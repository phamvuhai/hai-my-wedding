/* Wedding V3 Admin — one deliberate Publish, reuses Album/Supabase RLS. */
(() => {
  'use strict';
  const A=window.AdminApp, db=A?.db;if(!db)return;
  const $=id=>document.getElementById(id);
  const slots=[['story','Sau Our Story'],['promise','Sau Countdown'],['events','Sau lịch cưới'],['moments','Sau Album'],['rsvp','Sau RSVP']];
  const styles=['split','letter','film','quote'];
  const blank={version:3,heroIds:[],heroAutoplay:true,schedulePhotoId:'',farewellPhotoId:'',blocks:[]};
  let cfg={...blank},loaded=false,changed=false,busy=false,editing=-1;
  const published=()=>A.images.filter(i=>i.is_published&&i.image_path);
  const uuid=()=>window.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
  const name=id=>A.images.find(i=>i.id===id)?.title||id?.slice(0,8)||'Không có ảnh';
  const status=(txt,type='')=>A.setStatus($('v3Status'),txt,type);
  function defaults(){
    const p=published().slice().sort((a,b)=>Number(b.is_hero)-Number(a.is_hero)||Number(b.is_featured)-Number(a.is_featured)||Number(a.sort_order||0)-Number(b.sort_order||0));
    const block=(slot,style,id,vi,en,ja)=>({id:uuid(),slot,style,imageId:id||'',visible:true,text:{vi,en,ja}});
    return {version:3,heroIds:p.slice(0,3).map(i=>i.id),heroAutoplay:true,schedulePhotoId:p[0]?.id||'',farewellPhotoId:p[3]?.id||p[1]?.id||'',blocks:[
      block('story','split',p[0]?.id,'Từ cuộc gặp gỡ đầu tiên, chúng mình đã chọn cùng nhau đi tiếp.','From our very first hello to a lifetime of togetherness.','出会いから今日まで、ふたりで歩んできました。'),
      block('promise','letter',p[1]?.id||p[0]?.id,'Từ hôm nay, mỗi chặng đường đều có chúng mình.','From this day forward, every road is ours to share.','これからも、ずっと一緒に。'),
      block('moments','film',p[2]?.id||p[0]?.id,'Những khoảnh khắc nhỏ tạo nên một tình yêu thật lớn.','A thousand little moments, one beautiful love story.','小さな幸せが、かけがえのない思い出に。'),
      block('rsvp','quote','', 'Cảm ơn bạn đã là một phần trong câu chuyện của Hải & Mỹ.','Thank you for being part of our story.','私たちの物語に寄り添っていただき、ありがとうございます。')
    ]};
  }
  function normalize(raw){
    if(!raw||typeof raw!=='object')return defaults();
    return {version:3,heroIds:Array.isArray(raw.heroIds)?raw.heroIds.filter(v=>typeof v==='string').slice(0,3):[],
      heroAutoplay:raw.heroAutoplay!==false,schedulePhotoId:String(raw.schedulePhotoId||''),farewellPhotoId:String(raw.farewellPhotoId||''),
      blocks:Array.isArray(raw.blocks)?raw.blocks.slice(0,25).filter(b=>b&&slots.some(x=>x[0]===b.slot)&&styles.includes(b.style)).map(b=>({
        id:String(b.id||uuid()),slot:b.slot,style:b.style,imageId:String(b.imageId||''),visible:b.visible!==false,
        text:{vi:String(b.text?.vi||'').slice(0,420),en:String(b.text?.en||'').slice(0,420),ja:String(b.text?.ja||'').slice(0,420)}
      })):[]};
  }
  function pickers(){
    const options='<option value="">Tự động / Không chọn</option>'+published().map(i=>'<option value="'+A.esc(i.id)+'">'+A.esc(i.title||'Ảnh cưới')+' · '+i.id.slice(0,8)+'</option>').join('');
    ['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3FarewellImageSelect','v3BlockImage'].forEach(id=>{const el=$(id),v=el.value;el.innerHTML=options;if(published().some(i=>i.id===v))el.value=v;});
  }
  function fill(){
    cfg.heroIds.slice(0,3).forEach((id,i)=>{$('v3Hero'+i).value=id;});
    for(let i=cfg.heroIds.length;i<3;i++)$('v3Hero'+i).value='';
    $('v3Autoplay').checked=cfg.heroAutoplay;
    $('v3ScheduleImage').value=cfg.schedulePhotoId;
    $('v3FarewellImageSelect').value=cfg.farewellPhotoId;
    renderList();
  }
  function renderList(){
    const el=$('v3BlockList');
    if(!cfg.blocks.length){el.innerHTML='<p class="muted">Chưa có khối nội dung. Hãy thêm ảnh và chữ để bắt đầu.</p>';return;}
    el.innerHTML=cfg.blocks.map((b,i)=>'<article class="v3-admin-block">'+
      '<div><small>'+A.esc(slots.find(x=>x[0]===b.slot)?.[1])+' · '+A.esc(b.style)+'</small><strong>'+A.esc(b.style==='quote'?'Khối chữ':name(b.imageId))+'</strong>'+
      '<p>'+A.esc((b.text?.vi||b.text?.en||'').slice(0,130))+'</p></div><div class="v3-admin-block-buttons">'+
      '<button type="button" data-v3-action="up" data-i="'+i+'" aria-label="Lên">↑</button>'+
      '<button type="button" data-v3-action="down" data-i="'+i+'" aria-label="Xuống">↓</button>'+
      '<button type="button" data-v3-action="edit" data-i="'+i+'">Sửa</button>'+
      '<button type="button" data-v3-action="remove" data-i="'+i+'">Xóa</button></div></article>').join('');
  }
  const dirty=()=>{changed=true;status('Bạn có thay đổi chưa Publish.');};
  function clear(){
    editing=-1;$('v3BlockSlot').value='story';$('v3BlockStyle').value='split';$('v3BlockImage').value='';
    ['Vi','En','Ja'].forEach(l=>$('v3Text'+l).value='');
    $('v3BlockVisible').checked=true;$('v3BlockAdd').textContent='＋ Thêm khối';$('v3BlockCancel').hidden=true;
  }
  function edit(i){
    const b=cfg.blocks[i];if(!b)return;
    editing=i;$('v3BlockSlot').value=b.slot;$('v3BlockStyle').value=b.style;$('v3BlockImage').value=b.imageId;
    $('v3TextVi').value=b.text?.vi||'';$('v3TextEn').value=b.text?.en||'';$('v3TextJa').value=b.text?.ja||'';
    $('v3BlockVisible').checked=b.visible!==false;$('v3BlockAdd').textContent='✓ Cập nhật khối';$('v3BlockCancel').hidden=false;
    $('v3BlockSlot').scrollIntoView({behavior:'smooth',block:'center'});
  }
  $('v3BlockAdd')?.addEventListener('click',()=>{
    const style=$('v3BlockStyle').value,id=$('v3BlockImage').value;
    if(style!=='quote'&&!published().some(i=>i.id===id)){status('Hãy chọn ảnh đã Publish hoặc chọn kiểu Quote.','error');return;}
    const item={id:editing>=0?cfg.blocks[editing].id:uuid(),slot:$('v3BlockSlot').value,style,imageId:style==='quote'?'':id,
      visible:$('v3BlockVisible').checked,text:{vi:$('v3TextVi').value.trim(),en:$('v3TextEn').value.trim(),ja:$('v3TextJa').value.trim()}};
    if(editing>=0)cfg.blocks[editing]=item;else if(cfg.blocks.length<25)cfg.blocks.push(item);else{status('Tối đa 25 khối.','error');return;}
    clear();dirty();renderList();
  });
  $('v3BlockCancel')?.addEventListener('click',clear);
  $('v3BlockList')?.addEventListener('click',event=>{
    const button=event.target.closest('button[data-v3-action]');if(!button)return;
    const i=Number(button.dataset.i),action=button.dataset.v3Action;if(!cfg.blocks[i])return;
    if(action==='edit'){edit(i);return;}
    if(action==='remove'){cfg.blocks.splice(i,1);clear();}
    if(action==='up'&&i>0)[cfg.blocks[i-1],cfg.blocks[i]]=[cfg.blocks[i],cfg.blocks[i-1]];
    if(action==='down'&&i<cfg.blocks.length-1)[cfg.blocks[i+1],cfg.blocks[i]]=[cfg.blocks[i],cfg.blocks[i+1]];
    dirty();renderList();
  });
  ['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3FarewellImageSelect','v3Autoplay'].forEach(id=>{
    $(id)?.addEventListener('change',dirty);
  });
  async function load(){
    if(loaded||busy)return;
    busy=true;status('Đang tải thiết kế...');
    try{
      const {data,error}=await db.from('site_content').select('value_vi').eq('key','v3_design').maybeSingle();
      if(error)throw error;
      const raw=data?.value_vi?JSON.parse(data.value_vi):null;
      cfg=raw?normalize(raw):defaults();
      pickers();fill();loaded=true;changed=false;
      status(raw?'Đã tải thiết kế đang sử dụng.':'Đã chuẩn bị bố cục V3 mặc định. Nhấn Publish để lưu lựa chọn.');
    }catch(e){status('Không tải được thiết kế: '+e.message,'error');}
    finally{busy=false;}
  }
  $('v3Publish')?.addEventListener('click',async()=>{
    if(!loaded||busy)return;
    const heroIds=['v3Hero0','v3Hero1','v3Hero2'].map(id=>$(id).value).filter(Boolean);
    if(new Set(heroIds).size!==heroIds.length){status('Ba ảnh Hero cần khác nhau.','error');return;}
    const ids=[...heroIds,$('v3ScheduleImage').value,$('v3FarewellImageSelect').value,...cfg.blocks.filter(b=>b.style!=='quote').map(b=>b.imageId)].filter(Boolean);
    if(ids.some(id=>!published().some(i=>i.id===id))){status('Có ảnh chưa Publish hoặc đã bị xóa. Kiểm tra lại Album.','error');return;}
    cfg.heroIds=heroIds;cfg.heroAutoplay=$('v3Autoplay').checked;
    cfg.schedulePhotoId=$('v3ScheduleImage').value;cfg.farewellPhotoId=$('v3FarewellImageSelect').value;
    busy=true;$('v3Publish').disabled=true;status('Đang lưu thiết kế...');
    try{
      const {error}=await db.from('site_content').upsert({key:'v3_design',value_vi:JSON.stringify(cfg),value_en:null,value_ja:null,updated_at:new Date().toISOString()},{onConflict:'key'});
      if(error)throw error;
      changed=false;status('Đã Publish V3 thành công. Tải lại thiệp để xem.','success');
    }catch(e){status('Không thể Publish: '+e.message,'error');}
    finally{busy=false;$('v3Publish').disabled=false;}
  });
  document.addEventListener('admin:v3',()=>{if(!loaded)load();else{pickers();fill();}});
  document.addEventListener('admin:data',()=>{if(loaded&&!changed){pickers();fill();}});
})();