window.addEventListener('pageshow', event => {
  if (event.persisted) location.reload();
});

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

function highlightInvitedDays(invitedDays = []) {
  document.querySelectorAll('[data-event-day]').forEach((panel) => {
    panel.classList.toggle('is-invited', invitedDays.includes(panel.dataset.eventDay));
  });
  document.querySelectorAll('[data-invite-badge]').forEach((badge) => {
    const invited = invitedDays.includes(badge.dataset.inviteBadge);
    badge.hidden = !invited;
  });
}

window.WeddingEvents = { highlightInvitedDays };

const form = document.getElementById('rsvpForm');
const statusEl = document.getElementById('formStatus');

function tr(key, fallback = '') {
  return window.WeddingI18n?.t(key) || fallback || key;
}

function initEventScrollStory() {
  const section = document.getElementById('events');
  const items = [...document.querySelectorAll('[data-event-item]')];
  const days = [...document.querySelectorAll('[data-event-day]')];
  const status = document.getElementById('eventScrollStatus');
  const statusText = document.getElementById('eventScrollStatusText');
  const progress = document.getElementById('eventScrollProgress');
  if (!section || !items.length || !days.length || !status || !statusText || !progress) return;

  let frame = 0;
  let activeIndex = -1;
  let statusSwapTimer = 0;

  const clamp = value => Math.max(0, Math.min(1, value));

  function swapStatus(text) {
    if (!text || statusText.textContent === text) return;
    clearTimeout(statusSwapTimer);
    statusText.classList.add('is-changing');
    statusSwapTimer = setTimeout(() => {
      statusText.textContent = text;
      statusText.classList.remove('is-changing');
    }, 90);
  }

  const update = () => {
    frame = 0;
    const viewportH = Math.max(1, innerHeight);
    const focusY = viewportH * .48;

    const firstRect = items[0].getBoundingClientRect();
    const lastRect = items[items.length - 1].getBoundingClientRect();
    const firstCenter = firstRect.top + firstRect.height / 2;
    const lastCenter = lastRect.top + lastRect.height / 2;
    const overallProgress = clamp((focusY - firstCenter) / Math.max(1, lastCenter - firstCenter));
    progress.style.transform = `scaleX(${overallProgress.toFixed(4)})`;
    section.style.setProperty('--event-scroll-progress', overallProgress.toFixed(4));

    days.forEach(day => {
      const timeline = day.querySelector('.event-timeline');
      if (!timeline) return;
      const rect = timeline.getBoundingClientRect();
      const localProgress = clamp((focusY - rect.top) / Math.max(1, rect.height));
      timeline.style.setProperty('--day-progress', localProgress.toFixed(4));
    });

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(itemCenter - focusY);
      const focus = clamp(1 - distance / (viewportH * .48));
      const passed = clamp((focusY - rect.top) / Math.max(1, rect.height));

      item.style.setProperty('--event-focus', focus.toFixed(4));
      item.style.setProperty('--event-passed', passed.toFixed(4));
      item.style.setProperty('--event-opacity', (.62 + focus * .38).toFixed(3));
      item.style.setProperty('--event-shift', `${((1 - focus) * 3).toFixed(2)}px`);
      item.classList.toggle('is-past', itemCenter < focusY - 48);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    items.forEach((item, index) => item.classList.toggle('is-current', index === nearestIndex));
    days.forEach(day => day.classList.toggle('is-current-day', day.contains(items[nearestIndex])));

    if (nearestIndex !== activeIndex) {
      activeIndex = nearestIndex;
      const active = items[activeIndex];
      const day = active.closest('[data-event-day]');
      const date = day?.querySelector('.family-date')?.textContent?.trim() || '';
      const family = day?.querySelector('.family-title-row h3')?.textContent?.trim() || '';
      const time = active.querySelector('.event-date strong')?.textContent?.trim() || '';
      const title = active.querySelector('h4')?.textContent?.trim() || '';
      swapStatus([date.replace('.2026',''), family, time, title].filter(Boolean).join(' · '));
    }
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  addEventListener('scroll', requestUpdate, {passive:true});
  addEventListener('resize', requestUpdate, {passive:true});
  document.addEventListener('wedding:language', () => {
    activeIndex = -1;
    requestUpdate();
  });
  requestUpdate();
}

function initParticleQuietZones() {
  const zones = [...document.querySelectorAll('.countdown-section, #events, #rsvp')];
  if (!zones.length || !('IntersectionObserver' in window)) return;
  const active = new Set();
  const sync = () => document.body.classList.toggle('particles-muted', active.size > 0);
  const quietObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) active.add(entry.target);
      else active.delete(entry.target);
    });
    sync();
  }, { threshold:.18 });
  zones.forEach(zone => quietObserver.observe(zone));
}

initEventScrollStory();
initParticleQuietZones();

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type}`;
}

const rsvpGuestCountField = document.getElementById('rsvpGuestCountField');
const rsvpGuestCount = form?.querySelector('[name="guest_count"]');
const rsvpSubmitButton = form?.querySelector('button[type="submit"]');
let rsvpSubmitRestoreTimer = 0;

rsvpGuestCount?.addEventListener('change', () => {
  if (!rsvpGuestCount.disabled) rsvpGuestCount.dataset.lastValue = rsvpGuestCount.value;
});

function updateAttendanceUI() {
  if (!form || !rsvpGuestCount) return;
  const selected = form.querySelector('[name="attending"]:checked')?.value;
  const notAttending = selected === 'no';

  if (notAttending && !rsvpGuestCount.disabled) {
    rsvpGuestCount.dataset.lastValue = rsvpGuestCount.value || '1';
    rsvpGuestCount.value = '1';
  }

  rsvpGuestCount.disabled = notAttending;
  rsvpGuestCountField?.classList.toggle('is-disabled', notAttending);

  if (!notAttending && rsvpGuestCount.dataset.lastValue) {
    const max = Number(form.dataset.maxGuests || rsvpGuestCount.dataset.maxGuests || 10);
    const restored = Math.min(Math.max(Number(rsvpGuestCount.dataset.lastValue || 1),1),max);
    rsvpGuestCount.value = String(restored);
  }
}

function restoreRsvpButton() {
  if (!rsvpSubmitButton) return;
  clearTimeout(rsvpSubmitRestoreTimer);
  rsvpSubmitButton.disabled = false;
  rsvpSubmitButton.classList.remove('is-sending','is-success');
  rsvpSubmitButton.textContent = tr('rsvp.submit', 'Gửi xác nhận');
}

form?.querySelectorAll('[name="attending"]').forEach(radio => {
  radio.addEventListener('change', updateAttendanceUI);
});
document.addEventListener('wedding:language', () => {
  if (!rsvpSubmitButton?.classList.contains('is-sending') && !rsvpSubmitButton?.classList.contains('is-success')) {
    rsvpSubmitButton.textContent = tr('rsvp.submit', 'Gửi xác nhận');
  }
});
updateAttendanceUI();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(tr('rsvp.sending', 'Đang gửi xác nhận...'));
  if (rsvpSubmitButton) {
    clearTimeout(rsvpSubmitRestoreTimer);
    rsvpSubmitButton.disabled = true;
    rsvpSubmitButton.classList.remove('is-success');
    rsvpSubmitButton.classList.add('is-sending');
    rsvpSubmitButton.textContent = tr('rsvp.sending', 'Đang gửi xác nhận...');
  }

  const data = Object.fromEntries(new FormData(form).entries());
  data.guest_count = Number(data.guest_count || 1);
  data.created_at = new Date().toISOString();

  const inviteScope = form.dataset.inviteEvent || '';
  const maxGuests = Number(form.dataset.maxGuests || 10);
  if (form.dataset.inviteId && data.attending !== 'no' && (data.guest_count < 1 || data.guest_count > maxGuests)) {
    setStatus(
      tr('rsvp.maxGuestsError', 'Số người tham dự vượt quá giới hạn của thiệp mời.'),
      'error'
    );
    restoreRsvpButton();
    return;
  }
  if (form.dataset.inviteId && inviteScope === 'both' && !['bride','groom','both'].includes(data.event_choice)) {
    setStatus(tr('rsvp.eventError', 'Vui lòng chọn sự kiện bạn sẽ tham dự.'), 'error');
    restoreRsvpButton();
    return;
  }

  try {
    const cfg = window.WEDDING_CONFIG || {};
    const hasSupabase = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase;

    if (hasSupabase) {
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const inviteToken = window.WeddingGuest?.token || '';
      const inviteId = form.dataset.inviteId || '';

      if (inviteToken && inviteId) {
        const { error } = await client.rpc('submit_wedding_rsvp', {
          p_token: inviteToken,
          p_guest_name: data.name?.trim() || '',
          p_phone: data.phone?.trim() || null,
          p_attendance: data.attending,
          p_guest_count: data.guest_count,
          p_event_choice: inviteScope === 'both'
            ? (data.event_choice || 'both')
            : (inviteScope || data.event_choice || 'both'),
          p_message: data.message?.trim() || null
        });
        if (error) throw error;
        form.dataset.responseSource = 'invite';
      } else {
        const { error } = await client.from('rsvp').insert({
          guest_name: data.name.trim(),
          phone: data.phone?.trim() || null,
          attendance: data.attending,
          guest_count: data.attending === 'no' ? 0 : Math.min(data.guest_count, 10),
          event_choice: data.event_choice || 'both',
          invite_id: null,
          response_source: 'public',
          event_code: 'wedding-2026',
          message: data.message?.trim() || null
        });
        if (error) throw error;
      }
    } else {
      const current = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
      current.push(data);
      localStorage.setItem('wedding_rsvps', JSON.stringify(current));
    }

    if (!form.dataset.inviteId) form.reset();
    updateAttendanceUI();
    setStatus(
      form.dataset.inviteId
        ? tr('rsvp.updated', 'Đã cập nhật phản hồi của bạn ❤️')
        : tr('rsvp.success', 'Cảm ơn bạn! Hải Phạm và Mỹ Nguyễn đã nhận được xác nhận ❤️'),
      'success'
    );
    document.dispatchEvent(new CustomEvent('wedding:rsvp-success', {
      detail: {personalized: Boolean(form.dataset.inviteId)}
    }));
    if (rsvpSubmitButton) {
      rsvpSubmitButton.disabled = true;
      rsvpSubmitButton.classList.remove('is-sending');
      rsvpSubmitButton.classList.add('is-success');
      rsvpSubmitButton.textContent = form.dataset.inviteId
        ? tr('rsvp.updatedButton', '✓ Đã cập nhật RSVP')
        : tr('rsvp.sentButton', '✓ Đã gửi RSVP');
      rsvpSubmitRestoreTimer = setTimeout(restoreRsvpButton, 2400);
    }
  } catch (err) {
    console.error(err);
    setStatus(tr('rsvp.error', 'Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.'), 'error');
    restoreRsvpButton();
  }
});


const galleryState = {
  client: null,
  homeImages: [],
  albumImages: [],
  albums: [],
  albumFilter: 'all',
  albumLoadedAt: 0,
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

function galleryPublicUrl(img, role = 'gallery') {
  const client = galleryClient();
  if (!client) return img.publicUrl || '';
  const adaptive = window.WeddingAdaptiveImages;
  if (adaptive) return adaptive.select(client, img, undefined, role);
  if (img.publicUrl) return img.publicUrl;
  const base = client.storage.from('wedding-gallery').getPublicUrl(img.image_path).data.publicUrl;
  const version = img.updated_at || img.created_at || '';
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}
function imageHtmlAttrs(img, role = 'thumb', sizes = '100vw', loading = 'lazy', priority = 'auto') {
  const adaptive = window.WeddingAdaptiveImages;
  if (adaptive && galleryClient()) {
    return adaptive.htmlAttrs(galleryClient(),img,{role,sizes,loading,priority});
  }
  return 'src="' + galleryEsc(galleryPublicUrl(img,role)) + '" loading="' + loading + '" decoding="async"';
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

  // Show up to nine distinct published photos in an editorial homepage montage; the full Album stays available.
  root.dataset.count = String(galleryState.homeImages.length);
  root.innerHTML = galleryState.homeImages.map((img, index) => {
    const loc = galleryLocalized(img);
    const size = gallerySize(img);
    return `
      <button type="button"
        class="home-photo size-${size} ${index === 0 ? 'editorial-featured' : ''} reveal visible"
        data-photo-id="${galleryEsc(img.id)}"
        aria-label="${galleryEsc(loc.alt || 'Hải Phạm & Mỹ Nguyễn')}">
        <img data-home-progressive loading="lazy" decoding="async" alt="${galleryEsc(loc.alt)}"
          style="object-position:${Number(img.focus_x ?? 50)}% ${Number(img.focus_y ?? 50)}%">
        <span class="photo-curtain" aria-hidden="true"></span>
        <span class="home-photo-index" aria-hidden="true">${String(index + 1).padStart(2, '0')} <i></i> ${String(galleryState.homeImages.length).padStart(2, '0')}</span>
        <span class="home-photo-copy">
          <strong>${galleryEsc(loc.title)}</strong>
          <small>${galleryEsc(loc.caption)}</small>
        </span>
      </button>`;
  }).join('');
  // Only start thumbnail requests as the home images approach the viewport.
  root.querySelectorAll('img[data-home-progressive]').forEach((element,index)=>{
    const item=galleryState.homeImages[index];
    const client=galleryClient();
    const adaptive=window.WeddingAdaptiveImages;
    if(adaptive?.progressiveApply && client)
      adaptive.progressiveApply(element,client,item,{role:'home',priority:'low'});
    else element.src=galleryPublicUrl(item,'thumb');
  });
}

async function loadHomeGallery() {
  const root = document.getElementById('homeGallery');
  const client = galleryClient();
  if (!root || !client) return;

  try {
    const [galleryResult,designResult] = await Promise.all([
      client.from('gallery_images')
        .select('id,image_path,image_variants,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,display_size,is_featured,is_hero,show_on_homepage,show_in_album,focus_x,focus_y,created_at,updated_at')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100),
      client.from('site_content').select('value_vi').eq('key','v3_design').maybeSingle()
    ]);
    if (galleryResult.error) throw galleryResult.error;
    let selectedIds = [];
    try {
      const config = designResult.error ? null : JSON.parse(designResult.data?.value_vi || 'null');
      if (Array.isArray(config?.homePhotoIds)) selectedIds=config.homePhotoIds.slice(0,9);
    } catch (error) {
      console.warn('Gallery order: using default ordering.', error);
    }
    const all = (galleryResult.data || []).filter(img=>img.image_path && img.show_in_album !== false);
    // Respect Admin's explicit homepage order first; then enrich from approved
    // published album images, excluding Hero/Story copies when supplementing.
    const pinned=selectedIds.map(id=>all.find(img=>img.id===id)).filter(Boolean);
    const home=all.filter(img=>img.show_on_homepage);
    const supplement=all.filter(img=>!img.is_hero && img.id!==config?.promisePhotoId);
    const candidates=[...pinned,...home,...supplement];
    const seen=new Set();
    galleryState.homeImages = candidates.filter(img=>{
      if(seen.has(img.id))return false;
      seen.add(img.id);
      return true;
    }).slice(0,9).map(img=>({...img, publicUrl: galleryPublicUrl(img)}));
    if (galleryState.homeImages.length) renderHomeGallery();
    await syncGalleryRoute();
  } catch (error) {
    console.error('Home gallery error:', error);
  }
}

function galleryAlbumLabel(album) {
  if (!album) return '';
  const slug = album.slug || '';
  if (slug === 'pre-wedding') return tr('album.prewedding', album.title || 'Pre-Wedding');
  if (slug === 'nha-gai') return tr('album.bride', album.title || 'Nhà gái');
  if (slug === 'nha-trai') return tr('album.groom', album.title || 'Nhà trai');
  return album.title || slug;
}

function filteredAlbumImages() {
  if (galleryState.albumFilter === 'all') return galleryState.albumImages;
  const selected = galleryState.albums.find(a => a.slug === galleryState.albumFilter);
  if (!selected) return galleryState.albumImages;
  return galleryState.albumImages.filter(img => String(img.album_id) === String(selected.id));
}

function renderAlbumFilters() {
  const root = document.getElementById('albumOverlayFilters');
  if (!root) return;
  const buttons = [
    {slug:'all', label:tr('album.all','Tất cả')},
    ...galleryState.albums.map(album => ({slug:album.slug,label:galleryAlbumLabel(album)}))
  ];
  root.innerHTML = buttons.map(item =>
    `<button type="button" class="album-filter-btn ${galleryState.albumFilter===item.slug?'is-active':''}" data-album-filter="${galleryEsc(item.slug)}">${galleryEsc(item.label)}</button>`
  ).join('');
  root.hidden = buttons.length <= 1;
}

async function loadAlbumImages({force=false} = {}) {
  if (!force && galleryState.albumImages.length) return galleryState.albumImages;
  const client = galleryClient();
  if (!client) return [];

  const [albumResult, imageResult] = await Promise.all([
    client.from('gallery_albums').select('id,title,slug,sort_order').order('sort_order', {ascending:true}),
    client.from('gallery_images')
      .select('id,album_id,image_path,image_variants,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,display_size,is_featured,focus_x,focus_y,created_at,updated_at,is_published')
      .eq('is_published', true)
      .eq('show_in_album', true)
      // Album order is independent of Featured; homepage selection keeps its own order.
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
  ]);

  if (albumResult.error) throw albumResult.error;
  if (imageResult.error) throw imageResult.error;
  galleryState.albumImages = (imageResult.data || []).map(img => ({...img, publicUrl: galleryPublicUrl(img)}));
  galleryState.albumLoadedAt = Date.now();
  const usedAlbumIds = new Set(galleryState.albumImages.map(img => String(img.album_id)));
  galleryState.albums = (albumResult.data || []).filter(album => usedAlbumIds.has(String(album.id)));
  if (galleryState.albumFilter !== 'all' && !galleryState.albums.some(a => a.slug === galleryState.albumFilter)) {
    galleryState.albumFilter = 'all';
  }
  return galleryState.albumImages;
}

function renderAlbumOverlay() {
  const grid = document.getElementById('albumOverlayGrid');
  if (!grid) return;
  renderAlbumFilters();
  const visibleAlbumImages = filteredAlbumImages();
  window.WeddingProgressiveGallery?.destroy();
  if (!visibleAlbumImages.length) {
    grid.innerHTML = `<p class="album-overlay-empty">${galleryEsc(tr('album.empty','Album đang được chuẩn bị ♡'))}</p>`;
    return;
  }
  const renderCard = (img) => {
    const loc = galleryLocalized(img);
    const size = gallerySize(img);
    return `
      <button type="button" class="album-overlay-photo size-${size} album-progressive-card"
        data-album-photo-id="${galleryEsc(img.id)}"
        data-photo-title="${galleryEsc(loc.alt)}"
        aria-label="${galleryEsc(loc.alt)}">
        <img data-progressive-image class="album-progressive-image" alt="${galleryEsc(loc.alt)}"
          loading="lazy" decoding="async"
          style="object-position:${Number(img.focus_x ?? 50)}% ${Number(img.focus_y ?? 50)}%">
        <i class="album-progressive-indicator" aria-hidden="true"></i>
        <i class="album-progressive-error" aria-hidden="true">Ảnh chưa tải được · Chạm để mở</i>
        <span><strong>${galleryEsc(loc.title)}</strong><small>${galleryEsc(loc.caption)}</small></span>
      </button>`;
  };
  if (window.WeddingProgressiveGallery && galleryClient()) {
    window.WeddingProgressiveGallery.mount(grid,visibleAlbumImages,renderCard,galleryClient());
  } else {
    grid.innerHTML = visibleAlbumImages.map(img => {
      const markup=renderCard(img);
      return markup.replace('data-progressive-image class="album-progressive-image"',
        'class="album-progressive-image" src="'+galleryEsc(galleryPublicUrl(img,'thumb'))+'"');
    }).join('');
  }
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
    await loadAlbumImages({force: Date.now() - galleryState.albumLoadedAt > 60000});
  } catch (error) {
    console.error('Album overlay error:', error);
  }

  renderAlbumOverlay();
  if (!galleryState.albumOpen) galleryState.scrollY = window.scrollY;
  galleryState.albumOpen = true;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('gallery-overlay-open');
  requestAnimationFrame(() => window.WeddingProgressiveGallery?.activate());

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
  window.WeddingProgressiveGallery?.destroy();
  if (restoreScroll) requestAnimationFrame(() => window.scrollTo({top:galleryState.scrollY,left:0,behavior:'auto'}));
}

function renderLightbox() {
  const img=galleryState.activeImages[galleryState.activeIndex];
  if(!img)return;
  const loc=galleryLocalized(img);
  const image=document.getElementById('photoLightboxImage');
  const title=document.getElementById('photoLightboxTitle');
  const caption=document.getElementById('photoLightboxCaption');
  const counter=document.getElementById('photoLightboxCounter');
  const prev=document.getElementById('photoLightboxPrev');
  const next=document.getElementById('photoLightboxNext');
  const status=document.getElementById('photoLightboxLoading');
  const retry=document.getElementById('photoLightboxRetry');
  if(!image)return;
  const index=galleryState.activeIndex;
  const total=galleryState.activeImages.length;
  if(prev){prev.disabled=index<=0;prev.setAttribute('aria-disabled',String(index<=0));}
  if(next){next.disabled=index>=total-1;next.setAttribute('aria-disabled',String(index>=total-1));}
  image.alt=loc.alt;
  if(title)title.textContent=loc.title;
  if(caption)caption.textContent=loc.caption;
  if(counter)counter.textContent=`${index+1} / ${total}`;

  // A language-only update must not reload the original or reset zoom.
  if(image.dataset.photoId!==String(img.id)||!image.getAttribute('src')){
    window.WeddingPhotoZoom?.reset();
    const ticket=(galleryState.hdTicket||0)+1;
    galleryState.hdTicket=ticket;
    if(galleryState.pendingHD){
      galleryState.pendingHD.onload=null;
      galleryState.pendingHD.onerror=null;
      galleryState.pendingHD.src='';
      galleryState.pendingHD=null;
    }
    image.onload=null;
    image.onerror=null;
    image.dataset.photoId=String(img.id);
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.decoding='async';
    image.fetchPriority='high';
    image.loading='eager';
    delete image.dataset.fullHd;

    const client=galleryClient();
    const adaptive=window.WeddingAdaptiveImages;
    const full=adaptive&&client?adaptive.fullUrl(client,img):galleryPublicUrl(img,'lightbox');
    const medium=adaptive&&client?adaptive.mediumUrl(client,img):'';
    const small=adaptive&&client?adaptive.previewUrl(client,img):'';
    // On mobile, a cached 960px WebP is a much faster first image than
    // a 5MB original. Full resolution still loads after opening detail.
    const fallbackUrls=[medium,small,full].filter((url,i,arr)=>url&&arr.indexOf(url)===i);
    let fallbackIndex=0;
    const isCurrent=()=>galleryState.lightboxOpen && galleryState.hdTicket===ticket &&
      image.dataset.photoId===String(img.id);
    const language=()=>window.WeddingI18n?.language||'vi';
    const words=(vi,en,ja)=>language()==='ja'?ja:language()==='en'?en:vi;
    const loadingLabel=()=>words('Đang tải ảnh Full HD…','Loading full-resolution photo…','高画質を読み込み中…');
    const failureLabel=()=>words('Không tải được bản Full HD. Ảnh xem trước vẫn có thể phóng to.',
      'Full-resolution unavailable. You can still zoom the preview.',
      '高画質を読み込めませんでした。プレビューは拡大できます。');
    const missingLabel=()=>words('Ảnh không tải được. Hãy thử lại.','Photo unavailable. Please retry.','画像を読み込めません。再試行してください。');
    if(status)status.textContent=full&&full!==fallbackUrls[0]?loadingLabel():'';
    if(retry)retry.hidden=true;
    image.classList.toggle('is-hd-pending',Boolean(full&&full!==fallbackUrls[0]));

    image.onerror=()=>{
      if(!isCurrent())return;
      fallbackIndex++;
      if(fallbackIndex<fallbackUrls.length){
        image.src=fallbackUrls[fallbackIndex];
      }else{
        if(status)status.textContent=missingLabel();
        image.classList.remove('is-hd-pending');
        if(retry)retry.hidden=false;
      }
    };
    if(fallbackUrls.length) image.src=fallbackUrls[0];
    else{
      if(status)status.textContent=missingLabel();
      if(retry)retry.hidden=false;
    }

    const loadFull=()=>{
      if(!full||!isCurrent())return;
      if(galleryState.pendingHD){
        galleryState.pendingHD.onload=null;
        galleryState.pendingHD.onerror=null;
        galleryState.pendingHD.src='';
      }
      const hd=new Image();
      galleryState.pendingHD=hd;
      hd.decoding='async';
      hd.fetchPriority='high';
      if(status)status.textContent=loadingLabel();
      if(retry)retry.hidden=true;
      image.classList.toggle('is-hd-pending',Boolean(image.getAttribute('src')));
      hd.onload=()=>{
        if(!isCurrent())return;
        galleryState.pendingHD=null;
        // Browser normally reuses the decoded image from this preload.
        // Pinch scale remains untouched when swapping preview to original.
        image.src=full;
        image.dataset.fullHd='true';
        image.classList.remove('is-hd-pending');
        if(status)status.textContent='';
        if(retry)retry.hidden=true;
      };
      hd.onerror=()=>{
        if(!isCurrent())return;
        galleryState.pendingHD=null;
        image.classList.remove('is-hd-pending');
        if(status)status.textContent=failureLabel();
        if(retry)retry.hidden=false;
      };
      hd.src=full;
    };
    if(retry)retry.onclick=()=>{
      if(!image.naturalWidth && fallbackUrls.length){
        fallbackIndex=0;
        image.src=fallbackUrls[0];
      }
      loadFull();
    };
    if(full && full!==fallbackUrls[0])loadFull();
    else if(full) {
      image.classList.remove('is-hd-pending');
      if(status)status.textContent='';
    }
  }
  document.dispatchEvent(new CustomEvent('wedding:gallery-photo-change',{
    detail:{index:galleryState.activeIndex,total:galleryState.activeImages.length}
  }));
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
  window.WeddingProgressiveGallery?.pause(true);
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
  window.WeddingPhotoZoom?.reset();
  window.WeddingProgressiveGallery?.pause(false);
  galleryState.photoPushed = false;
  galleryState.hdTicket=(galleryState.hdTicket||0)+1;
  if (galleryState.pendingHD) {
    galleryState.pendingHD.onload=null;
    galleryState.pendingHD.onerror=null;
    galleryState.pendingHD.src='';
    galleryState.pendingHD=null;
  }
  const photo=document.getElementById('photoLightboxImage');
  if(photo){photo.removeAttribute('src');delete photo.dataset.photoId;photo.classList.remove('is-hd-pending');}
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('photo-lightbox-open');
}

function movePhoto(delta) {
  if (!galleryState.lightboxOpen || !galleryState.activeImages.length) return;
  // Stop at both ends: photo 1 cannot wrap to the last photo.
  const target=galleryState.activeIndex+delta;
  if (target<0 || target>=galleryState.activeImages.length) return;
  galleryState.activeIndex = target;
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
  const albumFilters = document.getElementById('albumOverlayFilters');
  const albumCta = document.querySelector('[data-album-link]');

  home?.addEventListener('click', event => {
    const item = event.target.closest('[data-photo-id]');
    if (!item) return;
    const index = galleryState.homeImages.findIndex(img => String(img.id) === String(item.dataset.photoId));
    if (index >= 0) showPhotoByIndex(index, galleryState.homeImages);
  });

  albumFilters?.addEventListener('click', event => {
    const button = event.target.closest('[data-album-filter]');
    if (!button) return;
    galleryState.albumFilter = button.dataset.albumFilter || 'all';
    renderAlbumOverlay();
  });

  albumGrid?.addEventListener('click', event => {
    const item = event.target.closest('[data-album-photo-id]');
    if (!item) return;
    const visibleAlbumImages = filteredAlbumImages();
    const index = visibleAlbumImages.findIndex(img => String(img.id) === String(item.dataset.albumPhotoId));
    if (index >= 0) showPhotoByIndex(index, visibleAlbumImages);
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
  let touchMulti = false;
  const lightbox = document.getElementById('photoLightbox');
  lightbox?.addEventListener('touchstart', event => {
    if (event.touches.length > 1) {
      touchMulti = true;
      return;
    }
    touchX = event.touches[0]?.clientX || 0;
  }, {passive:true});
  lightbox?.addEventListener('touchmove', event => {
    if (event.touches.length > 1) touchMulti = true;
  }, {passive:true});
  lightbox?.addEventListener('touchend', event => {
    if (event.touches.length) return;
    const allowSwipe = !touchMulti && (window.WeddingPhotoZoom?.canSwipe() ?? true);
    touchMulti = false;
    if (!allowSwipe) return;
    const endX = event.changedTouches[0]?.clientX || 0;
    const delta = endX - touchX;
    if (Math.abs(delta) > 55) movePhoto(delta > 0 ? -1 : 1);
  }, {passive:true});
  lightbox?.addEventListener('touchcancel',()=>{touchMulti=false;},{passive:true});

  addEventListener('popstate', () => { syncGalleryRoute(); });
}

initGalleryInteractions();
loadHomeGallery();

let galleryVisibilityHiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    galleryVisibilityHiddenAt = Date.now();
    return;
  }
  if (galleryVisibilityHiddenAt && Date.now() - galleryVisibilityHiddenAt > 60000) {
    galleryState.albumImages = [];
    galleryState.albums = [];
    galleryState.albumLoadedAt = 0;
  }
});

document.addEventListener('wedding:language', () => {
  // Preserve existing loaded image nodes so switching languages never replays the curtain.
  const tiles=[...document.querySelectorAll('#homeGallery > .home-photo')];
  if(tiles.length===galleryState.homeImages.length && tiles.every((tile,i)=>tile.dataset.photoId===galleryState.homeImages[i].id)){
    tiles.forEach((tile,i)=>{
      const copy=galleryLocalized(galleryState.homeImages[i]);
      tile.setAttribute('aria-label',copy.alt||'Hải & Mỹ');
      const image=tile.querySelector('img');if(image)image.alt=copy.alt||'';
      const title=tile.querySelector('.home-photo-copy strong');if(title)title.textContent=copy.title||'';
      const caption=tile.querySelector('.home-photo-copy small');if(caption)caption.textContent=copy.caption||'';
      const err=tile.querySelector('.album-v12-error');if(err)err.textContent=window.WeddingI18n?.language==='ja'?'画像を読み込めませんでした':window.WeddingI18n?.language==='en'?'Photo unavailable':'Ảnh chưa tải được';
    });
  } else if(galleryState.homeImages.length) renderHomeGallery();
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
  if (!hero || !framedImg || !fullImg) return;

  const markReady = (mode = 'image') => {
    document.body.classList.remove('hero-image-loading');
    document.body.classList.toggle('hero-image-fallback', mode !== 'image');
    document.body.classList.toggle('hero-image-ready', mode === 'image');
    window.WeddingHeroReady = true;
    document.dispatchEvent(new CustomEvent('wedding:hero-ready', {detail:{mode}}));
  };

  const cfg = window.WEDDING_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    markReady('fallback');
    return;
  }

  try {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await client
      .from('gallery_images')
      .select('image_path,image_variants,alt_text,title,alt_text_en,title_en,alt_text_ja,title_ja,focus_x,focus_y,width,height,hero_layout,hero_desktop_ratio,hero_mobile_ratio,hero_zoom,hero_spacing,updated_at')
      .eq('is_hero', true)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle();

    if (error || !data?.image_path) {
      markReady('fallback');
      return;
    }

    const lang = window.WeddingI18n?.language || 'vi';
    const alt = lang === 'en' ? (data.alt_text_en || data.title_en || data.alt_text || data.title) :
      lang === 'ja' ? (data.alt_text_ja || data.title_ja || data.alt_text || data.title) :
      (data.alt_text || data.title);

    const heroBaseUrl = client.storage.from('wedding-gallery').getPublicUrl(data.image_path).data.publicUrl;
    const fallbackUrl = data.updated_at ? `${heroBaseUrl}?v=${encodeURIComponent(data.updated_at)}` : heroBaseUrl;
    const responsive = window.WeddingAdaptiveImages;
    // First paint is a small pre-generated WebP; never preload the original.
    // A 960/1440px version replaces it later on a sufficiently fast network.
    const previewUrl = responsive?.previewUrl(client,data) || fallbackUrl;
    const url = previewUrl;
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

    // Decode the lightweight image before revealing the Hero to avoid blank frames.
    const preload = new Image();
    preload.fetchPriority='high';
    preload.src = url;
    await preload.decode();

    framedImg.src = url; // Legacy hidden image must not trigger a second HD request.
    framedImg.alt = alt || 'Hải Phạm & Mỹ Nguyễn';
    framedImg.style.objectPosition = `${fx}% ${fy}%`;

    if (responsive?.progressiveApply)
      responsive.progressiveApply(fullImg,client,data,{role:'hero',immediate:true,priority:'high'});
    else fullImg.src = url;
    fullImg.alt = '';
    fullImg.style.objectPosition = `${fx}% ${fy}%`;

    markReady('image');
  } catch (error) {
    console.error('Hero photo error:', error);
    markReady('fallback');
  }
}

loadHeroPhoto();
document.addEventListener('wedding:language', loadHeroPhoto);
