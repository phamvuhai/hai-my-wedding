/* Romantic Motion V19 — progressive decoration. Never changes RSVP, links or image data. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const scene = document.querySelector('.hm-forever-scene');
  const bound = new Set();
  const prefersMotion = () => !reduced.matches && root.dataset.motion !== 'minimal';
  const canTilt = () => prefersMotion() && fine.matches && !document.hidden;
  let scanFrame = 0;

  function silkButton(button) {
    if (!button) return;
    button.classList.add('hm-silk-button');
    // data-i18n on links can reset textContent on language changes; re-attach.
    if (!button.querySelector(':scope > .hm-silk-glint')) {
      const glint = document.createElement('span');
      glint.className = 'hm-silk-glint';
      glint.setAttribute('aria-hidden','true');
      button.appendChild(glint);
    }
    if (!button.querySelector(':scope > .hm-silk-thread')) {
      for (let index = 0; index < 2; index++) {
        const thread = document.createElement('span');
        thread.className = 'hm-silk-thread' + (index ? ' hm-silk-thread--2' : '');
        thread.setAttribute('aria-hidden','true');
        button.appendChild(thread);
      }
    }
  }

  function reset(element, kind) {
    element.classList.remove('hm-tilting');
    if (kind === 'gallery') {
      element.style.setProperty('--hm-shift-x','0px');
      element.style.setProperty('--hm-shift-y','0px');
      element.style.setProperty('--hm-spot-x','50%');
      element.style.setProperty('--hm-spot-y','50%');
    } else {
      element.style.setProperty('--hm-rx','0deg');
      element.style.setProperty('--hm-ry','0deg');
    }
  }

  function registerParallax(element, kind, maxDegrees) {
    if (!element || element.dataset.hmParallaxInit) return;
    element.dataset.hmParallaxInit = '1';
    element.classList.add(
      kind === 'gallery' ? 'hm-parallax-gallery' :
      kind === 'paper' ? 'hm-parallax-paper' :
      kind === 'portrait' ? 'hm-parallax-portrait' : 'hm-parallax-event'
    );
    if (kind === 'gallery' && !element.querySelector(':scope > .hm-photo-glow')) {
      const glow = document.createElement('span');
      glow.className = 'hm-photo-glow';
      glow.setAttribute('aria-hidden','true');
      element.appendChild(glow);
    }
    const item = {element,kind};
    bound.add(item);
    let raf = 0;
    let lastX = 0, lastY = 0;
    const render = () => {
      raf = 0;
      if (!canTilt() || !element.isConnected) { reset(element,kind); return; }
      const r = element.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = Math.min(1,Math.max(0,(lastX-r.left)/r.width));
      const y = Math.min(1,Math.max(0,(lastY-r.top)/r.height));
      element.classList.add('hm-tilting');
      if (kind === 'gallery') {
        element.style.setProperty('--hm-shift-x', ((.5-x)*11).toFixed(1)+'px');
        element.style.setProperty('--hm-shift-y', ((.5-y)*11).toFixed(1)+'px');
        element.style.setProperty('--hm-spot-x', (x*100).toFixed(1)+'%');
        element.style.setProperty('--hm-spot-y', (y*100).toFixed(1)+'%');
      } else {
        const intensity = root.dataset.motion === 'wow' ? 1 : .72;
        element.style.setProperty('--hm-rx', ((.5-y)*maxDegrees*intensity).toFixed(2)+'deg');
        element.style.setProperty('--hm-ry', ((x-.5)*maxDegrees*intensity).toFixed(2)+'deg');
      }
    };
    element.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      lastX = e.clientX;lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    },{passive:true});
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf=0;reset(element,kind); };
    element.addEventListener('pointerleave',stop,{passive:true});
    element.addEventListener('pointercancel',stop,{passive:true});
    element.addEventListener('blur',stop,{passive:true});
  }

  function scan() {
    // Do not touch the actual Hero layout or photo lightbox, which have
    // separate motion and interaction controllers.
    registerParallax(document.querySelector('#story .story-paper-stack .story-copy'),'paper',7);
    registerParallax(document.querySelector('.our-promise-photo-shell'),'portrait',9);
    registerParallax(document.querySelector('#v3SchedulePhotoWrap:not([hidden])'),'event',6);
    document.querySelectorAll('#homeGallery > .home-photo').forEach(photo => registerParallax(photo,'gallery',0));
    document.querySelectorAll('#openInvitation, .hero-copy > .btn, .gallery-cta .btn, .rsvp-form button[type="submit"]').forEach(silkButton);
    root.classList.toggle('hm-cinematic-enabled',canTilt());
    // Prune references to gallery elements replaced by the CMS.
    for (const item of bound) if (!item.element.isConnected) bound.delete(item);
  }
  function scheduleScan() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(() => { scanFrame = 0;scan(); });
  }

  if (scene) {
    const particles = scene.querySelector('.hm-forever-particles');
    // Fixed seeded distribution: no layout jitter between visits or languages.
    let seed = 82173;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    if (particles && !particles.children.length) {
      for (let i = 0; i < 24; i++) {
        const particle = document.createElement('span');
        particle.className = 'hm-forever-particle';
        particle.setAttribute('aria-hidden','true');
        const px = 7 + random()*86;
        const py = 10 + random()*79;
        particle.style.setProperty('--hm-px',px.toFixed(1)+'%');
        particle.style.setProperty('--hm-py',py.toFixed(1)+'%');
        particle.style.setProperty('--hm-p-size',(1.4+random()*2.8).toFixed(1)+'px');
        particle.style.setProperty('--hm-p-opacity',(.23+random()*.43).toFixed(2));
        particle.style.setProperty('--hm-p-time',(4.8+random()*6).toFixed(2)+'s');
        particle.style.setProperty('--hm-p-delay',(-random()*9).toFixed(2)+'s');
        particle.style.setProperty('--hm-p-drift',(-14+random()*28).toFixed(1)+'px');
        particle.style.setProperty('--hm-p-color',random()>.43?'#ffdeca':'#f4aec2');
        particles.appendChild(particle);
      }
    }
    let inView = false;
    const awake = () => {
      scene.classList.toggle('hm-awake',inView && prefersMotion() && !document.hidden &&
        !document.body.classList.contains('invitation-locked'));
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting);
        awake();
      },{threshold:0.08,rootMargin:'80px 0px'}).observe(scene);
    } else { inView = true; awake(); }
    document.addEventListener('visibilitychange',awake,{passive:true});
    document.addEventListener('wedding:invitation-opened',awake);
    reduced.addEventListener?.('change',awake);
    // Keep the decorative scene paused if the CMS changes animation mode.
    new MutationObserver(awake).observe(root,{attributes:true,attributeFilter:['data-motion']});
  }

  const gallery = document.getElementById('homeGallery');
  if (gallery) new MutationObserver(scheduleScan).observe(gallery,{childList:true});
  document.addEventListener('wedding:language',scheduleScan);
  document.addEventListener('wedding:content-loaded',scheduleScan);
  document.addEventListener('wedding:hero-ready',scheduleScan);
  document.addEventListener('visibilitychange',() => {
    if (!canTilt()) bound.forEach(({element,kind})=>reset(element,kind));
    scheduleScan();
  },{passive:true});
  const change = () => {
    if (!canTilt()) bound.forEach(({element,kind})=>reset(element,kind));
    scheduleScan();
  };
  reduced.addEventListener?.('change',change);
  fine.addEventListener?.('change',change);
  // Motion mode may load asynchronously from site_settings.
  new MutationObserver(change).observe(root,{attributes:true,attributeFilter:['data-motion']});
  scan();
  window.WeddingRomanticMotion = {refresh:scheduleScan};
})();
