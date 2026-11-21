(() => {
  'use strict';
  const A=window.AdminApp, P=window.AdminPhotoProcessor, db=A.db;
  const $=id=>document.getElementById(id);
  const input=$('bulkFileInput'),zone=$('bulkDropZone'),list=$('bulkPreviewGrid');
  const albumSelect=$('bulkAlbumSelect'), startBtn=$('bulkStartBtn'),retryBtn=$('bulkRetryBtn'),clearBtn=$('bulkClearBtn');
  if(!input||!zone||!list||!P||!db)return;
  const modeButtons=[...document.querySelectorAll('[data-album-mode]')];
  const modePanels=[...document.querySelectorAll('[data-album-panel]')];
  function switchMode(mode){
    modeButtons.forEach(b=>{
      const active=b.dataset.albumMode===mode;
      b.classList.toggle('active',active);
      b.setAttribute('aria-pressed',String(active));
    });
    modePanels.forEach(p=>p.classList.toggle('hidden',p.dataset.albumPanel!==mode));
  }
  modeButtons.forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.albumMode)));
  switchMode('single');
  window.AdminAlbumModes={switchMode};
  let queue=[],running=false,dragId=null;
  const allowed=new Set(['image/jpeg','image/png','image/webp']);
  const status=$('bulkStatus'),bar=$('bulkProgressBar'),stats=$('bulkSummary');

  function release(item){ if(item.preview)URL.revokeObjectURL(item.preview); }
  function key(file){return [file.name.toLowerCase(),file.size,file.lastModified].join(':');}
  function addFiles(files){
    if(running)return;
    let duplicates=0,rejected=0;
    const existing=new Set(queue.map(x=>key(x.file)));
    for(const file of [...files]){
      if(!allowed.has(file.type) || !file.size){rejected++;continue;}
      if(existing.has(key(file))){duplicates++;continue;}
      existing.add(key(file));
      queue.push({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),state:'ready',error:'',savedId:null});
    }
    render();
    if(rejected||duplicates) A.setStatus(status,
      [duplicates&&`Bỏ qua ${duplicates} file trùng trong hàng đợi`,rejected&&`Bỏ qua ${rejected} file không hỗ trợ`].filter(Boolean).join(' · '),'error');
    else A.setStatus(status,queue.length?`Đã chọn ${queue.length} ảnh. Kiểm tra thứ tự và nhấn Bắt đầu upload.`:'');
  }
  input.addEventListener('change',()=>{addFiles(input.files);input.value='';});
  zone.addEventListener('dragover',e=>{e.preventDefault();if(!running)zone.classList.add('drag-active');});
  zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('drag-active');});
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-active');addFiles(e.dataTransfer.files);});
  zone.addEventListener('click',e=>{if(e.target===zone || e.target.closest('[data-open-files]'))input.click();});
  zone.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===zone){e.preventDefault();input.click();}});

  function move(id,offset){
    if(running)return;
    const i=queue.findIndex(x=>x.id===id),j=i+offset;
    if(i<0||j<0||j>=queue.length)return;
    [queue[i],queue[j]]=[queue[j],queue[i]];render();
  }
  function remove(id){
    if(running)return;
    const i=queue.findIndex(x=>x.id===id);
    if(i>=0){release(queue[i]);queue.splice(i,1);render();}
  }
  function render(){
    const count=queue.length,done=queue.filter(x=>x.state==='success').length,
      failed=queue.filter(x=>x.state==='failed').length,processing=queue.filter(x=>x.state==='processing').length;
    const completed=done+failed;
    stats.textContent=`${count} ảnh · ${done} thành công · ${failed} lỗi`+(processing?` · ${processing} đang xử lý`:'');
    bar.style.width=(count?Math.round(completed/count*100):0)+'%';
    $('bulkProgressTrack').setAttribute('aria-valuenow',String(count?Math.round(completed/count*100):0));
    startBtn.disabled=running||!queue.some(x=>x.state==='ready')||!albumSelect.value;
    retryBtn.disabled=running||!failed||!albumSelect.value;
    clearBtn.disabled=running||!count;
    albumSelect.disabled=running;
    $('bulkPublishCheck').disabled=running;
    $('bulkShowInAlbumCheck').disabled=running;
    input.disabled=running;
    zone.setAttribute('aria-disabled',String(running));
    list.innerHTML=queue.map((item,i)=>`<article class="bulk-photo-card" data-id="${item.id}" draggable="${!running&&item.state!=='processing'}">
      <div class="bulk-photo-cover"><img loading="lazy" src="${item.preview}" alt="Preview ảnh ${i+1}">
        <span class="bulk-position">${i+1}</span></div>
      <div class="bulk-photo-info"><strong title="${A.esc(item.file.name)}">${A.esc(item.file.name)}</strong>
        <small>${P.formatMb(item.file.size)} MB · ${({ready:'Sẵn sàng',processing:'Đang xử lý',success:'Thành công',failed:'Thất bại'})[item.state]}</small>
        ${item.error?`<small class="bulk-photo-error" title="${A.esc(item.error)}">${A.esc(item.error)}</small>`:''}
        <div class="bulk-photo-actions">
          <button data-move="-1" data-id="${item.id}" aria-label="Đưa ảnh lên" ${running||i===0?'disabled':''}>↑</button>
          <button data-move="1" data-id="${item.id}" aria-label="Đưa ảnh xuống" ${running||i===count-1?'disabled':''}>↓</button>
          <button data-remove="${item.id}" aria-label="Bỏ ảnh" ${running?'disabled':''}>×</button>
        </div></div></article>`).join('');
    list.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>move(b.dataset.id,Number(b.dataset.move)));
    list.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>remove(b.dataset.remove));
    list.querySelectorAll('[draggable=true]').forEach(card=>{
      card.addEventListener('dragstart',e=>{dragId=card.dataset.id;e.dataTransfer.effectAllowed='move';});
      card.addEventListener('dragover',e=>{if(dragId){e.preventDefault();e.dataTransfer.dropEffect='move';}});
      card.addEventListener('drop',e=>{
        e.preventDefault();const src=queue.findIndex(x=>x.id===dragId),dest=queue.findIndex(x=>x.id===card.dataset.id);
        if(src>=0&&dest>=0&&src!==dest){const [item]=queue.splice(src,1);queue.splice(dest,0,item);render();}
        dragId=null;
      });
      card.addEventListener('dragend',()=>{dragId=null;});
    });
  }

  async function run(mode){
    if(running)return;
    const album=A.albums.find(a=>a.id===albumSelect.value);
    if(!album){A.setStatus(status,'Vui lòng chọn Album.','error');return;}
    const pending=queue.filter(x=>mode==='retry'?x.state==='failed':x.state==='ready');
    if(!pending.length)return;
    running=true;
    const settings={
      published:$('bulkPublishCheck').checked,
      showInAlbum:$('bulkShowInAlbumCheck').checked
    };
    const maxOrder=Math.max(0,...A.images.filter(x=>x.album_id===album.id).map(x=>Number(x.sort_order)||0));
    // Reserve stable positions before starting parallel workers.
    for(const item of pending){
      item.sortOrder=maxOrder+(queue.indexOf(item)+1)*10;
      item.state='ready';item.error='';
    }
    let cursor=0;
    render();
    A.setStatus(status,`Đang upload ${pending.length} ảnh vào ${album.title}...`);
    async function worker(){
      while(cursor<pending.length){
        const item=pending[cursor++];
        item.state='processing';render();
        try{
          const result=await P.uploadBulkImage(db,item.file,album,{...settings,sortOrder:item.sortOrder});
          item.state='success';item.savedId=result.id;
        }catch(error){item.state='failed';item.error=error?.message||'Không thể upload.';}
        render();
      }
    }
    try{
      await Promise.all([worker(),worker()]);
      await A.loadData();
      const completed=pending.filter(x=>x.state==='success').length;
      const errors=pending.length-completed;
      A.setStatus(status,`Đã upload ${completed}/${pending.length} ảnh.`+(errors?` ${errors} ảnh lỗi có thể thử lại.`:' Mở tab Sắp xếp để thay đổi thứ tự hiển thị.'),errors?'error':'success');
    }catch(error){A.setStatus(status,'Không thể cập nhật thư viện: '+error.message,'error');}
    finally{running=false;render();}
  }
  startBtn.addEventListener('click',()=>run('ready'));
  retryBtn.addEventListener('click',()=>run('retry'));
  clearBtn.addEventListener('click',()=>{if(running)return;queue.forEach(release);queue=[];render();A.setStatus(status,'');});
  document.addEventListener('admin:data',()=>{
    const previous=albumSelect.value;
    albumSelect.innerHTML=A.albums.map(a=>`<option value="${a.id}">${A.esc(a.title)}</option>`).join('');
    if(A.albums.some(a=>a.id===previous))albumSelect.value=previous;
    render();
  });
  window.addEventListener('beforeunload',()=>queue.forEach(release));
  render();
})();