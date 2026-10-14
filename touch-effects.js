/* Romantic Touch Experience — pointer-type aware, scroll-safe, no external dependencies. */
(() => {
  if (!('PointerEvent' in window) || document.documentElement.dataset.touchFxInit) return;
  document.documentElement.dataset.touchFxInit = '1';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchDevice = window.matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const layer = document.createElement('div');
  layer.className = 'wedding-touch-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let gesture = null;
  let lastBurst = 0;
  let activeParticles = 0;
  const MAX_PARTICLES = 28;
  const controlSelector = '.hero .btn, .gallery-cta .btn, .map-link, .home-photo, .album-overlay-photo, .photo-lightbox-nav, .music-toggle, .language-switcher button, .rsvp-form .radio, .rsvp-form button[type="submit"]';

  const enabled = () => !reduceMotion.matches && document.documentElement.dataset.motion !== 'minimal';
  const mode = () => document.documentElement.dataset.motion || 'elegant';
  const isTouch = event => event.pointerType === 'touch' || event.pointerType === 'pen';
  const clean = node => node.remove();

  function appendEffect(node, duration) {
    layer.appendChild(node);
    window.setTimeout(() => clean(node), duration);
  }

  function burst(x, y, kind = 'tap', force = false) {
    if (!enabled() || (!force && !touchDevice)) return;
    const now = performance.now();
    if (kind !== 'success' && now - lastBurst < 90) return;
    lastBurst = now;
    const strong = mode() === 'wow';
    const count = kind === 'success' ? (strong ? 12 : 6) : kind === 'hero' ? (strong ? 6 : 3) : 2;
    const span = kind === 'success' ? 118 : kind === 'hero' ? 56 : 34;

    const halo = document.createElement('span');
    halo.className = 'wedding-touch-halo wedding-touch-' + kind;
    halo.style.left = x + 'px';
    halo.style.top = y + 'px';
    appendEffect(halo, kind === 'success' ? 1050 : 620);

    for (let i = 0; i < count && activeParticles < MAX_PARTICLES; i++) {
      activeParticles++;
      const point = document.createElement('span');
      point.className = 'wedding-touch-spark';
      point.textContent = (kind === 'success' && i % 3 === 0) || (kind === 'hero' && i === 0) ? '♡' : '✦';
      point.style.left = x + 'px';
      point.style.top = y + 'px';
      const angle = (2 * Math.PI * i / count) - Math.PI / 2;
      const radius = span * (.64 + (i % 3) * .18);
      point.style.setProperty('--touch-dx', Math.round(Math.cos(angle) * radius) + 'px');
      point.style.setProperty('--touch-dy', Math.round(Math.sin(angle) * radius) + 'px');
      point.style.setProperty('--touch-delay', (i % 3) * 38 + 'ms');
      layer.appendChild(point);
      window.setTimeout(() => { point.remove(); activeParticles--; }, 970);
    }
  }

  function cleanPress() {
    gesture?.control?.classList.remove('is-touch-pressing');
    gesture = null;
  }

  document.addEventListener('pointerdown', event => {
    if (!isTouch(event) || !event.isPrimary) return;
    cleanPress();
    if (event.target.closest('input, textarea, select, [contenteditable], .photo-lightbox') &&
        !event.target.closest('.photo-lightbox-nav')) return;
    const control = event.target.closest(controlSelector);
    const hero = event.target.closest('#home');
    const eventCard = event.target.closest('.event-day-panel .event-card');
    if (!control && !hero && !eventCard) return;
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY,
      start:performance.now(), control, hero, eventCard};
    if (control) control.classList.add('is-touch-pressing');
  }, {passive:true});

  document.addEventListener('pointercancel', cleanPress, {passive:true});
  document.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId || !isTouch(event)) return;
    const data = gesture;
    cleanPress();
    const travel = Math.hypot(event.clientX - data.x, event.clientY - data.y);
    if (travel > 14 || performance.now() - data.start > 650) return; // A swipe is never a tap.
    if (document.body.classList.contains('invitation-locked')) return;
    if (data.control) {
      const kind = data.control.matches('.home-photo, .album-overlay-photo') ? 'photo' : 'control';
      burst(event.clientX, event.clientY, kind, true);
      if (kind === 'photo') {
        data.control.classList.remove('touch-photo-pressed');
        void data.control.offsetWidth;
        data.control.classList.add('touch-photo-pressed');
        window.setTimeout(() => data.control.classList.remove('touch-photo-pressed'), 420);
      }
    } else if (data.eventCard) {
      burst(event.clientX, event.clientY, 'event', true);
      data.eventCard.classList.add('touch-event-highlight');
      window.setTimeout(() => data.eventCard.classList.remove('touch-event-highlight'), 620);
    } else if (data.hero) {
      burst(event.clientX, event.clientY, 'hero', true);
    }
  }, {passive:true});

  // The existing Gallery owns swipe gestures and navigation. This only decorates
  // the resulting photo change; it does not register another swipe handler.
  document.addEventListener('wedding:gallery-photo-change', event => {
    if (!enabled() || !touchDevice) return;
    const image = document.getElementById('photoLightboxImage');
    if (!image) return;
    image.classList.remove('touch-photo-enter');
    void image.offsetWidth;
    image.classList.add('touch-photo-enter');
    window.setTimeout(() => image.classList.remove('touch-photo-enter'), 400);
  });

  // This event is dispatched only AFTER Supabase confirmed the RSVP submission.
  document.addEventListener('wedding:rsvp-success', () => {
    if (!touchDevice || !enabled()) return;
    const form = document.getElementById('rsvpForm');
    const target = document.getElementById('formStatus') || form;
    if (!target) return;
    const r = target.getBoundingClientRect();
    burst(Math.max(25, Math.min(innerWidth - 25, r.left + r.width / 2)),
      Math.max(45, Math.min(innerHeight - 45, r.top + Math.min(r.height / 2, 46))), 'success', true);
    form?.classList.add('touch-rsvp-celebrate');
    window.setTimeout(() => form?.classList.remove('touch-rsvp-celebrate'), 1000);
  });

  // Keep the custom mouse cursor on desktops. The touch layer never intercepts input.
  window.WeddingTouchEffects = {get active(){return touchDevice && enabled();}};
})();
