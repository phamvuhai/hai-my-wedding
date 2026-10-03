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
      .select('id,image_path,title,caption,alt_text,title_en,caption_en,alt_text_en,title_ja,caption_ja,alt_text_ja,width,height,sort_order,created_at')
      .order('is_cover', { ascending: false })
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
      return `
        <a class="home-photo home-photo-${(index % 6) + 1} reveal visible" href="./album/" aria-label="Hải & Mỹ album">
          <img loading="lazy" decoding="async" src="${url}" alt="${esc(alt || 'Hải & Mỹ')}">
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
