(() => {
  const tracks = {
    vi: {
      sources:['__kGJZ-kPno'],
      title:'Hơn Cả Yêu',
      artist:'Đức Phúc',
      label:'VIETNAMESE WEDDING SONG',
      start:48,
      end:125
    },
    ja: {
      sources:['WPl10ZrhCtk'],
      title:'Akuma no Ko',
      artist:'Ai Higuchi',
      label:'JAPANESE WEDDING SONG',
      start:58,
      end:135
    },
    en: {
      // Official video first; official album audio is the automatic fallback.
      sources:['06-XXOTP3Gc','yxJ5Uh2bnWg'],
      title:'Beautiful In White',
      artist:'Shane Filan',
      label:'ENGLISH WEDDING SONG',
      start:89,
      end:166
    }
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
  let loading = false;
  let player = null;
  let apiReady = false;
  let pendingStart = null;
  let fadeTimer = 0;
  let sourceIndex = 0;
  let loadWatchdog = 0;

  function currentTrack(lang=currentLang) {
    return tracks[lang] || tracks.vi;
  }

  function currentSource(track=currentTrack()) {
    return track.sources[Math.min(sourceIndex,track.sources.length-1)];
  }

  function setLoading(next) {
    loading = !!next;
    dock.classList.toggle('is-loading',loading);
    if (state && loading && !playing) state.textContent = '…';
  }

  function setPlaying(next) {
    playing = !!next;
    dock.classList.toggle('is-playing',playing);
    toggleButton.setAttribute('aria-pressed',playing ? 'true' : 'false');
    toggleButton.setAttribute('aria-label',playing ? 'Pause wedding music' : 'Play wedding music');
    if (state) state.textContent = playing ? '■' : '▶';
    if (playing) setLoading(false);
  }

  function updateMeta(lang) {
    const track = currentTrack(lang);
    currentLang = tracks[lang] ? lang : 'vi';
    sourceIndex = 0;
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

  function clearWatchdog() {
    if (loadWatchdog) {
      clearTimeout(loadWatchdog);
      loadWatchdog = 0;
    }
  }

  function restartSegment(track=currentTrack()) {
    if (!player || !playing) return;
    try {
      player.setVolume(100);
      player.seekTo(track.start,true);
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
        const volume = Math.max(0,Math.min(100,Math.round((remain/3)*100)));
        try { player.setVolume(volume); } catch {}
      }

      if (now >= track.end - .08) restartSegment(track);
    },180);
  }

  function tryNextSource() {
    const track = currentTrack();
    if (sourceIndex + 1 >= track.sources.length) {
      clearWatchdog();
      setLoading(false);
      setPlaying(false);
      dock.classList.add('has-playback-error');
      return false;
    }

    sourceIndex += 1;
    dock.classList.remove('has-playback-error');
    loadTrack(currentLang,{preserveSource:true});
    return true;
  }

  function startWatchdog() {
    clearWatchdog();
    loadWatchdog = setTimeout(() => {
      if (!playing && loading) tryNextSource();
    },4200);
  }

  function loadTrack(lang=currentLang,{preserveSource=false}={}) {
    const track = preserveSource ? currentTrack(lang) : updateMeta(lang);
    if (!preserveSource) sourceIndex = 0;

    dock.classList.remove('has-playback-error');
    clearFade();
    clearWatchdog();
    setPlaying(false);
    setLoading(true);

    if (!player || !apiReady) {
      pendingStart = {lang:currentLang,preserveSource:true};
      return;
    }

    try {
      player.setVolume(100);
      player.loadVideoById({
        videoId:currentSource(track),
        startSeconds:track.start,
        suggestedQuality:'small'
      });
      startWatchdog();
    } catch {
      tryNextSource();
    }
  }

  function stop() {
    pendingStart = null;
    clearFade();
    clearWatchdog();
    setLoading(false);
    if (player) {
      try { player.pauseVideo(); } catch {}
    }
    setPlaying(false);
  }

  function toggle() {
    if (playing || loading) {
      stop();
    } else {
      loadTrack(currentLang);
    }
  }

  function setupPlayer() {
    if (!window.YT?.Player || player) return;

    player = new window.YT.Player('musicFrame',{
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
            const pending = pendingStart;
            pendingStart = null;
            loadTrack(pending.lang,{preserveSource:pending.preserveSource});
          }
        },
        onStateChange(event) {
          const YTState = window.YT?.PlayerState;
          if (!YTState) return;

          if (event.data === YTState.PLAYING) {
            clearWatchdog();
            setPlaying(true);
            monitorFade(currentTrack());
          } else if (event.data === YTState.ENDED && (playing || loading)) {
            restartSegment(currentTrack());
          } else if (event.data === YTState.PAUSED && !loading) {
            setPlaying(false);
          }
        },
        onError() {
          clearWatchdog();
          tryNextSource();
        }
      }
    });
  }

  const priorReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof priorReady === 'function') priorReady();
    setupPlayer();
  };

  // Load the API immediately so it is usually ready before the user opens the invitation.
  if (window.YT?.Player) {
    setupPlayer();
  } else if (!document.querySelector('script[data-wedding-youtube-api]')) {
    const script = document.createElement('script');
    script.src='https://www.youtube.com/iframe_api';
    script.async=true;
    script.dataset.weddingYoutubeApi='1';
    document.head.appendChild(script);
  }

  document.addEventListener('wedding:language',event => {
    const lang=event.detail?.lang || window.WeddingI18n?.language || 'vi';
    const shouldResume=playing || loading;
    updateMeta(lang);
    if (shouldResume) loadTrack(lang);
  });

  toggleButton.addEventListener('click',event => {
    event.preventDefault();
    event.stopPropagation();
    const y=window.scrollY;
    toggle();
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY-y)>1) window.scrollTo({top:y,left:0,behavior:'auto'});
    });
  });

  // Keep playback untouched when the page moves to the background.
  // iOS may still suspend browser media at OS level; the site does not proactively pause it.

  updateMeta(currentLang);
  setLoading(false);
  setPlaying(false);

  window.WeddingMusic={
    start:loadTrack,
    stop,
    toggle,
    get playing(){return playing;},
    get loading(){return loading;},
    get language(){return currentLang;}
  };
})();