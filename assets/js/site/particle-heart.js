/* V23 — Rose-gold Particle Heart, original SVG + Canvas 2D.
 * Adds a one-time reveal to the existing Crystal Heart, with no network assets,
 * WebGL, external packages, or interactions overlaid on the invitation.
 */
(() => {
  'use strict';
  const scene = document.getElementById('weddingMagic');
  const stage = scene?.querySelector('.hm-crystal-stage');
  if (!scene || !stage || stage.querySelector('.hm-particle-intro')) return;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)');
  const NS = 'http://www.w3.org/2000/svg';
  const HEART = 'M110 181C91 162 24 117 24 70C24 31 74 16 110 53C146 16 196 31 196 70C196 117 129 162 110 181Z';
  const DRAW_MS = 1800;
  const BURST_START_MS = 1450;
  const BURST_END_MS = 3750;
  const REVEAL_START_MS = 2650;
  const REVEAL_END_MS = 4000;
  const DONE_MS = 4700;

  const intro = document.createElement('div');
  intro.className = 'hm-particle-intro';
  intro.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('hm-particle-trace-svg');
  svg.setAttribute('viewBox', '0 0 220 200');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  function makePath(cssClass) {
    const path = document.createElementNS(NS, 'path');
    path.classList.add(cssClass);
    path.setAttribute('d', HEART);
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
    return path;
  }
  const glowPath = makePath('hm-particle-trace-glow');
  const brightPath = makePath('hm-particle-trace-bright');
  const tracer = document.createElementNS(NS, 'circle');
  tracer.classList.add('hm-particle-tracer');
  tracer.setAttribute('r', '3.1');
  tracer.setAttribute('cx', '110');
  tracer.setAttribute('cy', '181');
  svg.appendChild(tracer);
  const canvas = document.createElement('canvas');
  canvas.className = 'hm-particle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  intro.appendChild(canvas);
  intro.appendChild(svg);
  stage.appendChild(intro);

  const ctx = canvas.getContext('2d', {alpha: true});
  const length = brightPath.getTotalLength();
  [glowPath, brightPath].forEach(path => {
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  });

  // Deterministic particles: no random animation jumps across language changes.
  let seed = 62331;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function particleBudget() {
    return mobile.matches ? 64 : 180;
  }
  function buildParticles() {
    return Array.from({length: particleBudget()}, (_, index) => {
      // The right arc dissolves into a fan of small champagne and blush sparks.
      const fraction = 0.53 + random() * .43;
      const point = brightPath.getPointAtLength(length * fraction);
      const angle = -1.42 + random() * 2.55;
      const speed = 33 + random() * 80;
      return {
        x: point.x, y: point.y,
        vx: Math.cos(angle) * speed + 16,
        vy: Math.sin(angle) * speed - 10,
        radius: .45 + random() * 1.55,
        start: BURST_START_MS + random() * 760,
        life: 1050 + random() * 1030,
        opacity: .25 + random() * .75,
        sway: random() * 6.28,
        shade: index % 5 === 0 ? '#fff7dc' : index % 3 === 0 ? '#f3adc0' : '#f1cead'
      };
    });
  }
  let particles = buildParticles();
  let elapsed = 0;
  let lastTime = null;
  let lastPaint = 0;
  let visible = false;
  let finished = false;
  let frameId = 0;
  let frameCounter = 0;
  let drawnParticles = 0;

  function resizeCanvas() {
    if (!ctx) return;
    const box = intro.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
  }

  function isAllowed() {
    return !!ctx && !reduced.matches &&
      root.dataset.motion !== 'minimal' &&
      root.dataset.motion !== 'off' &&
      !document.hidden &&
      !document.body.classList.contains('invitation-locked') &&
      !document.body.classList.contains('photo-lightbox-open') &&
      !document.body.classList.contains('gallery-overlay-open');
  }

  function paint(ms) {
    drawnParticles = 0;
    const drawProgress = Math.min(1, Math.max(0, ms / DRAW_MS));
    const dash = (length * (1 - drawProgress)).toFixed(2);
    glowPath.style.strokeDashoffset = dash;
    brightPath.style.strokeDashoffset = dash;
    const point = brightPath.getPointAtLength(length * drawProgress);
    tracer.setAttribute('cx', point.x.toFixed(2));
    tracer.setAttribute('cy', point.y.toFixed(2));
    tracer.style.opacity = ms < 2100 ? '1' : String(Math.max(0, 1 - (ms - 2100) / 450));
    const reveal = Math.max(0, Math.min(1, (ms - REVEAL_START_MS) / (REVEAL_END_MS - REVEAL_START_MS)));
    scene.style.setProperty('--hm-v23-reveal', reveal.toFixed(3));
    intro.style.opacity = String(Math.max(0, Math.min(1, (DONE_MS - ms) / 1300)));

    if (!ctx) return;
    const width = canvas.width, height = canvas.height;
    if (width < 1 || height < 1) return;
    ctx.clearRect(0, 0, width, height);
    if (ms < BURST_START_MS || ms > BURST_END_MS) return;

    // Match SVG's default preserveAspectRatio="xMidYMid meet".
    const scale = Math.min(width / 220, height / 200);
    const xOffset = (width - 220 * scale) / 2;
    const yOffset = (height - 200 * scale) / 2;
    ctx.save();
    ctx.translate(xOffset, yOffset);
    ctx.scale(scale, scale);
    for (const p of particles) {
      const age = ms - p.start;
      if (age <= 0 || age >= p.life) continue;
      const fraction = age / p.life;
      const t = age / 1000;
      const x = p.x + p.vx * t + Math.sin(p.sway + t * 4) * (fraction * 6);
      const y = p.y + p.vy * t + 10 * t * t;
      ctx.globalAlpha = p.opacity * Math.pow(1 - fraction, 1.7);
      ctx.fillStyle = p.shade;
      ctx.beginPath();
      ctx.arc(x, y, p.radius * (.85 + fraction * .35), 0, Math.PI * 2);
      ctx.fill();
      drawnParticles++;
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function stopFrame() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = null;
  }
  function finish() {
    finished = true;
    elapsed = DONE_MS;
    paint(elapsed);
    scene.style.setProperty('--hm-v23-reveal', '1');
    scene.classList.add('hm-particle-complete');
    stopFrame();
  }
  function frame(now) {
    frameId = 0;
    if (!visible || !isAllowed() || finished) {stopFrame(); return;}
    if (lastTime === null) lastTime = now;
    // Deliberate cap also avoids a huge leap when Safari returns from background.
    elapsed += Math.min(64, Math.max(0, now - lastTime));
    lastTime = now;
    const interval = mobile.matches ? 1000 / 30 : 1000 / 60;
    if (!lastPaint || now - lastPaint >= interval || elapsed >= DONE_MS) {
      lastPaint = now;
      frameCounter++;
      paint(elapsed);
    }
    if (elapsed >= DONE_MS) finish();
    else frameId = requestAnimationFrame(frame);
  }
  function reconcile() {
    const active = visible && isAllowed();
    if (!isAllowed()) {
      // Accessibility/performance mode shows the original static crystal heart.
      scene.classList.remove('hm-particle-enabled');
      stopFrame();
      return;
    }
    scene.classList.add('hm-particle-enabled');
    if (finished) {
      scene.classList.add('hm-particle-complete');
      scene.style.setProperty('--hm-v23-reveal', '1');
      return;
    }
    if (active && !frameId) {
      resizeCanvas();
      lastTime = null;
      frameId = requestAnimationFrame(frame);
    } else if (!active) {
      stopFrame();
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      reconcile();
    }, {threshold: .12, rootMargin: '50px 0px'});
    observer.observe(scene);
  } else {
    // No IntersectionObserver: show the static heart instead of running a loop.
    finished = true;
    scene.classList.add('hm-particle-complete');
    scene.style.setProperty('--hm-v23-reveal', '1');
  }
  const modeObserver = new MutationObserver(reconcile);
  modeObserver.observe(root, {attributes: true, attributeFilter: ['data-motion']});
  modeObserver.observe(document.body, {attributes: true, attributeFilter: ['class']});
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(intro);
  window.addEventListener('resize', () => {
    particles = buildParticles();
    resizeCanvas();
  }, {passive: true});
  document.addEventListener('visibilitychange', reconcile, {passive: true});
  document.addEventListener('wedding:invitation-opened', reconcile);
  document.addEventListener('wedding:gallery-photo-change', reconcile);
  window.addEventListener('pagehide', stopFrame, {passive: true});
  window.addEventListener('pageshow', reconcile, {passive: true});
  reduced.addEventListener?.('change', reconcile);
  mobile.addEventListener?.('change', () => {particles = buildParticles(); reconcile();});
  resizeCanvas();
  reconcile();

  // Read-only instrumentation for offline QA and future performance diagnostics.
  window.WeddingParticleHeart = {
    status: () => ({
      visible, finished, running: Boolean(frameId), elapsed: Math.round(elapsed),
      particles: particles.length, frames: frameCounter, drawnParticles, allowed: isAllowed()
    })
  };
})();
