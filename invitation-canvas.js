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
  const K = C.keyframes || {};
  const DS = C.designSpace || {};
  const DURATION = Number(C.duration || 6200);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const images = {};
  const dust = [];
  const petals = [];

  let w = 1, h = 1, dpr = 1;
  let raf = 0, startedAt = 0;
  let active = false, ready = false, destroyed = false;
  let progress = 0;
  let fired = new Set();
  let idleRaf = 0;
  let idleStartedAt = performance.now();
  let pointerX = 0, pointerY = 0;
  let pointerTX = 0, pointerTY = 0;

  const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix = (a,b,t)=>a+(b-a)*t;
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  const ease = t => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const easeOut = t => 1-Math.pow(1-clamp(t),3);
  const range = (p,a,b)=>smooth((p-a)/Math.max(.0001,b-a));

  const DESIGN_W = Number(DS.width || 220);
  const DESIGN_H = Number(DS.height || 320);

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

  function dispatch(name,p,message='') {
    document.dispatchEvent(new CustomEvent(name,{detail:{progress:p,duration:DURATION}}));
    if (status && message) status.textContent = message;
  }

  function fireEvents(p) {
    for (const [at,name,message] of EVENTS) {
      if (p >= at && !fired.has(name)) {
        fired.add(name);
        dispatch(name,p,message);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.decoding='async';
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('Unable to load invitation asset: '+src));
      img.src=src;
    });
  }

  async function preload() {
    const list=[
      ['card',A.card],['envelopeBack',A.envelopeBack],['envelopeFront',A.envelopeFront],
      ['envelopeFlap',A.envelopeFlap],['lining',A.lining],['cord',A.cord],
      ['seal',A.seal],['floralLeft',A.floralLeft],['floralRight',A.floralRight]
    ];
    try {
      await Promise.all(list.map(async([key,src])=>{
        if(!src) throw new Error('Missing invitation asset: '+key);
        images[key]=await loadImage(src);
      }));
      images.petals=await Promise.all((A.petals||[]).map(loadImage));
      try{await document.fonts?.ready;}catch{}
      ready=true;
      resize();
      seedParticles();
      render(0,0);
      if(!REDUCED) idleRaf=requestAnimationFrame(idleFrame);
      intro.classList.add('canvas-opening-ready');
      dispatch('invitation:canvas-ready',0,'Invitation ready');
      return true;
    } catch(error) {
      console.error('[invitation-canvas]',error);
      intro.classList.add('canvas-opening-error');
      dispatch('invitation:canvas-error',0,'Invitation visual could not load');
      return false;
    }
  }

  function resize() {
    if(destroyed) return;
    w=Math.max(1,innerWidth); h=Math.max(1,innerHeight);
    dpr=Math.min(devicePixelRatio||1,w<760?1.5:2);
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px'; canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(ready&&!active) render(progress,0);
  }

  function seedParticles() {
    dust.length=0; petals.length=0;
    let seed=20261219;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const dc=w<760?34:58, pc=w<760?6:10;
    for(let i=0;i<dc;i++) dust.push({
      x:.05+rand()*.9,y:.04+rand()*.72,r:.4+rand()*1.5,
      phase:rand()*TAU,alpha:.14+rand()*.4
    });
    for(let i=0;i<pc;i++) petals.push({
      x:.04+rand()*.92,y:-.16+rand()*1.05,size:14+rand()*22,
      speed:.20+rand()*.34,phase:rand()*TAU,spin:(rand()-.5)*1.5,
      alpha:.30+rand()*.42,asset:i%Math.max(1,images.petals?.length||1)
    });
  }

  function sceneTransform() {
    const widthFit=(w*Number(DS.fitWidth||.94))/DESIGN_W;
    const fitHeightRatio=w<760?Number(DS.mobileFitHeight||.78):Number(DS.desktopFitHeight||.78);
    const heightFit=(h*fitHeightRatio)/DESIGN_H;
    const scale=Math.min(widthFit,heightFit);
    const sceneW=DESIGN_W*scale, sceneH=DESIGN_H*scale;
    const idleAmount=active?Math.max(0,1-range(progress,.08,.32)):1;
    return {
      scale,
      x:(w-sceneW)/2 + pointerX*ss(1.7,{scale})*idleAmount,
      y:Math.max(12,(h-sceneH)/2 - (w<760?8:10)) + pointerY*ss(1.1,{scale})*idleAmount,
      sceneW,sceneH
    };
  }

  function sx(v,S){return S.x+v*S.scale;}
  function sy(v,S){return S.y+v*S.scale;}
  function ss(v,S){return v*S.scale;}

  function drawImage(img,x,y,ww,hh,alpha=1) {
    if(!img) return;
    ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,x,y,ww,hh);ctx.restore();
  }

  function drawBackground(S,p,time) {
    const lightX=w*(.48+pointerX*.035);
    const lightY=h*(.34+pointerY*.025);

    const base=ctx.createRadialGradient(lightX,lightY,10,w*.50,h*.48,Math.max(w,h)*.86);
    base.addColorStop(0,'#3B171E');
    base.addColorStop(.36,'#241015');
    base.addColorStop(.72,'#16080C');
    base.addColorStop(1,'#090306');
    ctx.fillStyle=base;
    ctx.fillRect(0,0,w,h);

    // Soft fabric sheen — deliberately irregular, like a photographed burgundy cloth.
    const sheen=ctx.createLinearGradient(0,h*.08,w,h*.92);
    sheen.addColorStop(0,'rgba(255,238,211,.028)');
    sheen.addColorStop(.34,'rgba(145,76,76,.018)');
    sheen.addColorStop(.52,'rgba(255,240,216,.045)');
    sheen.addColorStop(.72,'rgba(89,28,39,.015)');
    sheen.addColorStop(1,'rgba(255,255,255,.012)');
    ctx.fillStyle=sheen;
    ctx.fillRect(0,0,w,h);

    // Fine fabric fibers. Static geometry keeps the scene photographic rather than "sparkly".
    ctx.save();
    ctx.globalAlpha=.055;
    ctx.strokeStyle='#F4D8C0';
    ctx.lineWidth=.45;
    const gap=Math.max(18,Math.min(34,w/54));
    for(let x=-h;x<w+h;x+=gap){
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x-h*.16,h);
      ctx.stroke();
    }
    ctx.restore();

    const tableY=sy(Number(DS.floorY||245),S);
    const table=ctx.createLinearGradient(0,tableY,0,h);
    table.addColorStop(0,'rgba(0,0,0,.03)');
    table.addColorStop(.3,'rgba(26,8,12,.10)');
    table.addColorStop(1,'rgba(4,1,2,.34)');
    ctx.fillStyle=table;
    ctx.fillRect(0,tableY,w,h-tableY);

    // Pool of warm light under the stationery.
    const pool=ctx.createRadialGradient(w*.5,sy(230,S),0,w*.5,sy(230,S),ss(112,S));
    pool.addColorStop(0,'rgba(231,187,125,.13)');
    pool.addColorStop(.34,'rgba(193,118,75,.055)');
    pool.addColorStop(1,'rgba(80,20,31,0)');
    ctx.fillStyle=pool;
    ctx.fillRect(w*.5-ss(125,S),sy(112,S),ss(250,S),ss(210,S));

    // Final presentation glow is subtle and warm, not an artificial halo.
    const bloom=range(p,T.cardClear??.66,T.cardPresented??.84);
    if(bloom>0){
      const rr=Math.min(w,h)*(.18+.055*bloom);
      const rg=ctx.createRadialGradient(w*.5,sy(123,S),0,w*.5,sy(123,S),rr);
      rg.addColorStop(0,'rgba(255,236,194,'+(.095*bloom)+')');
      rg.addColorStop(.52,'rgba(221,170,110,'+(.035*bloom)+')');
      rg.addColorStop(1,'rgba(130,60,45,0)');
      ctx.fillStyle=rg;
      ctx.fillRect(w*.5-rr,sy(123,S)-rr,rr*2,rr*2);
    }

    // Gentle photographic vignette.
    const vignette=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.28,w*.5,h*.46,Math.max(w,h)*.72);
    vignette.addColorStop(.45,'rgba(0,0,0,0)');
    vignette.addColorStop(1,'rgba(0,0,0,.38)');
    ctx.fillStyle=vignette;
    ctx.fillRect(0,0,w,h);
  }

  function drawDust(p,time){
    const reveal=.25+range(p,.08,.42)*.75;
    for(let i=0;i<dust.length;i++){
      const d=dust[i];
      const x=d.x*w+Math.sin(time*.00045+d.phase)*6;
      const y=d.y*h+Math.cos(time*.00031+d.phase)*4;
      ctx.save();ctx.globalAlpha=d.alpha*reveal*.18*(.70+.30*Math.sin(time*.0012+d.phase));
      ctx.fillStyle=i%5?'#E9CDA8':'#FFF1D8';ctx.shadowColor='rgba(231,199,151,.20)';ctx.shadowBlur=3;
      ctx.beginPath();ctx.arc(x,y,Math.max(.35,d.r*.58),0,TAU);ctx.fill();ctx.restore();
    }
  }

  function drawFlorals(S,p){
    const l=DS.floralLeft||{x:-5,y:72,w:72,h:132};
    const r=DS.floralRight||{x:168,y:110,w:58,h:106};
    const settle=1-range(p,.14,.36)*.08;
    ctx.save();
    ctx.filter='saturate(.82) brightness(.90)';
    drawImage(images.floralLeft,sx(l.x,S),sy(l.y,S),ss(l.w,S),ss(l.h,S),.54*settle);
    drawImage(images.floralRight,sx(r.x,S),sy(r.y,S),ss(r.w,S),ss(r.h,S),.42*settle);
    ctx.restore();
  }

  function envYFor(p){
    const E=DS.envelope||{};
    const y1=Number(E.closedY||164),y3=Number(E.openY||184),y4=Number(E.cardY||190),y5=Number(E.presentedY||222);
    if(p<.20) return y1;
    if(p<.38) return mix(y1,y3,range(p,.20,.38));
    if(p<.68) return mix(y3,y4,range(p,.38,.68));
    return mix(y4,y5,range(p,.68,.86));
  }

  function drawEnvelopeBack(S,p){
    const E=DS.envelope||{x:15,w:190,h:116};
    const y=envYFor(p);
    const rise=range(p,.31,.84);

    // Contact shadow grows softer as the envelope slides down and the card rises.
    ctx.save();
    const shadowY=sy(y+(E.h||116)+4,S);
    const shadowW=ss(E.w*.88,S);
    const shadowH=ss(14+rise*5,S);
    const sg=ctx.createRadialGradient(w*.5,shadowY,0,w*.5,shadowY,shadowW*.56);
    sg.addColorStop(0,'rgba(0,0,0,'+(0.32-rise*.08)+')');
    sg.addColorStop(.62,'rgba(0,0,0,'+(0.12-rise*.03)+')');
    sg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sg;
    ctx.beginPath();
    ctx.ellipse(w*.5,shadowY,shadowW*.56,shadowH,0,0,TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.30)';
    ctx.shadowBlur=ss(7+rise*2,S);
    ctx.shadowOffsetY=ss(4,S);
    ctx.drawImage(images.envelopeBack,sx(E.x,S),sy(y,S),ss(E.w,S),ss(E.h,S));
    ctx.restore();
  }

  function drawFlap(S,p){
    const E=DS.envelope||{x:15,w:190};
    const y=envYFor(p);
    const fp=range(p,T.flapOpen??.16,T.flapOpenDone??.36);
    const flapH=80;
    const angle=Math.PI*ease(fp);
    const face=Math.cos(angle);
    const absFace=Math.max(.018,Math.abs(face));
    const hingeY=sy(y,S);
    const edgeDark=1-Math.min(1,Math.abs(face));

    // Moving hinge shadow sells the paper thickness at the 90° moment.
    if(fp>0&&fp<1){
      ctx.save();
      ctx.globalAlpha=.08+.25*edgeDark;
      ctx.shadowColor='rgba(0,0,0,.55)';
      ctx.shadowBlur=ss(4+8*edgeDark,S);
      ctx.fillStyle='rgba(25,4,9,.45)';
      ctx.fillRect(sx(E.x+3,S),hingeY-ss(.7,S),ss(E.w-6,S),ss(1.4,S));
      ctx.restore();
    }

    ctx.save();
    const squeeze=.985+.015*Math.abs(face);
    const drawW=ss(E.w*squeeze,S);
    const left=sx(E.x+(E.w-E.w*squeeze)/2,S);

    if(face>=0){
      const hh=ss(flapH*absFace,S);
      ctx.shadowColor='rgba(0,0,0,'+(0.16+edgeDark*.20)+')';
      ctx.shadowBlur=ss(5+edgeDark*7,S);
      ctx.shadowOffsetY=ss(2,S);
      ctx.drawImage(images.envelopeFlap,left,hingeY,drawW,hh);
    }else{
      const L=DS.lining||{x:15,w:190,h:80};
      const hh=ss((L.h||80)*absFace,S);
      ctx.translate(left,hingeY);
      ctx.scale(1,-1);
      ctx.shadowColor='rgba(0,0,0,'+(0.10+edgeDark*.14)+')';
      ctx.shadowBlur=ss(4+edgeDark*5,S);
      ctx.drawImage(images.lining,0,0,drawW,hh);
    }
    ctx.restore();
  }

  function drawFrontPocket(S,p){
    const E=DS.envelope||{x:15,w:190,h:116};
    const y=envYFor(p);
    ctx.drawImage(images.envelopeFront,sx(E.x,S),sy(y,S),ss(E.w,S),ss(E.h,S));

    const cardLift=range(p,T.cardStart??.31,T.cardPresented??.84);
    if(cardLift>0){
      const edgeY=sy(y+17,S);
      const g=ctx.createLinearGradient(0,edgeY-ss(5,S),0,edgeY+ss(3,S));
      g.addColorStop(0,'rgba(0,0,0,0)');
      g.addColorStop(.66,'rgba(0,0,0,'+(0.10+.10*cardLift)+')');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;
      ctx.fillRect(sx(E.x+5,S),edgeY-ss(5,S),ss(E.w-10,S),ss(9,S));
    }
  }

  function drawCordSeal(S,p){
    const E=DS.envelope||{x:15,w:190,h:116};
    const y=envYFor(p);
    const sealP=easeOut(range(p,T.sealOpen??.08,.23));

    const S0=DS.seal||{x:95,y:216,w:30,h:30};
    const dy=y-Number(E.closedY||168);
    const x0=Number(S0.x||95),y0=Number(S0.y||216)+dy;
    const driftX=sealP*10;
    const driftY=sealP*14+sealP*sealP*7;
    const size=Number(S0.w||30)*(1-sealP*.08);
    const alpha=1-range(p,.12,.28);

    if(alpha<=.01)return;

    ctx.save();
    ctx.translate(sx(x0+size/2+driftX,S),sy(y0+size/2+driftY,S));
    ctx.rotate(sealP*.10);
    ctx.globalAlpha=alpha;
    ctx.shadowColor='rgba(0,0,0,.42)';
    ctx.shadowBlur=ss(5+sealP*3,S);
    ctx.shadowOffsetY=ss(2+sealP*2,S);
    ctx.drawImage(images.seal,-ss(size/2,S),-ss(size/2,S),ss(size,S),ss(size,S));

    // A small moving specular reflection before the seal releases.
    if(sealP<.64){
      const shine=ctx.createRadialGradient(-ss(size*.14,S),-ss(size*.17,S),0,-ss(size*.14,S),-ss(size*.17,S),ss(size*.24,S));
      shine.addColorStop(0,'rgba(255,230,205,'+(0.18*(1-sealP))+')');
      shine.addColorStop(1,'rgba(255,230,205,0)');
      ctx.fillStyle=shine;
      ctx.beginPath();
      ctx.arc(0,0,ss(size*.47,S),0,TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCardText(x,y,cw,ch,S){
    const d=data(),t=C.typography||{};
    const cx=x+cw*.5;
    const cxPx=sx(cx,S);
    const maxNameWidth=ss(cw*.76,S);
    const maxTitleWidth=ss(cw*.62,S);

    ctx.save();
    ctx.textAlign='center';
    ctx.textBaseline='middle';

    const drawFittedText=(text,designY,sizeRatio,minPx,weight,family,color,maxWidth)=>{
      let size=Math.max(minPx,ss(cw*sizeRatio,S));
      const makeFont=px=>`${weight} ${px.toFixed(2)}px ${family}`;
      ctx.font=makeFont(size);
      const measured=ctx.measureText(text).width;
      if(measured>maxWidth&&measured>0){
        size=Math.max(minPx,size*(maxWidth/measured));
        ctx.font=makeFont(size);
      }
      ctx.fillStyle=color;
      ctx.fillText(text,cxPx,sy(y+ch*designY,S));
    };

    const drawOrnament=(designY,span=.22)=>{
      const py=sy(y+ch*designY,S);
      const gap=ss(cw*.055,S);
      const half=ss(cw*span,S);
      const diamond=Math.max(1.4,ss(cw*.010,S));

      ctx.save();
      ctx.strokeStyle='rgba(177,124,59,.72)';
      ctx.fillStyle='rgba(177,124,59,.86)';
      ctx.lineWidth=Math.max(.7,ss(.38,S));

      ctx.beginPath();
      ctx.moveTo(cxPx-half,py);
      ctx.lineTo(cxPx-gap,py);
      ctx.moveTo(cxPx+gap,py);
      ctx.lineTo(cxPx+half,py);
      ctx.stroke();

      ctx.translate(cxPx,py);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-diamond/2,-diamond/2,diamond,diamond);
      ctx.restore();
    };

    // Main monogram/title — classic serif like the approved mockup.
    drawFittedText(
      'H & M',
      t.monogramY??.19,
      .125,
      12,
      '600',
      '"Cormorant Garamond",Georgia,serif',
      '#6B1726',
      maxTitleWidth
    );

    // Subtitle sits directly under the monogram, never at the bottom of the card.
    drawFittedText(
      d.script,
      t.subtitleY??.265,
      .035,
      7,
      '500',
      '"Lora","Cormorant Garamond",Georgia,serif',
      '#8A5B43',
      ss(cw*.58,S)
    );

    drawOrnament(t.ornamentTopY??.325,.19);

    drawFittedText(
      d.groom,
      t.groomY??.435,
      .054,
      8,
      '600',
      '"Cormorant Garamond",Georgia,serif',
      '#6A1C29',
      maxNameWidth
    );

    // Ampersand with short gold rules for a cleaner wedding-invitation hierarchy.
    const ampY=t.ampY??.505;
    const ampPx=sy(y+ch*ampY,S);
    const ampGap=ss(cw*.075,S);
    const ampLine=ss(cw*.19,S);
    ctx.strokeStyle='rgba(177,124,59,.70)';
    ctx.lineWidth=Math.max(.7,ss(.36,S));
    ctx.beginPath();
    ctx.moveTo(cxPx-ampLine,ampPx);
    ctx.lineTo(cxPx-ampGap,ampPx);
    ctx.moveTo(cxPx+ampGap,ampPx);
    ctx.lineTo(cxPx+ampLine,ampPx);
    ctx.stroke();
    drawFittedText(
      '&',
      ampY,
      .047,
      8,
      '500',
      '"Cormorant Garamond",Georgia,serif',
      '#A87337',
      ss(cw*.14,S)
    );

    drawFittedText(
      d.bride,
      t.brideY??.575,
      .054,
      8,
      '600',
      '"Cormorant Garamond",Georgia,serif',
      '#6A1C29',
      maxNameWidth
    );

    drawOrnament(t.ornamentBottomY??.655,.18);

    drawFittedText(
      d.date,
      t.dateY??.735,
      .036,
      7,
      '500',
      '"Lora","Cormorant Garamond",Georgia,serif',
      '#7D4C34',
      ss(cw*.54,S)
    );

    ctx.restore();
  }

  function cardRectFor(p){
    const c4=DS.card04||{x:61,y:139,w:98,h:142};
    const c5=DS.card05||{x:58,y:72,w:104,h:151};
    const c6=DS.card06||{x:59,y:69,w:102,h:148};

    if(p<(T.cardStart??.31)) return null;

    if(p<(T.cardClear??.66)){
      const t=easeOut(range(p,T.cardStart??.31,T.cardClear??.66));
      const lift=t<.86 ? t/0.86 : 1;
      const settle=t>0.86 ? (t-.86)/.14 : 0;
      const overshoot=Math.sin(Math.PI*clamp(settle))*2.3;
      return {
        x:mix(c4.x,c5.x,lift),
        y:mix(c4.y,c5.y,lift)-overshoot,
        w:mix(c4.w,c5.w,lift),
        h:mix(c4.h,c5.h,lift)
      };
    }

    if(p<(T.transition??.955)){
      const t=ease(range(p,T.cardClear??.66,T.cardPresented??.84));
      return {
        x:mix(c5.x,c6.x,t),
        y:mix(c5.y,c6.y,t),
        w:mix(c5.w,c6.w,t),
        h:mix(c5.h,c6.h,t)
      };
    }

    const t=easeOut(range(p,T.transition??.955,1));
    const zoom=1+t*.035;
    const ww=c6.w*zoom,hh=c6.h*zoom;
    return {
      x:c6.x-(ww-c6.w)/2,
      y:c6.y-(hh-c6.h)/2-t*2.2,
      w:ww,h:hh
    };
  }

  function drawCard(S,p,clipped){
    const R=cardRectFor(p); if(!R) return;
    const lift=range(p,T.cardStart??.31,T.cardPresented??.84);

    const draw=()=>{
      const px=sx(R.x,S),py=sy(R.y,S),pw=ss(R.w,S),ph=ss(R.h,S);

      ctx.save();
      ctx.shadowColor='rgba(0,0,0,'+mix(.14,.34,lift)+')';
      ctx.shadowBlur=ss(mix(3.5,12,lift),S);
      ctx.shadowOffsetY=ss(mix(2,7,lift),S);
      ctx.drawImage(images.card,px,py,pw,ph);
      ctx.restore();

      // Warm grazing light across the cotton paper as it clears the envelope.
      if(lift>.18){
        ctx.save();
        ctx.globalCompositeOperation='screen';
        const gx=px+pw*(.18+.45*range(p,.38,.82));
        const shine=ctx.createLinearGradient(gx-pw*.23,py,gx+pw*.16,py+ph);
        shine.addColorStop(0,'rgba(255,255,255,0)');
        shine.addColorStop(.48,'rgba(255,246,226,'+(.035+.055*lift)+')');
        shine.addColorStop(.62,'rgba(255,255,255,0)');
        ctx.fillStyle=shine;
        ctx.fillRect(px,py,pw,ph);
        ctx.restore();
      }

      drawCardText(R.x,R.y,R.w,R.h,S);
    };

    if(clipped){
      const E=DS.envelope||{x:15,w:190,h:116};
      const y=envYFor(p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx(E.x,S),0,ss(E.w,S),sy(y+(E.h||116),S));
      ctx.clip();
      draw();
      ctx.restore();
    }else{
      draw();
    }
  }

  function drawPetals(p,time){
    // Intentionally empty: realistic stationery should not look like an illustrated confetti scene.
  }

  function render(p,time=performance.now()){
    if(!ready||destroyed)return;
    progress=clamp(p);
    ctx.clearRect(0,0,w,h);
    const S=sceneTransform();

    drawBackground(S,progress,time);
    drawDust(progress,time);
    drawFlorals(S,progress);
    drawEnvelopeBack(S,progress);
    drawFlap(S,progress);

    if(progress < (T.cardClear??.68)) drawCard(S,progress,true);

    drawFrontPocket(S,progress);
    drawCordSeal(S,progress);

    if(progress >= (T.cardClear??.68)) drawCard(S,progress,false);

    drawPetals(progress,time);

    const out=range(progress,T.transition??.955,1);
    if(out>0){
      const exposure=ctx.createRadialGradient(w*.5,h*.42,0,w*.5,h*.42,Math.max(w,h)*.74);
      exposure.addColorStop(0,'rgba(255,248,236,'+(out*.18)+')');
      exposure.addColorStop(.55,'rgba(74,29,34,'+(out*.12)+')');
      exposure.addColorStop(1,'rgba(8,2,4,'+(out*.58)+')');
      ctx.fillStyle=exposure;
      ctx.fillRect(0,0,w,h);
    }
  }

  function idleFrame(now){
    if(destroyed||active||!ready)return;
    pointerX=mix(pointerX,pointerTX,.045);
    pointerY=mix(pointerY,pointerTY,.045);
    render(0,now-idleStartedAt);
    idleRaf=requestAnimationFrame(idleFrame);
  }

  function frame(now){
    if(!active||destroyed)return;
    const p=clamp((now-startedAt)/DURATION);
    fireEvents(p);render(p,now-startedAt);
    if(p<1) raf=requestAnimationFrame(frame); else active=false;
  }

  function play(){
    if(REDUCED||active||!ready||destroyed)return false;
    cancelAnimationFrame(idleRaf);
    pointerTX=pointerTY=0;
    active=true;progress=0;fired=new Set();startedAt=performance.now();fireEvents(0);
    raf=requestAnimationFrame(frame);return true;
  }

  function stop(){active=false;cancelAnimationFrame(raf);cancelAnimationFrame(idleRaf);}
  function destroy(){
    stop();destroyed=true;
    removeEventListener('resize',resize);
    removeEventListener('pointermove',onScenePointerMove);
    removeEventListener('pointerleave',onScenePointerLeave);
    ctx.clearRect(0,0,w,h);
  }
  function renderAt(p){if(!ready||destroyed)return false;stop();render(clamp(p),0);return true;}
  function renderKeyframe(stage){
    const value=K[String(stage).padStart(2,'0')];
    return typeof value==='number'?renderAt(value):false;
  }

  function onScenePointerMove(e){
    if(active||destroyed||w<760)return;
    pointerTX=clamp((e.clientX/w-.5)*2,-1,1);
    pointerTY=clamp((e.clientY/h-.5)*2,-1,1);
  }
  function onScenePointerLeave(){
    pointerTX=pointerTY=0;
  }

  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',onScenePointerMove,{passive:true});
  addEventListener('pointerleave',onScenePointerLeave,{passive:true});
  document.addEventListener('invitation:data',()=>{if(ready&&!active)render(progress,0);});
  document.addEventListener('wedding:language',()=>{if(ready&&!active)render(progress,0);});

  const readyPromise=preload();

  window.WeddingInvitationCanvas={
    play,stop,destroy,render:renderAt,renderAt,renderKeyframe,readyPromise,
    get ready(){return ready;},
    get duration(){return DURATION;},
    get progress(){return progress;}
  };
})();
