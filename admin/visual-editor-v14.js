/* V14 – visual, section-ordered image editor. Uses the existing V3 form,
   validation, and Publish workflow as the single source of truth. */
(() => {
  'use strict';
  const root=document.getElementById('v14VisualEditor');
  const backdrop=document.getElementById('v14PhotoPicker');
  const A=window.AdminApp;
  if(!root||!backdrop||!A)return;

  const $=id=>document.getElementById(id);
  const esc=value=>A.esc(String(value??''));
  const source=()=>Array.isArray(A.images)?A.images.filter(photo=>photo.is_published&&photo.image_path):[];
  const albums=()=>source().filter(photo=>photo.show_in_album!==false);
  const byId=id=>source().find(photo=>photo.id===id);
  const imageUrl=photo=>A.publicUrl(photo.image_path)+(photo.updated_at?'?v='+encodeURIComponent(photo.updated_at):'');
  const attr=value=>esc(value);
  const steps=[
    {number:'01',key:'opening',title:'Mở thiệp',subtitle:'Opening Invitation',note:'Màn hình giới thiệu, tên Hải & Mỹ và nút Mở thiệp.',type:'static',symbol:'✉'},
    {number:'02',key:'hero',title:'Hero — ảnh cưới chính',subtitle:'Slideshow tự chuyển',note:'Chọn tối đa 3 ảnh. Ảnh số 1 là ảnh mở đầu.',type:'photos',ids:['v3Hero0','v3Hero1','v3Hero2'],labels:['Ảnh mở đầu','Ảnh thứ 2','Ảnh thứ 3'],settings:'v14AdvancedHero'},
    {number:'03',key:'story',title:'Our Story',subtitle:'Câu chuyện của chúng mình',note:'Sắp xếp ảnh, lời kể và các khối Filmstrip trong Story Builder.',type:'story',settings:'v14AdvancedStory'},
    {number:'04',key:'countdown',title:'Đếm ngược ngày cưới',subtitle:'Countdown',note:'Hiển thị thời gian còn lại. Không cần chọn ảnh riêng.',type:'static',symbol:'◷'},
    {number:'05',key:'schedule',title:'Wedding Schedule',subtitle:'Ảnh phía trên lịch cưới',note:'Ưu tiên ảnh ngang, thấy rõ cả hai người.',type:'photos',ids:['v3ScheduleImage'],labels:['Ảnh lịch cưới'],settings:'v14AdvancedHero'},
    {number:'06',key:'promise',title:'Our Promise',subtitle:'Lời hẹn của chúng mình',note:'Ưu tiên ảnh chân dung đứng, không cắt khuôn mặt.',type:'photos',ids:['v3PromiseImage'],labels:['Ảnh Our Promise'],settings:'v14AdvancedHero'},
    {number:'07',key:'gallery',title:'Our Moments — 5 ảnh',subtitle:'Gallery trang chủ',note:'Ảnh 01 lớn, bốn ảnh còn lại nhỏ. Chỉ chọn ảnh được phép xuất hiện trong Album.',type:'photos',ids:['v3Album0','v3Album1','v3Album2','v3Album3','v3Album4'],labels:['Ảnh lớn 01','Ảnh 02','Ảnh 03','Ảnh 04','Ảnh 05'],settings:'v14AdvancedAlbum'},
    {number:'08',key:'rsvp',title:'Xác nhận tham dự',subtitle:'RSVP',note:'Khách xác nhận tham dự qua biểu mẫu. Không có ảnh nền riêng.',type:'static',symbol:'✓'},
    {number:'09',key:'farewell',title:'Lời cảm ơn cuối thiệp',subtitle:'Farewell / Footer',note:'Ảnh kết thúc câu chuyện, đi cùng lời cảm ơn.',type:'photos',ids:['v3FarewellImageSelect'],labels:['Ảnh cuối thiệp'],settings:'v14AdvancedHero'}
  ];
  let device='desktop',activeSlot='',lastFocus=null;
  const normalizeText=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const idGroup=id=>id.startsWith('v3Hero')?'hero':id.startsWith('v3Album')?'gallery':null;
  const otherSelectedIds=id=>{
    const group=idGroup(id);
    if(!group)return new Set();
    const prefix=group==='hero'?'v3Hero':'v3Album',max=group==='hero'?3:5;
    return new Set(Array.from({length:max},(_,i)=>$(prefix+i)?.value).filter((v,i)=>v&&prefix+i!==id));
  };

  function tile(id,label,index){
    const value=$(id)?.value||'';
    const image=byId(value);
    const kind=idGroup(id);
    const isPublic=kind==='gallery';
    const available=isPublic?albums():source();
    const selected=image&&(isPublic?image.show_in_album!==false:true)?image:null;
    const automatically=!value;
    const status=selected
      ?(selected.show_in_album===false?'Chỉ dùng trên website':'Dùng trên website & Album')
      :(automatically?'Đang dùng ảnh tự động':'Ảnh đã bị ẩn hoặc không còn dùng được');
    const tag=index===0&&kind==='gallery'?'ẢNH CHÍNH':'';
    const description=selected?selected.title||selected.alt_text||'Ảnh cưới':'Chọn từ thư viện';
    const picture=selected?'<img loading="lazy" decoding="async" src="'+attr(imageUrl(selected))+'" alt="'+attr(description)+'">':
      '<span class="v14-empty-photo" aria-hidden="true"><span>＋</span><small>Chọn ảnh</small></span>';
    return '<button type="button" class="v14-photo-tile '+(index===0?'v14-featured':'')+
      '" data-v14-pick="'+attr(id)+'" aria-label="Thay '+attr(label)+'">'+
      '<span class="v14-photo-frame">'+picture+
      (tag?'<span class="v14-photo-tag">'+tag+'</span>':'')+
      '<span class="v14-photo-edit" aria-hidden="true">'+(selected?'Đổi ảnh':'Chọn ảnh')+' ↗</span></span>'+
      '<span class="v14-photo-meta"><strong>'+attr(label)+'</strong><small>'+attr(status)+'</small></span>'+
      '</button>';
  }

  function section(step){
    let content='';
    if(step.type==='photos'){
      const klass=step.key==='gallery'?'v14-photos-gallery':step.key==='hero'?'v14-photos-hero':'v14-photos-single';
      content='<div class="v14-photo-grid '+klass+'">'+step.ids.map((id,i)=>tile(id,step.labels[i],i)).join('')+'</div>';
      content+='<button type="button" class="v14-inline-advanced" data-v14-settings="'+step.settings+'">Căn chỉnh / tùy chỉnh nâng cao <span aria-hidden="true">↗</span></button>';
    } else if(step.type==='story'){
      const blocks=$('v3BlockList')?.querySelectorAll('.v3-admin-block').length||0;
      content='<div class="v14-story-preview"><div class="v14-story-mark" aria-hidden="true">“</div><p>Những khoảnh khắc tạo nên câu chuyện của chúng mình.</p>'+
        '<span>'+blocks+' khối ảnh / chữ trong Story Builder</span></div>'+
        '<button type="button" class="v14-open-story" data-v14-settings="v14AdvancedStory">Chỉnh Story Builder <span aria-hidden="true">↗</span></button>';
    } else{
      content='<div class="v14-static"><span class="v14-static-symbol" aria-hidden="true">'+step.symbol+
        '</span><span>Phần này sử dụng nội dung cố định trên thiệp; không có ảnh phải chọn.</span></div>';
      if(step.key==='opening'||step.key==='rsvp')content+='<button type="button" class="v14-inline-advanced" data-v14-tab="content">Chỉnh nội dung <span aria-hidden="true">↗</span></button>';
    }
    return '<article class="v14-journey-item" data-section="'+step.key+'">'+
      '<div class="v14-step-marker">'+step.number+'</div>'+
      '<div class="v14-journey-card"><div class="v14-card-head"><div><span>'+attr(step.subtitle)+'</span><h4>'+attr(step.title)+'</h4><p>'+attr(step.note)+'</p></div>'+
      (step.type==='photos'?'<span class="v14-card-chip">'+step.ids.length+' vị trí ảnh</span>':'')+
      '</div>'+content+'</div></article>';
  }

  function render(){
    const status=$('v3Status')?.textContent?.trim()||'Chọn ảnh rồi bấm Publish để lưu lên website.';
    const statusClass=/chưa Publish|thay đổi/i.test(status)?'v14-unsaved':/thành công/i.test(status)?'v14-saved':'';
    root.dataset.device=device;
    root.innerHTML='<div class="v14-toolbar">'+
      '<div class="v14-intro"><span class="v14-eyebrow">WEBSITE VISUAL EDITOR</span><h3>Chọn ảnh theo thứ tự trên thiệp</h3>'+
      '<p>Nhấn trực tiếp vào từng khung ảnh để chọn từ thư viện. Sắp xếp từ màn hình mở thiệp đến lời cảm ơn.</p></div>'+
      '<div class="v14-device" role="group" aria-label="Tỷ lệ xem trước theo thiết bị">'+
      [['desktop','PC'],['tablet','Tablet'],['mobile','Mobile']].map(([id,label])=>
        '<button type="button" data-v14-device="'+id+'" aria-pressed="'+(device===id)+'" class="'+(device===id?'is-active':'')+'">'+label+'</button>').join('')+
      '</div></div>'+
      '<div class="v14-editor-help"><span>① Chọn khung ảnh</span><span>② Chọn ảnh từ thư viện</span><span>③ Publish thiết kế</span></div>'+
      '<div class="v14-journey">'+steps.map(section).join('')+'</div>'+
      '<div class="v14-publish-bar"><div><strong>Áp dụng lên website</strong><p class="'+statusClass+'" role="status">'+attr(status)+'</p></div>'+
      '<button type="button" class="v14-publish-button" data-v14-publish> Lưu &amp; Publish thiết kế <span aria-hidden="true">↗</span></button></div>'+
      '<p class="v14-preview-footnote">Khung ảnh trong Admin là bản xem trước tỷ lệ. Mở website để kiểm tra giao diện thực tế trên từng thiết bị.</p>';
  }

  function openSettings(id){
    const details=$(id);if(!details)return;
    details.open=true;
    requestAnimationFrame(()=>details.scrollIntoView({block:'start',behavior:'smooth'}));
  }
  function switchTab(tab){
    document.querySelector('.nav-item[data-tab="'+tab+'"]')?.click();
  }
  function availablePhotos(){return idGroup(activeSlot)==='gallery'?albums():source()}
  function pickerGrid(){
    const grid=$('v14PickerGrid');if(!grid||!activeSlot)return;
    const filter=normalizeText($('v14PickerSearch')?.value);
    const exclusions=otherSelectedIds(activeSlot);
    const albumById=new Map((A.albums||[]).map(a=>[a.id,a.title]));
    const photos=availablePhotos().filter(photo=>{
      const combined=normalizeText([photo.title,photo.title_en,photo.title_ja,photo.alt_text,albumById.get(photo.album_id)].join(' '));
      return !filter||combined.includes(filter);
    });
    if(!photos.length){
      grid.innerHTML='<p class="v14-picker-empty">'+(availablePhotos().length?'Không tìm thấy ảnh phù hợp.':'Chưa có ảnh đã Publish. Vào Album để upload và Publish ảnh.')+'</p>';
      return;
    }
    grid.innerHTML=photos.map(photo=>{
      const selected=photo.id===$(activeSlot)?.value;
      const occupied=exclusions.has(photo.id);
      const desc=photo.title||photo.alt_text||'Ảnh cưới';
      return '<button type="button" class="v14-picker-photo'+(selected?' is-selected':'')+
        '" data-v14-photo-id="'+attr(photo.id)+'" '+(occupied?'disabled':'')+
        ' aria-pressed="'+(selected?'true':'false')+'">'+
        '<span class="v14-picker-thumb"><img loading="lazy" decoding="async" src="'+attr(imageUrl(photo))+'" alt="'+attr(desc)+'"></span>'+
        '<span class="v14-picker-photo-name">'+attr(desc)+'</span>'+
        '<span class="v14-picker-photo-label">'+(occupied?'Đã chọn ở ô khác':photo.show_in_album===false?'Chỉ dùng website':'Website & Album')+'</span>'+
        '</button>';
    }).join('');
  }
  function openPicker(id){
    const input=$(id);if(!input)return;
    activeSlot=id;lastFocus=document.activeElement;
    const allLabels=steps.flatMap(step=>(step.ids||[]).map((s,i)=>[s,step.labels[i]]));
    const name=allLabels.find(pair=>pair[0]===id)?.[1]||'Ảnh Story Builder';
    $('v14PickerTitle').textContent='Chọn ảnh: '+name;
    $('v14PickerHint').textContent=idGroup(id)==='gallery'
      ?'Album trang chủ: chỉ ảnh được phép hiển thị trong Album.'
      :'Bạn có thể chọn cả ảnh chỉ dùng cho website.';
    $('v14PickerSearch').value='';
    backdrop.hidden=false;
    document.body.classList.add('v14-dialog-open');
    pickerGrid();
    $('v14PickerSearch').focus();
  }
  function closePicker(){
    backdrop.hidden=true;activeSlot='';
    document.body.classList.remove('v14-dialog-open');
    if(lastFocus?.isConnected)lastFocus.focus();
  }
  function choosePhoto(id){
    if(!activeSlot)return;
    const el=$(activeSlot);
    if(!el)return;
    if(id&&!availablePhotos().some(photo=>photo.id===id))return;
    if(id&&otherSelectedIds(activeSlot).has(id))return;
    el.value=id;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    closePicker();
    setTimeout(render,0);
  }
  root.addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn)return;
    if(btn.dataset.v14Pick){openPicker(btn.dataset.v14Pick);return}
    if(btn.dataset.v14Settings){openSettings(btn.dataset.v14Settings);return}
    if(btn.dataset.v14Tab){switchTab(btn.dataset.v14Tab);return}
    if(btn.dataset.v14Device){device=btn.dataset.v14Device;render();return}
    if(btn.hasAttribute('data-v14-publish')){$('v3Publish')?.click();return}
  });
  backdrop.addEventListener('click',event=>{
    if(event.target===backdrop){closePicker();return}
    const tile=event.target.closest('[data-v14-photo-id]');
    if(tile&&!tile.disabled)choosePhoto(tile.dataset.v14PhotoId);
  });
  $('v14PickerSearch')?.addEventListener('input',pickerGrid);
  $('v14PickerClose')?.addEventListener('click',closePicker);
  $('v14PickerCancel')?.addEventListener('click',closePicker);
  $('v14PickerAutomatic')?.addEventListener('click',()=>choosePhoto(''));
  $('v14PickerAdd')?.addEventListener('click',()=>{
    closePicker();switchTab('album');
    requestAnimationFrame(()=>document.querySelector('.upload-panel')?.scrollIntoView({block:'start',behavior:'smooth'}));
  });
  document.addEventListener('keydown',event=>{
    if(backdrop.hidden)return;
    if(event.key==='Escape'){event.preventDefault();closePicker();return}
    if(event.key!=='Tab')return;
    const focusables=[...backdrop.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(el=>el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  const observedIds=['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3PromiseImage','v3FarewellImageSelect',
    ...Array.from({length:5},(_,i)=>'v3Album'+i)];
  observedIds.forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(render,0)));
  // Story Builder still saves through the original editor; offer a visual image chooser there too.
  ['v3BlockImage','v3BlockImage2','v3BlockImage3'].forEach(id=>{
    const select=$(id);if(!select)return;
    const trigger=document.createElement('button');
    trigger.type='button';trigger.className='v14-story-picker-trigger';
    trigger.textContent='▧  Chọn ảnh bằng thư viện';
    trigger.addEventListener('click',()=>openPicker(id));
    select.parentElement?.after(trigger);
  });
  const status=$('v3Status'),storyList=$('v3BlockList');
  if(status)new MutationObserver(()=>render()).observe(status,{characterData:true,childList:true,subtree:true});
  if(storyList)new MutationObserver(()=>render()).observe(storyList,{childList:true});
  document.addEventListener('admin:data',()=>setTimeout(render,0));
  document.addEventListener('admin:v3',()=>setTimeout(render,120));
  render();
})();