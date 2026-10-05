(() => {
  const intro = document.getElementById('invitationIntro');
  const openButton = document.getElementById('openInvitation');
  const stage = intro?.querySelector('.invite-v2-stage');
  const hero = document.getElementById('home');

  const validAnchors = new Set([
    '#home','#story','#events','#forever','#rsvp'
  ]);

  const isEntryRoute = location.pathname === '/' || location.pathname.split('/').filter(Boolean).includes('invite');
  let pendingHash = validAnchors.has(location.hash) ? location.hash : '';
  let invitationOpened = !isEntryRoute;
  let opening = false;

  function getHashTarget(hash = location.hash) {
    if (!validAnchors.has(hash)) return null;
    try { return document.querySelector(hash); }
    catch { return null; }
  }

  function scrollToHash(hash, behavior = 'auto') {
    const target = getHashTarget(hash);
    if (!target) return false;
    target.scrollIntoView({behavior, block:'start'});
    return true;
  }

  function goTop(behavior = 'auto') {
    window.scrollTo({top:0,left:0,behavior});
  }

  function twoFrames() {
    return new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  }

  async function waitForLayout() {
    if (document.readyState !== 'complete') {
      await Promise.race([
        new Promise(resolve => addEventListener('load', resolve, {once:true})),
        new Promise(resolve => setTimeout(resolve, 900))
      ]);
    }

    try {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 900))
        ]);
      }
    } catch {}

    await twoFrames();
  }

  async function restoreLocalizedRoutePosition() {
    await waitForLayout();
    if (pendingHash && scrollToHash(pendingHash, 'auto')) return;
    goTop('auto');
  }

  function replayHeroEntrance() {
    if (!hero) return;
    hero.classList.remove('hero-entered');
    void hero.offsetWidth;
    requestAnimationFrame(() => hero.classList.add('hero-entered'));
  }

  function localizedHomePath() {
    const lang = window.WeddingI18n?.language || 'vi';
    const code = window.WeddingI18n?.publicCode?.(lang) || (lang === 'ja' ? 'jp' : lang);
    const parts = location.pathname.split('/').filter(Boolean);
    const inviteIndex = parts.indexOf('invite');
    const token = inviteIndex >= 0 ? parts[inviteIndex + 1] : new URLSearchParams(location.search).get('invite');
    return token ? `/${code}/invite/${encodeURIComponent(token)}` : `/${code}`;
  }

  function canonicalizeAfterOpen() {
    if (!isEntryRoute) return;
    // Opening the invitation always lands on the top of the homepage.
    // Drop any old section hash so in-app browsers cannot restore into the middle of the page.
    pendingHash = '';
    history.replaceState(
      history.state || {},
      '',
      localizedHomePath() + location.search
    );
  }

  function dispatchOpened() {
    document.dispatchEvent(new CustomEvent('wedding:invitation-opened', {
      detail:{
        lang:window.WeddingI18n?.language || 'vi',
        hash:pendingHash || location.hash || ''
      }
    }));
  }

  async function finishOpening() {
    intro?.classList.add('is-opened');
    document.body.classList.remove('invitation-locked');
    document.body.classList.remove('invitation-opening');
    invitationOpened = true;
    opening = false;

    await waitForLayout();

    // A real invitation open always starts from the very top of the homepage.
    // Repeat across frames to defeat scroll restoration in Messenger/Safari in-app browsers.
    goTop('auto');
    await twoFrames();
    goTop('auto');
    replayHeroEntrance();

    intro?.setAttribute('aria-hidden','true');
    dispatchOpened();

    setTimeout(() => {
      if (invitationOpened) goTop('auto');
    }, 120);
  }

  function openInvitation() {
    if (!isEntryRoute || opening || !intro || !intro.classList.contains('is-ready')) return;
    opening = true;

    if (openButton) openButton.disabled = true;
    intro.classList.add('is-opening');
    document.body.classList.add('invitation-opening');

    canonicalizeAfterOpen();

    // This runs in the user's click/tap gesture so mobile browsers can start audio.
    const lang = window.WeddingI18n?.language || 'vi';
    window.WeddingMusic?.start?.(lang);

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTimeout(() => intro.classList.add('is-exiting'), 260);
      setTimeout(finishOpening, 560);
      return;
    }

    // Let the invitation finish opening, hold long enough to read it,
    // then cross-fade quickly into the already-preloaded Admin Hero.
    // Promote the letter only after it has cleared the front pocket.
    setTimeout(() => {
      if (opening) intro.classList.add('is-letter-out');
    }, 2920);

    // Hold the fully extracted invitation before entering the site.
    setTimeout(() => {
      if (opening) intro.classList.add('is-exiting');
    }, 5100);
    setTimeout(finishOpening, 5480);
  }

  function bindEntryInteractions() {
    openButton?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openInvitation();
    });

    stage?.addEventListener('click', event => {
      if (event.defaultPrevented || event.target.closest('button,a,input,select,textarea')) return;
      openInvitation();
    });

    stage?.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openInvitation();
    });

    stage?.addEventListener('pointerdown', () => {
      if (!opening) intro?.classList.add('is-pressed');
    }, {passive:true});

    const releasePress = () => intro?.classList.remove('is-pressed');
    stage?.addEventListener('pointerup', releasePress, {passive:true});
    stage?.addEventListener('pointercancel', releasePress, {passive:true});
    stage?.addEventListener('pointerleave', releasePress, {passive:true});
  }

  function bindRouteListeners() {
    addEventListener('hashchange', () => {
      pendingHash = validAnchors.has(location.hash) ? location.hash : '';

      if (!invitationOpened) {
        goTop('auto');
        return;
      }

      if (pendingHash) {
        requestAnimationFrame(() => scrollToHash(pendingHash, 'smooth'));
      } else {
        goTop('smooth');
      }
    });

    document.addEventListener('wedding:language', () => {
      if (!invitationOpened) return;
      pendingHash = validAnchors.has(location.hash) ? location.hash : '';
      if (!pendingHash) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToHash(pendingHash, 'auto'));
      });
    });
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  bindRouteListeners();

  if (!intro || !openButton) {
    document.body.classList.remove('invitation-locked');
    restoreLocalizedRoutePosition();
    return;
  }

  // Standard localized URLs are already "inside" the invitation. Personalized invite URLs
  // intentionally keep the cover so each guest receives the full invitation experience.
  if (!isEntryRoute) {
    intro.classList.add('is-bypassed','is-opened');
    intro.setAttribute('aria-hidden','true');
    document.body.classList.remove('invitation-locked');
    invitationOpened = true;
    restoreLocalizedRoutePosition();
    return;
  }

  // "/" is the one true entry route: always restart from the cover.
  goTop('auto');
  bindEntryInteractions();

  addEventListener('load', () => {
    if (!invitationOpened) goTop('auto');
  }, {once:true});

  // Very small perspective response on desktop; never changes dimensions.
  if (stage && matchMedia('(pointer:fine) and (min-width:900px)').matches) {
    intro.addEventListener('pointermove', event => {
      if (opening) return;
      const x = event.clientX / innerWidth - .5;
      const y = event.clientY / innerHeight - .5;
      stage.style.transform =
        `rotateX(${(-y * 1.5).toFixed(2)}deg) rotateY(${(x * 1.9).toFixed(2)}deg) translate3d(${(x * 4).toFixed(2)}px,${(y * 3).toFixed(2)}px,0)`;
    });

    intro.addEventListener('pointerleave', () => {
      stage.style.transform = '';
    });
  }

  const revealReadyState = () => {
    if (!intro || intro.classList.contains('is-ready')) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => intro.classList.add('is-ready'));
    });
  };

  if (window.WeddingHeroReady || document.body.classList.contains('hero-image-ready') || document.body.classList.contains('hero-image-fallback')) {
    revealReadyState();
  } else {
    document.addEventListener('wedding:hero-ready', revealReadyState, {once:true});
    // Never trap the guest if the remote image service is unavailable.
    setTimeout(() => {
      if (!window.WeddingHeroReady) {
        document.body.classList.remove('hero-image-loading');
        document.body.classList.add('hero-image-fallback');
        window.WeddingHeroReady = true;
      }
      revealReadyState();
    }, 2200);
  }
})();