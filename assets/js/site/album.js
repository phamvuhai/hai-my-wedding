/* Wedding Album V12 — image-first reveal. Never cover a pending/broken photograph. */
(() => {
  'use strict';
  const root=document.getElementById('homeGallery');
  if(!root)return;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const seen=new WeakSet();
  const observer=('IntersectionObserver' in window)
    ? new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          entry.target.dataset.albumV12Visible='true';
          maybeReveal(entry.target);
          observer.unobserve(entry.target);
        }
      },{threshold:.08,rootMargin:'0px 0px -5% 0px'})
    : null;

  function errorLabel(){
    const l=window.WeddingI18n?.language;
    return l==='ja'?'画像を読み込めませんでした':l==='en'?'Photo unavailable':'Ảnh chưa tải được';
  }
  function maybeReveal(tile){
    if(!tile.classList.contains('album-v12-ready') || tile.dataset.albumV12Visible!=='true')return;
    if(tile.dataset.albumV12Revealed==='true')return;
    tile.dataset.albumV12Revealed='true';
    if(reduced?.matches)return;
    // Only the decorative overlay animates; the real image is already visible.
    tile.classList.add('album-v12-animating');
    const clear=()=>tile.classList.remove('album-v12-animating');
    tile.querySelector('.photo-curtain')?.addEventListener('animationend',clear,{once:true});
    setTimeout(clear,1150);
  }
  function mountTile(tile){
    if(seen.has(tile))return;
    seen.add(tile);
    const image=tile.querySelector('img');
    if(!image)return;
    const hasRequest=()=>Boolean(image.currentSrc || image.getAttribute('src') ||
      image.getAttribute('srcset'));
    const done=()=>{
      if(!tile.isConnected || !image.naturalWidth)return;
      // Recovery must be possible after a failed preview followed by a
      // successful 480/960px fallback, without remounting the gallery.
      image.hidden=false;
      tile.disabled=false;
      tile.removeAttribute('aria-disabled');
      tile.classList.add('album-v12-ready');
      tile.classList.remove('album-v12-error-state');
      tile.querySelector('.album-v12-error')?.remove();
      maybeReveal(tile);
    };
    const broken=()=>{
      // HTMLImageElement.complete is true when src is missing. The progressive
      // loader intentionally assigns src later through IntersectionObserver.
      if(!hasRequest() || !tile.isConnected)return;
      tile.classList.add('album-v12-error-state');
      tile.classList.remove('album-v12-ready','album-v12-animating');
      image.hidden=true;
      // Keep the card clickable. A guest can still open Detail or retry.
      tile.disabled=false;
      tile.removeAttribute('aria-disabled');
      let label=tile.querySelector('.album-v12-error');
      if(!label){
        label=document.createElement('span');
        label.className='album-v12-error';
        label.setAttribute('role','status');
        tile.appendChild(label);
      }
      label.textContent=errorLabel();
    };
    image.addEventListener('load',done);
    // A progressive source can fail at 320px and still recover at 480/960px.
    // Show a permanent error only after ALL compact fallback URLs have failed.
    image.addEventListener('error',()=>{
      if(image.dataset.homeProgressive!=='loading')broken();
    });
    image.addEventListener('wedding:home-photo-error',broken);
    // Only consider a cached image ready if the browser has a real URL and
    // decoded pixels. Empty src images must remain pending, not broken.
    if(hasRequest() && image.complete && image.naturalWidth>0)done();
    if(observer)observer.observe(tile);
    else{tile.dataset.albumV12Visible='true';maybeReveal(tile);}
  }
  const mount=()=>root.querySelectorAll(':scope > .home-photo').forEach(mountTile);
  new MutationObserver(mount).observe(root,{childList:true});
  document.addEventListener('wedding:language',()=>{
    root.querySelectorAll('.album-v12-error').forEach(el=>el.textContent=errorLabel());
  });
  mount();
})();
