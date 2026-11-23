/* Responsive image selection (Supabase Free compatible).
   Image variants are pre-generated at upload time. Never guesses a missing URL. */
(() => {
  'use strict';

  const widths = [480, 960, 1440];
  const maxDpr = 2.5;
  const connection = () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  const bandwidth = () => {
    const net = connection();
    if (net.saveData || /^(slow-2g|2g)$/.test(String(net.effectiveType || '')) ||
        (Number(net.downlink) > 0 && Number(net.downlink) < 0.8)) return 'save';
    if (net.effectiveType === '3g' ||
        (Number(net.downlink) > 0 && Number(net.downlink) < 2)) return 'balanced';
    return 'auto';
  };
  const priorityCap = (role = 'gallery') => {
    const mode = bandwidth();
    if (mode === 'save') return role === 'lightbox' ? 1440 : 960;
    if (mode === 'balanced') return role === 'lightbox' ? 2400 : 1440;
    return Infinity;
  };

  function variants(image) {
    const value = image?.image_variants;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    return Object.keys(value)
      .map(raw => ({width:Number(raw),path:value[raw]}))
      .filter(entry => Number.isInteger(entry.width) && entry.width > 0 && typeof entry.path === 'string' && entry.path.includes('/') && entry.path.endsWith('.webp'))
      .sort((a,b) => a.width - b.width);
  }

  function resolved(client, path, image) {
    if (!client || !path) return '';
    const base = client.storage.from('wedding-gallery').getPublicUrl(path).data.publicUrl;
    const version = image?.updated_at || image?.created_at || '';
    return version ? base + (base.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(version) : base;
  }
  function sources(client,image,role) {
    if (!image?.image_path) return [];
    const maxSize = Number(image.width) || 2400;
    const original = {width:maxSize,path:image.image_path};
    const copies = variants(image).filter(v=>v.width < maxSize);
    // Thumbnails must never advertise the original full-size file via srcset.
    // Full resolution is requested only after opening a Lightbox.
    const candidates = role === 'lightbox' ? [original]
      : role === 'thumb' ? (copies.filter(v=>v.width<=960).length
        ? copies.filter(v=>v.width<=960) : [original])
      : role === 'story' ? (copies.length ? copies : [original])
      : [...copies,original];
    const cap = priorityCap(role);
    if (Number.isFinite(cap)) {
      const capped = candidates.filter(v=>v.width<=cap);
      // If the legacy image has no variants, preserve its original public URL.
      return capped.length ? capped : [candidates[0]];
    }
    return candidates;
  }

  function select(client,image,desiredWidth=960,role='gallery') {
    const list = sources(client,image,role);
    if (!list.length) return '';
    const requested = Math.max(1,Number(desiredWidth)||defaultTarget(role));
    const picked = list.find(entry=>entry.width>=requested) || list[list.length-1];
    return resolved(client,picked.path,image);
  }

  function fullUrl(client,image) {
    return image?.image_path ? resolved(client,image.image_path,image) : '';
  }
  function previewUrl(client,image) {
    const copies = variants(image);
    // 320px when available; legacy images already have a 480px variant.
    const picked = copies.find(x=>x.width>=320 && x.width<=480) ||
      copies.find(x=>x.width<=960) || copies[0];
    return resolved(client,picked?.path||image?.image_path,image);
  }
  function mediumUrl(client,image) {
    const copies=variants(image).filter(v=>v.width<=960);
    const picked=copies.find(v=>v.width>=960) || copies[copies.length-1];
    return resolved(client,picked?.path||image?.image_path,image);
  }
  function srcset(client,image,role='gallery') {
    const list = sources(client,image,role);
    if (list.length<=1) return '';
    return list.map(({width,path})=>resolved(client,path,image)+' '+width+'w').join(', ');
  }

  function pixelWidth(cssWidth) {
    const dpr = Math.min(maxDpr,Math.max(1,Number(devicePixelRatio)||1));
    return Math.ceil(Math.max(1,cssWidth)*dpr);
  }
  function defaultTarget(role) {
    const cssWidth = ({
      thumb:Math.max(180,innerWidth * (innerWidth<760?.47:.26)),
      story:Math.min(innerWidth*.87,840),
      hero:innerWidth,
      lightbox:Math.min(innerWidth,1600),
      gallery:Math.min(innerWidth*.8,1000)
    })[role] || 600;
    return pixelWidth(cssWidth);
  }
  function attrs(client,image,options={}) {
    const role=options.role||'gallery';
    const link=select(client,image,options.targetWidth||defaultTarget(role),role);
    const srcSet=srcset(client,image,role);
    return {
      src:link,
      srcset:srcSet,
      sizes:options.sizes||'(max-width: 760px) 48vw, (max-width: 1100px) 45vw, 30vw',
      loading:options.loading||'lazy',
      fetchpriority:options.priority||(role==='hero'?'high':'auto'),
      decoding:'async'
    };
  }
  function escapeAttr(value) {
    return String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function htmlAttrs(client,image,opts={}) {
    const v=attrs(client,image,opts);
    return 'src="'+escapeAttr(v.src)+'"'
      +(v.srcset?' srcset="'+escapeAttr(v.srcset)+'" sizes="'+escapeAttr(v.sizes)+'"':'')
      +' loading="'+escapeAttr(v.loading)+'" decoding="async" fetchpriority="'+escapeAttr(v.fetchpriority)+'"';
  }
  function apply(img,client,image,options={}) {
    if (!img || !image?.image_path) return;
    const v=attrs(client,image,options);
    // Set srcset/sizes first to let the browser make a single responsive request.
    if (v.srcset) {
      img.sizes=v.sizes;img.srcset=v.srcset;
    } else {
      img.removeAttribute('srcset');img.removeAttribute('sizes');
    }
    img.loading=v.loading;img.decoding='async';img.fetchPriority=v.fetchpriority;
    img.src=v.src;
  }


  /* TOP/Homepage: one small image first, then one decoded sharper image.
     Never fetch an original in the background when a WebP variant exists. */
  const progressiveNodes=new WeakMap(), progressiveSlides=new WeakMap();
  function topPlan(client,image,role='home') {
    const preview=previewUrl(client,image);
    const mode=bandwidth();
    const copies=variants(image);
    const maxWidth=mode==='save'?480:mode==='balanced'?
      (role==='hero'?960:480):(role==='hero'?1440:960);
    const eligible=copies.filter(v=>v.width<=maxWidth);
    const selected=eligible[eligible.length-1]||copies[0];
    const sharper=selected?resolved(client,selected.path,image):preview;
    return {preview,sharper,upgrade:mode!=='save'&&Boolean(sharper&&preview&&sharper!==preview),mode};
  }
  function progressiveApply(img,client,image,options={}) {
    if(!img||!client||!image?.image_path)return;
    const key=image.image_path+'|'+(image.updated_at||image.created_at||'');
    const old=progressiveNodes.get(img);
    if(old?.key===key)return;
    if(old){
      old.alive=false;
      old.observer?.disconnect();
      clearTimeout(old.timer);
      if(old.onLoad)img.removeEventListener('load',old.onLoad);
      if(old.onError)img.removeEventListener('error',old.onError);
    }
    const stage=topPlan(client,image,options.role||'home');
    if(!stage.preview)return;
    // Keep only actual registered compact WebP variants. Never request a
    // 4–6MB original on the homepage when a thumbnail is available.
    const compact=variants(image).filter(v=>v.width<=960);
    const fallbacks=[stage.preview,
      ...compact.map(v=>resolved(client,v.path,image))]
      .filter((url,index,all)=>url && all.indexOf(url)===index);
    const item={
      key,alive:true,timer:0,observer:null,started:false,
      attempt:0,loadedUrl:'',hadBaseLoad:false,onLoad:null,onError:null
    };
    progressiveNodes.set(img,item);
    img.removeAttribute('srcset');img.removeAttribute('sizes');
    img.loading=options.immediate?'eager':'lazy';
    img.decoding='async';
    img.fetchPriority=options.priority||(options.immediate?'high':'low');
    img.dataset.homeProgressive='pending';
    const isCurrent=()=>item.alive && progressiveNodes.get(img)===item && img.isConnected;
    function tryNext() {
      if(!isCurrent())return;
      if(item.attempt<fallbacks.length){
        img.dataset.homeProgressive='loading';
        img.src=fallbacks[item.attempt++];
        return;
      }
      img.dataset.homeProgressive='error';
      img.dispatchEvent(new Event('wedding:home-photo-error'));
    }
    item.onLoad=()=>{
      if(!isCurrent() || !img.naturalWidth)return;
      const firstSuccess=!item.hadBaseLoad;
      item.hadBaseLoad=true;
      item.loadedUrl=img.currentSrc||img.src;
      img.dataset.homeProgressive='ready';
      if(!firstSuccess||!stage.upgrade||stage.sharper===item.loadedUrl)return;
      // No HD upgrade on slow 4G or when the viewer has moved away.
      if(performance.now()-item.startedAt>1800)return;
      item.timer=setTimeout(()=>{
        item.timer=0;
        if(!isCurrent() || !item.hadBaseLoad || img.dataset.homeProgressive!=='ready')return;
        const sharper=new Image();
        sharper.decoding='async';sharper.fetchPriority='low';
        sharper.onload=()=>{
          if(isCurrent() && img.dataset.homeProgressive==='ready'){
            // Preserve the already-visible preview until the sharper image
            // is decoded, then switch without exposing a blank frame.
            img.dataset.homeProgressive='loading';
            img.src=stage.sharper;
          }
        };
        sharper.src=stage.sharper;
      },Number(options.delay)||900);
    };
    item.onError=()=>{
      if(!isCurrent())return;
      if(item.hadBaseLoad){
        // A failed optional sharpness upgrade must not erase a good preview.
        if(img.src!==item.loadedUrl){
          img.dataset.homeProgressive='loading';
          img.src=item.loadedUrl;
          return;
        }
        img.dataset.homeProgressive='error';
        img.dispatchEvent(new Event('wedding:home-photo-error'));
        return;
      }
      // When 320px fails, try 480px and 960px; a genuine terminal error
      // is announced only after all available compact sources have failed.
      tryNext();
    };
    img.addEventListener('load',item.onLoad);
    img.addEventListener('error',item.onError);
    const start=()=>{
      if(!isCurrent()||item.started)return;
      item.started=true;
      item.startedAt=performance.now();
      // IntersectionObserver has already gated the request. Avoid another
      // layer of native lazy-loading inside Safari's nested scrolling viewport.
      img.loading='eager';
      tryNext();
    };
    if(options.immediate||!('IntersectionObserver'in window))start();
    else {
      item.observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
          item.observer.disconnect();item.observer=null;start();
        }
      },{rootMargin:'240px 0px',threshold:0});
      item.observer.observe(img);
    }
  }
  function progressiveSlide(layer,client,image) {
    if(!layer||!client||!image?.image_path)return;
    const key=image.image_path+'|'+(image.updated_at||image.created_at||'');
    const tiles=[...layer.querySelectorAll('.v5-hero-tile')];
    if(!tiles.length)return;
    const stage=topPlan(client,image,'hero');
    let item=progressiveSlides.get(layer);
    if(!item||item.key!==key){
      if(item)clearTimeout(item.timer);
      item={key,timer:0,phase:'preview'};
      progressiveSlides.set(layer,item);
      item.previewLoaded=false;item.previewStarted=performance.now();
      const representative=tiles.find(x=>x.classList.contains('v6-center-image'))||tiles[0];
      representative.addEventListener('load',()=>{
        if(progressiveSlides.get(layer)!==item)return;
        item.previewLoaded=true;
        item.previewDuration=performance.now()-item.previewStarted;
        if(layer.classList.contains('is-current'))progressiveSlide(layer,client,image);
      },{once:true});
      for(const img of tiles){
        img.removeAttribute('srcset');img.removeAttribute('sizes');
        img.loading='eager';img.decoding='async';
        img.fetchPriority='low';img.src=stage.preview;
      }
    }
    if(!stage.upgrade||item.phase!=='preview'||item.timer||
       !item.previewLoaded||item.previewDuration>1800)return;
    item.timer=setTimeout(()=>{
      item.timer=0;
      if(!layer.isConnected||!layer.classList.contains('is-current')||item.phase!=='preview')return;
      item.phase='loading';
      // One shared request for the blurred backdrop and the contained full photo.
      const sharper=new Image();
      sharper.decoding='async';sharper.fetchPriority='low';
      sharper.onload=()=>{
        if(layer.isConnected&&layer.classList.contains('is-current')&&
            progressiveSlides.get(layer)===item){
          for(const img of tiles)img.src=stage.sharper;
          item.phase='sharp';
        } else item.phase='preview';
      };
      sharper.onerror=()=>{item.phase='preview';};
      sharper.src=stage.sharper;
    },850);
  }

  window.WeddingAdaptiveImages={widths,bandwidth,priorityCap,variants,resolved,sources,select,srcset,attrs,htmlAttrs,apply,pixelWidth,fullUrl,previewUrl,mediumUrl,topPlan,progressiveApply,progressiveSlide};
})();