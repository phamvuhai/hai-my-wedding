(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const body = document.body;
  const cfg = window.WEDDING_CONFIG || {};
  let mode = 'elegant';
  let raf = 0;

  function setMode(next) {
    mode = reduce ? 'minimal' : (['minimal','elegant','wow'].includes(next) ? next : 'elegant');
    root.dataset.motion = mode;
    body.classList.add('motion-ready');
    initEntrance();
    initReveal();
    initCountdown();
    initParallax();
    initMagnetic();
    initParticles();
    initRsvpSuccess();
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
    const hero = document.querySelector('.hero');
    if (!hero || hero.dataset.motionInit) return;
    hero.dataset.motionInit = '1';
    const pieces = [
      '.hero-copy .eyebrow',
      '.hero-copy h1',
      '.hero-date',
      '.hero-note',
      '.hero-copy .btn',
      '.hero-feature-photo'
    ];
    pieces.forEach((sel,i) => {
      const el = hero.querySelector(sel);
      if (!el) return;
      el.classList.add('hero-animate');
      el.style.setProperty('--motion-delay', `${180 + i * 150}ms`);
    });
    requestAnimationFrame(() => hero.classList.add('hero-entered'));
  }

  function initReveal() {
    const targets = [
      ...document.querySelectorAll('.section-heading, .intro .narrow, .event-family, .countdown > div, .home-photo, .rsvp-copy, .rsvp-form')
    ];
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('motion-in');
        io.unobserve(el);
      });
    }, { threshold: .14, rootMargin: '0px 0px -5% 0px' });
    targets.forEach((el,i) => {
      if (el.dataset.motionObserved) return;
      el.dataset.motionObserved = '1';
      el.classList.add('motion-item');
      el.style.setProperty('--stagger-index', i % 8);
      io.observe(el);
    });
  }

  function initCountdown() {
    document.querySelectorAll('.countdown strong').forEach(el => {
      if (el.dataset.flipInit) return;
      el.dataset.flipInit = '1';
      let last = el.textContent;
      const mo = new MutationObserver(() => {
        const next = el.textContent;
        if (next === last) return;
        last = next;
        el.classList.remove('count-flip');
        void el.offsetWidth;
        el.classList.add('count-flip');
      });
      mo.observe(el,{childList:true,characterData:true,subtree:true});
    });
  }

  function initParallax() {
    if (mode === 'minimal' || reduce) return;
    const hero = document.querySelector('.hero');
    if (!hero || hero.dataset.parallaxInit) return;
    hero.dataset.parallaxInit = '1';
    const photo = document.querySelector('.hero-full-photo img, .hero-feature-photo img');
    const copy = document.querySelector('.hero-copy');
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.max(0, scrollY);
        const h = hero.offsetHeight || 1;
        const p = Math.min(1, y / h);
        hero.style.setProperty('--scroll-progress', p.toFixed(3));
        if (copy) copy.style.transform = `translate3d(0,${-p * (mode === 'wow' ? 34 : 20)}px,0)`;
        if (photo) photo.style.setProperty('--scroll-shift', `${p * (mode === 'wow' ? 26 : 14)}px`);
      });
    };
    addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  }

  function initMagnetic() {
    if (mode !== 'wow' || reduce || matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.hero .btn, .gallery-cta .btn, .map-link').forEach(el => {
      if (el.dataset.magneticInit) return;
      el.dataset.magneticInit = '1';
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left+r.width/2)) / r.width * 8;
        const dy = (e.clientY - (r.top+r.height/2)) / r.height * 8;
        el.style.transform = `translate(${dx}px,${dy}px)`;
      });
      el.addEventListener('pointerleave',()=> el.style.transform='');
    });
  }

  function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let layer = hero.querySelector('.motion-particles');
    if (mode !== 'wow' || reduce) {
      layer?.remove();
      return;
    }
    if (layer) return;
    layer = document.createElement('div');
    layer.className = 'motion-particles';
    for (let i=0;i<9;i++) {
      const p = document.createElement('span');
      p.style.setProperty('--x', `${8 + (i*11)%86}%`);
      p.style.setProperty('--delay', `${(i*.8).toFixed(1)}s`);
      p.style.setProperty('--duration', `${9 + (i%4)*2}s`);
      p.style.setProperty('--size', `${5 + (i%3)*3}px`);
      layer.appendChild(p);
    }
    hero.appendChild(layer);
  }

  function initRsvpSuccess() {
    const status = document.getElementById('formStatus');
    const form = document.getElementById('rsvpForm');
    if (!status || !form || status.dataset.motionInit) return;
    status.dataset.motionInit = '1';
    new MutationObserver(() => {
      if (!status.classList.contains('success')) return;
      form.classList.remove('rsvp-celebrate');
      void form.offsetWidth;
      form.classList.add('rsvp-celebrate');
    }).observe(status,{attributes:true,childList:true,subtree:true});
  }

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