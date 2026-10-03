(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const root = document.documentElement;
  const body = document.body;
  const cfg = window.WEDDING_CONFIG || {};
  let mode = 'elegant';
  let scrollRaf = 0;

  const qs = (s, ctx=document) => ctx.querySelector(s);
  const qsa = (s, ctx=document) => [...ctx.querySelectorAll(s)];

  function setMode(next) {
    mode = reduce ? 'minimal' : (['minimal','elegant','wow'].includes(next) ? next : 'elegant');
    root.dataset.motion = mode;
    body.classList.add('motion-ready');

    initEntrance();
    initReveal();
    initCountdown();
    initParallax();
    initScrollCue();
    initMagnetic();
    initParticles();
    initEventTimeline();
    initEventTilt();
    initGalleryCuriosity();
    initRipple();
    initRsvpSuccess();
    initSignature();
    initEasterEgg();
    initCursor();
  }

  async function loadMode() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return setMode('elegant');
    try {
      const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data } = await db.from('site_settings').select('animation_mode').eq('id',1).maybeSingle();
      setMode(data?.animation_mode || 'elegant');
    } catch {
      setMode('elegant');
    }
  }

  function initEntrance() {
    const hero = qs('.hero');
    if (!hero || hero.dataset.motionInit) return;
    hero.dataset.motionInit = '1';

    [
      '.hero-copy .eyebrow',
      '.hero-copy h1',
      '.hero-date',
      '.hero-note',
      '.hero-copy .btn',
      '.hero-feature-photo',
      '.scroll-curiosity'
    ].forEach((sel,i) => {
      const el = qs(sel, hero);
      if (!el) return;
      el.classList.add('hero-animate');
      el.style.setProperty('--motion-delay', `${160 + i * 145}ms`);
    });

    requestAnimationFrame(() => hero.classList.add('hero-entered'));
  }

  function observeRevealElement(el, index=0) {
    if (!el || el.dataset.motionObserved) return;
    el.dataset.motionObserved = '1';
    el.classList.add('motion-item');
    el.style.setProperty('--stagger-index', index % 8);

    revealObserver.observe(el);
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold:.14, rootMargin:'0px 0px -5% 0px' });

  function initReveal() {
    qsa('.section-heading, .intro .narrow, .event-family, .countdown > div, .home-photo, .rsvp-copy, .rsvp-form')
      .forEach((el,i) => observeRevealElement(el,i));
    initGalleryCuriosity();
  }

  function initCountdown() {
    qsa('.countdown strong').forEach(el => {
      if (el.dataset.flipInit) return;
      el.dataset.flipInit = '1';
      let last = el.textContent;
      new MutationObserver(() => {
        const next = el.textContent;
        if (next === last) return;
        last = next;
        el.classList.remove('count-flip');
        void el.offsetWidth;
        el.classList.add('count-flip');
      }).observe(el,{childList:true,characterData:true,subtree:true});
    });
  }

  function initParallax() {
    if (mode === 'minimal' || reduce) return;
    const hero = qs('.hero');
    if (!hero || hero.dataset.parallaxInit) return;
    hero.dataset.parallaxInit = '1';

    const fullPhoto = qs('.hero-full-photo img', hero);
    const framedPhoto = qs('.hero-feature-photo img', hero);
    const copy = qs('.hero-copy', hero);
    const curtain = qs('.hero-curtain', hero);

    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        const y = Math.max(0, scrollY);
        const h = Math.max(1, hero.offsetHeight);
        const p = Math.min(1, y / h);

        hero.style.setProperty('--scroll-progress', p.toFixed(3));

        if (copy) {
          const amount = mode === 'wow' ? 38 : 20;
          copy.style.transform = `translate3d(0,${-p * amount}px,0)`;
          copy.style.opacity = String(Math.max(.55, 1 - p * .45));
        }

        [fullPhoto,framedPhoto].forEach(photo => {
          if (!photo) return;
          photo.style.setProperty('--scroll-shift', `${p * (mode === 'wow' ? 30 : 14)}px`);
        });

        if (curtain) {
          const cp = Math.max(0, (p - .58) / .42);
          curtain.style.setProperty('--curtain-progress', cp.toFixed(3));
        }

        hero.classList.toggle('hero-scrolled', p > .08);
      });
    };

    addEventListener('scroll',onScroll,{passive:true});
    onScroll();

    if (mode === 'wow' && !coarse) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - .5;
        const my = (e.clientY - r.top) / r.height - .5;
        hero.style.setProperty('--mouse-x', `${(mx*10).toFixed(2)}px`);
        hero.style.setProperty('--mouse-y', `${(my*8).toFixed(2)}px`);
      });
      hero.addEventListener('pointerleave',() => {
        hero.style.setProperty('--mouse-x','0px');
        hero.style.setProperty('--mouse-y','0px');
      });
    }
  }

  function initScrollCue() {
    const cue = qs('.scroll-curiosity');
    if (!cue || cue.dataset.motionInit) return;
    cue.dataset.motionInit = '1';

    const onScroll = () => cue.classList.toggle('is-hidden', scrollY > 90);
    addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  }

  function initMagnetic() {
    if (mode !== 'wow' || reduce || coarse) return;
    qsa('.hero .btn, .gallery-cta .btn, .map-link').forEach(el => {
      if (el.dataset.magneticInit) return;
      el.dataset.magneticInit = '1';

      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left+r.width/2)) / r.width * 9;
        const dy = (e.clientY - (r.top+r.height/2)) / r.height * 9;
        el.style.setProperty('--magnetic-x', `${dx}px`);
        el.style.setProperty('--magnetic-y', `${dy}px`);
      });
      el.addEventListener('pointerleave',() => {
        el.style.setProperty('--magnetic-x','0px');
        el.style.setProperty('--magnetic-y','0px');
      });
    });
  }

  function initParticles() {
    const hero = qs('.hero');
    if (!hero) return;

    let layer = qs('.motion-particles', hero);
    if (mode !== 'wow' || reduce) {
      layer?.remove();
      return;
    }
    if (layer) return;

    layer = document.createElement('div');
    layer.className = 'motion-particles';

    for (let i=0;i<11;i++) {
      const p = document.createElement('span');
      p.style.setProperty('--x', `${6 + (i*9)%88}%`);
      p.style.setProperty('--delay', `${(i*.72).toFixed(1)}s`);
      p.style.setProperty('--duration', `${9 + (i%5)*1.7}s`);
      p.style.setProperty('--size', `${4 + (i%4)*2}px`);
      layer.appendChild(p);
    }
    hero.appendChild(layer);
  }

  function initEventTimeline() {
    const events = qs('.events');
    if (!events || events.dataset.timelineInit) return;
    events.dataset.timelineInit = '1';

    const update = () => {
      const r = events.getBoundingClientRect();
      const vh = innerHeight || 1;
      const start = vh * .78;
      const end = -r.height * .25;
      const progress = Math.max(0, Math.min(1, (start - r.top) / (start - end)));
      events.style.setProperty('--event-progress', progress.toFixed(3));
    };

    addEventListener('scroll',update,{passive:true});
    addEventListener('resize',update,{passive:true});
    update();
  }

  function initEventTilt() {
    if (mode !== 'wow' || reduce || coarse) return;

    qsa('.event-family').forEach(card => {
      if (card.dataset.tiltInit) return;
      card.dataset.tiltInit = '1';

      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width-.5;
        const y = (e.clientY-r.top)/r.height-.5;
        card.style.setProperty('--tilt-x', `${(-y*2.2).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x*2.2).toFixed(2)}deg`);
      });

      card.addEventListener('pointerleave',() => {
        card.style.setProperty('--tilt-x','0deg');
        card.style.setProperty('--tilt-y','0deg');
      });
    });
  }

  function initGalleryCuriosity() {
    qsa('.home-photo').forEach((el,i) => {
      if (!el.dataset.scatterInit) {
        el.dataset.scatterInit = '1';
        const rotations = [-1.4,.9,-.7,1.2,-.5,.7,-1,.45];
        const shifts = [-16,18,-10,14,-8,12,-6,9];
        el.style.setProperty('--scatter-rotate', `${rotations[i%rotations.length]}deg`);
        el.style.setProperty('--scatter-x', `${shifts[i%shifts.length]}px`);
      }
      observeRevealElement(el,i);
    });
  }

  function initRipple() {
    qsa('.hero .btn, .gallery-cta .btn').forEach(btn => {
      if (btn.dataset.rippleInit) return;
      btn.dataset.rippleInit = '1';

      btn.addEventListener('pointerdown', e => {
        const r = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'motion-ripple';
        ripple.style.left = `${e.clientX-r.left}px`;
        ripple.style.top = `${e.clientY-r.top}px`;
        btn.appendChild(ripple);
        setTimeout(()=>ripple.remove(),700);
      });
    });
  }

  function initCursor() {
    if (mode !== 'wow' || reduce || coarse) return;
    if (qs('.motion-cursor')) return;

    const cursor = document.createElement('div');
    cursor.className = 'motion-cursor';
    cursor.innerHTML = '<span>VIEW</span>';
    body.appendChild(cursor);

    addEventListener('pointermove', e => {
      cursor.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    },{passive:true});

    qsa('.home-gallery, .gallery-cta').forEach(area => {
      area.addEventListener('pointerenter',()=>cursor.classList.add('visible'));
      area.addEventListener('pointerleave',()=>cursor.classList.remove('visible'));
    });
  }

  function heartBurst(origin) {
    const r = origin.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'heart-burst';
    layer.style.left = `${r.left+r.width/2}px`;
    layer.style.top = `${r.top+r.height/2}px`;

    for (let i=0;i<10;i++) {
      const s = document.createElement('span');
      s.textContent = i%3===0 ? '♥' : '♡';
      s.style.setProperty('--angle', `${i*36}deg`);
      s.style.setProperty('--distance', `${45+(i%4)*12}px`);
      layer.appendChild(s);
    }

    body.appendChild(layer);
    setTimeout(()=>layer.remove(),1100);
  }

  function initEasterEgg() {
    const mono = qs('.monogram');
    if (!mono || mono.dataset.eggInit) return;
    mono.dataset.eggInit = '1';

    let clicks = 0;
    let resetTimer = 0;
    mono.title = 'H ♥ M';

    mono.addEventListener('click',() => {
      clicks++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(()=>clicks=0,1200);
      if (clicks < 3) return;
      clicks = 0;
      heartBurst(mono);
      mono.classList.remove('monogram-bloom');
      void mono.offsetWidth;
      mono.classList.add('monogram-bloom');
    });
  }

  function initSignature() {
    const footer = qs('.footer');
    if (!footer || footer.dataset.signatureInit) return;
    footer.dataset.signatureInit = '1';

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        footer.classList.add('signature-in');
        io.disconnect();
      });
    },{threshold:.3});
    io.observe(footer);
  }

  function initRsvpSuccess() {
    const status = qs('#formStatus');
    const form = qs('#rsvpForm');
    if (!status || !form || status.dataset.motionInit) return;
    status.dataset.motionInit = '1';

    new MutationObserver(() => {
      if (!status.classList.contains('success')) return;
      form.classList.remove('rsvp-celebrate');
      void form.offsetWidth;
      form.classList.add('rsvp-celebrate');
      if (mode === 'wow') heartBurst(status);
    }).observe(status,{attributes:true,childList:true,subtree:true});
  }

  const galleryRoot = qs('#homeGallery');
  if (galleryRoot) {
    new MutationObserver(() => {
      initReveal();
      initGalleryCuriosity();
      initCursor();
    }).observe(galleryRoot,{childList:true,subtree:true});
  }

  document.addEventListener('wedding:language',()=>setTimeout(initReveal,0));

  if ('startViewTransition' in document) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href="/album"],a[href="./album/"],a[href="/album/"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.startViewTransition(() => { location.href = a.href; });
    });
  }

  loadMode();
})();