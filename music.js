(() => {
  const tracks = {
    vi: { id:'__kGJZ-kPno', title:'Hơn Cả Yêu', artist:'Đức Phúc', label:'VIETNAMESE WEDDING SONG' },
    ja: { id:'ljDRzQz3ULE', title:'115万キロのフィルム', artist:'Official髭男dism', label:'JAPANESE WEDDING SONG' },
    en: { id:'2Vv-BfVoq4g', title:'Perfect', artist:'Ed Sheeran', label:'ENGLISH WEDDING SONG' }
  };

  const dock = document.getElementById('musicDock');
  const toggleButton = document.getElementById('musicToggle');
  const frame = document.getElementById('musicFrame');
  const title = document.getElementById('musicTitle');
  const artist = document.getElementById('musicArtist');
  const label = document.getElementById('musicLabel');
  const state = document.getElementById('musicState');
  if (!dock || !toggleButton || !frame) return;

  let currentLang = window.WeddingI18n?.language || 'vi';
  let playing = false;

  function embedUrl(id) {
    const params = new URLSearchParams({
      autoplay:'1',
      playsinline:'1',
      rel:'0',
      modestbranding:'1',
      controls:'0',
      disablekb:'1',
      fs:'0',
      loop:'1',
      playlist:id
    });
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  function setPlaying(next) {
    playing = !!next;
    dock.classList.toggle('is-playing', playing);
    toggleButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');
    if (state) state.textContent = playing ? '■' : '▶';
  }

  function updateMeta(lang) {
    const track = tracks[lang] || tracks.vi;
    currentLang = tracks[lang] ? lang : 'vi';
    dock.dataset.lang = currentLang;
    title.textContent = track.title;
    artist.textContent = track.artist;
    label.textContent = track.label;
    return track;
  }

  function start(lang=currentLang) {
    const track = updateMeta(lang);
    frame.src = embedUrl(track.id);
    setPlaying(true);
  }

  function stop() {
    frame.src = 'about:blank';
    setPlaying(false);
  }

  function toggle() {
    if (playing) stop();
    else start(currentLang);
  }

  document.addEventListener('wedding:language', event => {
    const lang = event.detail?.lang || window.WeddingI18n?.language || 'vi';
    const wasPlaying = playing;
    updateMeta(lang);
    if (wasPlaying) start(lang);
  });

  toggleButton.addEventListener('click', toggle);

  updateMeta(currentLang);
  setPlaying(false);

  window.WeddingMusic = {
    start,
    stop,
    toggle,
    get playing(){ return playing; },
    get language(){ return currentLang; }
  };
})();