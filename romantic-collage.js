/* Romantic Collage: public invitation photos sourced only from published gallery records. */
(() => {
  'use strict';
  const SLOTS = ['story', 'promise', 'events', 'moments', 'rsvp'];
  const MESSAGES = {
    vi: {
      story: ['OUR LITTLE MOMENTS', 'Từ những ngày bình yên', 'Mọi hành trình đẹp đều bắt đầu bằng một khoảnh khắc.'],
      promise: ['A LOVE TO REMEMBER', 'Mình đã chọn nhau', 'Và sẽ còn cùng nhau viết tiếp thật nhiều mùa thương nhớ.'],
      events: ['TOGETHER, ALWAYS', 'Ngày chung đôi', 'Từ hôm nay, mỗi ngày đều là một lời hẹn yêu thương.'],
      moments: ['LOVE IN FRAMES', 'Từng chút thương yêu', 'Một vài bức ảnh, một ngàn kỷ niệm.'],
      rsvp: ['WITH ALL OUR LOVE', 'Hẹn gặp bạn trong ngày vui', 'Có bạn ở đây, câu chuyện của chúng mình thêm trọn vẹn.']
    },
    en: {
      story: ['OUR LITTLE MOMENTS', 'The days that brought us here', 'Every beautiful journey begins with one small moment.'],
      promise: ['A LOVE TO REMEMBER', 'We chose each other', 'With a thousand more memories waiting to unfold.'],
      events: ['TOGETHER, ALWAYS', 'Our forever begins', 'Every new day, another promise to love.'],
      moments: ['LOVE IN FRAMES', 'Little pieces of us', 'A handful of photographs, a thousand memories.'],
      rsvp: ['WITH ALL OUR LOVE', 'We cannot wait to see you', 'Your presence makes our story even more special.']
    },
    ja: {
      story: ['OUR LITTLE MOMENTS', 'ふたりの大切な日々', '小さな出会いから、かけがえのない物語が始まりました。'],
      promise: ['A LOVE TO REMEMBER', 'ふたりで選んだ未来', 'これからも思い出を重ねていきます。'],
      events: ['TOGETHER, ALWAYS', '永遠を誓う日', '何気ない毎日を、これからも一緒に。'],
      moments: ['LOVE IN FRAMES', 'ふたりの思い出', '一枚一枚に大切な時間が詰まっています。'],
      rsvp: ['WITH ALL OUR LOVE', '当日お会いできるのを楽しみにしています', '皆さまと過ごせることを心より楽しみにしています。']
    }
  };
  const allowedStyles = new Set(['polaroid', 'film', 'full']);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = { items: [], images: new Map(), client: null };
  const language = () => ['vi','en','ja'].includes(window.WeddingI18n?.language)
    ? window.WeddingI18n.language : 'vi';

  function photoUrl(img) {
    if (!img?.image_path || !state.client) return '';
    const url = state.client.storage.from('wedding-gallery').getPublicUrl(img.image_path).data.publicUrl;
    if (!url) return '';
    return img.updated_at ? url + '?v=' + encodeURIComponent(img.updated_at) : url;
  }

  function createFallback(photos) {
    const arrangement = [
      ['story','polaroid'], ['story','polaroid'],
      ['promise','full'], ['events','film'], ['events','polaroid'],
      ['moments','polaroid'], ['rsvp','film']
    ];
    return photos.slice(0, arrangement.length).map((img, i) => ({
      id: 'default-' + i,
      imageId: img.id, slot: arrangement[i][0], style: arrangement[i][1],
      visible: true, caption: {vi:'',en:'',ja:''}
    }));
  }

  function photoCaption(item, img, lang) {
    const localized = item.caption && typeof item.caption === 'object' ? item.caption[lang] : '';
    if (localized) return localized;
    if (lang === 'en') return img.caption_en || img.caption || '';
    if (lang === 'ja') return img.caption_ja || img.caption || '';
    return img.caption || '';
  }

  function photoAlt(img, lang) {
    if (lang === 'en') return img.alt_text_en || img.title_en || img.alt_text || img.title || 'Hai & My';
    if (lang === 'ja') return img.alt_text_ja || img.title_ja || img.alt_text || img.title || 'Hai & My';
    return img.alt_text || img.title || 'Hải & Mỹ';
  }

  function render() {
    const lang = language();
    SLOTS.forEach(slot => {
      const host = document.querySelector('[data-collage-slot="' + slot + '"]');
      if (!host) return;
      const entries = state.items.filter(item =>
        item && item.slot === slot && item.visible !== false && state.images.has(item.imageId));
      if (!entries.length) {
        host.innerHTML = '';
        host.hidden = true;
        return;
      }
      const words = MESSAGES[lang][slot];
      const cards = entries.map((item, index) => {
        const img = state.images.get(item.imageId);
        const style = allowedStyles.has(item.style) ? item.style : 'polaroid';
        const caption = photoCaption(item, img, lang);
        const positionX = Math.max(0, Math.min(100, Number(img.focus_x ?? 50) || 50));
        const positionY = Math.max(0, Math.min(100, Number(img.focus_y ?? 50) || 50));
        return '<figure class="romance-photo romance-photo--' + style + ' romance-photo--' + (index % 3) + '">' +
          '<div class="romance-photo-mat"><img loading="lazy" decoding="async" src="' + safe(photoUrl(img)) +
          '" alt="' + safe(photoAlt(img,lang)) + '" style="object-position:' + positionX + '% ' + positionY + '%"></div>' +
          (caption ? '<figcaption>' + safe(caption) + '</figcaption>' : '<figcaption aria-hidden="true">H ♡ M</figcaption>') +
          '</figure>';
      }).join('');
      const count = Math.min(entries.length, 3);
      host.innerHTML =
        '<div class="romance-collage-inner">' +
          '<div class="romance-collage-title"><span class="romance-collage-flourish" aria-hidden="true">✧ &nbsp; ♡ &nbsp; ✧</span>' +
            '<small>' + safe(words[0]) + '</small><h2>' + safe(words[1]) + '</h2><p>' + safe(words[2]) + '</p></div>' +
          '<div class="romance-collage-photos romance-collage-count-' + count + '">' + cards + '</div>' +
          '<div class="romance-collage-signature" aria-hidden="true">Hải <i>&</i> Mỹ</div>' +
        '</div>';
      host.hidden = false;
    });
  }

  function normalizeItems(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 40).filter(item =>
      item && typeof item.imageId === 'string' && SLOTS.includes(item.slot))
      .map(item => ({
        imageId: item.imageId, slot: item.slot,
        style: allowedStyles.has(item.style) ? item.style : 'polaroid',
        visible: item.visible !== false,
        caption: Object.fromEntries(['vi','en','ja'].map(lang => [
          lang, String(item.caption?.[lang] ?? '').slice(0, 240)
        ]))
      }));
  }

  async function load() {
    const cfg = window.WEDDING_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;
    const client = state.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    try {
      const configResult = await client.from('site_content')
        .select('value_vi').eq('key','collage_layout').maybeSingle();
      if (configResult.error) throw configResult.error;
      let saved = null;
      if (configResult.data?.value_vi) {
        try { saved = JSON.parse(configResult.data.value_vi); }
        catch (error) { console.warn('Invalid collage configuration', error); return; }
      }
      let photos = [];
      if (saved && Array.isArray(saved.items)) {
        state.items = normalizeItems(saved.items);
        const ids = [...new Set(state.items.map(item => item.imageId))];
        if (ids.length) {
          const result = await client.from('gallery_images')
            .select('id,image_path,caption,caption_en,caption_ja,title,title_en,title_ja,alt_text,alt_text_en,alt_text_ja,focus_x,focus_y,updated_at')
            .eq('is_published',true).in('id',ids);
          if (result.error) throw result.error;
          photos = result.data || [];
        }
      } else {
        const result = await client.from('gallery_images')
          .select('id,image_path,caption,caption_en,caption_ja,title,title_en,title_ja,alt_text,alt_text_en,alt_text_ja,focus_x,focus_y,updated_at,is_featured,sort_order')
          .eq('is_published',true).eq('show_on_homepage',true)
          .order('is_featured',{ascending:false})
          .order('sort_order',{ascending:true}).limit(7);
        if (result.error) throw result.error;
        photos = result.data || [];
        state.items = createFallback(photos);
      }
      state.images = new Map(photos.map(img => [img.id,img]));
      render();
    } catch (error) {
      console.error('Romantic collage error:', error);
    }
  }
  document.addEventListener('wedding:language', render);
  load();
})();
