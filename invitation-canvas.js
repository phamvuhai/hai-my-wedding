(() => {
  const canvas = document.getElementById('invitationCanvas');
  const intro = document.getElementById('invitationIntro');
  if (!canvas || !intro) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const DURATION = 6200;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EVENTS = [
    [0.00, 'invitation:tap'],
    [0.10, 'invitation:seal-open'],
    [0.20, 'invitation:flap-open'],
    [0.36, 'invitation:card-start'],
    [0.68, 'invitation:card-clear'],
    [0.84, 'invitation:card-presented'],
    [0.94, 'invitation:transition'],
    [1.00, 'invitation:complete']
  ];

  let w = 0, h = 0, dpr = 1, raf = 0, startedAt = 0;
  let active = false, progress = 0, fired = new Set();
  let dust = [], petals = [];

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t), 3);
  const smooth = t => {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  };
  const range = (p, a, b) => smooth((p - a) / (b - a));

  function emit(name, p) {
    document.dispatchEvent(new CustomEvent(name, { detail: { progress: p, duration: DURATION } }));
  }

  function fireEvents(p) {
    EVENTS.forEach(([at, name]) => {
      if (p >= at && !fired.has(name)) {
        fired.add(name);
        emit(name, p);
      }
    });
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!active) render(progress);
  }

  function seededParticles() {
    dust = [];
    petals = [];
    const dustCount = innerWidth < 760 ? 34 : 58;
    const petalCount = innerWidth < 760 ? 8 : 13;
    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: .08 + Math.random() * .84,
        y: .12 + Math.random() * .75,
        size: .45 + Math.random() * 1.65,
        phase: Math.random() * TAU,
        drift: .3 + Math.random() * .8,
        alpha: .18 + Math.random() * .5
      });
    }
    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: .03 + Math.random() * .94,
        y: -.12 + Math.random() * 1.1,
        size: 7 + Math.random() * 10,
        phase: Math.random() * TAU,
        speed: .2 + Math.random() * .42,
        spin: (Math.random() - .5) * 2,
        alpha: .36 + Math.random() * .46
      });
    }
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawBackground(p) {
    const g = ctx.createRadialGradient(w * .5, h * .43, 20, w * .5, h * .45, Math.max(w, h) * .78);
    g.addColorStop(0, '#4b0e1a');
    g.addColorStop(.43, '#25060d');
    g.addColorStop(1, '#100205');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const bloom = range(p, .72, .93);
    if (bloom > 0) {
      const r = Math.min(w, h) * (.20 + bloom * .13);
      const lg = ctx.createRadialGradient(w * .5, h * .43, 0, w * .5, h * .43, r);
      lg.addColorStop(0, 'rgba(244,191,102,' + (.21 * bloom) + ')');
      lg.addColorStop(.45, 'rgba(194,111,48,' + (.09 * bloom) + ')');
      lg.addColorStop(1, 'rgba(90,24,23,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(w * .5 - r, h * .43 - r, r * 2, r * 2);
    }

    const floorY = h * .78;
    const floor = ctx.createLinearGradient(0, floorY, 0, h);
    floor.addColorStop(0, 'rgba(255,245,226,.03)');
    floor.addColorStop(1, 'rgba(233,207,173,.13)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.strokeStyle = 'rgba(236,204,158,.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = floorY + (i / 6) * (h - floorY);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 4); ctx.stroke();
    }
  }

  function drawLeaf(x, y, angle, scale, color = '#b88645') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8, -5, 15, -4, 19, 1);
    ctx.bezierCurveTo(12, 5, 5, 6, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawRose(x, y, r, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 9; i++) {
      ctx.rotate(.72);
      const rg = ctx.createRadialGradient(r * .15, 0, 0, r * .3, 0, r);
      rg.addColorStop(0, '#b34550');
      rg.addColorStop(.55, '#7f1c2b');
      rg.addColorStop(1, '#3f0811');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(r * .36, 0, r * .72, r * .31, .25, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#4b0711';
    ctx.beginPath(); ctx.arc(0, 0, r * .28, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawBotanicalCluster(x, y, s, mirror = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(mirror * s, s);

    ctx.strokeStyle = '#9d6a36';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(20, 52, 35, 33, 61, 0);
    ctx.stroke();

    [[10,62,-2.45],[18,51,.25],[28,39,-2.35],[38,27,.38],[48,14,-2.25],[55,5,.45]].forEach(v => {
      drawLeaf(v[0], v[1], v[2], .72, '#b78b4d');
    });
    drawRose(7, 61, 15, 1);
    drawRose(30, 36, 10, .94);
    drawRose(51, 11, 8, .88);
    ctx.restore();
  }

  function drawAmbient(p, time) {
    const ambient = .38 + range(p, .1, .35) * .62;

    dust.forEach((d, i) => {
      const x = d.x * w + Math.sin(time * .00045 * d.drift + d.phase) * 8;
      const y = d.y * h + Math.cos(time * .00028 + d.phase) * 5;
      const twinkle = .45 + .55 * Math.sin(time * .002 + d.phase);
      ctx.globalAlpha = d.alpha * ambient * (.55 + twinkle * .45);
      ctx.fillStyle = i % 4 ? '#e1b05b' : '#ffe1a0';
      ctx.shadowColor = 'rgba(230,178,85,.7)';
      ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(x, y, d.size, 0, TAU); ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (p > .18) {
      petals.forEach((petal, i) => {
        const t = ((time * .000025 * petal.speed) + petal.y + i * .071) % 1.22;
        const x = petal.x * w + Math.sin(time * .00055 + petal.phase) * 24;
        const y = t * h;
        drawPetal(x, y, petal.size, time * .0003 * petal.spin + petal.phase, petal.alpha * range(p, .18, .42));
      });
    }
  }

  function drawPetal(x, y, size, rot, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(-size, 0, size, 0);
    g.addColorStop(0, '#5c0c19');
    g.addColorStop(.52, '#a52f3e');
    g.addColorStop(1, '#66101d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.bezierCurveTo(-size * .35, -size * .72, size * .72, -size * .52, size, 0);
    ctx.bezierCurveTo(size * .28, size * .82, -size * .55, size * .64, -size, 0);
    ctx.fill();
    ctx.restore();
  }

  function sceneLayout() {
    const mobile = w < 760;
    const envW = Math.min(w * (mobile ? .84 : .43), mobile ? 430 : 580);
    const envH = envW * .58;
    const x = (w - envW) / 2;
    const y = h * (mobile ? .49 : .50);
    const cardW = envW * (mobile ? .70 : .66);
    const cardH = cardW * 1.32;
    return { mobile, envW, envH, x, y, cardW, cardH };
  }

  function drawEnvelopeBack(L, flapP) {
    const { x, y, envW, envH } = L;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 18;
    const g = ctx.createLinearGradient(x, y, x + envW, y + envH);
    g.addColorStop(0, '#7c1d2b');
    g.addColorStop(.5, '#61131f');
    g.addColorStop(1, '#430a13');
    ctx.fillStyle = g;
    roundRect(x, y, envW, envH, 5);
    ctx.fill();
    ctx.restore();

    if (flapP > .02) {
      const apexY = mix(y + envH * .56, y - envH * .53, ease(flapP));
      const lining = ctx.createLinearGradient(x, apexY, x, y + 4);
      lining.addColorStop(0, '#f9ecd6');
      lining.addColorStop(1, '#ead1ae');
      ctx.fillStyle = lining;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 3);
      ctx.lineTo(x + envW - 5, y + 3);
      ctx.lineTo(x + envW * .5, apexY);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = .13;
      ctx.strokeStyle = '#9c6b3b';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const yy = mix(apexY + 20, y - 2, i / 7);
        ctx.beginPath();
        ctx.moveTo(x + envW * .23, yy);
        ctx.quadraticCurveTo(x + envW * .5, yy - 18, x + envW * .77, yy);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#bd8a47';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawFlapClosed(L, flapP) {
    if (flapP >= .98) return;
    const { x, y, envW, envH } = L;
    const alpha = 1 - range(flapP, .75, 1);
    const apexY = mix(y + envH * .57, y + envH * .08, ease(flapP));
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x, y, x + envW, apexY);
    g.addColorStop(0, '#8f2c3a');
    g.addColorStop(.52, '#6c1724');
    g.addColorStop(1, '#4a0a14');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + envW - 2, y + 2);
    ctx.lineTo(x + envW * .5, apexY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c49450';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawFrontPocket(L) {
    const { x, y, envW, envH } = L;
    const g = ctx.createLinearGradient(x, y, x + envW, y + envH);
    g.addColorStop(0, '#771827');
    g.addColorStop(.5, '#60101d');
    g.addColorStop(1, '#3f0812');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + envW * .5, y + envH * .58);
    ctx.lineTo(x + envW - 2, y + 2);
    ctx.lineTo(x + envW - 2, y + envH - 2);
    ctx.lineTo(x + 2, y + envH - 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(209,157,78,.85)';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + envW * .5, y + envH * .58);
    ctx.lineTo(x + envW - 2, y + 2);
    ctx.stroke();

    const shine = ctx.createLinearGradient(x, y, x + envW, y);
    shine.addColorStop(0, 'rgba(255,220,160,.03)');
    shine.addColorStop(.5, 'rgba(255,220,160,.11)');
    shine.addColorStop(1, 'rgba(255,220,160,.02)');
    ctx.fillStyle = shine;
    ctx.fillRect(x + 3, y + envH * .76, envW - 6, 1.5);
  }

  function drawCordAndSeal(L, sealP) {
    const { x, y, envW, envH } = L;
    const loosen = ease(sealP);
    const cx = x + envW * .5;
    const cy = y + envH * .57;
    ctx.save();
    ctx.globalAlpha = 1 - sealP * .5;
    ctx.strokeStyle = '#bf8c49';
    ctx.lineWidth = Math.max(1.5, envW * .004);
    ctx.shadowColor = 'rgba(242,194,105,.28)';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(x + envW * .04, y + envH * .08);
    ctx.bezierCurveTo(x + envW * .30, y + envH * (.40 + loosen * .05), cx - envW * .05, cy + loosen * 26, cx + loosen * 55, cy + loosen * 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + envW * .96, y + envH * .08);
    ctx.bezierCurveTo(x + envW * .70, y + envH * (.40 + loosen * .04), cx + envW * .05, cy + loosen * 20, cx + loosen * 70, cy + loosen * 24);
    ctx.stroke();
    ctx.restore();

    const sx = cx + loosen * envW * .20;
    const sy = cy + loosen * envH * .20;
    const sr = envW * .052 * mix(1, .78, loosen);
    ctx.save();
    ctx.globalAlpha = 1 - sealP * .28;
    ctx.translate(sx, sy);
    ctx.rotate(loosen * .12);
    const sg = ctx.createRadialGradient(-sr * .22, -sr * .25, sr * .15, 0, 0, sr);
    sg.addColorStop(0, '#a84745');
    sg.addColorStop(.42, '#7d252a');
    sg.addColorStop(1, '#441017');
    ctx.fillStyle = sg;
    ctx.shadowColor = 'rgba(0,0,0,.32)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU;
      const rr = sr * (.94 + .06 * Math.sin(i * 2.3));
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d4a45d'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e1bb77';
    ctx.font = Math.max(10, sr * .58) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('H·M', 0, 1);
    ctx.restore();
  }

  function drawCard(L, cardP, p) {
    const { envW, envH, x, y, cardW, cardH } = L;
    const startX = x + (envW - cardW) / 2;
    const startY = y + envH * .13;
    const finalX = (w - cardW) / 2;
    const finalY = Math.max(h * .105, y - cardH * .72);
    const rise = ease(cardP);
    const cx = mix(startX, finalX, rise);
    const cy = mix(startY, finalY, rise);
    const scale = mix(.94, 1, rise);

    ctx.save();
    ctx.translate(cx + cardW / 2, cy + cardH / 2);
    ctx.scale(scale, scale);
    ctx.translate(-cardW / 2, -cardH / 2);

    ctx.shadowColor = 'rgba(0,0,0,' + mix(.12, .34, rise) + ')';
    ctx.shadowBlur = mix(8, 30, rise);
    ctx.shadowOffsetY = mix(3, 16, rise);
    const paper = ctx.createLinearGradient(0, 0, cardW, cardH);
    paper.addColorStop(0, '#fff7e9');
    paper.addColorStop(.58, '#f8ead6');
    paper.addColorStop(1, '#eed7b8');
    ctx.fillStyle = paper;
    roundRect(0, 0, cardW, cardH, 4);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#bd8743';
    ctx.lineWidth = 1.1;
    roundRect(cardW * .035, cardH * .025, cardW * .93, cardH * .95, 2);
    ctx.stroke();

    ctx.globalAlpha = .07;
    ctx.strokeStyle = '#7a4a2c';
    ctx.lineWidth = .6;
    for (let i = 0; i < 18; i++) {
      const yy = (i + 1) * cardH / 19;
      ctx.beginPath(); ctx.moveTo(cardW * .08, yy); ctx.lineTo(cardW * .92, yy + Math.sin(i) * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawBotanicalCluster(cardW * .08, cardH * .04, .58, 1, .96);
    ctx.save();
    ctx.translate(cardW * .92, cardH * .96);
    ctx.rotate(Math.PI);
    drawBotanicalCluster(0, 0, .54, 1, .96);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7b2430';
    ctx.font = Math.max(28, cardW * .135) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('H & M', cardW * .5, cardH * .22);

    ctx.fillStyle = '#6c1f29';
    ctx.font = '600 ' + Math.max(13, cardW * .061) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('PHẠM VŨ HẢI', cardW * .5, cardH * .40);
    ctx.font = '500 ' + Math.max(12, cardW * .054) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('&', cardW * .5, cardH * .46);
    ctx.font = '600 ' + Math.max(13, cardW * .061) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('NGUYỄN THỊ MỸ', cardW * .5, cardH * .53);

    ctx.strokeStyle = '#c2914c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardW * .38, cardH * .59);
    ctx.lineTo(cardW * .62, cardH * .59);
    ctx.stroke();

    ctx.fillStyle = '#7f4a32';
    ctx.font = '500 ' + Math.max(11, cardW * .043) + 'px "Lora", Georgia, serif';
    ctx.fillText('19 · 12 · 2026', cardW * .5, cardH * .66);

    ctx.fillStyle = '#8d5b43';
    ctx.font = 'italic ' + Math.max(15, cardW * .065) + 'px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Wedding Invitation', cardW * .5, cardH * .80);

    if (p > .80) {
      const shine = range(p, .80, .94);
      ctx.globalCompositeOperation = 'screen';
      const cg = ctx.createLinearGradient(cardW * (.05 + shine * .5), 0, cardW * (.28 + shine * .65), cardH);
      cg.addColorStop(0, 'rgba(255,255,255,0)');
      cg.addColorStop(.5, 'rgba(255,237,194,' + (.18 * (1 - Math.abs(.5 - shine) * 1.4)) + ')');
      cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, cardW, cardH);
    }

    ctx.restore();
  }

  function drawForegroundDecor(L, p) {
    const alpha = .75 + range(p, .2, .5) * .25;
    const s = L.mobile ? .78 : 1;
    drawBotanicalCluster(L.x - 32, L.y - 58, 1.05 * s, 1, alpha);
    drawBotanicalCluster(L.x + L.envW + 26, L.y + 12, .72 * s, -1, alpha * .72);
    drawRose(L.x - 10, L.y + L.envH * .92, 13 * s, .82);
    drawRose(L.x + L.envW + 12, L.y + L.envH * .82, 10 * s, .72);
  }

  function drawFloorPetals(L) {
    const baseY = Math.min(h - 20, L.y + L.envH + 34);
    drawPetal(L.x + L.envW * .12, baseY, 10, -.15, .58);
    drawPetal(L.x + L.envW * .82, baseY + 9, 8, .7, .45);
    drawPetal(L.x + L.envW * .60, baseY + 18, 7, 1.9, .36);
  }

  function render(p, time = performance.now()) {
    progress = clamp(p);
    ctx.clearRect(0, 0, w, h);

    drawBackground(progress);
    const L = sceneLayout();
    const sealP = range(progress, .10, .24);
    const flapP = range(progress, .20, .42);
    const cardP = range(progress, .36, .84);
    const cardClear = progress >= .68;

    drawAmbient(progress, time);
    drawForegroundDecor(L, progress);
    drawEnvelopeBack(L, flapP);

    if (!cardClear) drawCard(L, cardP, progress);
    drawFlapClosed(L, flapP);
    drawFrontPocket(L);
    drawCordAndSeal(L, sealP);
    if (cardClear) drawCard(L, cardP, progress);

    drawFloorPetals(L);

    const transition = range(progress, .94, 1);
    if (transition > 0) {
      ctx.fillStyle = 'rgba(18,3,7,' + (transition * .72) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function frame(now) {
    if (!active) return;
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
    if (reduceMotion || active) return false;
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

  seededParticles();
  resize();
  render(0);
  intro.classList.add('canvas-opening-ready');
  addEventListener('resize', resize, { passive: true });

  window.WeddingInvitationCanvas = {
    play,
    stop,
    render,
    get duration() { return DURATION; }
  };
})();