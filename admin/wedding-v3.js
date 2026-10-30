/* Wedding V3 Admin — one deliberate Publish, reuses Album/Supabase RLS. */
(() => {
  'use strict';
  const A=window.AdminApp, db=A?.db;if(!db)return;
  const $=id=>document.getElementById(id);
  const slots=[['story','Sau Our Story'],['promise','Sau Countdown'],['events','Sau lịch cưới'],['moments','Sau Album'],['rsvp','Sau RSVP']];
  const styles=['split','letter','film','quote'];
  const blank={version:3,heroIds:[],homePhotoIds:[],heroAutoplay:true,schedulePhotoId:'',farewellPhotoId:'',promisePhotoId:'',blocks:[],posterBlur:6,posterShade:40,posterForeground:true,posterDesktopX:50,posterDesktopY:50,posterMobileX:50,posterMobileY:50};
  let cfg={...blank},loaded=false,changed=false,busy=false,editing=-1;
  const published=()=>A.images.filter(i=>i.is_published&&i.image_path);
  const albumPhotos=()=>published().filter(i=>i.show_in_album!==false);
  const uuid=()=>window.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
  const name=id=>A.images.find(i=>i.id===id)?.title||id?.slice(0,8)||'Không có ảnh';
  const status=(txt,type='')=>A.setStatus($('v3Status'),txt,type);
  function defaults(){
    const all=published().slice().sort((x,y)=>Number(x.sort_order||0)-Number(y.sort_order||0));
    const p=all.length?all:published();
    const blocks=(()=>{
    
    return [
      {id:'v4-chapter-1',slot:'story',style:'split',imageId:p[1]?.id||'',visible:true,text:{"vi":"Hạnh phúc không phải lúc nào cũng là điều lớn lao. Đôi khi, đó chỉ là được kể cho nhau nghe một ngày đã qua, cùng cười vì những chuyện rất nhỏ và biết rằng luôn có một người ở đó để lắng nghe.","en":"Happiness is not always something grand. Sometimes it is sharing an ordinary day, laughing at little things, and knowing there is always someone who will listen.","ja":"幸せは、特別な出来事だけではありません。今日あったことを話し、小さなことで笑い合い、耳を傾けてくれる人がそばにいる。それが私たちの宝物です。"}},
      {id:'v4-chapter-2',slot:'story',style:'letter',imageId:p[2]?.id||'',visible:true,text:{"vi":"Có những ngày rực rỡ, cũng có những ngày thật bình thường. Nhưng khi cùng nhìn về một hướng, chúng mình hiểu rằng điều quý giá nhất không phải đi được bao xa, mà là vẫn muốn bước tiếp cùng nhau.","en":"Some days shine while others are beautifully ordinary. We have learned that what matters most is not how far we go, but choosing to keep walking together.","ja":"輝く日もあれば、何気ない日もあります。大切なのはどこまで行けるかよりも、これからも一緒に歩みたいと思えることだと感じています。"}},
      {id:'v4-chapter-3',slot:'promise',style:'quote',imageId:'',visible:true,text:{"vi":"“Chẳng cần ngày nào cũng rực rỡ, chỉ mong những ngày bình thường luôn có nhau.”","en":"“Every day need not be extraordinary. May we always share the ordinary ones.”","ja":"「毎日が特別でなくてもいい。何気ない日々を、これからも一緒に。」"}},
      {id:'v4-chapter-4',slot:'promise',style:'split',imageId:p[3]?.id||'',visible:true,text:{"vi":"Và rồi, từ lời hẹn luôn ở bên nhau, chúng mình chọn một lời hứa lớn hơn: trở thành gia đình, cùng chăm sóc một mái ấm và đón chờ những điều tốt đẹp phía trước.","en":"A simple promise to stay by each other's side grew into something more: a family, a home, and the hope of welcoming all the beautiful days ahead.","ja":"そして、いつもそばにいるという約束は、家族になり、ふたりで家庭を築くという大切な決意になりました。"}},
      {id:'v4-chapter-5',slot:'events',style:'letter',imageId:p[4]?.id||'',visible:true,text:{"vi":"Hai ngày vui, hai gia đình và thật nhiều yêu thương. Từ những nghi lễ ấm áp bên người thân đến buổi tiệc quây quần cùng bạn bè, chúng mình mong được cùng mọi người lưu giữ thật nhiều kỷ niệm đẹp.","en":"Two celebrations, two families and so much love. From intimate family traditions to joyful gatherings with friends, we hope to share beautiful memories with everyone.","ja":"ふたつの家族が迎える、愛に満ちた二日間。温かな儀式から楽しい披露宴まで、皆さまと素敵な思い出を重ねられたら幸いです。"}},
      {id:'v4-chapter-6',slot:'moments',style:'film',imageId:p[5]?.id||'',visible:true,text:{"vi":"Mỗi bức ảnh là một lời nhắc rằng hạnh phúc được dệt nên từ những điều nhỏ bé. Chúng mình sẽ giữ những khoảnh khắc này, để một ngày nhìn lại vẫn thấy nguyên vẹn sự dịu dàng của hôm nay.","en":"Every photograph reminds us that a beautiful life is woven from little things. We will keep these moments so we can remember how this chapter felt.","ja":"一枚一枚の写真は、小さな幸せの積み重ね。いつか見返したときにも、今の優しい気持ちを思い出せるよう大切に残していきます。"}},
      {id:'v5-chapter-8',slot:'events',style:'split',imageId:p[6]?.id||p[0]?.id||'',visible:true,text:{"vi":"Hôm nay, chúng mình không chỉ đánh dấu một ngày đặc biệt, mà còn mở ra những ngày tháng mới: cùng học cách quan tâm, cùng sẻ chia và luôn dành cho nhau một nơi để trở về.","en":"Today is not only a celebration. It is the beginning of a new chapter: caring for each other, sharing the little things, and always having a place to call home.","ja":"この日は、ひとつの節目であると同時に、新しい毎日の始まりです。互いを思いやり、喜びを分かち合い、いつでも帰れる場所をふたりでつくっていきます。"}},
      {id:'v5-chapter-9',slot:'moments',style:'split',imageId:p[7]?.id||p[1]?.id||'',visible:true,text:{"vi":"Mai này khi nhìn lại, điều chúng mình muốn nhớ nhất không chỉ là những tấm hình thật đẹp, mà còn là cảm giác được yêu thương, được lớn lên và được cùng nhau đi qua những ngày bình dị.","en":"When we look back one day, we hope to remember more than lovely photographs: the feeling of being loved, growing together, and sharing the beauty of ordinary days.","ja":"いつか振り返ったとき、美しい写真だけではなく、愛されている安心感や、ともに成長し、何気ない日々を分かち合った温かさを思い出したいと思います。"}},
      {id:'v4-chapter-7',slot:'rsvp',style:'quote',imageId:'',visible:true,text:{"vi":"“Ngày vui sẽ trọn vẹn hơn khi có bạn ở đây. Cảm ơn vì đã cùng chúng mình viết nên một kỷ niệm đáng nhớ.”","en":"“Our celebration will be lovelier with you here. Thank you for being part of a memory we will always cherish.”","ja":"「皆さまと過ごすひとときが、私たちの宝物になります。心から、ありがとうございます。」"}}
    ].filter(block=>['v4-chapter-1','v4-chapter-3','v4-chapter-6','v4-chapter-7'].includes(block.id))
      .map(block=>block.style==='film'?{...block,imageIds:[p[6]?.id,p[7]?.id].filter(Boolean)}:block);
  })();
    return {version:3,heroIds:[],homePhotoIds:[],heroAutoplay:true,posterBlur:6,posterShade:40,
      posterForeground:false,posterDesktopX:50,posterDesktopY:50,posterMobileX:50,posterMobileY:50,
      schedulePhotoId:p[0]?.id||'',farewellPhotoId:p[6]?.id||p[1]?.id||'',promisePhotoId:'',blocks};
  }
  function clampFocus(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):50;}
  function normalize(raw){
    if(!raw||typeof raw!=='object')return defaults();
    return {version:3,heroIds:Array.isArray(raw.heroIds)?raw.heroIds.filter(v=>typeof v==='string').slice(0,3):[],
      homePhotoIds:Array.isArray(raw.homePhotoIds)?raw.homePhotoIds.filter(v=>typeof v==='string').slice(0,5):[],
      heroAutoplay:true,
      posterBlur:[4,6,10].includes(Number(raw.posterBlur))?Number(raw.posterBlur):6,
      posterShade:[30,40,55].includes(Number(raw.posterShade))?Number(raw.posterShade):40,
      posterForeground:raw.posterForeground!==false,
      posterDesktopX:clampFocus(raw.posterDesktopX),posterDesktopY:clampFocus(raw.posterDesktopY),
      posterMobileX:clampFocus(raw.posterMobileX),posterMobileY:clampFocus(raw.posterMobileY),
      schedulePhotoId:String(raw.schedulePhotoId||''),farewellPhotoId:String(raw.farewellPhotoId||''),promisePhotoId:String(raw.promisePhotoId||''),
      blocks:Array.isArray(raw.blocks)?raw.blocks.slice(0,25).filter(b=>b&&slots.some(x=>x[0]===b.slot)&&styles.includes(b.style)).map(b=>({
        id:String(b.id||uuid()),slot:b.slot,style:b.style,imageId:String(b.imageId||''),imageIds:Array.isArray(b.imageIds)?b.imageIds.filter(v=>typeof v==='string').slice(0,2):[],visible:b.visible!==false,
        text:{vi:String(b.text?.vi||'').slice(0,420),en:String(b.text?.en||'').slice(0,420),ja:String(b.text?.ja||'').slice(0,420)}
      })):[]};
  }
  function pickers(){
    const options='<option value="">Tự động / Không chọn</option>'+published().map(i=>'<option value="'+A.esc(i.id)+'">'+A.esc(i.title||'Ảnh cưới')+' · '+i.id.slice(0,8)+'</option>').join('');
    ['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3PromiseImage','v3FarewellImageSelect','v3BlockImage','v3BlockImage2','v3BlockImage3',].forEach(id=>{const el=$(id);if(!el)return;const v=el.value;el.innerHTML=options;if(published().some(i=>i.id===v))el.value=v;});
    const albumOptions='<option value="">Tự động / Không chọn</option>'+albumPhotos().map(i=>'<option value="'+A.esc(i.id)+'">'+A.esc(i.title||'Ảnh cưới')+'</option>').join('');
    Array.from({length:5},(_,i)=>'v3Album'+i).forEach(id=>{const el=$(id);const v=el.value;el.innerHTML=albumOptions;if(albumPhotos().some(i=>i.id===v))el.value=v;});
  }
  function fill(){
    cfg.heroIds.slice(0,3).forEach((id,i)=>{$('v3Hero'+i).value=id;});
    for(let i=cfg.heroIds.length;i<3;i++)$('v3Hero'+i).value='';
    for(let i=0;i<5;i++)$('v3Album'+i).value=cfg.homePhotoIds[i]||'';
    renderAlbumPreview();
    $('v3Autoplay').checked=true;
    $('v3PosterBlur').value=cfg.posterBlur;
    $('v3PosterShade').value=cfg.posterShade;
    $('v3PosterForeground').checked=cfg.posterForeground!==false;
    ['DesktopX','DesktopY','MobileX','MobileY'].forEach(k=>{$('v3Poster'+k).value=cfg['poster'+k];});
    renderPosterPreview();
    $('v3ScheduleImage').value=cfg.schedulePhotoId;
    $('v3PromiseImage').value=cfg.promisePhotoId;
    $('v3FarewellImageSelect').value=cfg.farewellPhotoId;
    renderList();
  }
  function renderPosterPreview(){
    const photo=published().find(i=>i.id===$('v3Hero0').value)||published().find(i=>i.is_hero)||published()[0];
    const desktopX=clampFocus($('v3PosterDesktopX').value),desktopY=clampFocus($('v3PosterDesktopY').value);
    const mobileX=clampFocus($('v3PosterMobileX').value),mobileY=clampFocus($('v3PosterMobileY').value);
    const blur=[4,6,10].includes(Number($('v3PosterBlur').value))?Number($('v3PosterBlur').value):6;
    const shade=[30,40,55].includes(Number($('v3PosterShade').value))?Number($('v3PosterShade').value):40;
    const showPhoto=false;
    ['DesktopX','DesktopY','MobileX','MobileY'].forEach(k=>{
      const out=$('v3'+k+'Value');if(out)out.textContent=$('v3Poster'+k).value+'%';
    });
    for(const [id,x,y] of [['v3PosterPreviewDesktop',desktopX,desktopY],['v3PosterPreviewMobile',mobileX,mobileY]]){
      const root=$(id);if(!root)continue;
      root.style.setProperty('--preview-blur',blur+'px');
      root.style.setProperty('--preview-shade',(shade/100).toFixed(2));
      root.style.setProperty('--preview-focus',x+'% '+y+'%');
      root.classList.toggle('v3-preview-no-photo',!showPhoto);
      const src=photo?A.publicUrl(photo.image_path)+(photo.updated_at?'?v='+encodeURIComponent(photo.updated_at):''):'';
      root.querySelectorAll('img').forEach(el=>{
        if(src){el.src=src;el.hidden=false;}else{el.removeAttribute('src');el.hidden=true;}
      });
    }
  }
  function renderAlbumPreview(){
    const root=$('v3AlbumPreview');if(!root)return;
    const selected=Array.from({length:5},(_,i)=>$('v3Album'+i)?.value).filter(Boolean);
    const all=albumPhotos().filter(photo=>!selected.includes(photo.id))
      .sort((a,b)=>(Number(b.is_featured)-Number(a.is_featured))||(Number(a.sort_order||0)-Number(b.sort_order||0)));
    const ordered=[...selected.map(id=>albumPhotos().find(i=>i.id===id)).filter(Boolean),...all].slice(0,5);
    root.innerHTML=ordered.map((photo,index)=>'<figure class="v11-admin-photo">'+
      '<img loading="lazy" alt="" src="'+A.esc(A.publicUrl(photo.image_path)+(photo.updated_at?'?v='+encodeURIComponent(photo.updated_at):''))+'">'+
      '<figcaption>'+(index+1).toString().padStart(2,'0')+' · '+A.esc(photo.title||'Ảnh cưới')+'</figcaption></figure>').join('');
  }
  function updateFilmVisibility(){
    const wrap=$('v3FilmOptions');if(wrap)wrap.hidden=$('v3BlockStyle')?.value!=='film';
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
    editing=-1;$('v3BlockSlot').value='story';$('v3BlockStyle').value='split';$('v3BlockImage').value='';$('v3BlockImage2').value='';$('v3BlockImage3').value='';updateFilmVisibility();
    ['Vi','En','Ja'].forEach(l=>$('v3Text'+l).value='');
    $('v3BlockVisible').checked=true;$('v3BlockAdd').textContent='＋ Thêm khối';$('v3BlockCancel').hidden=true;
  }
  function edit(i){
    const b=cfg.blocks[i];if(!b)return;
    editing=i;$('v3BlockSlot').value=b.slot;$('v3BlockStyle').value=b.style;$('v3BlockImage').value=b.imageId;$('v3BlockImage2').value=b.imageIds?.[0]||'';$('v3BlockImage3').value=b.imageIds?.[1]||'';updateFilmVisibility();
    $('v3TextVi').value=b.text?.vi||'';$('v3TextEn').value=b.text?.en||'';$('v3TextJa').value=b.text?.ja||'';
    $('v3BlockVisible').checked=b.visible!==false;$('v3BlockAdd').textContent='✓ Cập nhật khối';$('v3BlockCancel').hidden=false;
    $('v3BlockSlot').scrollIntoView({behavior:'smooth',block:'center'});
  }
  $('v3BlockAdd')?.addEventListener('click',()=>{
    const style=$('v3BlockStyle').value,id=$('v3BlockImage').value;
    if(style!=='quote'&&!published().some(i=>i.id===id)){status('Hãy chọn ảnh đã Publish hoặc chọn kiểu Quote.','error');return;}
    const extras=style==='film'?[$('v3BlockImage2').value,$('v3BlockImage3').value].filter(Boolean):[];
    if(new Set([id,...extras]).size!==1+extras.length){status('Ba ảnh Filmstrip không được trùng nhau.','error');return;}
    if(extras.some(photoId=>!published().some(photo=>photo.id===photoId))){status('Ảnh phụ Filmstrip phải được Publish.','error');return;}
    const item={id:editing>=0?cfg.blocks[editing].id:uuid(),slot:$('v3BlockSlot').value,style,imageId:style==='quote'?'':id,imageIds:extras,
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
  $('v3BlockStyle')?.addEventListener('change',updateFilmVisibility);
  ['v3BlockImage2','v3BlockImage3'].forEach(id=>$(id)?.addEventListener('change',dirty));
  Array.from({length:5},(_,i)=>'v3Album'+i).forEach(id=>{
    $(id)?.addEventListener('change',()=>{dirty();renderAlbumPreview();});
  });
  ['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3PromiseImage','v3FarewellImageSelect','v3Autoplay','v3PosterBlur','v3PosterShade','v3PosterForeground','v3PosterDesktopX','v3PosterDesktopY','v3PosterMobileX','v3PosterMobileY'].forEach(id=>{
    $(id)?.addEventListener('change',()=>{dirty();renderPosterPreview();});
    if(id.startsWith('v3Poster'))$(id)?.addEventListener('input',renderPosterPreview);
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
      status(raw?'Đã tải thiết kế đang sử dụng.':'Đã chuẩn bị bố cục mặc định. Nhấn Publish để lưu lựa chọn.');
    }catch(e){status('Không tải được thiết kế: '+e.message,'error');}
    finally{busy=false;}
  }
  $('v3Publish')?.addEventListener('click',async()=>{
    if(!loaded||busy)return;
    const heroIds=['v3Hero0','v3Hero1','v3Hero2'].map(id=>$(id).value).filter(Boolean);
    if(new Set(heroIds).size!==heroIds.length){status('Ba ảnh Hero cần khác nhau.','error');return;}
    const homePhotoIds=Array.from({length:5},(_,i)=>$('v3Album'+i).value).filter(Boolean);
    if(new Set(homePhotoIds).size!==homePhotoIds.length){status('5 ảnh Album không được chọn trùng nhau.','error');return;}
    if(homePhotoIds.some(id=>!albumPhotos().some(photo=>photo.id===id))){status('Ảnh Gallery phải được cho phép hiển thị trong Album.','error');return;}
    const ids=[...heroIds,...homePhotoIds,$('v3ScheduleImage').value,$('v3PromiseImage').value,$('v3FarewellImageSelect').value,...cfg.blocks.filter(b=>b.style!=='quote').flatMap(b=>[b.imageId,...(b.imageIds||[])])].filter(Boolean);
    if(ids.some(id=>!published().some(i=>i.id===id))){status('Có ảnh chưa Publish hoặc đã bị xóa. Kiểm tra lại Album.','error');return;}
    cfg.heroIds=heroIds;cfg.homePhotoIds=homePhotoIds;cfg.heroAutoplay=true;
    cfg.posterBlur=Number($('v3PosterBlur').value);cfg.posterShade=Number($('v3PosterShade').value);
    cfg.posterForeground=false;
    ['DesktopX','DesktopY','MobileX','MobileY'].forEach(k=>{cfg['poster'+k]=clampFocus($('v3Poster'+k).value);});
    cfg.schedulePhotoId=$('v3ScheduleImage').value;cfg.promisePhotoId=$('v3PromiseImage').value;cfg.farewellPhotoId=$('v3FarewellImageSelect').value;
    busy=true;$('v3Publish').disabled=true;status('Đang lưu thiết kế...');
    try{
      const {error}=await db.from('site_content').upsert({key:'v3_design',value_vi:JSON.stringify(cfg),value_en:null,value_ja:null,updated_at:new Date().toISOString()},{onConflict:'key'});
      if(error)throw error;
      changed=false;status('Đã Publish thiết kế thành công. Tải lại thiệp để xem.','success');
    }catch(e){status('Không thể Publish: '+e.message,'error');}
    finally{busy=false;$('v3Publish').disabled=false;}
  });
  document.addEventListener('admin:v3',()=>{
    if(!loaded)load();
    else if(changed){pickers();status('Bạn có thay đổi chưa Publish.');}
    else{pickers();fill();}
  });
  document.addEventListener('admin:data',()=>{if(loaded&&!changed){pickers();fill();}});
})();