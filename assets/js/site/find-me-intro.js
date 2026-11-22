/* Find Me V26 — automatic golden particle portrait reveal.
 * Uses the approved wedding image only; no drag, merge, or heart effect.
 * Particles converge on actual image pixels. A sharp image replaces them at 5s.
 */
(() => {
  'use strict';
  const intro=document.getElementById('invitationIntro');
  const stage=document.getElementById('findMeStage');
  const canvas=document.getElementById('findMeCanvas');
  const hint=document.getElementById('findMeHint');
  const result=document.getElementById('findMeResult');
  if(!intro||!stage||!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width:760px), (pointer:coarse)');
  const TEXT={
    vi:'Từng điểm sáng, một câu chuyện của Hải & Mỹ',
    en:'A thousand lights, one story of Hải & Mỹ',
    ja:'ひとつひとつの光が、ふたりの物語になる'
  };
  function localize(){
    const language=window.WeddingI18n?.language||'vi';
    const label=TEXT[language]||TEXT.vi;
    if(hint)hint.textContent=label;
    stage.setAttribute('aria-label',label);
  }
  if(result)result.hidden=true;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
  function seeded(seed){
    let a=seed>>>0;
    return ()=>{a=(Math.imul(1664525,a)+1013904223)>>>0;return a/4294967296};
  }
  let image=null,width=0,height=0,dpr=1,frameId=0,frames=0;
  let particles=[],stars=[],visible=true,finished=false,startedAt=0,elapsed=0,wasActive=false;
  let previous=0;
  const DURATION=5000, FULL_REVEAL_AT=3650;
  function active(){
    return !document.hidden &&
      document.body.classList.contains('invitation-locked') &&
      !intro.classList.contains('is-opening') &&
      !intro.classList.contains('is-opened') &&
      !intro.classList.contains('is-bypassed');
  }
  function animated(){return !reduce.matches &&
    document.documentElement.dataset.motion!=='off' &&
    document.documentElement.dataset.motion!=='minimal';}
  function stop(){if(frameId)cancelAnimationFrame(frameId);frameId=0;previous=0;}
  function imageRect(){
    if(!image)return {x:0,y:0,w:width,h:height};
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
    const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    return {x:(width-w)/2,y:(height-h)/2,w,h};
  }
  function prepare(){
    if(!image||!width||!height)return;
    const rect=imageRect();
    const sample=document.createElement('canvas');
    const sw=236,sh=Math.max(1,Math.round(sw*image.naturalHeight/image.naturalWidth));
    sample.width=sw;sample.height=sh;
    const sc=sample.getContext('2d',{willReadFrequently:true});
    if(!sc)return;
    sc.drawImage(image,0,0,sw,sh);
    let data;
    try{data=sc.getImageData(0,0,sw,sh).data;}catch(_){return;}
    const rnd=seeded(20261220),candidates=[];
    const at=(x,y)=>{const i=(y*sw+x)*4;return [data[i],data[i+1],data[i+2],data[i+3]]};
    // Prefer illuminated outlines / edges, while retaining a few interior pixels.
    for(let y=2;y<sh-2;y+=2){
      for(let x=2;x<sw-2;x+=2){
        const [r,g,b,a]=at(x,y);
        if(a<75)continue;
        const light=(r*.3+g*.59+b*.11)/255;
        const [rr,gg,bb]=at(x+2,y);
        const [lr,lg,lb]=at(x-2,y);
        const edge=Math.min(1,(Math.abs(rr-lr)+Math.abs(gg-lg)+Math.abs(bb-lb))/185);
        const chance=.12+.65*edge+.26*light;
        if(rnd()>chance)continue;
        candidates.push({
          x:rect.x+(x+.5)/sw*rect.w,
          y:rect.y+(y+.5)/sh*rect.h,
          color:'rgb('+r+','+g+','+b+')',
          alpha:clamp(a/255,.3,1),
          light,edge
        });
      }
    }
    const budget=mobile.matches?650:1700;
    // Deterministic shuffle distributes the portrait details evenly over time.
    for(let i=candidates.length-1;i>0;i--){
      const j=Math.floor(rnd()*(i+1));
      [candidates[i],candidates[j]]=[candidates[j],candidates[i]];
    }
    particles=candidates.slice(0,budget).map((p,i)=>{
      const angle=rnd()*Math.PI*2;
      const spread=Math.max(width,height)*(.45+rnd()*.55);
      return {...p,
        fromX:width*.5+Math.cos(angle)*spread,
        fromY:height*.5+Math.sin(angle)*spread*.65,
        delay:rnd()*1350,
        radius:.55+rnd()*.75,
        drift:rnd()*Math.PI*2,
        speed:.7+rnd()*.6
      };
    });
    stars=Array.from({length:mobile.matches?16:27},()=>({
      x:rnd()*width,y:rnd()*height,r:.35+rnd()*.65,phase:rnd()*6.28
    }));
  }
  function background(now){
    const bg=ctx.createRadialGradient(width*.5,height*.4,0,width*.5,height*.5,Math.max(width,height)*.67);
    bg.addColorStop(0,'#3b2422');
    bg.addColorStop(.55,'#24161b');
    bg.addColorStop(1,'#140e13');
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(const s of stars){
      ctx.fillStyle='rgba(255,205,145,'+(.15+.2*(.5+.5*Math.sin(now*.001+s.phase)))+')';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    }
  }
  function paint(now=0){
    if(!width||!height)return;
    background(now);
    if(!image)return;
    const rect=imageRect();
    const t=finished?DURATION:elapsed;
    const reveal=smooth((t-FULL_REVEAL_AT)/(DURATION-FULL_REVEAL_AT));
    if(finished||!animated()){
      ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h);
      return;
    }
    // Low opacity early silhouette gives continuity, but pixels stay crisp at the end.
    if(t>2150){
      ctx.save();
      ctx.globalAlpha=.09*smooth((t-2150)/1050)+.91*reveal;
      ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h);
      ctx.restore();
    }
    ctx.save();
    const fade=1-smooth((t-3500)/1300);
    for(const p of particles){
      const pt=smooth((t-p.delay)/(2850*p.speed));
      if(pt<=0)continue;
      const spiral=(1-pt)*Math.sin(p.drift+t*.002)*15;
      const x=p.fromX+(p.x-p.fromX)*pt+spiral;
      const y=p.fromY+(p.y-p.fromY)*pt;
      const strength=Math.min(1,pt*5)*fade*p.alpha;
      if(strength<.015)continue;
      ctx.globalAlpha=strength;
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(x,y,p.radius*(.7+.35*p.light),0,Math.PI*2);
      ctx.fill();
      if(p.edge>.5&&p.radius>1.0&&t<3550){
        ctx.globalAlpha=strength*.2;
        ctx.beginPath();ctx.arc(x,y,p.radius*2.3,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
  function finish(){
    finished=true;elapsed=DURATION;
    stop();paint(performance.now());
    stage.classList.add('is-complete');
    if(hint)hint.classList.add('is-complete');
  }
  function render(now){
    frameId=0;
    if(!active()||!visible){stop();return;}
    if(!image){stop();return;}
    if(!animated()){finish();return;}
    if(!startedAt)startedAt=now-elapsed;
    const interval=mobile.matches?1000/30:1000/60;
    if(previous&&now-previous<interval){
      frameId=requestAnimationFrame(render);return;
    }
    previous=now;frames++;
    elapsed=clamp(now-startedAt,0,DURATION);
    if(elapsed>=DURATION){finish();return;}
    paint(now);
    frameId=requestAnimationFrame(render);
  }
  function reconcile(){
    if(!active()||!visible){stop();return;}
    if(!image)return;
    if(!animated()){finish();return;}
    if(finished){paint(performance.now());return;}
    if(!frameId){
      startedAt=performance.now()-elapsed;previous=0;
      frameId=requestAnimationFrame(render);
    }
  }
  function resize(){
    const r=canvas.getBoundingClientRect();
    if(r.width<1||r.height<1)return;
    width=r.width;height=r.height;
    dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    prepare();paint(performance.now());reconcile();
  }
  function load(){
    const src=window.WeddingFindMePortraitData;
    if(!src)return;
    const img=new Image();
    img.decoding='async';
    img.onload=()=>{
      image=img;prepare();
      if(!animated())finish();
      else {paint(performance.now());reconcile();}
    };
    img.onerror=()=>{stage.classList.add('is-image-failed');};
    img.src=src;
  }
  window.addEventListener('resize',resize,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    reconcile();
  },{threshold:.01}).observe(stage);
  document.addEventListener('visibilitychange',reconcile);
  document.addEventListener('wedding:language',localize);
  document.addEventListener('wedding:invitation-opened',stop);
  new MutationObserver(reconcile).observe(intro,{attributes:true,attributeFilter:['class']});
  new MutationObserver(reconcile).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  reduce.addEventListener?.('change',()=>{if(reduce.matches)finish();else reconcile();});
  mobile.addEventListener?.('change',()=>{prepare();reconcile();});
  window.addEventListener('pagehide',stop,{passive:true});
  window.addEventListener('pageshow',reconcile,{passive:true});
  stage.classList.add('is-enhanced');
  localize();resize();load();reconcile();
  window.WeddingFindMe={
    status:()=>({running:!!frameId,finished,frames,elapsed:Math.round(elapsed),
      duration:DURATION,particles:particles.length,photoLoaded:!!image,
      automatic:true,visible,width:Math.round(width),height:Math.round(height)})
  };
})();
