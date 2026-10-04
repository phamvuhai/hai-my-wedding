(() => {
  const intro = document.getElementById('invitationIntro');
  const openButton = document.getElementById('openInvitation');
  const stage = intro?.querySelector('.intro-card-stage');
  const hero = document.getElementById('home');

  const validAnchors = new Set([
    '#home','#story','#events','#guide','#schedule',
    '#travel','#forever','#wishes','#rsvp'
  ]);

  let pendingHash = validAnchors.has(location.hash) ? location.hash : '';
  let invitationOpened = false;

  function getHashTarget(hash = location.hash) {
    if (!validAnchors.has(hash)) return null;
    try {
      return document.querySelector(hash);
    } catch {
      return null;
    }
  }

  function scrollToHash(hash, behavior = 'smooth') {
    const target = getHashTarget(hash);
    if (!target) return false;
    target.scrollIntoView({ behavior, block: 'start' });
    return true;
  }

  function goTop(behavior = 'auto') {
    window.scrollTo({ top: 0, left: 0, behavior });
  }

  if (!intro || !openButton) {
    document.body.classList.remove('invitation-locked');
    requestAnimationFrame(() => {
      if (location.hash) scrollToHash(location.hash, 'auto');
    });
    return;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Keep the page behind the invitation at the top while the intro is visible.
  // The requested fragment is remembered and restored only after opening.
  goTop('auto');

  function replayHeroEntrance() {
    if (!hero) return;
    hero.classList.remove('hero-entered');
    void hero.offsetWidth;
    requestAnimationFrame(() => hero.classList.add('hero-entered'));
  }

  function navigateAfterOpening() {
    const hash = pendingHash || (validAnchors.has(location.hash) ? location.hash : '');

    // Wait for the intro lock to be removed and localized text/layout to settle.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (hash && scrollToHash(hash, 'smooth')) return;
        goTop('auto');
        replayHeroEntrance();
      });
    });
  }

  function finishOpening() {
    intro.classList.add('is-opened');
    document.body.classList.remove('invitation-locked');
    invitationOpened = true;

    navigateAfterOpening();

    setTimeout(() => {
      intro.setAttribute('aria-hidden', 'true');
    }, 720);

    document.dispatchEvent(new CustomEvent('wedding:invitation-opened', {
      detail: {
        lang: window.WeddingI18n?.language || 'vi',
        hash: pendingHash || location.hash || ''
      }
    }));
  }

  function openInvitation() {
    if (intro.classList.contains('is-opening')) return;

    openButton.disabled = true;
    intro.classList.add('is-opening');

    const lang = window.WeddingI18n?.language || 'vi';
    window.WeddingMusic?.start?.(lang);

    setTimeout(finishOpening, 1480);
  }

  openButton.addEventListener('click', openInvitation);

  // Some browsers apply the native fragment scroll late, after scripts have already run.
  // Keep the covered page at the top until the invitation has actually opened.
  addEventListener('load', () => {
    if (!invitationOpened && pendingHash) goTop('auto');
  }, { once: true });

  // Browser Back/Forward and in-page anchor navigation keep working after the intro.
  // Before opening, remember the requested section but keep the covered page at the top.
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

  // If language changes while an anchor is active, keep that section in view.
  document.addEventListener('wedding:language', () => {
    if (!invitationOpened || !location.hash || !validAnchors.has(location.hash)) return;
    pendingHash = location.hash;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToHash(pendingHash, 'auto'));
    });
  });

  // Very small perspective response on desktop; it never changes element dimensions.
  if (stage && matchMedia('(pointer:fine) and (min-width:900px)').matches) {
    intro.addEventListener('pointermove', event => {
      if (intro.classList.contains('is-opening')) return;
      const x = event.clientX / innerWidth - .5;
      const y = event.clientY / innerHeight - .5;
      stage.style.transform = `rotateX(${(-y * 1.6).toFixed(2)}deg) rotateY(${(x * 2).toFixed(2)}deg) translate3d(${(x * 4).toFixed(2)}px,${(y * 3).toFixed(2)}px,0)`;
    });

    intro.addEventListener('pointerleave', () => {
      stage.style.transform = '';
    });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => intro.classList.add('is-ready'));
  });
})();