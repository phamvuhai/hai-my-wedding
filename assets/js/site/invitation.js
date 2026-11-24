(() => {
  const intro = document.getElementById('invitationIntro');
  const openButton = document.getElementById('openInvitation');
  const hero = document.getElementById('home');

  const validAnchors = new Set([
    '#home','#story','#events','#forever','#rsvp'
  ]);

  const isEntryRoute = location.pathname === '/' || location.pathname.split('/').filter(Boolean).includes('invite');
  let pendingHash = validAnchors.has(location.hash) ? location.hash : '';
  let invitationOpened = !isEntryRoute;
  let opening = false;
  let replaying = false;

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

  function dispatchOpened(replay = false) {
    document.dispatchEvent(new CustomEvent('wedding:invitation-opened', {
      detail:{
        lang:window.WeddingI18n?.language || 'vi',
        hash:pendingHash || location.hash || '',
        replay
      }
    }));
  }

  async function finishOpening() {
    if (invitationOpened) return;
    intro?.classList.add('is-opened');
    document.body.classList.remove('invitation-locked');
    document.body.classList.remove('invitation-opening');
    invitationOpened = true;
    const wasReplay = replaying;

    await waitForLayout();

    // A real invitation open always starts from the very top of the homepage.
    // Repeat across frames to defeat scroll restoration in Messenger/Safari in-app browsers.
    goTop('auto');
    await twoFrames();
    goTop('auto');
    replayHeroEntrance();

    intro?.setAttribute('aria-hidden','true');
    replaying = false;
    opening = false;
    dispatchOpened(wasReplay);
    if (wasReplay) document.querySelector('.nav .brand')?.focus({preventScroll:true});

    setTimeout(() => {
      if (invitationOpened) goTop('auto');
    }, 120);
  }

  function openInvitation() {
    if ((!isEntryRoute && !replaying) || opening || invitationOpened || !intro) return;
    opening = true;

    if (openButton) openButton.disabled = true;
    intro.classList.add('is-opening');
    document.body.classList.add('invitation-opening');
    if (!replaying) canonicalizeAfterOpen();

    // Music still starts from the user's click, as required by mobile browsers.
    const lang = window.WeddingI18n?.language || 'vi';
    if (!replaying) window.WeddingMusic?.start?.(lang);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finishOpening();
      return;
    }

    // A single short fade replaces the old multi-stage envelope animation.
    intro.classList.add('is-exiting');
    setTimeout(finishOpening, 280);
  }

  function replayInvitation() {
    if (!intro || !openButton || opening || !invitationOpened) return;
    replaying = true;
    invitationOpened = false;
    pendingHash = '';
    if (location.hash && validAnchors.has(location.hash)) {
      history.replaceState(history.state || {}, '', location.pathname + location.search);
    }
    window.WeddingPersonalized?.dismissWelcome?.();
    document.body.classList.remove('invitation-opening');
    document.body.classList.add('invitation-locked');
    intro.classList.remove('is-bypassed','is-opened','is-opening','is-exiting');
    intro.classList.add('is-ready');
    intro.setAttribute('aria-hidden','false');
    openButton.disabled = false;
    intro.scrollTop = 0;
    goTop('auto');
    document.dispatchEvent(new Event('wedding:invitation-replay'));
    openButton.focus({preventScroll:true});
  }

  function bindEntryInteractions() {
    openButton?.addEventListener('click', event => {
      event.preventDefault();
      openInvitation();
    });
    document.querySelectorAll('[data-invite-replay]').forEach(button => {
      button.addEventListener('click', replayInvitation);
    });
    document.querySelector('.nav .brand')?.addEventListener('click', event => {
      if (!invitationOpened || opening) return;
      event.preventDefault();
      pendingHash = '';
      if (location.hash && validAnchors.has(location.hash)) {
        history.replaceState(history.state || {}, '', location.pathname + location.search);
      }
      if (window.scrollY > 1) goTop(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    });
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

  bindEntryInteractions();

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

  addEventListener('load', () => {
    if (!invitationOpened) goTop('auto');
  }, {once:true});


  // Entry cover is always interactive, regardless of hero image loading.
  intro.classList.add('is-ready');
})();