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
    initTypography();
    initReveal();
    initScrollDecorations();
    initSectionMotion();
    initNavThemes();
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
    qsa('.section-heading, .story-side, .story-copy, .gallery-display, .countdown-heading, .event-family, .countdown > div, .guide-card, .schedule-head, .schedule-day, .travel-heading, .travel-card, .city-notes, .faq-heading, .faq-item, .wishes-display, .wishes-card, .home-photo, .rsvp-copy, .rsvp-display, .rsvp-form')
      .forEach((el,i) => observeRevealElement(el,i));
    initGalleryCuriosity();
  }

  function escapeText(value='') {
    return String(value)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function wrapMotionLines(el) {
    if (!el) return;
    const raw = el.textContent.trim().replace(/\s+/g,' ');
    if (!raw) return;
    if (el.dataset.motionWrappedSource === raw && el.querySelector('.motion-line-inner')) return;

    let parts;
    if (/^H[1-6]$/.test(el.tagName)) {
      parts = raw.split(/,\s*/).map((part,index,arr) => index < arr.length-1 ? part + ',' : part);
    } else {
      parts = raw.match(/[^.!?。！？]+[.!?。！？]?/g)?.map(x=>x.trim()).filter(Boolean) || [raw];
    }

    el.dataset.motionWrappedSource = raw;
    el.innerHTML = parts.map(part =>
      `<span class="motion-line"><span class="motion-line-inner">${escapeText(part)}</span></span>`
    ).join('');
  }

  function initTypography() {
    qsa('[data-motion-lines]').forEach(wrapMotionLines);
  }

  function initScrollDecorations() {
    if (body.dataset.scrollDecorInit) return;
    body.dataset.scrollDecorInit = '1';

    const floating = qsa('.floating-word');
    const progress = qs('.page-progress');
    const side = qs('.side-note');
    let decorRaf = 0;

    const update = () => {
      cancelAnimationFrame(decorRaf);
      decorRaf = requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const p = Math.max(0, Math.min(1, scrollY / max));
        root.style.setProperty('--page-progress', p.toFixed(4));

        floating.forEach((el,index) => {
          const direction = index % 2 ? -1 : 1;
          const x = direction * (p * 34);
          const y = (p - .5) * (index % 2 ? 28 : 46);
          el.style.transform = `translate3d(${x}px,${y}px,0)`;
        });

        if (side) {
          side.style.opacity = String(.22 + Math.min(.28,p*.5));
        }
        if (progress) {
          progress.classList.toggle('near-end', p > .9);
        }
      });
    };

    addEventListener('scroll',update,{passive:true});
    addEventListener('resize',update,{passive:true});
    update();
  }

  function sectionProgress(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const vh = innerHeight || 1;
    const start = vh;
    const end = -r.height;
    return Math.max(0, Math.min(1, (start - r.top) / (start - end)));
  }

  function initSectionMotion() {
    if (body.dataset.sectionMotionInit) return;
    body.dataset.sectionMotionInit = '1';

    const guide = qs('.guide-grid');
    const travel = qs('.travel-cards');
    const forever = qs('.forever-transition');
    const topRail = qs('.forever-rail-top');
    const bottomRail = qs('.forever-rail-bottom');
    const foreverWord = qs('.forever-copy strong');
    const scheduleDays = qs('.schedule-days');
    let sectionRaf = 0;

    const update = () => {
      cancelAnimationFrame(sectionRaf);
      sectionRaf = requestAnimationFrame(() => {
        if (guide) {
          const p = sectionProgress(guide);
          const shift = (p - .5) * 34;
          guide.style.setProperty('--guide-shift', `${shift.toFixed(2)}px`);
        }

        if (travel) {
          const p = sectionProgress(travel);
          const shift = (p - .5) * 38;
          travel.style.setProperty('--travel-shift', `${shift.toFixed(2)}px`);
        }

        if (scheduleDays) {
          const p = sectionProgress(scheduleDays);
          scheduleDays.style.setProperty('--schedule-progress', p.toFixed(3));
        }

        if (forever) {
          const p = sectionProgress(forever);
          forever.style.setProperty('--forever-progress', p.toFixed(3));
          const horizontal = (p - .5) * 150;
          if (topRail) topRail.style.transform = `translate3d(${-horizontal}px,0,0)`;
          if (bottomRail) bottomRail.style.transform = `translate3d(${horizontal}px,0,0)`;
          if (foreverWord) {
            const scale = .88 + p * .2;
            const tracking = Math.max(-.04, .12 - p * .16);
            foreverWord.style.transform = `scale(${scale.toFixed(3)})`;
            foreverWord.style.letterSpacing = `${tracking.toFixed(3)}em`;
          }
        }
      });
    };

    addEventListener('scroll',update,{passive:true});
    addEventListener('resize',update,{passive:true});
    update();
  }

  function initNavThemes() {
    const nav = qs('.nav');
    if (!nav || nav.dataset.themeInit) return;
    nav.dataset.themeInit = '1';

    const themeTargets = [
      ['#home','dark'],
      ['#story','light'],
      ['.countdown-section','dark'],
      ['#events','light'],
      ['#guide','light'],
      ['#schedule','light'],
      ['#travel','dark'],
      ['#forever','dark'],
      ['.gallery-section','light'],
      ['#wishes','light'],
      ['#rsvp','light'],
      ['.footer','dark']
    ];

    const navTargets = [
      ['#story','story'],
      ['#events','events'],
      ['#rsvp','rsvp']
    ];

    const themeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const theme = entry.target.dataset.navTheme || 'light';
        nav.classList.toggle('nav-theme-light', theme === 'light');
        nav.classList.toggle('nav-theme-dark', theme === 'dark');
      });
    }, { rootMargin:'-25% 0px -65% 0px', threshold:0 });

    themeTargets.forEach(([selector,theme]) => {
      const el = qs(selector);
      if (!el) return;
      el.dataset.navTheme = theme;
      themeObserver.observe(el);
    });

    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const key = entry.target.dataset.navKey;
        qsa('.nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${key}`);
        });
      });
    }, { rootMargin:'-35% 0px -55% 0px', threshold:0 });

    navTargets.forEach(([selector,key]) => {
      const el = qs(selector);
      if (!el) return;
      el.dataset.navKey = key;
      activeObserver.observe(el);
    });
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

  document.addEventListener('wedding:language',()=>setTimeout(() => {
    initTypography();
    initReveal();
  },0));

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