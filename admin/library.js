(() => {
  const A=window.AdminApp, db=A.db, filter=document.getElementById('libraryAlbumFilter');
  document.addEventListener('admin:data',()=>{
    document.getElementById('albumSelect').innerHTML=A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    filter.innerHTML='<option value="all">Tất cả album</option>'+A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    renderStats();render();
  });
  function renderStats(){const p=A.images.filter(x=>x.is_published).length;document.getElementById('albumStats').innerHTML=`<div class="stat"><span>Album</span><strong>${A.albums.length}</strong></div><div class="stat"><span>Tổng ảnh</span><strong>${A.images.length}</strong></div><div class="stat"><span>Đang hiển thị</span><strong>${p}</strong></div><div class="stat"><span>Bản nháp</span><strong>${A.images.length-p}</strong></div>`;}
  filter.onchange=render;
  function render(){
    const byId=Object.fromEntries(A.albums.map(a=>[a.id,a])),list=A.images.filter(x=>filter.value==='all'||x.album_id===filter.value);
    document.getElementById('adminGallery').innerHTML=list.length?list.map(img=>`<article class="media-card"><div class="media-thumb"><img loading="lazy" src="${A.publicUrl(img.image_path)}" alt="${A.esc(img.alt_text||'')}">${img.is_published?'':'<span class="draft-pill">DRAFT</span>'}</div><div class="media-body"><strong>${A.esc(img.title||byId[img.album_id]?.title||'Untitled')}</strong><small>${A.esc(byId[img.album_id]?.title||'')}</small><div class="media-tags">${img.is_hero?'<span>Hero</span>':''}${img.is_featured?'<span>Featured</span>':''}${img.show_on_homepage?'<span>Homepage</span>':''}<span>${A.esc(img.display_size||'auto')}</span></div><div class="media-actions"><button data-action="edit" data-id="${img.id}">Edit ảnh</button><button data-action="publish" data-id="${img.id}">${img.is_published?'Ẩn':'Publish'}</button><button data-action="cover" data-id="${img.id}">${img.is_cover?'Cover ✓':'Set cover'}</button><button data-action="home" data-id="${img.id}">${img.show_on_homepage?'Ẩn Home':'Show Home'}</button><button data-action="featured" data-id="${img.id}">${img.is_featured?'Featured ✓':'Featured'}</button><button data-action="hero" data-id="${img.id}">${img.is_hero?'Hero ✓':'Set Hero'}</button><button class="danger" data-action="delete" data-id="${img.id}">Xóa</button></div></div></article>`).join(''):'<p class="muted">Chưa có ảnh.</p>';
    document.querySelectorAll('.media-actions button').forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id));
  }
  async function action(type,id){
    const img=A.images.find(x=>x.id===id);if(!img)return;
    if(type==='edit'){document.dispatchEvent(new CustomEvent('admin:edit',{detail:img}));return;}
    if(type==='publish'){const {error}=await db.from('gallery_images').update({is_published:!img.is_published,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='cover'){await db.from('gallery_images').update({is_cover:false}).eq('album_id',img.album_id);const {error}=await db.from('gallery_images').update({is_cover:true}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='home'){const {error}=await db.from('gallery_images').update({show_on_homepage:!img.show_on_homepage,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='featured'){const {error}=await db.from('gallery_images').update({is_featured:!img.is_featured,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='hero'){await db.from('gallery_images').update({is_hero:false}).neq('id',id);const {error}=await db.from('gallery_images').update({is_hero:true,show_on_homepage:true,is_published:true,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await A.loadData();}
    if(type==='delete'){if(!confirm('Xóa ảnh này khỏi album?'))return;await Promise.all([db.storage.from('wedding-gallery').remove([img.image_path]),db.storage.from('wedding-originals').remove([img.original_path])]);const {error}=await db.from('gallery_images').delete().eq('id',id);if(error)return alert(error.message);await A.loadData();}
  }
})();