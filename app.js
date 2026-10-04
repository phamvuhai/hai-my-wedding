const targetDate = new Date('2026-12-18T08:00:00+07:00');

function updateCountdown() {
  const now = new Date();
  let diff = targetDate - now;
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const form = document.getElementById('rsvpForm');
const statusEl = document.getElementById('formStatus');

function tr(key, fallback = '') {
  return window.WeddingI18n?.t(key) || fallback || key;
}

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(tr('rsvp.sending', 'Đang gửi xác nhận...'));

  const data = Object.fromEntries(new FormData(form).entries());
  data.guest_count = Number(data.guest_count || 1);
  data.created_at = new Date().toISOString();

  try {
    const cfg = window.WEDDING_CONFIG || {};
    const hasSupabase = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase;

    if (hasSupabase) {
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { error } = await client.from('rsvp').insert({
        guest_name: data.name.trim(),
        phone: data.phone?.trim() || null,
        attendance: data.attending,
        guest_count: data.attending === 'no' ? 0 : data.guest_count,
        event_choice: data.event_choice || 'both',
        event_code: 'wedding-2026',
        message: data.message?.trim() || null
      });
      if (error) throw error;
    } else {
      const current = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
      current.push(data);
      localStorage.setItem('wedding_rsvps', JSON.stringify(current));
    }

    form.reset();
    setStatus(tr('rsvp.success', 'Cảm ơn bạn! Hải Phạm và Mỹ Nguyễn đã nhận được xác nhận ❤️'), 'success');
  } catch (err) {
    console.error(err);
    setStatus(tr('rsvp.error', 'Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.'), 'error');
  }
});


const galleryState = {
  client: null,
  homeImages: [],
  albumImages: [],
  activeImages: [],
  activeIndex: -1,
  albumOpen: false,
  lightboxOpen: false,
  albumPushed: false,
  photoPushed: false,
  scrollY: 0
};

function galleryEsc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function galleryLocalized(img) {
  const lang = window.WeddingI18n?.language || 'vi';
  if (lang === 'en') {
    return {
      title: img.title_en || img.title || '',
      caption: img.caption_en || img.caption || '',
      alt: img.alt_text_en || img.alt_text || img.title_en || img.title || 'Hải Phạm & Mỹ Nguyễn'
    };
  }
  if (lang === 'ja') {
    return {
      title: img.title_ja || img.title || '',
      caption: img.caption_ja || img.caption || '',
      alt: img.alt_text_ja || img.alt_text || img.title_ja || img.title || 'Hải Phạm & Mỹ Nguyễn'
    };
  }
  return {
    title: img.title || '',
    caption: img.caption || '',
    alt: img.alt_text || img.title || 'Hải Phạm & Mỹ Nguyễn'
  };
}

function galleryClient() {
  if (galleryState.client) return galleryState.client;
  const cfg = window.WEDDING_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
  galleryState.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  return galleryState.client;
}

function galleryPublicUrl(img) {
  if (img.publicUrl) return img.publicUrl;
  const client = galleryClient();
  return client ? client.storage.from('wedding-gallery').getPublicUrl(img.image_path).data.publicUrl : '';
}

function gallerySize(img) {
  if (['small','tall','wide','large'].includes(img.display_size)) return img.display_size;
  if (img.is_featured) return 'large';
  const ratio = (img.width || 1) / (img.height || 1);
  return ratio > 1.35 ? 'wide' : ratio < .78 ? 'tall' : 'small';
}

function renderHomeGallery() {
  const root = document.getElementById('homeGallery');
  if (!root || !galleryState.homeImages.length) return;

  root.innerHTML = galleryState.homeImages.map((img, index) => {
    const loc = galleryLocalized(img);
    const size = gallerySize(img);
    const url = galleryPublicUrl(img);
    return `
      <button type="button"
        class="home-photo size-${size} ${index === 0 ? 'editorial-featured' : ''} reveal visible"
        data-photo-id="${galleryEsc(img.id)}"
        aria-label="${galleryEsc(loc.alt || 'Hải Phạm & Mỹ Nguyễn')}">
        <img loading="lazy" decoding="async" src="${url}" alt="${galleryEsc(loc.alt)}"
          style="object-position:${Number(img.focus_x ?? 50)}% ${Number(img.focus_y ?? 50)}%">
        <span class="photo-curtain" aria-hidden="true"></span>
        <span class="home-photo-copy">
          <strong>${galleryEsc(loc.title)}</strong>
          <small>${galleryEsc(loc.caption)}</small>
        </span>
      </button>`;
  }).join('');
}

async function loadHomeGallery() {
  const root = document.getElementById('homeGallery');
  const client = galleryClient();
  if (!root || !client) return;

  try {
    const { data: images, error } = await client
      .from('gallery_images')
      .select('id,image_path,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,display_size,is_featured,is_hero,show_on_homepage,focus_x,focus_y,created_at')
      .eq('show_on_homepage', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    galleryState.homeImages = (images || []).map(img => ({...img, publicUrl: galleryPublicUrl(img)}));
    if (galleryState.homeImages.length) renderHomeGallery();
    await syncGalleryRoute();
  } catch (error) {
    console.error('Home gallery error:', error);
  }
}

async function loadAlbumImages() {
  if (galleryState.albumImages.length) return galleryState.albumImages;
  const client = galleryClient();
  if (!client) return [];

  const { data, error } = await client
    .from('gallery_images')
    .select('id,image_path,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,display_size,is_featured,focus_x,focus_y,created_at,is_published')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  galleryState.albumImages = (data || []).map(img => ({...img, publicUrl: galleryPublicUrl(img)}));
  return galleryState.albumImages;
}

function renderAlbumOverlay() {
  const grid = document.getElementById('albumOverlayGrid');
  if (!grid) return;
  if (!galleryState.albumImages.length) {
    grid.innerHTML = `<p class="album-overlay-empty">${galleryEsc(tr('album.empty','Album đang được chuẩn bị ♡'))}</p>`;
    return;
  }

  grid.innerHTML = galleryState.albumImages.map((img, index) => {
    const loc = galleryLocalized(img);
    const size = gallerySize(img);
    return `
      <button type="button" class="album-overlay-photo size-${size}" data-album-photo-id="${galleryEsc(img.id)}"
        aria-label="${galleryEsc(loc.alt)}">
        <img loading="lazy" decoding="async" src="${galleryPublicUrl(img)}" alt="${galleryEsc(loc.alt)}"
          style="object-position:${Number(img.focus_x ?? 50)}% ${Number(img.focus_y ?? 50)}%">
        <span><strong>${galleryEsc(loc.title)}</strong><small>${galleryEsc(loc.caption)}</small></span>
      </button>`;
  }).join('');
}

function localizedPath(album = false) {
  const lang = window.WeddingI18n?.language || 'vi';
  const code = window.WeddingI18n?.publicCode ? window.WeddingI18n.publicCode(lang) : (lang === 'ja' ? 'jp' : lang);
  return album ? `/${code}/album` : `/${code}`;
}

async function showAlbumOverlay({push = true} = {}) {
  const overlay = document.getElementById('albumOverlay');
  if (!overlay) return;
  try {
    await loadAlbumImages();
  } catch (error) {
    console.error('Album overlay error:', error);
  }

  renderAlbumOverlay();
  if (!galleryState.albumOpen) galleryState.scrollY = window.scrollY;
  galleryState.albumOpen = true;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('gallery-overlay-open');

  if (push) {
    galleryState.albumPushed = true;
    history.pushState({weddingOverlay:'album'}, '', localizedPath(true));
  } else if (!history.state?.weddingOverlay) {
    galleryState.albumPushed = false;
  }
}

function hideAlbumOverlay({restoreScroll = true} = {}) {
  const overlay = document.getElementById('albumOverlay');
  if (!overlay || !galleryState.albumOpen) return;
  galleryState.albumOpen = false;
  galleryState.albumPushed = false;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('gallery-overlay-open');
  if (restoreScroll) requestAnimationFrame(() => window.scrollTo({top:galleryState.scrollY,left:0,behavior:'auto'}));
}

function renderLightbox() {
  const img = galleryState.activeImages[galleryState.activeIndex];
  if (!img) return;
  const loc = galleryLocalized(img);
  const image = document.getElementById('photoLightboxImage');
  const title = document.getElementById('photoLightboxTitle');
  const caption = document.getElementById('photoLightboxCaption');
  const counter = document.getElementById('photoLightboxCounter');
  if (!image) return;

  image.src = galleryPublicUrl(img);
  image.alt = loc.alt;
  title.textContent = loc.title;
  caption.textContent = loc.caption;
  counter.textContent = `${galleryState.activeIndex + 1} / ${galleryState.activeImages.length}`;
}

function photoRoute(id) {
  const base = galleryState.albumOpen ? localizedPath(true) : localizedPath(false);
  return `${base}?photo=${encodeURIComponent(id)}`;
}

function showPhotoByIndex(index, images, {push = true} = {}) {
  const lightbox = document.getElementById('photoLightbox');
  if (!lightbox || !images?.length) return;
  galleryState.activeImages = images;
  galleryState.activeIndex = Math.max(0, Math.min(images.length - 1, index));
  galleryState.lightboxOpen = true;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('photo-lightbox-open');
  renderLightbox();

  if (push) {
    const img = galleryState.activeImages[galleryState.activeIndex];
    galleryState.photoPushed = true;
    history.pushState({weddingOverlay:'photo', photoId:img.id}, '', photoRoute(img.id));
  } else if (!history.state?.photoId) {
    galleryState.photoPushed = false;
  }
}

function hidePhoto() {
  const lightbox = document.getElementById('photoLightbox');
  if (!lightbox || !galleryState.lightboxOpen) return;
  galleryState.lightboxOpen = false;
  galleryState.photoPushed = false;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('photo-lightbox-open');
}

function movePhoto(delta) {
  if (!galleryState.lightboxOpen || !galleryState.activeImages.length) return;
  galleryState.activeIndex = (galleryState.activeIndex + delta + galleryState.activeImages.length) % galleryState.activeImages.length;
  renderLightbox();
  const img = galleryState.activeImages[galleryState.activeIndex];
  history.replaceState({weddingOverlay:'photo', photoId:img.id}, '', photoRoute(img.id));
}

async function syncGalleryRoute() {
  const isAlbumRoute = location.pathname.split('/').filter(Boolean).includes('album');
  const photoId = new URLSearchParams(location.search).get('photo');

  if (isAlbumRoute && !galleryState.albumOpen) await showAlbumOverlay({push:false});
  if (!isAlbumRoute && galleryState.albumOpen) hideAlbumOverlay({restoreScroll:true});

  const source = isAlbumRoute ? galleryState.albumImages : galleryState.homeImages;
  if (photoId && source.length) {
    const index = source.findIndex(img => String(img.id) === String(photoId));
    if (index >= 0) showPhotoByIndex(index, source, {push:false});
  } else {
    hidePhoto();
  }
}

function closePhotoViaHistory() {
  if (!galleryState.lightboxOpen) return;
  if (galleryState.photoPushed) {
    history.back();
    return;
  }
  const base = galleryState.albumOpen ? localizedPath(true) : localizedPath(false);
  history.replaceState({}, '', base);
  hidePhoto();
}

function closeAlbumViaHistory() {
  if (!galleryState.albumOpen) return;
  if (galleryState.albumPushed) {
    history.back();
    return;
  }
  history.replaceState({}, '', localizedPath(false));
  hideAlbumOverlay();
}

function initGalleryInteractions() {
  const home = document.getElementById('homeGallery');
  const albumGrid = document.getElementById('albumOverlayGrid');
  const albumCta = document.querySelector('[data-album-link]');

  home?.addEventListener('click', event => {
    const item = event.target.closest('[data-photo-id]');
    if (!item) return;
    const index = galleryState.homeImages.findIndex(img => String(img.id) === String(item.dataset.photoId));
    if (index >= 0) showPhotoByIndex(index, galleryState.homeImages);
  });

  albumGrid?.addEventListener('click', event => {
    const item = event.target.closest('[data-album-photo-id]');
    if (!item) return;
    const index = galleryState.albumImages.findIndex(img => String(img.id) === String(item.dataset.albumPhotoId));
    if (index >= 0) showPhotoByIndex(index, galleryState.albumImages);
  });

  albumCta?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    showAlbumOverlay();
  });

  document.getElementById('albumOverlayClose')?.addEventListener('click', closeAlbumViaHistory);
  document.getElementById('photoLightboxClose')?.addEventListener('click', closePhotoViaHistory);
  document.getElementById('photoLightboxPrev')?.addEventListener('click', () => movePhoto(-1));
  document.getElementById('photoLightboxNext')?.addEventListener('click', () => movePhoto(1));

  document.addEventListener('keydown', event => {
    if (!galleryState.lightboxOpen) return;
    if (event.key === 'Escape') closePhotoViaHistory();
    if (event.key === 'ArrowLeft') movePhoto(-1);
    if (event.key === 'ArrowRight') movePhoto(1);
  });

  let touchX = 0;
  const lightbox = document.getElementById('photoLightbox');
  lightbox?.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0]?.clientX || 0;
  }, {passive:true});
  lightbox?.addEventListener('touchend', event => {
    const endX = event.changedTouches[0]?.clientX || 0;
    const delta = endX - touchX;
    if (Math.abs(delta) > 45) movePhoto(delta > 0 ? -1 : 1);
  }, {passive:true});

  addEventListener('popstate', () => { syncGalleryRoute(); });
}

initGalleryInteractions();
loadHomeGallery();

document.addEventListener('wedding:language', () => {
  renderHomeGallery();
  if (galleryState.albumOpen) renderAlbumOverlay();
  if (galleryState.lightboxOpen) renderLightbox();
});

function heroRatioCss(value, fallback, width, height) {
  if (!value || value === 'auto') {
    if (width && height) return `${width} / ${height}`;
    return fallback;
  }
  const [a,b] = String(value).split(':').map(Number);
  return `${a} / ${b}`;
}

async function loadHeroPhoto() {
  const hero = document.getElementById('home');
  const framedImg = document.getElementById('heroImage');
  const fullImg = document.getElementById('heroFullImage');
  const introImg = document.getElementById('introImage');
  if (!hero || !framedImg || !fullImg) return;

  const cfg = window.WEDDING_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;

  try {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await client
      .from('gallery_images')
      .select('image_path,alt_text,title,alt_text_en,title_en,alt_text_ja,title_ja,focus_x,focus_y,width,height,hero_layout,hero_desktop_ratio,hero_mobile_ratio,hero_zoom,hero_spacing')
      .eq('is_hero', true)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    const lang = window.WeddingI18n?.language || 'vi';
    const alt = lang === 'en' ? (data.alt_text_en || data.title_en || data.alt_text || data.title) :
      lang === 'ja' ? (data.alt_text_ja || data.title_ja || data.alt_text || data.title) :
      (data.alt_text || data.title);

    const url = client.storage.from('wedding-gallery').getPublicUrl(data.image_path).data.publicUrl;
    const layout = ['full','framed','split','minimal'].includes(data.hero_layout) ? data.hero_layout : 'full';

    hero.classList.remove(
      'hero-layout-full','hero-layout-framed','hero-layout-split','hero-layout-minimal',
      'hero-spacing-compact','hero-spacing-normal','hero-spacing-spacious'
    );
    hero.classList.add(`hero-layout-${layout}`);
    const spacing = ['compact','normal','spacious'].includes(data.hero_spacing) ? data.hero_spacing : 'normal';
    hero.classList.add(`hero-spacing-${spacing}`);

    const fx = Number(data.focus_x ?? 50);
    const fy = Number(data.focus_y ?? 50);
    const zoom = Math.max(1, Math.min(1.6, Number(data.hero_zoom ?? 1)));

    hero.style.setProperty('--hero-focus-x', `${fx}%`);
    hero.style.setProperty('--hero-focus-y', `${fy}%`);
    hero.style.setProperty('--hero-zoom', zoom);
    hero.style.setProperty('--hero-desktop-ratio', heroRatioCss(data.hero_desktop_ratio, '16 / 9', data.width, data.height));
    hero.style.setProperty('--hero-mobile-ratio', heroRatioCss(data.hero_mobile_ratio, '4 / 5', data.width, data.height));
    const ratioWidths = {
      '16:9':'860px',
      '3:2':'760px',
      '4:3':'650px',
      '4:5':'500px',
      'auto':'680px'
    };
    hero.style.setProperty('--hero-frame-max', ratioWidths[data.hero_desktop_ratio] || '680px');

    framedImg.src = url;
    framedImg.alt = alt || 'Hải Phạm & Mỹ Nguyễn';
    fullImg.src = url;
    fullImg.alt = '';
    if (introImg) {
      introImg.src = url;
      introImg.alt = alt || 'Hải Phạm & Mỹ Nguyễn';
      introImg.style.objectPosition = `${fx}% ${fy}%`;
    }
  } catch (error) {
    console.error('Hero photo error:', error);
  }
}

loadHeroPhoto();
document.addEventListener('wedding:language', loadHeroPhoto);
