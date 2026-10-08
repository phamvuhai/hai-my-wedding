(() => {
  const canvas = document.getElementById('invitationCanvas');
  const intro = document.getElementById('invitationIntro');
  const status = document.getElementById('invitationCanvasStatus');
  if (!canvas || !intro) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const A = window.WeddingInvitationAssets || {};
  const C = window.WeddingInvitationConfig || {};
  const T = C.timeline || {};
  const KEYFRAMES = C.keyframes || {};
  const DURATION = Number(C.duration || 6200);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const images = {};
  const dust = [];
  const petals = [];

  let w = 1;
  let h = 1;
  let dpr = 1;
  let raf = 0;
  let startedAt = 0;
  let active = false;
  let ready = false;
  let destroyed = false;
  let progress = 0;
  let fired = new Set();

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  };
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOutCubic = t => {
    t = clamp(t);
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const range = (p, a, b) => smooth((p - a) / Math.max(.0001, b - a));

  function mulberry32(seed) {
    return function rand() {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(20261219);

  const EVENTS = [
    [T.tap ?? 0, 'invitation:tap', 'Invitation opening started'],
    [T.sealOpen ?? .10, 'invitation:seal-open', 'Wax seal released'],
    [T.flapOpen ?? .20, 'invitation:flap-open', 'Envelope flap opened'],
    [T.cardStart ?? .36, 'invitation:card-start', 'Invitation card rising'],
    [T.cardClear ?? .68, 'invitation:card-clear', 'Invitation card cleared envelope'],
    [T.cardPresented ?? .84, 'invitation:card-presented', 'Invitation card presented'],
    [T.transition ?? .94, 'invitation:transition', 'Transitioning to wedding website'],
    [T.complete ?? 1, 'invitation:complete', 'Invitation opening complete']
  ];

  function data() {
    return {
      groom: 'PHẠM VŨ HẢI',
      bride: 'NGUYỄN THỊ MỸ',
      date: '19 · 12 · 2026',
      script: 'Wedding Invitation',
      ...(window.WeddingInvitationData || {})
    };
  }

  function dispatch(name, p, message = '') {
    document.dispatchEvent(new CustomEvent(name, {
      detail: { progress: p, duration: DURATION }
    }));
    if (status && message) status.textContent = message;
  }

  function fireEvents(p) {
    for (const [at, name, message] of EVENTS) {
      if (p >= at && !fired.has(name)) {
        fired.add(name);
        dispatch(name, p, message);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to load invitation asset: ' + src));
      img.src = src;
    });
  }

  async function preload() {
    const list = [
      ['card', A.card],
      ['envelopeBack', A.envelopeBack],
      ['envelopeFront', A.envelopeFront],
      ['envelopeFlap', A.envelopeFlap],
      ['lining', A.lining],
      ['cord', A.cord],
      ['seal', A.seal],
      ['floralLeft', A.floralLeft],
      ['floralRight', A.floralRight]
    ];

    try {
      await Promise.all(list.map(async ([key, src]) => {
        if (!src) throw new Error('Missing invitation asset: ' + key);
        images[key] = await loadImage(src);
      }));

      images.petals = await Promise.all((A.petals || []).map(loadImage));
      try { await document.fonts?.ready; } catch {}

      ready = true;
      resize();
      seedParticles();
      render(0, 0);
      intro.classList.add('canvas-opening-ready');
      dispatch('invitation:canvas-ready', 0, 'Invitation ready');
      return true;
    } catch (error) {
      console.error('[invitation-canvas]', error);
      intro.classList.add('canvas-opening-error');
      dispatch('invitation:canvas-error', 0, 'Invitation visual could not load');
      return false;
    }
  }

  function rulesForViewport() {
    if (w < 760) return C.layout?.mobile || {};
    if (w < 1100) return C.layout?.tablet || {};
    return C.layout?.desktop || {};
  }

  function layout() {
    const r = rulesForViewport();
    const envelopeVW = Number(r.envelopeVW || .84);
    const maxEnvelope = Number(r.maxEnvelope || 590);
    const envW = Math.min(w * envelopeVW, maxEnvelope);
    const envH = envW * .605;
    const envX = (w - envW) / 2;
    const envY = h * Number(r.anchorY || .50);
    const cardW = envW * Number(r.cardRatio || .68);
    const cardH = cardW * Number(C.card?.aspect || 1.375);

    return {
      envW, envH, envX, envY,
      cardW, cardH,
      mobile: w < 760,
      floralScale: Number(r.floralScale || 1)
    };
  }

  function resize() {
    if (destroyed) return;
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    dpr = Math.min(devicePixelRatio || 1, w < 760 ? 1.5 : 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (ready && !active) render(progress, 0);
  }

  function seedParticles() {
    dust.length = 0;
    petals.length = 0;

    const dustCount = w < 760 ? 38 : 66;
    const petalCount = w < 760 ? 8 : 13;

    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: .05 + rand() * .90,
        y: .04 + rand() * .73,
        r: .45 + rand() * 1.65,
        phase: rand() * TAU,
        drift: .40 + rand() * 1.00,
        alpha: .15 + rand() * .45
      });
    }

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: .03 + rand() * .94,
        y: -.18 + rand() * 1.02,
        size: 15 + rand() * 25,
        speed: .22 + rand() * .35,
        phase: rand() * TAU,
        spin: (rand() - .5) * 1.6,
        alpha: .34 + rand() * .44,
        asset: i % Math.max(1, images.petals?.length || 1)
      });
    }
  }

  function drawImage(img, x, y, ww, hh, alpha = 1) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, ww, hh);
    ctx.restore();
  }

  function drawBackground(p) {
    const base = ctx.createRadialGradient(
      w * .5, h * .34, 20,
      w * .5, h * .43, Math.max(w, h) * .84
    );
    base.addColorStop(0, C.colors?.burgundy || '#4B0E1A');
    base.addColorStop(.45, '#25060D');
    base.addColorStop(1, C.colors?.background || '#100205');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(
      w * .5, h * .46, Math.min(w, h) * .20,
      w * .5, h * .46, Math.max(w, h) * .72
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const floorY = h * .735;
    const floor = ctx.createLinearGradient(0, floorY, 0, h);
    floor.addColorStop(0, 'rgba(255,247,234,.02)');
    floor.addColorStop(.50, 'rgba(247,231,204,.11)');
    floor.addColorStop(1, 'rgba(235,207,173,.24)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, w, h - floorY);

    const floorGlow = ctx.createRadialGradient(
      w * .5, floorY + 28, 0,
      w * .5, floorY + 28, Math.min(w * .60, 480)
    );
    floorGlow.addColorStop(0, 'rgba(255,236,198,.15)');
    floorGlow.addColorStop(1, 'rgba(255,236,198,0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.strokeStyle = 'rgba(156,112,76,.055)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const yy = floorY + ((i + 1) / 9) * (h - floorY);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(w * .32, yy - 2, w * .68, yy + 3, w, yy + 1);
      ctx.stroke();
    }

    const bloom = range(p, T.cardClear ?? .68, T.cardPresented ?? .84);
    if (bloom > 0) {
      const rr = Math.min(w, h) * (.22 + bloom * .12);
      const g = ctx.createRadialGradient(w * .5, h * .40, 0, w * .5, h * .40, rr);
      g.addColorStop(0, 'rgba(245,190,92,' + (.24 * bloom) + ')');
      g.addColorStop(.48, 'rgba(181,81,37,' + (.10 * bloom) + ')');
      g.addColorStop(1, 'rgba(120,40,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(w * .5 - rr, h * .40 - rr, rr * 2, rr * 2);
    }
  }

  function drawBokeh(time) {
    const dots = [
      [.06,.14,42,'126,25,41'], [.16,.07,24,'193,77,67'],
      [.35,.17,18,'190,94,64'], [.81,.12,36,'128,27,43'],
      [.94,.31,22,'221,155,79'], [.11,.55,25,'208,138,65'],
      [.88,.58,38,'116,23,37'], [.25,.71,19,'229,182,105'],
      [.76,.70,22,'187,96,56']
    ];

    for (let i = 0; i < dots.length; i++) {
      const [xx, yy, rr, rgb] = dots[i];
      const pulse = .72 + .14 * Math.sin(time * .001 + i * .9);
      const g = ctx.createRadialGradient(w * xx, h * yy, 0, w * xx, h * yy, rr);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (.10 * pulse) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(w * xx - rr, h * yy - rr, rr * 2, rr * 2);
    }
  }

  function drawDust(p, time) {
    const reveal = .24 + range(p, .08, .42) * .76;

    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      const x = d.x * w + Math.sin(time * .00045 * d.drift + d.phase) * 7;
      const y = d.y * h + Math.cos(time * .00031 + d.phase) * 5;
      const twinkle = .55 + .45 * Math.sin(time * .002 + d.phase);

      ctx.save();
      ctx.globalAlpha = d.alpha * reveal * twinkle;
      ctx.fillStyle = i % 4 ? '#DCAA55' : '#FFE0A1';
      ctx.shadowColor = 'rgba(237,185,86,.62)';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSceneFlorals(L, p) {
    const alpha = .84 + range(p, .20, .52) * .14;
    const leftW = L.envW * .72 * L.floralScale;
    const rightW = L.envW * .57 * L.floralScale;

    drawImage(
      images.floralLeft,
      L.envX - leftW * .48,
      L.envY - leftW * 1.33 * .48,
      leftW, leftW * 1.33,
      alpha
    );

    drawImage(
      images.floralRight,
      L.envX + L.envW - rightW * .40,
      L.envY - rightW * 1.33 * .30,
      rightW, rightW * 1.33,
      alpha * .88
    );
  }

  function drawForegroundFlorals(L, p) {
    const reveal = .40 + range(p, T.cardClear ?? .68, T.cardPresented ?? .84) * .42;
    const leftW = L.envW * (L.mobile ? .24 : .29);
    const rightW = L.envW * (L.mobile ? .20 : .24);

    ctx.save();
    ctx.filter = 'blur(.3px)';

    drawImage(
      images.floralLeft,
      L.envX - leftW * .34,
      L.envY + L.envH * .50,
      leftW, leftW * 1.33,
      reveal * .56
    );

    drawImage(
      images.floralRight,
      L.envX + L.envW - rightW * .64,
      L.envY + L.envH * .58,
      rightW, rightW * 1.33,
      reveal * .48
    );

    ctx.restore();
  }

  function drawEnvelopeBack(L) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.43)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 18;
    ctx.drawImage(images.envelopeBack, L.envX, L.envY, L.envW, L.envH);
    ctx.restore();
  }

  function drawFlap(L, p) {
    const flapH = L.envW * .42;

    if (p < .5) {
      const t = easeInOutCubic(p / .5);
      const hh = Math.max(2, flapH * (1 - t));

      ctx.save();
      ctx.translate(L.envX, L.envY);
      ctx.globalAlpha = 1 - t * .03;
      ctx.drawImage(images.envelopeFlap, 0, 0, L.envW, hh);
      ctx.restore();
      return;
    }

    const t = easeOutCubic((p - .5) / .5);
    const hh = Math.max(2, flapH * t);

    ctx.save();
    ctx.translate(L.envX, L.envY);
    ctx.scale(1, -1);
    ctx.shadowColor = 'rgba(0,0,0,.16)';
    ctx.shadowBlur = 11;
    ctx.drawImage(images.lining, 0, 0, L.envW, hh);
    ctx.restore();
  }

  function drawCordAndSeal(L, sealP, cordP) {
    const c = easeOutCubic(cordP);

    ctx.save();
    ctx.globalAlpha = 1 - c * .58;
    ctx.translate(c * L.envW * .030, c * L.envH * .082);
    ctx.rotate(c * .030);
    ctx.drawImage(images.cord, L.envX, L.envY, L.envW, L.envH);
    ctx.restore();

    const s = easeOutCubic(sealP);
    const size = L.envW * .142;
    const bx = L.envX + L.envW * .5 - size * .5;
    const by = L.envY + L.envH * .55 - size * .5;
    const x = bx + s * L.envW * .20;
    const y = by + s * L.envH * .19;
    const scale = mix(1, .82, s);

    ctx.save();
    ctx.translate(x + size * .5, y + size * .5);
    ctx.rotate(s * .14);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 1 - s * .24;
    ctx.drawImage(images.seal, -size * .5, -size * .5, size, size);
    ctx.restore();
  }

  function drawSealSpark(L, p) {
    const q = range(p, .095, .255);
    if (q <= 0 || q >= 1) return;

    const cx = L.envX + L.envW * .5;
    const cy = L.envY + L.envH * .55;
    const fade = Math.sin(q * Math.PI);

    for (let i = 0; i < 18; i++) {
      const a = i * 2.399 + .4;
      const rr = (18 + (i % 7) * 8) * easeOutCubic(q);

      ctx.save();
      ctx.globalAlpha = fade * (.16 + (i % 4) * .06);
      ctx.fillStyle = i % 3 ? '#E5B761' : '#FFE0A1';
      ctx.shadowColor = 'rgba(237,185,86,.68)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * rr,
        cy + Math.sin(a) * rr * .58,
        i % 5 === 0 ? 1.7 : 1,
        0, TAU
      );
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFrontPocket(L) {
    ctx.drawImage(images.envelopeFront, L.envX, L.envY, L.envW, L.envH);
  }

  function drawCardText(cardW, cardH) {
    const d = data();
    const t = C.typography || {};
    const cx = cardW * .5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#7A2230';
    ctx.font = `${Math.max(33, cardW * .132)}px "Great Vibes","Cormorant Garamond",Georgia,serif`;
    ctx.fillText('H & M', cx, cardH * (t.monogramY || .22));

    ctx.fillStyle = '#69202A';
    ctx.font = `500 ${Math.max(13, cardW * .055)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.groom, cx, cardH * (t.groomY || .40));

    ctx.font = `500 ${Math.max(12, cardW * .049)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText('&', cx, cardH * (t.ampY || .465));

    ctx.font = `500 ${Math.max(13, cardW * .055)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.bride, cx, cardH * (t.brideY || .53));

    const oy = cardH * (t.ornamentY || .595);
    ctx.strokeStyle = '#B47D3F';
    ctx.lineWidth = Math.max(.8, cardW * .002);
    ctx.beginPath();
    ctx.moveTo(cardW * .39, oy);
    ctx.lineTo(cardW * .47, oy);
    ctx.moveTo(cardW * .53, oy);
    ctx.lineTo(cardW * .61, oy);
    ctx.stroke();

    ctx.fillStyle = '#B47D3F';
    ctx.font = `${Math.max(11, cardW * .035)}px Georgia,serif`;
    ctx.fillText('❦', cx, oy + cardW * .012);

    ctx.fillStyle = '#7D4C34';
    ctx.font = `500 ${Math.max(11, cardW * .039)}px "Lora",Georgia,serif`;
    ctx.fillText(d.date, cx, cardH * (t.dateY || .665));

    ctx.fillStyle = '#8B5D43';
    ctx.font = `${Math.max(18, cardW * .069)}px "Great Vibes","Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.script, cx, cardH * (t.scriptY || .80));
  }

  function cardGeometry(L, cardP) {
    const startX = L.envX + (L.envW - L.cardW) / 2;
    const startY = L.envY + L.envH * .13;
    const finalX = (w - L.cardW) / 2;

    const minTop = L.mobile
      ? Math.max(84, h * Number(C.card?.topMobile || .10))
      : Math.max(74, h * Number(C.card?.topDesktop || .09));

    const intended = L.envY - L.cardH * Number(C.card?.riseEnvelopeRatio || .61);
    const finalY = Math.max(minTop, intended);
    const rise = easeInOutCubic(cardP);

    return {
      x: mix(startX, finalX, rise),
      y: mix(startY, finalY, rise),
      scale: mix(C.card?.startScale || .955, C.card?.finalScale || 1, rise),
      rotation: mix(C.card?.startRotation || -.004, C.card?.finalRotation || 0, rise),
      rise
    };
  }

  function drawCard(L, cardP, p) {
    const g = cardGeometry(L, cardP);

    ctx.save();
    ctx.translate(g.x + L.cardW * .5, g.y + L.cardH * .5);
    ctx.rotate(g.rotation);
    ctx.scale(g.scale, g.scale);
    ctx.translate(-L.cardW * .5, -L.cardH * .5);

    ctx.shadowColor = 'rgba(0,0,0,' + mix(.10, .29, g.rise) + ')';
    ctx.shadowBlur = mix(6, 27, g.rise);
    ctx.shadowOffsetY = mix(3, 13, g.rise);

    ctx.drawImage(images.card, 0, 0, L.cardW, L.cardH);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawCardText(L.cardW, L.cardH);

    if (p > (T.cardPresented ?? .84) - .02) {
      const shine = range(p, (T.cardPresented ?? .84) - .02, T.transition ?? .94);
      const sweepX = mix(-L.cardW * .35, L.cardW * .92, shine);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const sg = ctx.createLinearGradient(
        sweepX, 0,
        sweepX + L.cardW * .28, L.cardH
      );
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(.5, 'rgba(255,236,191,.18)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, L.cardW, L.cardH);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawPetals(p, time) {
    if (!images.petals?.length || p < .18) return;

    const reveal = range(p, .18, .42);

    for (let i = 0; i < petals.length; i++) {
      const pt = petals[i];
      const tt = ((time * .000028 * pt.speed) + pt.y + i * .069) % 1.22;
      const x = pt.x * w + Math.sin(time * .00056 + pt.phase) * 24;
      const y = tt * h;
      const size = pt.size;
      const img = images.petals[pt.asset % images.petals.length];

      ctx.save();
      ctx.globalAlpha = pt.alpha * reveal;
      ctx.translate(x, y);
      ctx.rotate(time * .00025 * pt.spin + pt.phase);
      ctx.drawImage(img, -size, -size * .55, size * 2, size * 1.1);
      ctx.restore();
    }
  }

  function render(p, time = performance.now()) {
    if (!ready || destroyed) return;

    progress = clamp(p);
    ctx.clearRect(0, 0, w, h);

    const L = layout();

    const sealP = range(progress, T.sealOpen ?? .10, .26);
    const cordP = range(progress, T.cordLoose ?? .16, .33);
    const flapP = range(progress, T.flapOpen ?? .20, T.flapOpenDone ?? .38);
    const cardP = range(progress, T.cardStart ?? .36, T.cardPresented ?? .84);
    const cardClear = progress >= (T.cardClear ?? .68);

    drawBackground(progress);
    drawBokeh(time);
    drawDust(progress, time);
    drawSceneFlorals(L, progress);

    drawEnvelopeBack(L);
    drawFlap(L, flapP);
    drawSealSpark(L, progress);

    if (!cardClear && progress >= (T.cardStart ?? .36)) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.envX, 0, L.envW, L.envY + L.envH + 2);
      ctx.clip();
      drawCard(L, cardP, progress);
      ctx.restore();
    }

    drawFrontPocket(L);
    drawCordAndSeal(L, sealP, cordP);

    if (cardClear) {
      drawCard(L, cardP, progress);
    }

    drawForegroundFlorals(L, progress);
    drawPetals(progress, time);

    const out = range(progress, T.transition ?? .94, 1);
    if (out > 0) {
      ctx.fillStyle = 'rgba(13,1,4,' + (out * .72) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function frame(now) {
    if (!active || destroyed) return;

    const p = clamp((now - startedAt) / DURATION);
    fireEvents(p);
    render(p, now - startedAt);

    if (p < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      active = false;
    }
  }

  function play() {
    if (REDUCED || active || !ready || destroyed) return false;

    active = true;
    progress = 0;
    fired = new Set();
    startedAt = performance.now();
    fireEvents(0);
    raf = requestAnimationFrame(frame);
    return true;
  }

  function stop() {
    active = false;
    cancelAnimationFrame(raf);
  }

  function destroy() {
    stop();
    destroyed = true;
    removeEventListener('resize', resize);
    ctx.clearRect(0, 0, w, h);
  }

  function renderAt(p) {
    if (!ready || destroyed) return false;
    stop();
    render(clamp(p), 0);
    return true;
  }

  function renderKeyframe(stage) {
    const value = KEYFRAMES[String(stage).padStart(2, '0')];
    if (typeof value !== 'number') return false;
    return renderAt(value);
  }

  addEventListener('resize', resize, { passive: true });

  document.addEventListener('invitation:data', () => {
    if (ready && !active) render(progress, 0);
  });

  document.addEventListener('wedding:language', () => {
    if (ready && !active) render(progress, 0);
  });

  const readyPromise = preload();

  window.WeddingInvitationCanvas = {
    play,
    stop,
    destroy,
    render: renderAt,
    renderAt,
    renderKeyframe,
    readyPromise,
    get ready() { return ready; },
    get duration() { return DURATION; },
    get progress() { return progress; }
  };
})();
