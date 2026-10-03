(() => {
  const intro = document.getElementById('invitationIntro');
  const openButton = document.getElementById('openInvitation');
  const stage = intro?.querySelector('.intro-card-stage');
  const hero = document.getElementById('home');

  if (!intro || !openButton) {
    document.body.classList.remove('invitation-locked');
    return;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  function replayHeroEntrance() {
    if (!hero) return;
    hero.classList.remove('hero-entered');
    void hero.offsetWidth;
    requestAnimationFrame(() => hero.classList.add('hero-entered'));
  }

  function finishOpening() {
    intro.classList.add('is-opened');
    document.body.classList.remove('invitation-locked');
    window.scrollTo(0, 0);
    replayHeroEntrance();

    setTimeout(() => {
      intro.setAttribute('aria-hidden', 'true');
    }, 720);

    document.dispatchEvent(new CustomEvent('wedding:invitation-opened', {
      detail: { lang: window.WeddingI18n?.language || 'vi' }
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