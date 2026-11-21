(() => {
  'use strict';
  const A=window.AdminApp,db=A.db,$=id=>document.getElementById(id);
  const select=$('sortAlbumSelect'),list=$('sortPhotoList'),save=$('sortSaveBtn'),discard=$('sortDiscardBtn'),status=$('sortStatus');
  if(!select||!list||!db)return;
  let ordered=[],dirty=false,dragId=null,saving=false;
  function photosForAlbum(){
    return A.images.filter(x=>x.album_id===select.value).sort((a,b)=>
      (Number(a.sort_order||0)-Number(b.sort_order||0)) ||
      (new Date(b.created_at)-new Date(a.created_at)) ||
      String(a.id).localeCompare(String(b.id)));
  }
  function reload(){ordered=photosForAlbum().map(x=>x.id);dirty=false;render();}
  function move(from,to){
    if(saving||from<0||to<0||from>=ordered.length||to>=ordered.length||from===to)return;
    const [id]=ordered.splice(from,1);ordered.splice(to,0,id);dirty=true;render();
  }
  function render(){
    const byId=new Map(A.images.map(x=>[x.id,x]));
    const images=ordered.map(id=>byId.get(id)).filter(Boolean);
    list.innerHTML=images.length?images.map((img,i)=>`<article class="sort-photo-card" draggable="${!saving}" data-id="${img.id}">
      <div class="sort-photo-handle" title="Kéo thả để đổi thứ tự">⠿</div>
      <img loading="lazy" src="${A.publicUrl(img.image_path)}" alt="${A.esc(img.alt_text||img.title||'Ảnh cưới')}">
      <div class="sort-photo-name"><strong>${i+1}. ${A.esc(img.title||'Ảnh cưới')}</strong>
        <small>${img.is_published?'Published':'Draft'} · ${img.is_featured?'Featured · ':''}${img.show_in_album===false?'Website only':'Album'}</small></div>
      <div class="sort-photo-buttons"><button type="button" data-first="${img.id}" ${saving||i===0?'disabled':''} aria-label="Đưa lên đầu">⇤</button>
        <button type="button" data-up="${img.id}" ${saving||i===0?'disabled':''} aria-label="Đưa lên">↑</button>
        <button type="button" data-down="${img.id}" ${saving||i===images.length-1?'disabled':''} aria-label="Đưa xuống">↓</button>
        <button type="button" data-last="${img.id}" ${saving||i===images.length-1?'disabled':''} aria-label="Đưa xuống cuối">⇥</button></div></article>`).join(''):'<p class="muted">Album chưa có ảnh.</p>';
    list.querySelectorAll('[data-first]').forEach(b=>b.onclick=()=>move(ordered.indexOf(b.dataset.first),0));
    list.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=ordered.indexOf(b.dataset.up);move(i,i-1);});
    list.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{const i=ordered.indexOf(b.dataset.down);move(i,i+1);});
    list.querySelectorAll('[data-last]').forEach(b=>b.onclick=()=>move(ordered.indexOf(b.dataset.last),ordered.length-1));
    list.querySelectorAll('[draggable=true]').forEach(card=>{
      card.addEventListener('dragstart',e=>{dragId=card.dataset.id;e.dataTransfer.effectAllowed='move';});
      card.addEventListener('dragover',e=>{if(dragId){e.preventDefault();e.dataTransfer.dropEffect='move';}});
      card.addEventListener('drop',e=>{e.preventDefault();move(ordered.indexOf(dragId),ordered.indexOf(card.dataset.id));dragId=null;});
      card.addEventListener('dragend',()=>dragId=null);
    });
    save.disabled=saving||!dirty||!ordered.length;
    discard.disabled=saving||!dirty;
    select.disabled=saving;
    $('sortDirtyLabel').textContent=dirty?'● Chưa lưu thứ tự':'Đã đồng bộ';
  }
  select.addEventListener('change',()=>{
    if(dirty&&!confirm('Thứ tự chưa lưu sẽ bị bỏ. Tiếp tục?')){
      // Restore the previous album selection instead of silently losing the draft.
      select.value=select.dataset.previous||select.value;return;
    }
    select.dataset.previous=select.value;reload();A.setStatus(status,'');
  });
  discard.addEventListener('click',()=>{reload();A.setStatus(status,'Đã khôi phục thứ tự trên database.');});
  save.addEventListener('click',async()=>{
    if(saving||!dirty)return;
    saving=true;render();A.setStatus(status,'Đang lưu thứ tự vào Supabase...');
    try{
      const {data,error}=await db.rpc('reorder_gallery_images',{p_album_id:select.value,p_image_ids:ordered});
      if(error)throw error;
      if(Number(data)!==ordered.length)throw new Error('Số ảnh đã cập nhật không khớp.');
      dirty=false;
      await A.loadData();
      A.setStatus(status,`Đã lưu thứ tự ${ordered.length} ảnh. Refresh website để kiểm tra.`,'success');
    }catch(error){A.setStatus(status,'Lưu thứ tự thất bại: '+error.message,'error');}
    finally{saving=false;render();}
  });
  document.addEventListener('admin:data',()=>{
    const current=select.value;
    select.innerHTML=A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    if(A.albums.some(a=>a.id===current))select.value=current;
    select.dataset.previous=select.value;
    if(!dirty)reload();
  });
  reload();
})();