(() => {
  'use strict';
  const A=window.AdminApp,db=A.db,$=id=>document.getElementById(id);
  const filter=$('libraryAlbumFilter');
  const selected=new Set();
  const selectAll=$('bulkLibrarySelectAll'), actionSelect=$('bulkLibraryAction');
  const targetAlbum=$('bulkLibraryTargetAlbum'),apply=$('bulkLibraryApply');
  const toolbar=$('bulkLibraryToolbar'),count=$('bulkLibraryCount'),status=$('bulkLibraryStatus');
  if(!filter)return;
  document.addEventListener('admin:data',()=>{
    selected.clear();
    $('albumSelect').innerHTML=A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    const previous=filter.value;
    filter.innerHTML='<option value="all">Tất cả album</option>'+A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    if(previous==='all'||A.albums.some(a=>a.id===previous))filter.value=previous;
    targetAlbum.innerHTML='<option value="">Chọn Album đích</option>'+A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    renderStats();render();
  });
  function renderStats(){
    const p=A.images.filter(x=>x.is_published).length;
    $('albumStats').innerHTML=`<div class="stat"><span>Album</span><strong>${A.albums.length}</strong></div>
      <div class="stat"><span>Tổng ảnh</span><strong>${A.images.length}</strong></div>
      <div class="stat"><span>Đang hiển thị</span><strong>${p}</strong></div>
      <div class="stat"><span>Bản nháp</span><strong>${A.images.length-p}</strong></div>`;
  }
  function visible(){
    return A.images.filter(x=>filter.value==='all'||x.album_id===filter.value);
  }
  filter.onchange=render;
  function updateToolbar(){
    if(!toolbar)return;
    count.textContent=`Đã chọn ${selected.size} ảnh`;
    apply.disabled=!selected.size||!actionSelect.value||(actionSelect.value==='move'&&!targetAlbum.value);
    selectAll.checked=visible().length>0&&visible().every(x=>selected.has(x.id));
    selectAll.indeterminate=visible().some(x=>selected.has(x.id))&&!selectAll.checked;
    targetAlbum.hidden=actionSelect.value!=='move';
  }
  function render(){
    const byId=Object.fromEntries(A.albums.map(a=>[a.id,a])),list=visible();
    $('adminGallery').innerHTML=list.length?list.map(img=>`<article class="media-card">
      <label class="media-select" title="Chọn ảnh"><input type="checkbox" class="bulk-gallery-check" data-id="${img.id}" ${selected.has(img.id)?'checked':''}><span class="sr-only">Chọn ảnh</span></label>
      <div class="media-thumb"><img loading="lazy" src="${A.publicUrl(img.image_path)}" alt="${A.esc(img.alt_text||'')}">${img.is_published?'':'<span class="draft-pill">DRAFT</span>'}</div>
      <div class="media-body"><strong>${A.esc(img.title||byId[img.album_id]?.title||'Untitled')}</strong><small>${A.esc(byId[img.album_id]?.title||'')}</small>
      <div class="media-tags">${img.show_in_album===false?'<span>Website only</span>':'<span>Album</span>'}${img.is_hero?'<span>Hero</span>':''}${img.is_featured?'<span>Featured</span>':''}${img.show_on_homepage?'<span>Homepage</span>':''}<span>${A.esc(img.display_size||'auto')}</span></div>
      <div class="media-actions"><button data-action="edit" data-id="${img.id}">Edit ảnh</button><button data-action="publish" data-id="${img.id}">${img.is_published?'Ẩn':'Publish'}</button><button data-action="cover" data-id="${img.id}">${img.is_cover?'Cover ✓':'Set cover'}</button><button data-action="home" data-id="${img.id}">${img.show_on_homepage?'Ẩn Home':'Show Home'}</button><button data-action="featured" data-id="${img.id}">${img.is_featured?'Featured ✓':'Featured'}</button><button data-action="hero" data-id="${img.id}">${img.is_hero?'Hero ✓':'Set Hero'}</button><button class="danger" data-action="delete" data-id="${img.id}">Xóa</button></div></div></article>`).join(''):'<p class="muted">Chưa có ảnh.</p>';
    document.querySelectorAll('.media-actions button').forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id));
    document.querySelectorAll('.bulk-gallery-check').forEach(b=>b.onchange=()=>{
      if(b.checked)selected.add(b.dataset.id);else selected.delete(b.dataset.id);
      updateToolbar();
    });
    updateToolbar();
  }
  selectAll?.addEventListener('change',()=>{
    for(const img of visible())if(selectAll.checked)selected.add(img.id);else selected.delete(img.id);
    render();
  });
  actionSelect?.addEventListener('change',updateToolbar);
  targetAlbum?.addEventListener('change',updateToolbar);

  async function bulkAction(){
    const ids=[...selected].filter(id=>A.images.some(img=>img.id===id));
    if(!ids.length)return;
    const kind=actionSelect.value;
    const updates={
      publish:{is_published:true},unpublish:{is_published:false},
      show:{show_in_album:true},hide:{show_in_album:false}
    };
    apply.disabled=true;
    A.setStatus(status,`Đang xử lý ${ids.length} ảnh...`);
    try{
      if(kind==='move'){
        if(!A.albums.some(a=>a.id===targetAlbum.value))throw new Error('Chưa chọn Album đích.');
        const {data,error}=await db.rpc('move_gallery_images',{p_image_ids:ids,p_target_album_id:targetAlbum.value});
        if(error)throw error;
        if(Number(data)!==ids.length)throw new Error('Số ảnh di chuyển không khớp.');
      } else if(kind==='delete'){
        // Avoid breaking published photos or configured homepage/hero assets.
        const guarded=ids.map(id=>A.images.find(x=>x.id===id))
          .filter(img=>img&&(img.is_published||img.is_hero||img.is_featured||img.is_cover||img.show_on_homepage));
        if(guarded.length)throw new Error('Xóa hàng loạt chỉ hỗ trợ ảnh Draft chưa dùng làm Hero/Featured/Homepage/Cover.');
        if(!confirm(`Xóa vĩnh viễn ${ids.length} ảnh Draft khỏi Supabase Storage và database?`))return;
        const {data,error}=await db.from('gallery_images').delete().in('id',ids).select('id,image_path,original_path,image_variants');
        if(error)throw error;
        if(data?.length!==ids.length)throw new Error('Không thể xác nhận đủ số bản ghi đã xóa. Cần kiểm tra dữ liệu.');
        const [publicClean,masterClean]=await Promise.all([
          db.storage.from('wedding-gallery').remove(data.flatMap(x=>[x.image_path,...Object.values(x.image_variants||{})])),
          db.storage.from('wedding-originals').remove(data.map(x=>x.original_path))
        ]);
        if(publicClean.error||masterClean.error)A.setStatus(status,'Đã xóa database, nhưng một số file Storage chưa được dọn: '+(publicClean.error?.message||masterClean.error?.message),'error');
      } else if(updates[kind]){
        const payload={...updates[kind],updated_at:new Date().toISOString()};
        const {data,error}=await db.from('gallery_images').update(payload).in('id',ids).select('id');
        if(error)throw error;
        if(data?.length!==ids.length)throw new Error('Số ảnh cập nhật không khớp.');
      } else throw new Error('Chưa chọn thao tác.');
      await A.loadData();
      if(kind!=='delete'||!status.textContent.includes('Storage')) A.setStatus(status,`Đã xử lý thành công ${ids.length} ảnh.`,'success');
    }catch(error){A.setStatus(status,'Không thành công: '+error.message,'error');}
    finally{updateToolbar();}
  }
  apply?.addEventListener('click',bulkAction);

  async function action(type,id){
    const img=A.images.find(x=>x.id===id);if(!img)return;
    if(type==='edit'){document.dispatchEvent(new CustomEvent('admin:edit',{detail:img}));return;}
    if(type==='publish'){const {error}=await db.from('gallery_images').update({is_published:!img.is_published,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='cover'){await db.from('gallery_images').update({is_cover:false}).eq('album_id',img.album_id);const {error}=await db.from('gallery_images').update({is_cover:true}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='home'){const {error}=await db.from('gallery_images').update({show_on_homepage:!img.show_on_homepage,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='featured'){const {error}=await db.from('gallery_images').update({is_featured:!img.is_featured,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='hero'){await db.from('gallery_images').update({is_hero:false}).neq('id',id);const {error}=await db.from('gallery_images').update({is_hero:true,is_published:true,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='delete'){
      if(!confirm('Xóa ảnh này khỏi album?'))return;
      const {data,error}=await db.from('gallery_images').delete().eq('id',id).select('id');
      if(error||!data?.length)return alert(error?.message||'Không xóa được ảnh.');
      const [pub,master]=await Promise.all([
        db.storage.from('wedding-gallery').remove([img.image_path,...Object.values(img.image_variants||{})]),
        db.storage.from('wedding-originals').remove([img.original_path])
      ]);
      if(pub.error||master.error)console.warn('Storage clean-up failed',pub.error,master.error);
      await A.loadData();
    }
  }
})();