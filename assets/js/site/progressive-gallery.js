/* V21 — progressive gallery images on Supabase Free, no WebGL, no new backend.
 * Stage 1: 320/480px preview near the scroll position.
 * Stage 2: 960px only after staying visible, never the full original in the grid.
 * Stage 3: full resolution is deliberately reserved for a Lightbox tap. */
(() => {
  'use strict';
  const INITIAL_COUNT=10, NEXT_COUNT=10, MAX_PREVIEWS=3, MAX_UPGRADES=1;
  const root=document.getElementById('albumOverlay');
  const adaptive=window.WeddingAdaptiveImages;
  const lowMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let session=null;
  function slowNetwork() {
    return adaptive?.bandwidth?.() === 'save' || adaptive?.bandwidth?.() === 'balanced';
  }
  function safeUrl(client,img,role) {
    if(!adaptive || !client) return '';
    if(role==='preview')return adaptive.previewUrl(client,img);
    if(role==='medium')return adaptive.mediumUrl(client,img);
    return adaptive.fullUrl(client,img);
  }
  function disconnect(){
    if(!session)return;
    const old=session;
    old.alive=false;
    old.previewObserver?.disconnect();
    old.upgradeObserver?.disconnect();
    old.batchObserver?.disconnect();
    for(const timer of old.timers.values())clearTimeout(timer);
    old.timers.clear();
    for(const card of old.cards.values()){
      const image=card.querySelector('img[data-progressive-image]');
      if(image){image.onload=null;image.onerror=null;}
    }
    old.previews.length=0;
    old.upgrades.length=0;
    session=null;
  }
  function markError(state,card){
    if(!state.alive || !card.isConnected)return;
    card.classList.add('is-photo-error');
    card.classList.remove('is-photo-loading');
    card.setAttribute('aria-label',(card.dataset.photoTitle || 'Ảnh cưới')+' — Chạm để mở ảnh');
  }
  function setPreview(state,card){
    if(!state.alive || !card.isConnected)return;
    const id=card.dataset.albumPhotoId;
    const item=state.images.get(id);
    if(!item)return;
    const img=card.querySelector('img[data-progressive-image]');
    if(!img)return;
    const previewUrl=safeUrl(state.client,item,'preview');
    const mediumUrl=safeUrl(state.client,item,'medium');
    // Never fallback to the original if usable variants exist. A missing
    // thumbnail must not silently trigger a full-resolution gallery request.
    const list=[previewUrl,mediumUrl]
      .filter((url,index,array)=>url && array.indexOf(url)===index);
    if(!list.length){markError(state,card);return;}
    card.classList.add('is-photo-loading');
    img.loading='eager'; // IntersectionObserver has already gated this request.
    img.decoding='async';img.fetchPriority='low';
    img.removeAttribute('srcset');img.removeAttribute('sizes');
    let attempt=0;
    const done=()=>{
      img.onload=null;img.onerror=null;
      state.activePreviews=Math.max(0,state.activePreviews-1);
      drainPreviews(state);
    };
    const loaded=()=>{
      if(!state.alive||!card.isConnected){done();return;}
      card.classList.add('is-photo-ready');
      card.classList.remove('is-photo-error','is-photo-loading');
      done();
      scheduleUpgrade(state,card);
    };
    const failed=()=>{
      if(!state.alive||!card.isConnected){done();return;}
      if(attempt<list.length){
        img.src=list[attempt++];
      } else {
        markError(state,card);
        done();
      }
    };
    img.onload=loaded;img.onerror=failed;
    failed();
  }
  function drainPreviews(state){
    if(!state.alive || state.paused)return;
    while(state.activePreviews<MAX_PREVIEWS && state.previews.length){
      const card=state.previews.shift();
      if(!card.isConnected)continue;
      state.activePreviews++;
      setPreview(state,card);
    }
  }
  function queuePreview(state,card){
    if(!state.alive || card.dataset.previewQueued)return;
    card.dataset.previewQueued='1';
    state.previews.push(card);
    drainPreviews(state);
  }
  function scheduleUpgrade(state,card) {
    const id=card.dataset.albumPhotoId;
    if(!state.alive || !state.visible.has(id) || slowNetwork())return;
    const item=state.images.get(id);
    if(!item || !adaptive?.variants(item)?.length)return;
    const preview=adaptive.variants(item).find(v=>v.width>=320&&v.width<=480);
    const medium=adaptive.variants(item).find(v=>v.width>=960);
    if(!preview || !medium || card.clientWidth* Math.min(window.devicePixelRatio||1,3)<preview.width*1.12)return;
    if(state.timers.has(id) || card.dataset.upgradeQueued || card.dataset.upgraded)return;
    const timer=setTimeout(()=>{
      state.timers.delete(id);
      if(!state.alive || !state.visible.has(id) || !card.isConnected)return;
      card.dataset.upgradeQueued='1';
      state.upgrades.push(card);
      drainUpgrades(state);
    },1250);
    state.timers.set(id,timer);
  }
  function drainUpgrades(state) {
    if(!state.alive || state.paused)return;
    while(state.activeUpgrades<MAX_UPGRADES && state.upgrades.length) {
      const card=state.upgrades.shift();
      delete card.dataset.upgradeQueued;
      if(!card.isConnected || !state.visible.has(card.dataset.albumPhotoId))continue;
      const item=state.images.get(card.dataset.albumPhotoId);
      const src=safeUrl(state.client,item,'medium');
      const oldImg=card.querySelector('img[data-progressive-image]');
      if(!src || !oldImg || oldImg.src===src || slowNetwork())continue;
      state.activeUpgrades++;
      const higher=new Image();
      higher.decoding='async';higher.fetchPriority='low';
      higher.className='album-progressive-sharp';
      higher.alt='';
      higher.setAttribute('aria-hidden','true');
      const finish=()=>{
        state.activeUpgrades=Math.max(0,state.activeUpgrades-1);
        drainUpgrades(state);
      };
      higher.onload=()=>{
        if(!state.alive || !card.isConnected){finish();return;}
        const original=card.querySelector('img[data-progressive-image]');
        if(!original){finish();return;}
        // Crossfade over a decoded preview. Release the duplicate overlay soon
        // afterwards to keep scrolling memory use small on phones.
        card.insertBefore(higher,original.nextSibling);
        requestAnimationFrame(()=>higher.classList.add('is-sharp'));
        setTimeout(()=>{
          if(state.alive && card.isConnected && original.isConnected){
            original.src=src;card.dataset.upgraded='1';
            higher.remove();
          }
        },450);
        finish();
      };
      higher.onerror=finish;
      higher.src=src;
    }
  }
  function observeCards(state,cards){
    for(const card of cards){
      state.cards.set(card.dataset.albumPhotoId,card);
      state.previewObserver?.observe(card);
      state.upgradeObserver?.observe(card);
      if(!state.previewObserver)queuePreview(state,card);
    }
  }
  function appendBatch(state){
    if(!state.alive || state.nextIndex>=state.photos.length)return;
    const end=Math.min(state.nextIndex+NEXT_COUNT,state.photos.length);
    const items=state.photos.slice(state.nextIndex,end);
    state.nextIndex=end;
    const template=document.createElement('template');
    template.innerHTML=items.map(state.renderCard).join('');
    const fragment=template.content;
    const cards=[...fragment.querySelectorAll('[data-album-photo-id]')];
    state.grid.insertBefore(fragment,state.sentinel);
    observeCards(state,cards);
    const remaining=state.photos.length-state.nextIndex;
    state.sentinel.hidden=remaining<=0;
    if(remaining>0)state.sentinel.textContent='Đang chuẩn bị thêm ảnh...';
    if(!state.batchObserver && remaining>0)appendBatch(state);
  }
  function mount(grid,photos,renderCard,client){
    disconnect();
    if(!grid || !photos?.length)return;
    const state={
      alive:true,paused:false,grid,photos,renderCard,client,
      images:new Map(photos.map(x=>[String(x.id),x])),
      cards:new Map(), visible:new Set(),timers:new Map(),
      nextIndex:0,previews:[],upgrades:[],
      activePreviews:0,activeUpgrades:0,
      previewObserver:null,upgradeObserver:null,batchObserver:null
    };
    session=state;
    grid.innerHTML='';
    state.sentinel=document.createElement('div');
    state.sentinel.className='album-batch-sentinel';
    state.sentinel.setAttribute('aria-hidden','true');
    state.sentinel.textContent='Đang chuẩn bị thêm ảnh...';
    grid.appendChild(state.sentinel);
    if('IntersectionObserver' in window){
      state.previewObserver=new IntersectionObserver(entries=>{
        for(const entry of entries)if(entry.isIntersecting){
          state.previewObserver.unobserve(entry.target);
          queuePreview(state,entry.target);
        }
      },{root,rootMargin:'320px 0px',threshold:0});
      state.upgradeObserver=new IntersectionObserver(entries=>{
        for(const entry of entries){
          const id=entry.target.dataset.albumPhotoId;
          if(entry.isIntersecting && entry.intersectionRatio>=.4){
            state.visible.add(id);
            if(entry.target.classList.contains('is-photo-ready'))scheduleUpgrade(state,entry.target);
          }else{
            state.visible.delete(id);
            const timer=state.timers.get(id);
            if(timer){clearTimeout(timer);state.timers.delete(id);}
          }
        }
      },{root,threshold:[0,.4,.7]});
      state.batchObserver=new IntersectionObserver(entries=>{
        if(entries.some(x=>x.isIntersecting))appendBatch(state);
      },{root,rootMargin:'450px 0px',threshold:0});
    }
    appendBatch(state);
    state.batchObserver?.observe(state.sentinel);
    if(INITIAL_COUNT!==NEXT_COUNT)console.warn('Initial batch differs from next batch');
  }
  function activate(){
    if(!session?.alive)return;
    // The gallery overlay may have been hidden during the first observer tick.
    // Reobserving makes WebKit notify us once it becomes visible.
    for(const card of session.cards.values()){
      if(!card.dataset.previewQueued)session.previewObserver?.observe(card);
    }
    if(session.nextIndex<session.photos.length)session.batchObserver?.observe(session.sentinel);
  }
  function pause(shouldPause=true){
    if(!session)return;
    session.paused=Boolean(shouldPause);
    if(!session.paused){
      drainPreviews(session);
      drainUpgrades(session);
    }
  }
  function count(){return session?.cards.size||0;}
  window.WeddingProgressiveGallery={mount,activate,pause,destroy:disconnect,count,slowNetwork};
})();