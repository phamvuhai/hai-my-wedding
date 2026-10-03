(() => {
  const tracks = {
    vi: {
      id: '__kGJZ-kPno',
      title: 'Hơn Cả Yêu',
      artist: 'Đức Phúc',
      label: 'VIETNAMESE WEDDING SONG'
    },
    ja: {
      id: 'ljDRzQz3ULE',
      title: '115万キロのフィルム',
      artist: 'Official髭男dism',
      label: 'JAPANESE WEDDING SONG'
    },
    en: {
      id: '2Vv-BfVoq4g',
      title: 'Perfect',
      artist: 'Ed Sheeran',
      label: 'ENGLISH WEDDING SONG'
    }
  };

  const dock = document.getElementById('musicDock');
  const toggle = document.getElementById('musicToggle');
  const frame = document.getElementById('musicFrame');
  const title = document.getElementById('musicTitle');
  const artist = document.getElementById('musicArtist');
  const label = document.getElementById('musicLabel');
  const hint = document.getElementById('musicHint');
  const external = document.getElementById('musicExternal');
  if (!dock || !toggle || !frame) return;

  let pendingLanguageGesture = false;
  let currentLang = window.WeddingI18n?.language || 'vi';

  function embedUrl(id, autoplay=false) {
    const p = new URLSearchParams({
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      enablejsapi: '0'
    });
    if (autoplay) p.set('autoplay','1');
    return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
  }

  function setOpen(open) {
    dock.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function applyTrack(lang, autoplay=false) {
    const track = tracks[lang] || tracks.vi;
    currentLang = tracks[lang] ? lang : 'vi';

    title.textContent = track.title;
    artist.textContent = track.artist;
    label.textContent = track.label;
    external.href = `https://www.youtube.com/watch?v=${track.id}`;

    const next = embedUrl(track.id, autoplay);
    if (frame.src !== next) frame.src = next;

    const labels = {
      vi: autoplay ? 'Đang mở bài hát theo ngôn ngữ đã chọn' : 'Bấm để mở nhạc cưới',
      en: autoplay ? 'Opening the song for your selected language' : 'Tap to open the wedding song',
      ja: autoplay ? '選択した言語の曲を再生します' : 'タップしてウェディングソングを開く'
    };
    hint.textContent = labels[currentLang];

    if (autoplay) setOpen(true);
  }

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingLanguageGesture = true;
      setTimeout(() => { pendingLanguageGesture = false; }, 500);
    }, { capture:true });
  });

  document.addEventListener('wedding:language', e => {
    const lang = e.detail?.lang || window.WeddingI18n?.language || 'vi';
    applyTrack(lang, pendingLanguageGesture);
  });

  toggle.addEventListener('click', () => {
    const open = !dock.classList.contains('open');
    if (!frame.src) applyTrack(currentLang, false);
    setOpen(open);
  });

  applyTrack(currentLang, false);
})();