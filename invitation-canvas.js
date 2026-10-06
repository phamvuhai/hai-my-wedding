(() => {
  const canvas = document.getElementById('invitationCanvas');
  const intro = document.getElementById('invitationIntro');
  if (!canvas || !intro) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const A = window.WeddingInvitationAssets || {};
  const C = window.WeddingInvitationConfig || {};
  const T = C.timeline || {};
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
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  const range = (p, a, b) => smooth((p - a) / (b - a));

  const EVENTS = [
    [T.tap ?? 0, 'invitation:tap'],
    [T.sealOpen ?? .10, 'invitation:seal-open'],
    [T.flapOpen ?? .20, 'invitation:flap-open'],
    [T.cardStart ?? .36, 'invitation:card-start'],
    [T.cardClear ?? .68, 'invitation:card-clear'],
    [T.cardPresented ?? .84, 'invitation:card-presented'],
    [T.transition ?? .94, 'invitation:transition'],
    [T.complete ?? 1, 'invitation:complete']
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

  function dispatch(name, p) {
    document.dispatchEvent(new CustomEvent(name, {
      detail: { progress: p, duration: DURATION }
    }));
  }

  function fireEvents(p) {
    for (const [at, name] of EVENTS) {
      if (p >= at && !fired.has(name)) {
        fired.add(name);
        dispatch(name, p);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to load: ' + src));
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
      render(0);
      intro.classList.add('canvas-opening-ready');
      dispatch('invitation:canvas-ready', 0);
      return true;
    } catch (error) {
      console.error('[invitation-canvas]', error);
      dispatch('invitation:canvas-error', 0);
      return false;
    }
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
    if (ready && !active) render(progress);
  }

  function seedParticles() {
    dust.length = 0;
    petals.length = 0;
    const dustCount = w < 760 ? 38 : 66;
    const petalCount = w < 760 ? 8 : 13;

    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: .05 + Math.random() * .9,
        y: .05 + Math.random() * .75,
        r: .45 + Math.random() * 1.65,
        phase: Math.random() * TAU,
        drift: .4 + Math.random(),
        alpha: .15 + Math.random() * .45
      });
    }

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: .03 + Math.random() * .94,
        y: -.18 + Math.random() * 1.02,
        size: 15 + Math.random() * 25,
        speed: .22 + Math.random() * .35,
        phase: Math.random() * TAU,
        spin: (Math.random() - .5) * 1.6,
        alpha: .34 + Math.random() * .44,
        asset: i % Math.max(1, images.petals?.length || 1)
      });
    }
  }

  function rulesForViewport() {
    if (w < 760) return C.layout?.mobile || {};
    if (w < 1100) return C.layout?.tablet || {};
    return C.layout?.desktop || {};
  }

  function layout() {
    const r = rulesForViewport();
    const envW = Math.min(w * Number(r.envelopeVW || .84), Number(r.maxEnvelope || 590));
    const envH = envW * .605;
    const envX = (w - envW) / 2;
    const envY = h * Number(r.anchorY || .50);
    const cardW = envW * Number(r.cardRatio || .68);
    const cardH = cardW * Number(C.card?.aspect || 1.375);
    return { envW, envH, envX, envY, cardW, cardH, mobile: w < 760 };
  }

  function drawImage(img, x, y, ww, hh, alpha = 1) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, ww, hh);
    ctx.restore();
  }

  function drawBackground(p) {
    const base = ctx.createRadialGradient(w*.5,h*.36,20,w*.5,h*.42,Math.max(w,h)*.82);
    base.addColorStop(0,'#4B0E1A');
    base.addColorStop(.45,'#25060D');
    base.addColorStop(1,'#0C0104');
    ctx.fillStyle = base;
    ctx.fillRect(0,0,w,h);

    const floorY = h*.735;
    const floor = ctx.createLinearGradient(0,floorY,0,h);
    floor.addColorStop(0,'rgba(255,247,234,.02)');
    floor.addColorStop(.52,'rgba(247,231,204,.11)');
    floor.addColorStop(1,'rgba(235,207,173,.23)');
    ctx.fillStyle = floor;
    ctx.fillRect(0,floorY,w,h-floorY);

    const floorGlow = ctx.createRadialGradient(w*.5,floorY+28,0,w*.5,floorY+28,Math.min(w*.58,460));
    floorGlow.addColorStop(0,'rgba(255,236,198,.14)');
    floorGlow.addColorStop(1,'rgba(255,236,198,0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0,floorY,w,h-floorY);

    const bloom = range(p, T.cardClear ?? .68, T.cardPresented ?? .84);
    if (bloom > 0) {
      const r = Math.min(w,h) * (.22 + bloom*.11);
      const g = ctx.createRadialGradient(w*.5,h*.41,0,w*.5,h*.41,r);
      g.addColorStop(0,'rgba(245,190,92,' + (.22*bloom) + ')');
      g.addColorStop(.48,'rgba(181,81,37,' + (.09*bloom) + ')');
      g.addColorStop(1,'rgba(120,40,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(w*.5-r,h*.41-r,r*2,r*2);
    }
  }

  function drawBokeh(time) {
    const dots = [
      [.08,.16,35,'128,28,44'], [.18,.08,21,'194,82,70'],
      [.84,.13,30,'132,31,45'], [.92,.31,19,'222,155,78'],
      [.11,.55,22,'208,138,65'], [.88,.58,36,'116,23,37'],
      [.24,.71,16,'229,182,105'], [.76,.70,20,'187,96,56']
    ];
    for (let i=0;i<dots.length;i++) {
      const [xx,yy,rr,rgb] = dots[i];
      const pulse = .72 + .14*Math.sin(time*.001+i);
      const g=ctx.createRadialGradient(w*xx,h*yy,0,w*xx,h*yy,rr);
      g.addColorStop(0,'rgba('+rgb+','+(.10*pulse)+')');
      g.addColorStop(1,'rgba('+rgb+',0)');
      ctx.fillStyle=g;
      ctx.fillRect(w*xx-rr,h*yy-rr,rr*2,rr*2);
    }
  }

  function drawDust(p,time) {
    const reveal=.30+range(p,.08,.42)*.70;
    for (let i=0;i<dust.length;i++) {
      const d=dust[i];
      const x=d.x*w+Math.sin(time*.00045*d.drift+d.phase)*7;
      const y=d.y*h+Math.cos(time*.00031+d.phase)*5;
      const twinkle=.55+.45*Math.sin(time*.002+d.phase);
      ctx.save();
      ctx.globalAlpha=d.alpha*reveal*twinkle;
      ctx.fillStyle=i%4?'#DCAA55':'#FFE0A1';
      ctx.shadowColor='rgba(237,185,86,.62)';
      ctx.shadowBlur=7;
      ctx.beginPath();ctx.arc(x,y,d.r,0,TAU);ctx.fill();
      ctx.restore();
    }
  }

  function drawSceneFlorals(L,p) {
    const alpha=.82+range(p,.2,.52)*.16;
    const leftW=L.envW*(L.mobile?.66:.72);
    const rightW=L.envW*(L.mobile?.50:.57);
    drawImage(images.floralLeft,L.envX-leftW*.48,L.envY-leftW*1.33*.48,leftW,leftW*1.33,alpha);
    drawImage(images.floralRight,L.envX+L.envW-rightW*.40,L.envY-rightW*1.33*.30,rightW,rightW*1.33,alpha*.88);
  }

  function drawForegroundFlorals(L,p) {
    const reveal=.48+range(p,T.cardClear??.68,T.cardPresented??.84)*.36;
    const leftW=L.envW*(L.mobile?.25:.30);
    const rightW=L.envW*(L.mobile?.21:.25);
    ctx.save();
    ctx.filter='blur(.25px)';
    drawImage(images.floralLeft,L.envX-leftW*.32,L.envY+L.envH*.50,leftW,leftW*1.33,reveal*.55);
    drawImage(images.floralRight,L.envX+L.envW-rightW*.64,L.envY+L.envH*.58,rightW,rightW*1.33,reveal*.48);
    ctx.restore();
  }

  function drawEnvelopeBack(L) {
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.42)';
    ctx.shadowBlur=30;
    ctx.shadowOffsetY=18;
    ctx.drawImage(images.envelopeBack,L.envX,L.envY,L.envW,L.envH);
    ctx.restore();
  }

  function drawFlap(L,p) {
    const flapH=L.envW*.42;
    const half=.5;
    if (p < half) {
      const t=easeInOutCubic(p/half);
      const hh=Math.max(2,flapH*(1-t));
      ctx.drawImage(images.envelopeFlap,L.envX,L.envY,L.envW,hh);
    } else {
      const t=easeOutCubic((p-half)/half);
      const hh=Math.max(2,flapH*t);
      ctx.save();
      ctx.translate(L.envX,L.envY);
      ctx.scale(1,-1);
      ctx.shadowColor='rgba(0,0,0,.16)';
      ctx.shadowBlur=10;
      ctx.drawImage(images.lining,0,0,L.envW,hh);
      ctx.restore();
    }
  }

  function drawCordAndSeal(L,sealP,cordP) {
    const c=easeOutCubic(cordP);
    ctx.save();
    ctx.globalAlpha=1-c*.55;
    ctx.translate(c*L.envW*.025,c*L.envH*.075);
    ctx.rotate(c*.026);
    ctx.drawImage(images.cord,L.envX,L.envY,L.envW,L.envH);
    ctx.restore();

    const s=easeOutCubic(sealP);
    const size=L.envW*.142;
    const bx=L.envX+L.envW*.5-size*.5;
    const by=L.envY+L.envH*.55-size*.5;
    const x=bx+s*L.envW*.19;
    const y=by+s*L.envH*.18;
    const scale=mix(1,.82,s);

    ctx.save();
    ctx.translate(x+size*.5,y+size*.5);
    ctx.rotate(s*.13);
    ctx.scale(scale,scale);
    ctx.globalAlpha=1-s*.20;
    ctx.drawImage(images.seal,-size*.5,-size*.5,size,size);
    ctx.restore();
  }

  function drawSealSpark(L,p) {
    const q=range(p,.095,.255);
    if(q<=0||q>=1)return;
    const cx=L.envX+L.envW*.5;
    const cy=L.envY+L.envH*.55;
    const fade=Math.sin(q*Math.PI);
    for(let i=0;i<18;i++){
      const a=i*2.399+.4;
      const r=(18+(i%7)*8)*easeOutCubic(q);
      ctx.save();
      ctx.globalAlpha=fade*(.16+(i%4)*.06);
      ctx.fillStyle=i%3?'#E5B761':'#FFE0A1';
      ctx.shadowColor='rgba(237,185,86,.68)';
      ctx.shadowBlur=8;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.58,i%5===0?1.7:1,0,TAU);ctx.fill();
      ctx.restore();
    }
  }

  function drawFrontPocket(L) {
    ctx.drawImage(images.envelopeFront,L.envX,L.envY,L.envW,L.envH);
  }

  function drawCardText(cardW,cardH) {
    const d=data();
    const t=C.typography||{};
    const cx=cardW*.5;
    ctx.textAlign='center';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#7A2230';
    ctx.font=`${Math.max(33,cardW*.132)}px "UTM Beautiful Caps","Cormorant Garamond",Georgia,serif`;
    ctx.fillText('H & M',cx,cardH*(t.monogramY||.22));
    ctx.fillStyle='#69202A';
    ctx.font=`500 ${Math.max(13,cardW*.055)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.groom,cx,cardH*(t.groomY||.40));
    ctx.font=`500 ${Math.max(12,cardW*.049)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText('&',cx,cardH*(t.ampY||.465));
    ctx.font=`500 ${Math.max(13,cardW*.055)}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.bride,cx,cardH*(t.brideY||.53));

    const oy=cardH*(t.ornamentY||.595);
    ctx.strokeStyle='#B47D3F';
    ctx.lineWidth=Math.max(.8,cardW*.002);
    ctx.beginPath();
    ctx.moveTo(cardW*.39,oy);ctx.lineTo(cardW*.47,oy);
    ctx.moveTo(cardW*.53,oy);ctx.lineTo(cardW*.61,oy);
    ctx.stroke();
    ctx.fillStyle='#B47D3F';
    ctx.font=`${Math.max(11,cardW*.035)}px Georgia,serif`;
    ctx.fillText('❦',cx,oy+cardW*.012);

    ctx.fillStyle='#7D4C34';
    ctx.font=`500 ${Math.max(11,cardW*.039)}px "Lora",Georgia,serif`;
    ctx.fillText(d.date,cx,cardH*(t.dateY||.665));
    ctx.fillStyle='#8B5D43';
    ctx.font=`${Math.max(18,cardW*.069)}px "UTM Beautiful Caps","Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.script,cx,cardH*(t.scriptY||.80));
  }

  function cardGeometry(L,cardP) {
    const startX=L.envX+(L.envW-L.cardW)/2;
    const startY=L.envY+L.envH*.13;
    const finalX=(w-L.cardW)/2;
    const minTop=L.mobile?Math.max(88,h*(C.card?.topMobile||.105)):Math.max(78,h*(C.card?.topDesktop||.095));
    const intended=L.envY-L.cardH*.60;
    const finalY=Math.max(minTop,intended);
    const rise=easeInOutCubic(cardP);
    return {
      x:mix(startX,finalX,rise),
      y:mix(startY,finalY,rise),
      scale:mix(C.card?.startScale||.95,C.card?.finalScale||1,rise),
      rotation:mix(C.card?.startRotation||.004,C.card?.finalRotation||0,rise),
      rise
    };
  }

  function drawCard(L,cardP,p) {
    const g=cardGeometry(L,cardP);
    ctx.save();
    ctx.translate(g.x+L.cardW*.5,g.y+L.cardH*.5);
    ctx.rotate(g.rotation);
    ctx.scale(g.scale,g.scale);
    ctx.translate(-L.cardW*.5,-L.cardH*.5);

    ctx.shadowColor='rgba(0,0,0,'+mix(.10,.29,g.rise)+')';
    ctx.shadowBlur=mix(6,27,g.rise);
    ctx.shadowOffsetY=mix(3,13,g.rise);
    ctx.drawImage(images.card,0,0,L.cardW,L.cardH);
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;

    drawCardText(L.cardW,L.cardH);

    if(p>(T.cardPresented??.84)-.02){
      const shine=range(p,(T.cardPresented??.84)-.02,T.transition??.94);
      const sweepX=mix(-L.cardW*.35,L.cardW*.92,shine);
      ctx.save();
      ctx.globalCompositeOperation='screen';
      const sg=ctx.createLinearGradient(sweepX,0,sweepX+L.cardW*.28,L.cardH);
      sg.addColorStop(0,'rgba(255,255,255,0)');
      sg.addColorStop(.5,'rgba(255,236,191,.18)');
      sg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=sg;ctx.fillRect(0,0,L.cardW,L.cardH);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPetals(p,time){
    if(!images.petals?.length||p<.18)return;
    const reveal=range(p,.18,.42);
    for(let i=0;i<petals.length;i++){
      const pt=petals[i];
      const tt=((time*.000028*pt.speed)+pt.y+i*.069)%1.22;
      const x=pt.x*w+Math.sin(time*.00056+pt.phase)*24;
      const y=tt*h;
      const size=pt.size;
      const img=images.petals[pt.asset%images.petals.length];
      ctx.save();
      ctx.globalAlpha=pt.alpha*reveal;
      ctx.translate(x,y);
      ctx.rotate(time*.00025*pt.spin+pt.phase);
      ctx.drawImage(img,-size,-size*.55,size*2,size*1.1);
      ctx.restore();
    }
  }

  function render(p,time=performance.now()){
    if(!ready||destroyed)return;
    progress=clamp(p);
    ctx.clearRect(0,0,w,h);

    drawBackground(progress);
    drawBokeh(time);

    const L=layout();
    const sealP=range(progress,T.sealOpen??.10,.24);
    const cordP=range(progress,T.cordLoose??.16,.30);
    const flapP=range(progress,T.flapOpen??.20,.44);
    const cardP=range(progress,T.cardStart??.36,T.cardPresented??.84);
    const cardClear=progress>=(T.cardClear??.68);

    drawDust(progress,time);
    drawSceneFlorals(L,progress);
    drawEnvelopeBack(L);
    drawFlap(L,flapP);
    drawSealSpark(L,progress);

    if(!cardClear && progress>=(T.cardStart??.36)){
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.envX,0,L.envW,L.envY+L.envH+2);
      ctx.clip();
      drawCard(L,cardP,progress);
      ctx.restore();
    }

    drawFrontPocket(L);
    drawCordAndSeal(L,sealP,cordP);

    if(cardClear) drawCard(L,cardP,progress);

    drawForegroundFlorals(L,progress);
    drawPetals(progress,time);

    const out=range(progress,T.transition??.94,T.complete??1);
    if(out>0){
      ctx.fillStyle='rgba(13,1,4,'+(out*.72)+')';
      ctx.fillRect(0,0,w,h);
    }
  }

  function frame(now){
    if(!active||destroyed)return;
    const p=clamp((now-startedAt)/DURATION);
    fireEvents(p);
    render(p,now-startedAt);
    if(p<1) raf=requestAnimationFrame(frame);
    else active=false;
  }

  function play(){
    if(REDUCED||active||!ready||destroyed)return false;
    active=true;
    progress=0;
    fired=new Set();
    startedAt=performance.now();
    fireEvents(0);
    raf=requestAnimationFrame(frame);
    return true;
  }

  function stop(){
    active=false;
    cancelAnimationFrame(raf);
  }

  function destroy(){
    stop();
    destroyed=true;
    removeEventListener('resize',resize);
    ctx.clearRect(0,0,w,h);
  }

  function renderAt(p){
    if(!ready||destroyed)return false;
    stop();
    render(clamp(p),0);
    return true;
  }

  addEventListener('resize',resize,{passive:true});
  document.addEventListener('invitation:data',()=>{if(ready&&!active)render(progress);});
  document.addEventListener('wedding:language',()=>{if(ready&&!active)render(progress);});

  const readyPromise=preload();

  window.WeddingInvitationCanvas={
    play,stop,destroy,render,renderAt,readyPromise,
    get ready(){return ready;},
    get duration(){return DURATION;},
    get progress(){return progress;}
  };
})();