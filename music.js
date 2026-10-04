(() => {
  const tracks = {
    vi: { id:'__kGJZ-kPno', title:'Hơn Cả Yêu', artist:'Đức Phúc', label:'VIETNAMESE WEDDING SONG', start:48, end:125 },
    ja: { id:'WPl10ZrhCtk', title:'Akuma no Ko', artist:'Ai Higuchi', label:'JAPANESE WEDDING SONG', start:58, end:135 },
    en: { id:'06-XXOTP3Gc', title:'Beautiful In White', artist:'Shane Filan', label:'ENGLISH WEDDING SONG', start:38, end:115 }
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
  let player = null;
  let apiReady = false;
  let pendingStart = null;
  let fadeTimer = 0;

  function currentTrack(lang=currentLang) {
    return tracks[lang] || tracks.vi;
  }

  function setPlaying(next) {
    playing = !!next;
    dock.classList.toggle('is-playing', playing);
    toggleButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');
    if (state) state.textContent = playing ? '■' : '▶';
  }

  function updateMeta(lang) {
    const track = currentTrack(lang);
    currentLang = tracks[lang] ? lang : 'vi';
    dock.dataset.lang = currentLang;
    title.textContent = track.title;
    artist.textContent = track.artist;
    label.textContent = track.label;
    return track;
  }

  function clearFade() {
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = 0;
    }
  }

  function restartSegment(track=currentTrack()) {
    if (!player || !playing) return;
    try {
      player.setVolume(100);
      player.seekTo(track.start, true);
      player.playVideo();
    } catch {}
  }

  function monitorFade(track) {
    clearFade();
    fadeTimer = setInterval(() => {
      if (!player || !playing || typeof player.getCurrentTime !== 'function') return;
      const now = Number(player.getCurrentTime() || 0);
      const remain = track.end - now;

      if (remain <= 3 && remain > 0) {
        const volume = Math.max(0, Math.min(100, Math.round((remain / 3) * 100)));
        try { player.setVolume(volume); } catch {}
      }

      if (now >= track.end - .08) {
        restartSegment(track);
      }
    }, 180);
  }

  function loadTrack(lang=currentLang) {
    const track = updateMeta(lang);
    if (!player || !apiReady) {
      pendingStart = currentLang;
      return;
    }

    clearFade();
    try {
      player.setVolume(100);
      player.loadVideoById({
        videoId: track.id,
        startSeconds: track.start,
        suggestedQuality: 'small'
      });
      setPlaying(true);
      monitorFade(track);
    } catch {
      setPlaying(false);
    }
  }

  function stop() {
    clearFade();
    if (player) {
      try { player.pauseVideo(); } catch {}
    }
    setPlaying(false);
  }

  function toggle() {
    if (playing) {
      stop();
    } else {
      loadTrack(currentLang);
    }
  }

  function setupPlayer() {
    if (!window.YT?.Player || player) return;
    player = new window.YT.Player('musicFrame', {
      width:'1',
      height:'1',
      playerVars:{
        autoplay:0,
        controls:0,
        disablekb:1,
        fs:0,
        playsinline:1,
        rel:0,
        modestbranding:1,
        origin:location.origin
      },
      events:{
        onReady() {
          apiReady = true;
          if (pendingStart) {
            const lang = pendingStart;
            pendingStart = null;
            loadTrack(lang);
          }
        },
        onStateChange(event) {
          if (event.data === window.YT.PlayerState.ENDED && playing) {
            restartSegment(currentTrack());
          }
        }
      }
    });
  }

  const priorReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof priorReady === 'function') priorReady();
    setupPlayer();
  };

  if (window.YT?.Player) {
    setupPlayer();
  } else if (!document.querySelector('script[data-wedding-youtube-api]')) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.weddingYoutubeApi = '1';
    document.head.appendChild(script);
  }

  document.addEventListener('wedding:language', event => {
    const lang = event.detail?.lang || window.WeddingI18n?.language || 'vi';
    const wasPlaying = playing;
    updateMeta(lang);
    if (wasPlaying) loadTrack(lang);
  });

  toggleButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const y = window.scrollY;
    toggle();
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo({top:y,left:0,behavior:'auto'});
    });
  });

  updateMeta(currentLang);
  setPlaying(false);

  window.WeddingMusic = {
    start: loadTrack,
    stop,
    toggle,
    get playing(){ return playing; },
    get language(){ return currentLang; }
  };
})();