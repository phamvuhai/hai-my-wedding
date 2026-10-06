(() => {
  const canvas = document.getElementById('invitationCanvas');
  const intro = document.getElementById('invitationIntro');
  if (!canvas || !intro) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const assetsManifest = window.WeddingInvitationAssets || {};
  const config = window.WeddingInvitationConfig || {};
  const timeline = config.timeline || {};
  const DURATION = Number(config.duration || 6200);
  const TAU = Math.PI * 2;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const EVENTS = [
    [timeline.tap ?? 0.00, 'invitation:tap'],
    [timeline.sealOpen ?? 0.10, 'invitation:seal-open'],
    [timeline.flapOpen ?? 0.20, 'invitation:flap-open'],
    [timeline.cardStart ?? 0.36, 'invitation:card-start'],
    [timeline.cardClear ?? 0.68, 'invitation:card-clear'],
    [timeline.cardPresented ?? 0.84, 'invitation:card-presented'],
    [timeline.transition ?? 0.94, 'invitation:transition'],
    [timeline.complete ?? 1.00, 'invitation:complete']
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let startedAt = 0;
  let active = false;
  let progress = 0;
  let fired = new Set();
  let ready = false;
  let destroyed = false;

  const images = {};
  const dust = [];
  const petals = [];

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  };
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const range = (p, a, b) => smooth((p - a) / (b - a));

  function invitationData() {
    return {
      groom: 'PHẠM VŨ HẢI',
      bride: 'NGUYỄN THỊ MỸ',
      date: '19 · 12 · 2026',
      script: 'Wedding Invitation',
      ...(window.WeddingInvitationData || {})
    };
  }

  function emit(name, p) {
    document.dispatchEvent(new CustomEvent(name, {
      detail: { progress: p, duration: DURATION }
    }));
  }

  function fireEvents(p) {
    EVENTS.forEach(([at, name]) => {
      if (p >= at && !fired.has(name)) {
        fired.add(name);
        emit(name, p);
      }
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('Missing invitation asset path'));
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function preload() {
    const entries = [
      ['card', assetsManifest.card],
      ['envelopeBack', assetsManifest.envelopeBack],
      ['envelopeFront', assetsManifest.envelopeFront],
      ['envelopeFlap', assetsManifest.envelopeFlap],
      ['lining', assetsManifest.lining],
      ['cord', assetsManifest.cord],
      ['seal', assetsManifest.seal],
      ['floralLeft', assetsManifest.floralLeft],
      ['floralRight', assetsManifest.floralRight]
    ];

    const petalPaths = Array.isArray(assetsManifest.petals) ? assetsManifest.petals : [];

    try {
      await Promise.all(entries.map(async ([key, src]) => {
        images[key] = await loadImage(src);
      }));
      images.petals = await Promise.all(petalPaths.map(loadImage));
      try { await document.fonts?.ready; } catch {}
      ready = true;
      seedParticles();
      resize();
      render(0);
      intro.classList.add('canvas-opening-ready');
      document.dispatchEvent(new CustomEvent('invitation:canvas-ready'));
      return true;
    } catch (error) {
      console.error('Invitation canvas assets failed to preload:', error);
      ready = false;
      document.dispatchEvent(new CustomEvent('invitation:canvas-error'));
      return false;
    }
  }

  function resize() {
    if (destroyed) return;
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ready && !active) render(progress);
  }

  function seedParticles() {
    dust.length = 0;
    petals.length = 0;

    const dustCount = w < 760 ? 36 : 64;
    const petalCount = w < 760 ? 7 : 12;

    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: .08 + Math.random() * .84,
        y: .09 + Math.random() * .72,
        r: .45 + Math.random() * 1.8,
        phase: Math.random() * TAU,
        drift: .5 + Math.random() * 1.1,
        alpha: .18 + Math.random() * .48
      });
    }

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: .03 + Math.random() * .94,
        y: -.18 + Math.random() * 1.06,
        size: 16 + Math.random() * 26,
        speed: .22 + Math.random() * .42,
        phase: Math.random() * TAU,
        spin: (Math.random() - .5) * 1.7,
        asset: i % Math.max(1, images.petals?.length || 1),
        alpha: .38 + Math.random() * .46
      });
    }
  }

  function drawImageFit(img, x, y, width, height, alpha = 1) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  }

  function drawBackground(p) {
    const g = ctx.createRadialGradient(w * .5, h * .37, 20, w * .5, h * .45, Math.max(w, h) * .82);
    g.addColorStop(0, '#4b0e1a');
    g.addColorStop(.42, '#25060d');
    g.addColorStop(1, '#0d0104');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const floorY = h * .76;
    const floor = ctx.createLinearGradient(0, floorY, 0, h);
    floor.addColorStop(0, 'rgba(255,245,226,.025)');
    floor.addColorStop(1, 'rgba(237,211,174,.16)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.strokeStyle = 'rgba(233,204,164,.055)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const yy = floorY + (i / 7) * (h - floorY);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(w, yy + 3);
      ctx.stroke();
    }

    const bokeh = [
      [.08,.17,34,'126,28,43'], [.18,.08,20,'192,80,70'],
      [.84,.14,28,'132,31,45'], [.92,.31,18,'221,155,79'],
      [.12,.55,22,'208,138,65'], [.88,.58,35,'116,23,37'],
      [.24,.71,16,'229,182,105'], [.76,.70,19,'187,96,56']
    ];
    bokeh.forEach((b, i) => {
      const pulse = .72 + .16 * Math.sin(performance.now() * .001 + i);
      const rg = ctx.createRadialGradient(w*b[0], h*b[1], 0, w*b[0], h*b[1], b[2]);
      rg.addColorStop(0, 'rgba(' + b[3] + ',' + (.11 * pulse) + ')');
      rg.addColorStop(1, 'rgba(' + b[3] + ',0)');
      ctx.fillStyle = rg;
      ctx.fillRect(w*b[0]-b[2], h*b[1]-b[2], b[2]*2, b[2]*2);
    });

    const bloom = range(p, .78, .93);
    if (bloom > 0) {
      const r = Math.min(w, h) * (.21 + .11 * bloom);
      const lg = ctx.createRadialGradient(w*.5, h*.41, 0, w*.5, h*.41, r);
      lg.addColorStop(0, 'rgba(250,204,117,' + (.26*bloom) + ')');
      lg.addColorStop(.45, 'rgba(211,132,58,' + (.11*bloom) + ')');
      lg.addColorStop(1, 'rgba(120,45,25,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(w*.5-r, h*.41-r, r*2, r*2);
    }
  }

  function layout() {
    const mobile = w < 760;
    const tablet = !mobile && w < 1100;
    const rules = mobile ? config.layout?.mobile : tablet ? config.layout?.tablet : config.layout?.desktop;
    const vw = Number(rules?.envelopeVW || (mobile ? .84 : tablet ? .62 : .43));
    const maxEnvelope = Number(rules?.maxEnvelope || (mobile ? 430 : tablet ? 560 : 590));
    const cardRatio = Number(rules?.cardRatio || .67);

    const envW = Math.min(w * vw, maxEnvelope);
    const envH = envW * .605;
    const envX = (w - envW) / 2;
    const envY = h * (mobile ? .49 : .50);
    const cardW = envW * cardRatio;
    const cardH = cardW * 1.375;

    return { mobile, tablet, envW, envH, envX, envY, cardW, cardH };
  }

  function drawSceneFlorals(L, p) {
    const alpha = .76 + range(p, .20, .52) * .22;
    const leftW = L.envW * (L.mobile ? .56 : .60);
    const leftH = leftW * 1.33;
    const rightW = L.envW * (L.mobile ? .46 : .50);
    const rightH = rightW * 1.33;

    drawImageFit(
      images.floralLeft,
      L.envX - leftW * .50,
      L.envY - leftH * .45,
      leftW,
      leftH,
      alpha
    );
    drawImageFit(
      images.floralRight,
      L.envX + L.envW - rightW * .38,
      L.envY - rightH * .25,
      rightW,
      rightH,
      alpha * .82
    );
  }

  function drawDust(p, time) {
    const reveal = .30 + range(p, .08, .42) * .70;
    dust.forEach((d, i) => {
      const x = d.x * w + Math.sin(time * .00045 * d.drift + d.phase) * 7;
      const y = d.y * h + Math.cos(time * .00031 + d.phase) * 5;
      const twinkle = .55 + .45 * Math.sin(time * .002 + d.phase);
      ctx.save();
      ctx.globalAlpha = d.alpha * reveal * twinkle;
      ctx.fillStyle = i % 4 ? '#dca955' : '#ffe0a1';
      ctx.shadowColor = 'rgba(237,185,86,.64)';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPetals(p, time) {
    if (!images.petals?.length || p < .18) return;
    const reveal = range(p, .18, .42);
    petals.forEach((petal, i) => {
      const t = ((time * .000028 * petal.speed) + petal.y + i * .069) % 1.22;
      const x = petal.x * w + Math.sin(time * .00056 + petal.phase) * 24;
      const y = t * h;
      const size = petal.size;
      const img = images.petals[petal.asset % images.petals.length];
      ctx.save();
      ctx.globalAlpha = petal.alpha * reveal;
      ctx.translate(x, y);
      ctx.rotate(time * .00025 * petal.spin + petal.phase);
      ctx.drawImage(img, -size, -size * .55, size * 2, size * 1.1);
      ctx.restore();
    });
  }

  function drawEnvelopeBack(L) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.40)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 18;
    ctx.drawImage(images.envelopeBack, L.envX, L.envY, L.envW, L.envH);
    ctx.restore();
  }

  function drawFlap(L, flapP) {
    const flapH = L.envW * .42;
    if (flapP < .5) {
      const t = easeOut(flapP / .5);
      const hScale = Math.max(.02, 1 - t);
      const drawH = flapH * hScale;
      ctx.save();
      ctx.globalAlpha = 1 - t * .05;
      ctx.drawImage(images.envelopeFlap, L.envX, L.envY, L.envW, drawH);
      ctx.restore();
      return;
    }

    const t = easeOut((flapP - .5) / .5);
    const drawH = flapH * t;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.18)';
    ctx.shadowBlur = 10;
    ctx.drawImage(images.lining, L.envX, L.envY, L.envW, -drawH);
    ctx.restore();
  }

  function drawCordAndSeal(L, sealP) {
    const release = easeOut(sealP);

    ctx.save();
    ctx.globalAlpha = 1 - release * .40;
    ctx.translate(release * L.envW * .035, release * L.envH * .085);
    ctx.rotate(release * .035);
    ctx.drawImage(images.cord, L.envX, L.envY, L.envW, L.envH);
    ctx.restore();

    const sealSize = L.envW * .145;
    const baseX = L.envX + L.envW * .5 - sealSize * .5;
    const baseY = L.envY + L.envH * .55 - sealSize * .5;
    const x = baseX + release * L.envW * .19;
    const y = baseY + release * L.envH * .18;
    const scale = mix(1, .80, release);

    ctx.save();
    ctx.translate(x + sealSize*.5, y + sealSize*.5);
    ctx.rotate(release * .14);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 1 - release * .20;
    ctx.drawImage(images.seal, -sealSize*.5, -sealSize*.5, sealSize, sealSize);
    ctx.restore();
  }

  function drawFrontPocket(L) {
    ctx.drawImage(images.envelopeFront, L.envX, L.envY, L.envW, L.envH);
  }

  function drawCardTypography(cardW, cardH) {
    const d = invitationData();
    const t = config.typography || {};
    const center = cardW * .5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#7a2230';
    ctx.font = `italic ${Math.max(30, cardW * .125)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText('H & M', center, cardH * (t.monogramY || .22));

    if (d.guestName) {
      ctx.fillStyle = '#9a6a43';
      ctx.font = `500 ${Math.max(10, cardW * .032)}px "Lora", Georgia, serif`;
      const guest = String(d.guestName).length > 34 ? String(d.guestName).slice(0, 32) + '…' : String(d.guestName);
      ctx.fillText(guest, center, cardH * .31);
    }

    ctx.fillStyle = '#69202a';
    ctx.font = `600 ${Math.max(13, cardW * .057)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(d.groom || 'PHẠM VŨ HẢI', center, cardH * (t.groomY || .40));

    ctx.font = `500 ${Math.max(12, cardW * .049)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText('&', center, cardH * (t.ampY || .465));

    ctx.font = `600 ${Math.max(13, cardW * .057)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(d.bride || 'NGUYỄN THỊ MỸ', center, cardH * (t.brideY || .53));

    const ornamentY = cardH * (t.ornamentY || .595);
    ctx.strokeStyle = '#b47d3f';
    ctx.lineWidth = Math.max(.8, cardW * .002);
    ctx.beginPath();
    ctx.moveTo(cardW * .39, ornamentY);
    ctx.lineTo(cardW * .47, ornamentY);
    ctx.moveTo(cardW * .53, ornamentY);
    ctx.lineTo(cardW * .61, ornamentY);
    ctx.stroke();

    ctx.fillStyle = '#b47d3f';
    ctx.font = `${Math.max(11, cardW * .035)}px Georgia, serif`;
    ctx.fillText('❦', center, ornamentY + cardW * .012);

    ctx.fillStyle = '#7d4c34';
    ctx.font = `500 ${Math.max(11, cardW * .039)}px "Lora", Georgia, serif`;
    ctx.fillText(d.date || '19 · 12 · 2026', center, cardH * (t.dateY || .665));

    ctx.fillStyle = '#8b5d43';
    ctx.font = `italic ${Math.max(15, cardW * .060)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(d.script || 'Wedding Invitation', center, cardH * (t.scriptY || .80));
  }

  function drawCard(L, cardP, p) {
    const startX = L.envX + (L.envW - L.cardW) / 2;
    const startY = L.envY + L.envH * .13;
    const finalX = (w - L.cardW) / 2;
    const topSafe = L.mobile ? Math.max(88, h * .105) : Math.max(78, h * .095);
    const finalY = Math.min(
      topSafe,
      L.envY - L.cardH * .60
    );

    const rise = easeOut(cardP);
    const x = mix(startX, finalX, rise);
    const y = mix(startY, finalY, rise);
    const scale = mix(.95, 1, rise);
    const rotation = mix(.003, 0, rise);

    ctx.save();
    ctx.translate(x + L.cardW*.5, y + L.cardH*.5);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.translate(-L.cardW*.5, -L.cardH*.5);

    ctx.shadowColor = 'rgba(0,0,0,' + mix(.10, .30, rise) + ')';
    ctx.shadowBlur = mix(6, 28, rise);
    ctx.shadowOffsetY = mix(3, 14, rise);
    ctx.drawImage(images.card, 0, 0, L.cardW, L.cardH);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawCardTypography(L.cardW, L.cardH);

    if (p > .82) {
      const shine = range(p, .82, .94);
      const sweepX = mix(-L.cardW*.35, L.cardW*.92, shine);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sg = ctx.createLinearGradient(sweepX, 0, sweepX + L.cardW*.28, L.cardH);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(.5, 'rgba(255,236,191,.18)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, L.cardW, L.cardH);
      ctx.restore();
    }

    ctx.restore();
  }

  function render(p, time = performance.now()) {
    if (!ready || destroyed) return;

    progress = clamp(p);
    ctx.clearRect(0, 0, w, h);

    drawBackground(progress);
    const L = layout();

    const sealP = range(progress, timeline.sealOpen ?? .10, .24);
    const flapP = range(progress, timeline.flapOpen ?? .20, .44);
    const cardP = range(progress, timeline.cardStart ?? .36, timeline.cardPresented ?? .84);
    const cardClear = progress >= (timeline.cardClear ?? .68);

    drawDust(progress, time);
    drawSceneFlorals(L, progress);
    drawEnvelopeBack(L);
    drawFlap(L, flapP);

    if (!cardClear) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.envX, 0, L.envW, L.envY + L.envH + 2);
      ctx.clip();
      drawCard(L, cardP, progress);
      ctx.restore();
    }

    drawFrontPocket(L);
    drawCordAndSeal(L, sealP);

    if (cardClear) {
      drawCard(L, cardP, progress);
    }

    drawPetals(progress, time);

    const transitionP = range(progress, timeline.transition ?? .94, 1);
    if (transitionP > 0) {
      ctx.fillStyle = 'rgba(13,1,4,' + (transitionP * .72) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function frame(now) {
    if (!active || destroyed) return;
    const elapsed = now - startedAt;
    const p = clamp(elapsed / DURATION);
    fireEvents(p);
    render(p, elapsed);

    if (p < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      active = false;
    }
  }

  function play() {
    if (reduceMotion || active || !ready || destroyed) return false;
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
    ctx.clearRect(0, 0, w, h);
  }

  function destroy() {
    stop();
    destroyed = true;
    removeEventListener('resize', resize);
  }

  addEventListener('resize', resize, { passive: true });
  document.addEventListener('invitation:data', () => {
    if (ready && !active) render(progress);
  });
  document.addEventListener('wedding:language', () => {
    if (ready && !active) render(progress);
  });

  const readyPromise = preload();

  window.WeddingInvitationCanvas = {
    play,
    stop,
    destroy,
    render,
    readyPromise,
    get ready() { return ready; },
    get duration() { return DURATION; }
  };
})();