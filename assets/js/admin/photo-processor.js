(() => {
  'use strict';
  // Shared, stateless WebP optimization used by both the single-photo editor and bulk uploads.
  const MB = 1024 * 1024;
  const PUBLIC_TARGET = 5.5 * MB, PUBLIC_LIMIT = 6 * MB;
  const MASTER_TARGET = 19 * MB, MASTER_LIMIT = 20 * MB;
  const PUBLIC_PLANS = [
    [2400,.84],[2400,.78],[2400,.72],[2400,.66],
    [2200,.82],[2200,.76],[2200,.70],
    [2000,.82],[2000,.76],[2000,.70],
    [1800,.80],[1800,.74],[1600,.76],[1600,.68]
  ];
  const MASTER_PLANS = [
    [3000,.90],[3000,.84],[3000,.78],
    [2800,.86],[2800,.80],[2600,.84],[2600,.78],
    [2400,.82],[2200,.80],[2000,.78]
  ];
  const allowed = new Set(['image/jpeg','image/png','image/webp']);

  function formatMb(bytes) { return (Number(bytes || 0) / MB).toFixed(2); }
  function releaseCanvas(canvas) { if (canvas) { canvas.width = 1; canvas.height = 1; } }
  function canvasToWebp(canvas, quality) {
    return new Promise((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không thể chuyển ảnh sang WebP.')), 'image/webp', quality));
  }

  async function optimizeCanvas(canvasFactory, plans, target, limit, label) {
    let best = null;
    for (const [maxSize, quality] of plans) {
      const canvas = canvasFactory(maxSize);
      const width = canvas.width, height = canvas.height;
      let blob;
      try { blob = await canvasToWebp(canvas, quality); }
      finally { releaseCanvas(canvas); }
      const candidate = {blob, width, height, maxSize, quality};
      if (!best || blob.size < best.blob.size) best = candidate;
      if (blob.size <= target) return candidate;
    }
    if (best && best.blob.size <= limit) return best;
    throw new Error(`Ảnh ${label} sau khi tối ưu vẫn quá lớn (${formatMb(best?.blob?.size)} MB). Giới hạn ${formatMb(limit)} MB.`);
  }

  function optimizePublic(canvasFactory) {
    return optimizeCanvas(canvasFactory, PUBLIC_PLANS, PUBLIC_TARGET, PUBLIC_LIMIT, 'public');
  }
  function optimizeMaster(canvasFactory) {
    return optimizeCanvas(canvasFactory, MASTER_PLANS, MASTER_TARGET, MASTER_LIMIT, 'master');
  }
  function validateFile(file) {
    if (!file || !allowed.has(file.type)) throw new Error('Chỉ hỗ trợ JPG, PNG hoặc WebP.');
    if (!file.size) throw new Error('File ảnh rỗng.');
  }
  async function decodeImage(file) {
    validateFile(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    try {
      await new Promise((resolve,reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Không đọc được ảnh ' + file.name));
        img.src = url;
      });
      if (!img.naturalWidth || !img.naturalHeight) throw new Error('Ảnh không hợp lệ.');
      return img;
    } finally { URL.revokeObjectURL(url); }
  }
  function canvasForImage(image, maxSize) {
    // Scale down, never upscale a small image, and preserve the original aspect ratio.
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    return canvas;
  }
  async function prepareBulk(file) {
    const image = await decodeImage(file);
    try {
      const create = maxSize => canvasForImage(image,maxSize);
      // Release the large master canvas before beginning public optimization.
      const master = await optimizeMaster(create);
      const publicImage = await optimizePublic(create);
      return {master, publicImage};
    } finally {
      image.onload = null;
      image.onerror = null;
      image.src = '';
    }
  }
  const RESPONSIVE_WIDTHS = [480,960,1440];
  async function variantsFromPublicBlob(blob, sourceWidth) {
    // Resize from the finished public file: matches its exact crop/rotation/look.
    if (!blob) return [];
    const img=await decodeImage(blob);
    try {
      const results=[];
      for(const width of RESPONSIVE_WIDTHS) {
        if (width >= img.naturalWidth || (sourceWidth && width >= sourceWidth)) continue;
        const height=Math.max(1,Math.round(img.naturalHeight*width/img.naturalWidth));
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        try {
          canvas.getContext('2d').drawImage(img,0,0,width,height);
          const compressed=await canvasToWebp(canvas,width<=480?.70:width<=960?.76:.81);
          results.push({width,blob:compressed});
        } finally {releaseCanvas(canvas);}
      }
      return results;
    } finally {img.src='';}
  }

  async function uploadResponsiveVariants(db,blob,imagePath,sourceWidth,{strict=false}={}) {
    const results={};
    const uploaded=[];
    const storage=db.storage.from('wedding-gallery');
    try {
      const prepared=await variantsFromPublicBlob(blob,sourceWidth);
      const base=imagePath.replace(/\.webp$/i,'');
      const version=crypto.randomUUID().slice(0,8);
      for (const item of prepared) {
        const variantPath=base+'-'+version+'-w'+item.width+'.webp';
        const {error}=await storage.upload(variantPath,item.blob,{
          contentType:'image/webp',cacheControl:'31536000',upsert:false
        });
        if(error)throw error;
        uploaded.push(variantPath);
        results[String(item.width)]=variantPath;
      }
    } catch (error) {
      // Original full-size public image remains usable. Never publish fake paths.
      if (uploaded.length) {
        const cleanup=await storage.remove(uploaded);
        if(cleanup.error)console.warn('Unable to clean responsive variants',cleanup.error);
      }
      console.warn('Responsive variant generation failed; full image remains available',error);
      if(strict)throw error;
      return {};
    }
    return results;
  }
  function variantPaths(imageVariants) {
    return Object.values(imageVariants||{}).filter(value=>typeof value==='string');
  }

  function friendlyStorageError(error, label, mb) {
    const message = error?.message || 'Upload thất bại.';
    return /maximum allowed size|exceeded|too large|payload too large/i.test(message)
      ? `${label} vượt giới hạn Storage ${mb} MB.` : message;
  }

  async function uploadBulkImage(db, file, album, settings={}) {
    if (!album?.id || !album?.slug) throw new Error('Chưa chọn Album hợp lệ.');
    const processed = await prepareBulk(file);
    const id = crypto.randomUUID();
    const originalPath = `${album.slug}/${id}-master.webp`;
    const imagePath = `${album.slug}/${id}.webp`;
    let masterUploaded = false, publicUploaded = false, imageVariants = {};
    try {
      const masterResult = await db.storage.from('wedding-originals').upload(originalPath, processed.master.blob, {
        contentType:'image/webp', upsert:false
      });
      if (masterResult.error) throw new Error(friendlyStorageError(masterResult.error,'Ảnh master',20));
      masterUploaded = true;

      const publicResult = await db.storage.from('wedding-gallery').upload(imagePath, processed.publicImage.blob, {
        contentType:'image/webp',cacheControl:'31536000',upsert:false
      });
      if (publicResult.error) throw new Error(friendlyStorageError(publicResult.error,'Ảnh public',6));
      publicUploaded = true;

      imageVariants=await uploadResponsiveVariants(db,processed.publicImage.blob,imagePath,processed.publicImage.width);
      const baseName = String(file.name || 'Ảnh cưới').replace(/\.[^.]+$/,'').slice(0,120);
      const payload = {
        id,album_id:album.id,original_path:originalPath,image_path:imagePath,image_variants:imageVariants,
        title:baseName || 'Ảnh cưới',caption:null,alt_text:'Ảnh cưới Hải và Mỹ',
        width:processed.publicImage.width,height:processed.publicImage.height,
        focus_x:50,focus_y:50,is_published:!!settings.published,
        show_in_album:settings.showInAlbum !== false,show_on_homepage:false,
        is_featured:false,is_hero:false,display_size:'auto',
        sort_order:Number(settings.sortOrder || 0),updated_at:new Date().toISOString()
      };
      const result = await db.from('gallery_images').insert(payload).select('id').single();
      if (result.error || result.data?.id !== id) throw new Error(result.error?.message || 'Không xác nhận được bản ghi ảnh.');
      return {id,imagePath,originalPath,publicBytes:processed.publicImage.blob.size};
    } catch(error) {
      const cleanups = [];
      if (publicUploaded) cleanups.push(db.storage.from('wedding-gallery').remove([imagePath,...variantPaths(imageVariants)]));
      if (masterUploaded) cleanups.push(db.storage.from('wedding-originals').remove([originalPath]));
      const results = await Promise.allSettled(cleanups);
      if (results.some(r => r.status==='rejected' || r.value?.error)) console.warn('Could not completely clean up failed photo upload',results);
      throw error;
    }
  }

  window.AdminPhotoProcessor = {
    PUBLIC_LIMIT,MASTER_LIMIT,formatMb,validateFile,prepareBulk,
    optimizePublic,optimizeMaster,uploadBulkImage,
    variantsFromPublicBlob,uploadResponsiveVariants,variantPaths
  };
})();