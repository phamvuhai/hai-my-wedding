(() => {
  const A = window.AdminApp;
  const db = A.db;
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');
  const file = document.getElementById('fileInput');
  const ratio = document.getElementById('ratioSelect');
  const zoom = document.getElementById('zoomRange');
  const hint = document.getElementById('dropHint');
  const album = document.getElementById('albumSelect');
  const status = document.getElementById('uploadStatus');
  const stage = document.getElementById('editorStage');
  const marker = document.getElementById('focusMarker');
  const focusX = document.getElementById('focusX');
  const focusY = document.getElementById('focusY');
  const focusXValue = document.getElementById('focusXValue');
  const focusYValue = document.getElementById('focusYValue');
  const previewImages = [...document.querySelectorAll('.focus-preview img')];
  const heroCheck = document.getElementById('heroCheck');
  const heroSettings = document.getElementById('heroSettings');
  const heroLayout = document.getElementById('heroLayout');
  const heroDesktopRatio = document.getElementById('heroDesktopRatio');
  const heroMobileRatio = document.getElementById('heroMobileRatio');
  const heroZoom = document.getElementById('heroZoom');
  const heroZoomValue = document.getElementById('heroZoomValue');
  const heroSpacing = document.getElementById('heroSpacing');
  const heroDesktopPreview = document.querySelector('.hero-setting-preview.desktop img');
  const heroMobilePreview = document.querySelector('.hero-setting-preview.mobile img');

  A.fileQueue = [];
  A.focusX = 50;
  A.focusY = 50;

  function ratioValue() {
    if (ratio.value === 'free') return null;
    const [a, b] = ratio.value.split(':').map(Number);
    return a / b;
  }

  function chooseRatioFromSize(w, h) {
    if (!w || !h) return 'free';
    const r = w / h;
    const choices = [
      ['1:1', 1],
      ['4:5', .8],
      ['3:2', 1.5],
      ['16:9', 16 / 9]
    ];
    const closest = choices.sort((a,b) => Math.abs(a[1]-r) - Math.abs(b[1]-r))[0];
    return Math.abs(closest[1] - r) < .04 ? closest[0] : 'free';
  }

  function renderCanvas(target, maxSize) {
    if (!A.sourceImage) return null;
    const out = target || document.createElement('canvas');
    const rotated = Math.abs(A.rotation) % 180 === 90;
    const iw = rotated ? A.sourceImage.naturalHeight : A.sourceImage.naturalWidth;
    const ih = rotated ? A.sourceImage.naturalWidth : A.sourceImage.naturalHeight;
    const r = ratioValue() || iw / ih;

    let cw, ch;
    if (r >= 1) {
      cw = maxSize;
      ch = Math.max(1, Math.round(maxSize / r));
    } else {
      ch = maxSize;
      cw = Math.max(1, Math.round(maxSize * r));
    }

    out.width = cw;
    out.height = ch;
    const x = out.getContext('2d');
    x.fillStyle = '#eee7e1';
    x.fillRect(0, 0, cw, ch);
    x.save();
    x.translate(cw / 2, ch / 2);
    x.rotate(A.rotation * Math.PI / 180);

    const sw = A.sourceImage.naturalWidth;
    const sh = A.sourceImage.naturalHeight;
    const fit = Math.max(
      cw / (rotated ? sh : sw),
      ch / (rotated ? sw : sh)
    ) * Number(zoom.value);

    x.drawImage(A.sourceImage, -sw * fit / 2, -sh * fit / 2, sw * fit, sh * fit);
    x.restore();
    return out;
  }

  function draw() {
    if (!A.sourceImage) {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      marker.classList.add('hidden');
      previewImages.forEach(img => img.removeAttribute('src'));
      return;
    }
    renderCanvas(canvas, 1200);
    marker.classList.remove('hidden');
    updateFocusUI();
    updatePreviews();
  }

  function ratioCss(value, fallback) {
    if (!value || value === 'auto') return fallback;
    const [a,b] = value.split(':').map(Number);
    return `${a} / ${b}`;
  }

  function updateHeroSettingsUI() {
    if (!heroCheck) return;
    heroSettings.classList.toggle('hidden', !heroCheck.checked);
    heroZoomValue.value = `${Number(heroZoom.value || 1).toFixed(2)}×`;
    heroSettings.dataset.spacing = heroSpacing.value || 'normal';
    const desktopBox = heroDesktopPreview?.parentElement;
    const mobileBox = heroMobilePreview?.parentElement;
    if (desktopBox) desktopBox.style.setProperty('--preview-ratio', ratioCss(heroDesktopRatio.value, '16 / 9'));
    if (mobileBox) mobileBox.style.setProperty('--preview-ratio', ratioCss(heroMobileRatio.value, '4 / 5'));
    [heroDesktopPreview, heroMobilePreview].forEach(img => {
      if (!img) return;
      img.style.objectPosition = `${A.focusX}% ${A.focusY}%`;
      img.style.transformOrigin = `${A.focusX}% ${A.focusY}%`;
      img.style.transform = `scale(${Number(heroZoom.value || 1)})`;
    });
  }

  let previewFrame = 0;
  function updatePreviews() {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => {
      if (!A.sourceImage) return;
      const url = canvas.toDataURL('image/webp', .62);
      previewImages.forEach(img => {
        img.src = url;
        img.style.objectPosition = `${A.focusX}% ${A.focusY}%`;
      });
      [heroDesktopPreview, heroMobilePreview].forEach(img => {
        if (!img) return;
        img.src = url;
      });
      updateHeroSettingsUI();
    });
  }

  function updateFocusUI() {
    focusX.value = Math.round(A.focusX);
    focusY.value = Math.round(A.focusY);
    focusXValue.value = `${Math.round(A.focusX)}%`;
    focusYValue.value = `${Math.round(A.focusY)}%`;

    if (!A.sourceImage) return;
    const sr = stage.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    marker.style.left = `${cr.left - sr.left + cr.width * A.focusX / 100}px`;
    marker.style.top = `${cr.top - sr.top + cr.height * A.focusY / 100}px`;
    previewImages.forEach(img => {
      img.style.objectPosition = `${A.focusX}% ${A.focusY}%`;
    });
    [heroDesktopPreview, heroMobilePreview].forEach(img => {
      if (!img) return;
      img.style.objectPosition = `${A.focusX}% ${A.focusY}%`;
      img.style.transformOrigin = `${A.focusX}% ${A.focusY}%`;
    });
  }

  function setFocus(x, y) {
    A.focusX = Math.max(0, Math.min(100, Number(x)));
    A.focusY = Math.max(0, Math.min(100, Number(y)));
    updateFocusUI();
  }

  function setFocusFromPointer(clientX, clientY) {
    if (!A.sourceImage) return;
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) / r.width * 100;
    const y = (clientY - r.top) / r.height * 100;
    setFocus(x, y);
  }

  let draggingFocus = false;
  stage.addEventListener('pointerdown', e => {
    if (!A.sourceImage) return;
    const cr = canvas.getBoundingClientRect();
    if (
      e.target !== marker &&
      (e.clientX < cr.left || e.clientX > cr.right || e.clientY < cr.top || e.clientY > cr.bottom)
    ) return;
    draggingFocus = true;
    setFocusFromPointer(e.clientX, e.clientY);
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (draggingFocus) setFocusFromPointer(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', () => draggingFocus = false);
  window.addEventListener('resize', updateFocusUI);

  focusX.addEventListener('input', () => setFocus(focusX.value, A.focusY));
  focusY.addEventListener('input', () => setFocus(A.focusX, focusY.value));
  document.getElementById('focusReset').onclick = () => setFocus(50, 50);
  heroCheck.addEventListener('change', updateHeroSettingsUI);
  heroLayout.addEventListener('change', updateHeroSettingsUI);
  heroDesktopRatio.addEventListener('change', updateHeroSettingsUI);
  heroMobileRatio.addEventListener('change', updateHeroSettingsUI);
  heroZoom.addEventListener('input', updateHeroSettingsUI);
  heroSpacing.addEventListener('change', updateHeroSettingsUI);

  function loadBlob(blob, name='image') {
    return new Promise((ok, no) => {
      const img = new Image();
      const u = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(u);
        A.sourceImage = img;
        A.sourceBlob = blob;
        A.sourceName = name;
        A.rotation = 0;
        zoom.value = '1';
        hint.classList.add('hidden');
        draw();
        ok();
      };
      img.onerror = () => {
        URL.revokeObjectURL(u);
        no(new Error('Không đọc được ảnh này. Hãy dùng JPG, PNG hoặc WebP.'));
      };
      img.src = u;
    });
  }

  async function loadNextQueued() {
    const next = A.fileQueue.shift();
    if (!next) {
      reset();
      return false;
    }
    A.editRecord = null;
    A.focusX = 50;
    A.focusY = 50;
    ratio.value = 'free';
    try {
      await loadBlob(next, next.name);
      document.getElementById('imageTitle').value = next.name.replace(/\.[^.]+$/, '');
      A.setStatus(
        status,
        A.fileQueue.length
          ? `Đang chỉnh ảnh này. Còn ${A.fileQueue.length} ảnh trong hàng đợi.`
          : 'Đang chỉnh ảnh đã chọn.',
        'success'
      );
      return true;
    } catch (e) {
      A.setStatus(status, e.message, 'error');
      return loadNextQueued();
    }
  }

  file.onchange = async () => {
    if (!file.files.length) return;
    A.fileQueue = [...file.files];
    await loadNextQueued();
  };

  stage.ondragover = e => e.preventDefault();
  stage.ondrop = async e => {
    e.preventDefault();
    A.fileQueue = [...e.dataTransfer.files].filter(x => x.type.startsWith('image/'));
    if (A.fileQueue.length) await loadNextQueued();
  };

  ratio.onchange = draw;
  zoom.oninput = draw;
  document.getElementById('rotateLeft').onclick = () => { A.rotation = (A.rotation - 90) % 360; draw(); };
  document.getElementById('rotateRight').onclick = () => { A.rotation = (A.rotation + 90) % 360; draw(); };

  const MB = 1024 * 1024;
  const PUBLIC_TARGET_BYTES = 5.5 * MB;
  const PUBLIC_LIMIT_BYTES = 6 * MB;
  const MASTER_TARGET_BYTES = 19 * MB;
  const MASTER_LIMIT_BYTES = 20 * MB;

  const formatMb = bytes => (Number(bytes || 0) / MB).toFixed(2);

  const canvasToWebp = (canvas, quality) =>
    new Promise(ok => canvas.toBlob(ok, 'image/webp', quality));

  function releaseCanvas(canvas) {
    if (!canvas) return;
    canvas.width = 1;
    canvas.height = 1;
  }

  async function optimizePublicBlob() {
    const plans = [
      [2400, .84], [2400, .78], [2400, .72], [2400, .66],
      [2200, .82], [2200, .76], [2200, .70],
      [2000, .82], [2000, .76], [2000, .70],
      [1800, .80], [1800, .74], [1600, .76], [1600, .68]
    ];
    let best = null;

    for (const [maxSize, quality] of plans) {
      const out = renderCanvas(null, maxSize);
      const width = out.width;
      const height = out.height;
      const blob = await canvasToWebp(out, quality);
      releaseCanvas(out);
      if (!blob) continue;

      const candidate = { blob, width, height, maxSize, quality };
      if (!best || blob.size < best.blob.size) best = candidate;
      if (blob.size <= PUBLIC_TARGET_BYTES) return candidate;
    }

    if (best && best.blob.size <= PUBLIC_LIMIT_BYTES) return best;
    throw new Error(
      `Ảnh public sau khi tối ưu vẫn quá lớn (${formatMb(best?.blob?.size)} MB). Giới hạn upload là 6 MB.`
    );
  }

  function renderMasterCanvas(maxSize) {
    const img = A.sourceImage;
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(img.naturalWidth * scale));
    out.height = Math.max(1, Math.round(img.naturalHeight * scale));
    out.getContext('2d').drawImage(img, 0, 0, out.width, out.height);
    return out;
  }

  async function optimizeMasterBlob() {
    const plans = [
      [3000, .90], [3000, .84], [3000, .78],
      [2800, .86], [2800, .80],
      [2600, .84], [2600, .78],
      [2400, .82], [2200, .80], [2000, .78]
    ];
    let best = null;

    for (const [maxSize, quality] of plans) {
      const out = renderMasterCanvas(maxSize);
      const width = out.width;
      const height = out.height;
      const blob = await canvasToWebp(out, quality);
      releaseCanvas(out);
      if (!blob) continue;

      const candidate = { blob, width, height, maxSize, quality };
      if (!best || blob.size < best.blob.size) best = candidate;
      if (blob.size <= MASTER_TARGET_BYTES) return candidate;
    }

    if (best && best.blob.size <= MASTER_LIMIT_BYTES) return best;
    throw new Error(
      `Ảnh master sau khi tối ưu vẫn quá lớn (${formatMb(best?.blob?.size)} MB). Giới hạn upload là 20 MB.`
    );
  }

  function friendlyStorageError(error, label, limitMb) {
    const message = error?.message || 'Upload thất bại.';
    if (/maximum allowed size|exceeded|too large|payload too large/i.test(message)) {
      return `${label} vượt giới hạn ${limitMb} MB của Storage. Hệ thống đã thử tự tối ưu nhưng file vẫn quá lớn.`;
    }
    return message;
  }

  document.addEventListener('admin:edit', async e => {
    const img = e.detail;
    A.setStatus(status, 'Đang tải ảnh master...');
    const { data, error } = await db.storage.from('wedding-originals').download(img.original_path);
    if (error) return A.setStatus(status, error.message, 'error');

    A.editRecord = img;
    A.focusX = Number(img.focus_x ?? 50);
    A.focusY = Number(img.focus_y ?? 50);
    ratio.value = chooseRatioFromSize(img.width, img.height);
    await loadBlob(data, img.original_path.split('/').pop());

    album.value = img.album_id;
    document.getElementById('imageTitle').value = img.title || '';
    document.getElementById('imageCaption').value = img.caption || '';
    document.getElementById('imageAlt').value = img.alt_text || '';
    document.getElementById('imageTitleEn').value = img.title_en || '';
    document.getElementById('imageCaptionEn').value = img.caption_en || '';
    document.getElementById('imageAltEn').value = img.alt_text_en || '';
    document.getElementById('imageTitleJa').value = img.title_ja || '';
    document.getElementById('imageCaptionJa').value = img.caption_ja || '';
    document.getElementById('imageAltJa').value = img.alt_text_ja || '';
    document.getElementById('publishCheck').checked = img.is_published;
    document.getElementById('homepageCheck').checked = img.show_on_homepage !== false;
    document.getElementById('featuredCheck').checked = !!img.is_featured;
    document.getElementById('heroCheck').checked = !!img.is_hero;
    heroLayout.value = img.hero_layout || 'full';
    heroDesktopRatio.value = img.hero_desktop_ratio || '16:9';
    heroMobileRatio.value = img.hero_mobile_ratio || '4:5';
    heroZoom.value = Number(img.hero_zoom || 1);
    heroSpacing.value = img.hero_spacing || 'normal';
    document.getElementById('displaySize').value = img.display_size || 'auto';
    document.getElementById('sortOrder').value = Number(img.sort_order || 0);
    document.getElementById('cancelEditBtn').classList.remove('hidden');

    draw();
    updateHeroSettingsUI();
    document.querySelector('.upload-panel').scrollIntoView({ behavior:'smooth' });
    A.setStatus(status, 'Đang chỉnh sửa ảnh hiện có.', 'success');
  });

  document.getElementById('cancelEditBtn').onclick = reset;

  function reset(clearQueue=true) {
    A.editRecord = null;
    A.sourceImage = null;
    A.sourceBlob = null;
    A.sourceName = '';
    A.focusX = 50;
    A.focusY = 50;
    if (clearQueue) A.fileQueue = [];
    file.value = '';
    ratio.value = 'free';
    zoom.value = '1';
    ['imageTitle','imageCaption','imageAlt','imageTitleEn','imageCaptionEn','imageAltEn','imageTitleJa','imageCaptionJa','imageAltJa']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('publishCheck').checked = true;
    document.getElementById('homepageCheck').checked = true;
    document.getElementById('featuredCheck').checked = false;
    document.getElementById('heroCheck').checked = false;
    heroLayout.value = 'full';
    heroDesktopRatio.value = '16:9';
    heroMobileRatio.value = '4:5';
    heroZoom.value = '1';
    heroSpacing.value = 'normal';
    document.getElementById('displaySize').value = 'auto';
    document.getElementById('sortOrder').value = '0';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    hint.classList.remove('hidden');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    marker.classList.add('hidden');
    previewImages.forEach(img => img.removeAttribute('src'));
    updateFocusUI();
    updateHeroSettingsUI();
    A.setStatus(status, '');
  }

  document.getElementById('saveImageBtn').onclick = async () => {
    if (!A.sourceImage || !A.sourceBlob) return A.setStatus(status, 'Hãy chọn ảnh trước.', 'error');
    const al = A.albums.find(x => x.id === album.value);
    if (!al) return;

    A.setStatus(status, 'Đang tối ưu ảnh public để phù hợp giới hạn Storage...');
    let rendered;
    try {
      rendered = await optimizePublicBlob();
    } catch (e) {
      return A.setStatus(status, e.message || 'Không xử lý được ảnh.', 'error');
    }
    if (!rendered?.blob) return A.setStatus(status, 'Không xử lý được ảnh.', 'error');

    A.setStatus(
      status,
      `Public: ${formatMb(rendered.blob.size)} MB · ${rendered.width}×${rendered.height} · WebP ${Math.round(rendered.quality * 100)}%. Đang upload...`
    );

    const title = document.getElementById('imageTitle').value.trim();
    const caption = document.getElementById('imageCaption').value.trim();
    const alt = document.getElementById('imageAlt').value.trim();
    const titleEn = document.getElementById('imageTitleEn').value.trim();
    const captionEn = document.getElementById('imageCaptionEn').value.trim();
    const altEn = document.getElementById('imageAltEn').value.trim();
    const titleJa = document.getElementById('imageTitleJa').value.trim();
    const captionJa = document.getElementById('imageCaptionJa').value.trim();
    const altJa = document.getElementById('imageAltJa').value.trim();
    const published = document.getElementById('publishCheck').checked;
    const showHomepage = document.getElementById('homepageCheck').checked;
    const featured = document.getElementById('featuredCheck').checked;
    const hero = document.getElementById('heroCheck').checked;
    const selectedHeroLayout = heroLayout.value;
    const selectedHeroDesktopRatio = heroDesktopRatio.value;
    const selectedHeroMobileRatio = heroMobileRatio.value;
    const selectedHeroZoom = Number(heroZoom.value || 1);
    const selectedHeroSpacing = heroSpacing.value || 'normal';
    const displaySize = document.getElementById('displaySize').value;
    const sortOrder = Number(document.getElementById('sortOrder').value || 0);

    let id, originalPath, imagePath;
    let oldImagePath = null;
    let masterOptimized = null;
    let createdOriginal = false;
    if (A.editRecord) {
      id = A.editRecord.id;
      originalPath = A.editRecord.original_path;
      oldImagePath = A.editRecord.image_path;
      imagePath = `${al.slug}/${id}-${Date.now()}.webp`;
    } else {
      id = crypto.randomUUID();
      originalPath = `${al.slug}/${id}-master.webp`;
      imagePath = `${al.slug}/${id}.webp`;
      A.setStatus(status, 'Đang tối ưu bản master...');
      try {
        masterOptimized = await optimizeMasterBlob();
      } catch (e) {
        return A.setStatus(status, e.message || 'Không tạo được bản master.', 'error');
      }
      if (!masterOptimized?.blob) return A.setStatus(status, 'Không tạo được bản master.', 'error');

      const u = await db.storage.from('wedding-originals').upload(originalPath, masterOptimized.blob, {
        contentType:'image/webp'
      });
      if (u.error) {
        return A.setStatus(status, friendlyStorageError(u.error, 'Ảnh master', 20), 'error');
      }
      createdOriginal = true;
    }

    const p = await db.storage.from('wedding-gallery').upload(imagePath, rendered.blob, {
      contentType:'image/webp',
      cacheControl:'31536000',
      upsert:false
    });
    if (p.error) {
      if (createdOriginal) {
        await db.storage.from('wedding-originals').remove([originalPath]);
      }
      return A.setStatus(status, friendlyStorageError(p.error, 'Ảnh public', 6), 'error');
    }

    if (hero) {
      await db.from('gallery_images').update({ is_hero:false }).neq('id', id || '00000000-0000-0000-0000-000000000000');
    }

    const payload = {
      album_id:al.id,
      original_path:originalPath,
      image_path:imagePath,
      title:title || null,
      caption:caption || null,
      alt_text:alt || title || 'Ảnh cưới Hải và Mỹ',
      title_en:titleEn || null,
      caption_en:captionEn || null,
      alt_text_en:altEn || titleEn || null,
      title_ja:titleJa || null,
      caption_ja:captionJa || null,
      alt_text_ja:altJa || titleJa || null,
      width:rendered.width,
      height:rendered.height,
      focus_x:Number(A.focusX.toFixed(2)),
      focus_y:Number(A.focusY.toFixed(2)),
      is_published:published,
      show_on_homepage:showHomepage,
      is_featured:featured,
      is_hero:hero,
      hero_layout:selectedHeroLayout,
      hero_desktop_ratio:selectedHeroDesktopRatio,
      hero_mobile_ratio:selectedHeroMobileRatio,
      hero_zoom:selectedHeroZoom,
      hero_spacing:selectedHeroSpacing,
      display_size:displaySize,
      sort_order:sortOrder,
      updated_at:new Date().toISOString()
    };

    const op = A.editRecord
      ? db.from('gallery_images').update(payload).eq('id', id)
      : db.from('gallery_images').insert({ ...payload, id });

    const { error } = await op;
    if (error) {
      await Promise.all([
        db.storage.from('wedding-gallery').remove([imagePath]),
        !A.editRecord && createdOriginal
          ? db.storage.from('wedding-originals').remove([originalPath])
          : Promise.resolve()
      ]);
      return A.setStatus(status, error.message, 'error');
    }

    if (oldImagePath && oldImagePath !== imagePath) {
      const cleanup = await db.storage.from('wedding-gallery').remove([oldImagePath]);
      if (cleanup.error) console.warn('Could not remove previous public image:', cleanup.error);
    }

    await A.loadData();
    if (A.fileQueue.length) {
      reset(false);
      await loadNextQueued();
    } else {
      reset();
      const originalInfo = A.sourceBlob ? `Ảnh nguồn ${formatMb(A.sourceBlob.size)} MB · ` : '';
      const publicInfo = `Public ${formatMb(rendered.blob.size)} MB · ${rendered.width}×${rendered.height} · WebP ${Math.round(rendered.quality * 100)}%`;
      const masterInfo = masterOptimized
        ? ` · Master ${formatMb(masterOptimized.blob.size)} MB · ${masterOptimized.width}×${masterOptimized.height} · WebP ${Math.round(masterOptimized.quality * 100)}%`
        : '';
      A.setStatus(status, `${originalInfo}${publicInfo}${masterInfo} · Đã lưu thành công.`, 'success');
    }
  };
})();