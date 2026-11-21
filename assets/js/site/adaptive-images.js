/* Responsive image selection (Supabase Free compatible).
   Image variants are pre-generated at upload time. Never guesses a missing URL. */
(() => {
  'use strict';

  const widths = [480, 960, 1440];
  const maxDpr = 2.5;
  const connection = () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  const bandwidth = () => {
    const net = connection();
    if (net.saveData || /^(slow-2g|2g)$/.test(String(net.effectiveType || ''))) return 'save';
    if (net.effectiveType === '3g') return 'balanced';
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

  window.WeddingAdaptiveImages={widths,bandwidth,priorityCap,variants,resolved,sources,select,srcset,attrs,htmlAttrs,apply,pixelWidth,fullUrl,previewUrl,mediumUrl};
})();