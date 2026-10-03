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
  const state = document.getElementById('musicState');
  if (!dock || !toggle || !frame) return;

  let currentLang = window.WeddingI18n?.language || 'vi';
  let playing = false;
  let languageGesture = false;
  let gestureTimer = 0;

  function embedUrl(id, autoplay) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: '0',
      disablekb: '1',
      fs: '0',
      loop: '1',
      playlist: id
    });
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  function setPlaying(next) {
    playing = !!next;
    dock.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
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

  function startTrack(lang=currentLang) {
    const track = updateMeta(lang);
    // This is intentionally triggered from a user gesture whenever possible.
    frame.src = embedUrl(track.id, true);
    setPlaying(true);
  }

  function stopTrack() {
    frame.src = 'about:blank';
    setPlaying(false);
  }

  // Capture the language button gesture before i18n dispatches its custom event.
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      languageGesture = true;
      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => { languageGesture = false; }, 700);
    }, { capture:true });
  });

  document.addEventListener('wedding:language', event => {
    const lang = event.detail?.lang || window.WeddingI18n?.language || 'vi';
    updateMeta(lang);

    // Initial page load only updates metadata. A real language-button click
    // immediately switches and starts the selected song.
    if (languageGesture) startTrack(lang);
  });

  toggle.addEventListener('click', () => {
    if (playing) stopTrack();
    else startTrack(currentLang);
  });

  // Browsers do not reliably allow audible autoplay before any interaction.
  // Start the current-language song on the first normal user gesture instead.
  const startOnFirstGesture = event => {
    if (playing) return;
    if (event.target.closest?.('[data-lang], #musicToggle')) return;
    startTrack(currentLang);
  };
  document.addEventListener('pointerdown', startOnFirstGesture, { capture:true, once:true });
  document.addEventListener('keydown', startOnFirstGesture, { capture:true, once:true });

  updateMeta(currentLang);
  setPlaying(false);
})();