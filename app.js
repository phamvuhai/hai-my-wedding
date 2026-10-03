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
    setStatus(tr('rsvp.success', 'Cảm ơn bạn! Hải & Mỹ đã nhận được xác nhận ❤️'), 'success');
  } catch (err) {
    console.error(err);
    setStatus(tr('rsvp.error', 'Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.'), 'error');
  }
});


async function loadHomeGallery() {
  const root = document.getElementById('homeGallery');
  if (!root) return;

  const cfg = window.WEDDING_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;

  try {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data: images, error } = await client
      .from('gallery_images')
      .select('id,image_path,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,display_size,is_featured,is_hero,show_on_homepage,focus_x,focus_y,created_at')
      .eq('show_on_homepage', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    if (!images?.length) return;

    const esc = (value = '') => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

    const lang = window.WeddingI18n?.language || 'vi';
    root.innerHTML = images.map((img, index) => {
      const url = client.storage.from('wedding-gallery').getPublicUrl(img.image_path).data.publicUrl;
      const title = lang === 'en' ? (img.title_en || img.title) : lang === 'ja' ? (img.title_ja || img.title) : img.title;
      const caption = lang === 'en' ? (img.caption_en || img.caption) : lang === 'ja' ? (img.caption_ja || img.caption) : img.caption;
      const alt = lang === 'en' ? (img.alt_text_en || img.alt_text || title) : lang === 'ja' ? (img.alt_text_ja || img.alt_text || title) : (img.alt_text || title);
      const size = ['small','tall','wide','large'].includes(img.display_size) ? img.display_size : (
        img.is_featured ? 'large' : ((img.width || 1) / (img.height || 1) > 1.35 ? 'wide' : ((img.height || 1) / (img.width || 1) > 1.28 ? 'tall' : 'small'))
      );
      return `
        <a class="home-photo size-${size} ${index === 0 ? 'editorial-featured' : ''} reveal visible" href="/album" aria-label="Hải & Mỹ album">
          <img loading="lazy" decoding="async" src="${url}" alt="${esc(alt || 'Hải & Mỹ')}" style="object-position:${Number(img.focus_x ?? 50)}% ${Number(img.focus_y ?? 50)}%">
          <span class="home-photo-copy">
            <strong>${esc(title || '')}</strong>
            <small>${esc(caption || '')}</small>
          </span>
        </a>`;
    }).join('');
  } catch (error) {
    console.error('Home gallery error:', error);
  }
}

loadHomeGallery();
document.addEventListener('wedding:language', loadHomeGallery);


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
    framedImg.alt = alt || 'Hải & Mỹ';
    fullImg.src = url;
    fullImg.alt = '';
  } catch (error) {
    console.error('Hero photo error:', error);
  }
}

loadHeroPhoto();
document.addEventListener('wedding:language', loadHeroPhoto);
