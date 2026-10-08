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
    return {
      scale,
      x:(w-sceneW)/2,
      y:Math.max(12,(h-sceneH)/2 - (w<760?8:10)),
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
    const g=ctx.createRadialGradient(w*.5,h*.34,20,w*.5,h*.45,Math.max(w,h)*.8);
    g.addColorStop(0,'#4B0E1A');g.addColorStop(.48,'#25060D');g.addColorStop(1,'#0D0104');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

    const floorY=sy(Number(DS.floorY||245),S);
    const floor=ctx.createLinearGradient(0,floorY,0,h);
    floor.addColorStop(0,'rgba(255,247,234,.02)');
    floor.addColorStop(.55,'rgba(247,231,204,.10)');
    floor.addColorStop(1,'rgba(235,207,173,.22)');
    ctx.fillStyle=floor;ctx.fillRect(0,floorY,w,h-floorY);

    const dots=[[.08,.14,34],[.18,.07,20],[.84,.13,28],[.92,.30,18],[.12,.56,22],[.78,.69,18]];
    dots.forEach((d,i)=>{
      const pulse=.7+.15*Math.sin(time*.001+i);
      const rg=ctx.createRadialGradient(w*d[0],h*d[1],0,w*d[0],h*d[1],d[2]);
      rg.addColorStop(0,'rgba(190,90,58,'+(.09*pulse)+')');
      rg.addColorStop(1,'rgba(190,90,58,0)');
      ctx.fillStyle=rg;ctx.fillRect(w*d[0]-d[2],h*d[1]-d[2],d[2]*2,d[2]*2);
    });

    const bloom=range(p,T.cardClear??.68,T.cardPresented??.84);
    if(bloom>0){
      const rr=Math.min(w,h)*(.20+.10*bloom);
      const rg=ctx.createRadialGradient(w*.5,sy(132,S),0,w*.5,sy(132,S),rr);
      rg.addColorStop(0,'rgba(246,191,96,'+(.22*bloom)+')');
      rg.addColorStop(1,'rgba(181,81,37,0)');
      ctx.fillStyle=rg;ctx.fillRect(w*.5-rr,sy(132,S)-rr,rr*2,rr*2);
    }
  }

  function drawDust(p,time){
    const reveal=.25+range(p,.08,.42)*.75;
    for(let i=0;i<dust.length;i++){
      const d=dust[i];
      const x=d.x*w+Math.sin(time*.00045+d.phase)*6;
      const y=d.y*h+Math.cos(time*.00031+d.phase)*4;
      ctx.save();ctx.globalAlpha=d.alpha*reveal*(.58+.42*Math.sin(time*.002+d.phase));
      ctx.fillStyle=i%4?'#DCAA55':'#FFE0A1';ctx.shadowColor='rgba(237,185,86,.6)';ctx.shadowBlur=6;
      ctx.beginPath();ctx.arc(x,y,d.r,0,TAU);ctx.fill();ctx.restore();
    }
  }

  function drawFlorals(S,p){
    const l=DS.floralLeft||{x:-28,y:58,w:118,h:158};
    const r=DS.floralRight||{x:155,y:105,w:88,h:118};
    const alpha=.92+range(p,.2,.52)*.08;
    drawImage(images.floralLeft,sx(l.x,S),sy(l.y,S),ss(l.w,S),ss(l.h,S),alpha);
    drawImage(images.floralRight,sx(r.x,S),sy(r.y,S),ss(r.w,S),ss(r.h,S),alpha*.88);
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
    const E=DS.envelope||{x:10,w:200,h:122};
    const y=envYFor(p);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=ss(8,S);ctx.shadowOffsetY=ss(5,S);
    ctx.drawImage(images.envelopeBack,sx(E.x,S),sy(y,S),ss(E.w,S),ss(E.h,S));ctx.restore();
  }

  function drawFlap(S,p){
    const E=DS.envelope||{x:10,w:200};
    const y=envYFor(p);
    const flapProgress=range(p,T.flapOpen??.20,T.flapOpenDone??.38);
    const flapH=84;
    if(flapProgress<=0){
      ctx.drawImage(images.envelopeFlap,sx(E.x,S),sy(y,S),ss(E.w,S),ss(flapH,S));
      return;
    }
    if(flapProgress<.5){
      const t=ease(flapProgress/.5);
      ctx.drawImage(images.envelopeFlap,sx(E.x,S),sy(y,S),ss(E.w,S),Math.max(2,ss(flapH*(1-t),S)));
    }else{
      const t=easeOut((flapProgress-.5)/.5);
      const L=DS.lining||{x:10,y03:106,w:200,h:84};
      const ly=mix(Number(L.y03||106),Number(L.y04||111),range(p,.20,.53));
      ctx.save();
      ctx.translate(sx(L.x,S),sy(y,S));
      ctx.scale(1,-1);
      ctx.drawImage(images.lining,0,0,ss(L.w,S),Math.max(2,ss((L.h||84)*t,S)));
      ctx.restore();
    }
  }

  function drawFrontPocket(S,p){
    const E=DS.envelope||{x:10,w:200,h:122};
    const y=envYFor(p);
    ctx.drawImage(images.envelopeFront,sx(E.x,S),sy(y,S),ss(E.w,S),ss(E.h,S));
  }

  function drawCordSeal(S,p){
    const E=DS.envelope||{x:10,w:200,h:122};
    const y=envYFor(p);
    const cordP=range(p,T.cordLoose??.16,.34);
    const sealP=range(p,T.sealOpen??.10,.26);

    ctx.save();ctx.globalAlpha=1-cordP*.58;
    ctx.translate(ss(cordP*5,S),ss(cordP*4,S));ctx.rotate(cordP*.03);
    ctx.drawImage(images.cord,sx(E.x,S),sy(y,S),ss(E.w,S),ss(E.h,S));ctx.restore();

    const S0=DS.seal||{x:92,y:214,w:36,h:36};
    const dy=y-Number(E.closedY||164);
    const x0=Number(S0.x||92), y0=Number(S0.y||214)+dy;
    const x=x0+sealP*18, yy=y0+sealP*10, size=Number(S0.w||36)*(1-sealP*.16);
    ctx.save();
    ctx.translate(sx(x+size/2,S),sy(yy+size/2,S));ctx.rotate(sealP*.14);ctx.globalAlpha=1-sealP*.22;
    ctx.drawImage(images.seal,-ss(size/2,S),-ss(size/2,S),ss(size,S),ss(size,S));ctx.restore();
  }

  function drawCardText(x,y,cw,ch,S){
    const d=data(),t=C.typography||{};
    const cx=x+cw*.5;
    ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillStyle='#7A2230';
    ctx.font=`${Math.max(12,ss(cw*.132,S))}px "Great Vibes","Cormorant Garamond",Georgia,serif`;
    ctx.fillText('H & M',sx(cx,S),sy(y+ch*(t.monogramY||.22),S));
    ctx.fillStyle='#69202A';
    ctx.font=`500 ${Math.max(6,ss(cw*.055,S))}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.groom,sx(cx,S),sy(y+ch*(t.groomY||.40),S));
    ctx.font=`500 ${Math.max(6,ss(cw*.049,S))}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText('&',sx(cx,S),sy(y+ch*(t.ampY||.465),S));
    ctx.font=`500 ${Math.max(6,ss(cw*.055,S))}px "Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.bride,sx(cx,S),sy(y+ch*(t.brideY||.53),S));
    ctx.fillStyle='#7D4C34';
    ctx.font=`500 ${Math.max(5,ss(cw*.039,S))}px "Lora",Georgia,serif`;
    ctx.fillText(d.date,sx(cx,S),sy(y+ch*(t.dateY||.665),S));
    ctx.fillStyle='#8B5D43';
    ctx.font=`${Math.max(7,ss(cw*.069,S))}px "Great Vibes","Cormorant Garamond",Georgia,serif`;
    ctx.fillText(d.script,sx(cx,S),sy(y+ch*(t.scriptY||.80),S));
  }

  function cardRectFor(p){
    const c4=DS.card04||{x:58,y:135,w:106,h:146};
    const c5=DS.card05||{x:57,y:74,w:108,h:149};
    const c6=DS.card06||{x:60,y:70,w:102,h:140};
    if(p<.36) return null;
    if(p<.68){
      const t=ease(range(p,.36,.68));
      return {
        x:mix(c4.x,c5.x,t*.42),y:mix(c4.y,c5.y,t*.42),
        w:mix(c4.w,c5.w,t*.42),h:mix(c4.h,c5.h,t*.42)
      };
    }
    if(p<.94){
      const t=ease(range(p,.68,.86));
      return {x:mix(c4.x,c5.x,t),y:mix(c4.y,c5.y,t),w:mix(c4.w,c5.w,t),h:mix(c4.h,c5.h,t)};
    }
    const t=ease(range(p,.94,1));
    return {x:mix(c5.x,c6.x,t),y:mix(c5.y,c6.y,t),w:mix(c5.w,c6.w,t),h:mix(c5.h,c6.h,t)};
  }

  function drawCard(S,p,clipped){
    const R=cardRectFor(p); if(!R) return;
    const draw=()=>{
      ctx.save();
      ctx.shadowColor='rgba(0,0,0,'+mix(.10,.26,range(p,.36,.84))+')';
      ctx.shadowBlur=ss(mix(2,8,range(p,.36,.84)),S);
      ctx.shadowOffsetY=ss(mix(1,4,range(p,.36,.84)),S);
      ctx.drawImage(images.card,sx(R.x,S),sy(R.y,S),ss(R.w,S),ss(R.h,S));
      ctx.restore();
      drawCardText(R.x,R.y,R.w,R.h,S);
    };
    if(clipped){
      const E=DS.envelope||{x:10,w:200,h:122};
      const y=envYFor(p);
      ctx.save();ctx.beginPath();ctx.rect(sx(E.x,S),0,ss(E.w,S),sy(y+(E.h||122),S));ctx.clip();draw();ctx.restore();
    }else draw();
  }

  function drawPetals(p,time){
    if(!images.petals?.length||p<.18)return;
    const reveal=range(p,.18,.42);
    for(const pt of petals){
      const tt=((time*.000028*pt.speed)+pt.y)%1.22;
      const x=pt.x*w+Math.sin(time*.00056+pt.phase)*18;
      const y=tt*h;
      const img=images.petals[pt.asset%images.petals.length],sz=pt.size;
      ctx.save();ctx.globalAlpha=pt.alpha*reveal;ctx.translate(x,y);ctx.rotate(time*.00025*pt.spin+pt.phase);
      ctx.drawImage(img,-sz,-sz*.55,sz*2,sz*1.1);ctx.restore();
    }
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

    const out=range(progress,T.transition??.94,1);
    if(out>0){
      ctx.fillStyle='rgba(13,1,4,'+(out*.62)+')';
      ctx.fillRect(0,0,w,h);
    }
  }

  function frame(now){
    if(!active||destroyed)return;
    const p=clamp((now-startedAt)/DURATION);
    fireEvents(p);render(p,now-startedAt);
    if(p<1) raf=requestAnimationFrame(frame); else active=false;
  }

  function play(){
    if(REDUCED||active||!ready||destroyed)return false;
    active=true;progress=0;fired=new Set();startedAt=performance.now();fireEvents(0);
    raf=requestAnimationFrame(frame);return true;
  }

  function stop(){active=false;cancelAnimationFrame(raf);}
  function destroy(){stop();destroyed=true;removeEventListener('resize',resize);ctx.clearRect(0,0,w,h);}
  function renderAt(p){if(!ready||destroyed)return false;stop();render(clamp(p),0);return true;}
  function renderKeyframe(stage){
    const value=K[String(stage).padStart(2,'0')];
    return typeof value==='number'?renderAt(value):false;
  }

  addEventListener('resize',resize,{passive:true});
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
