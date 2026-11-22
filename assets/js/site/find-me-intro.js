/* V25 Find Me wedding intro. Original Canvas 2D implementation based on the
 * interaction brief (not copied from an unaudited ZIP).
 * Drag either light toward the other; the connection becomes a rose-gold heart.
 * Zero images, network requests, WebGL or external libraries.
 */
(() => {
  'use strict';
  const intro=document.getElementById('invitationIntro');
  const scene=document.getElementById('findMeStage');
  const canvas=document.getElementById('findMeCanvas');
  const hint=document.getElementById('findMeHint');
  const result=document.getElementById('findMeResult');
  if(!intro||!scene||!canvas||!hint||!result)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width:760px), (pointer:coarse)');
  const translations={
    vi:{hint:'Kéo hai ánh sáng lại gần nhau ♡',success:'Giữa muôn người, mình tìm thấy nhau ♡'},
    en:{hint:'Bring the two lights together ♡',success:'Among so many, we found each other ♡'},
    ja:{hint:'ふたつの光を近づけてみてください ♡',success:'たくさんの出会いの中で、ふたりは巡り会えた ♡'}
  };
  const language=()=>window.WeddingI18n?.language||'vi';
  function localize(){
    const copy=translations[language()]||translations.vi;
    hint.textContent=window.WeddingI18n?.t?.('findme.hint')||copy.hint;
    result.textContent=window.WeddingI18n?.t?.('findme.success')||copy.success;
    scene.setAttribute('aria-label',copy.hint);
  }

  const souls=[
    {name:'Hải',x:.28,y:.44,light:'#ffdfba',glow:'#dca89c'},
    {name:'Mỹ',x:.72,y:.44,light:'#ffe0eb',glow:'#e0a0ba'}
  ];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  // Optional offline-prepared, transparent portrait sketches. Files are created
  // from approved real portraits ahead of deployment, never from visitors.
  // Missing files intentionally retain the original V25 two-souls animation.
  const portraitPaths=[
    '/assets/images/find-me/hai-sketch.svg',
    '/assets/images/find-me/my-sketch.svg'
  ];
  const portraits=portraitPaths.map(()=>({image:null,points:[],ready:false}));
  let portraitCount=0;
  function loadPortraits(){
    portraitPaths.forEach((src,index)=>{
      const img=new Image();
      img.decoding='async';
      img.onload=()=>{
        try{
          const sample=document.createElement('canvas');
          sample.width=96;sample.height=112;
          const c=sample.getContext('2d',{willReadFrequently:true});
          if(!c)return;
          c.clearRect(0,0,96,112);
          const ratio=Math.min(96/img.naturalWidth,112/img.naturalHeight);
          const w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;
          c.drawImage(img,(96-w)/2,(112-h)/2,w,h);
          const data=c.getImageData(0,0,96,112).data;
          const points=[];
          for(let y=2;y<110;y+=3)for(let x=2;x<94;x+=3){
            const offset=(y*96+x)*4,alpha=data[offset+3];
            const intensity=(data[offset]+data[offset+1]+data[offset+2])/3;
            if(alpha>65&&intensity>40 && ((x*17+y*13)%7!==0))
              points.push({x:x/96-.5,y:y/112-.5,a:alpha/255});
          }
          if(points.length<25)return;
          portraits[index]={image:img,points,ready:true};
          portraitCount=portraits.filter(p=>p.ready).length;
          paint(performance.now());
        }catch(_error){/* malformed or inaccessible assets fall back safely */}
      };
      img.onerror=()=>{};
      img.src=src;
    });
  }
  function drawPortrait(index,now){
    const portrait=portraits[index];
    if(!portrait.ready || reduced.matches || merged)return;
    const center=screenPoint(souls[index]);
    const scale=Math.min(width*.43,height*1.15);
    const x=center.x,y=center.y-height*.04;
    const reveal=clamp((now-(portraitStart||now))/1700,0,1);
    const count=Math.floor(portrait.points.length*reveal);
    ctx.save();
    ctx.shadowColor=index===0?'#efc49e':'#f2adc9';
    ctx.shadowBlur=4;
    ctx.fillStyle=index===0?'#ffdfba':'#ffe0eb';
    for(let i=0;i<count;i++){
      const p=portrait.points[i];
      ctx.globalAlpha=.28+.7*p.a;
      ctx.fillRect(x+p.x*scale,y+p.y*scale,1.5,1.5);
    }
    ctx.restore();
  }
  let portraitStart=0;

  let width=0,height=0,dpr=1,frameId=0,lastFrame=0;
  let visible=true,drag=null,merged=false,mergeAt=0,frameCount=0;
  let sparkleCount=0,finished=false,stars=[],sparks=[];
  const seedRandom=seed=>{
    let value=seed;
    return ()=>{value=(value*16807)%2147483647;return(value-1)/2147483646};
  };
  const random=seedRandom(122026);
  function createStars(){
    stars=Array.from({length:mobile.matches?22:40},(_,i)=>({
      x:random(),y:random()*.9,rad:.35+random()*.9,phase:i*.63
    }));
  }
  function createSparks(){
    const count=mobile.matches?48:120;
    sparkleCount=count;
    const rand=seedRandom(192026);
    sparks=Array.from({length:count},(_,i)=>({
      a:rand()*Math.PI*2,
      speed:.18+rand()*.75,
      size:.45+rand()*1.7,
      delay:rand()*.32,
      color:i%5===0?'#fff7dd':i%3===0?'#f2b5c4':'#eec7a7'
    }));
  }
  function screenPoint(soul){return{x:soul.x*width,y:soul.y*height};}
  function isCoverActive(){
    return !document.hidden &&
      !intro.classList.contains('is-opening') &&
      !intro.classList.contains('is-opened') &&
      !intro.classList.contains('is-bypassed') &&
      document.body.classList.contains('invitation-locked') &&
      document.documentElement.dataset.motion!=='off';
  }
  function shouldAnimate(){return isCoverActive() && visible && !reduced.matches &&
    document.documentElement.dataset.motion!=='minimal';}
  function stop(){if(frameId)cancelAnimationFrame(frameId);frameId=0;lastFrame=0;}
  function resize(){
    const rect=canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    width=rect.width;height=rect.height;
    dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    createStars();
    if(merged)createSparks();
    paint(performance.now());
  }
  function circle(x,y,r,color,alpha=1){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();ctx.restore();
  }
  function drawHeart(cx,cy,progress=1){
    const factor=Math.min(width/330,height/150)*2.6;
    ctx.save();
    ctx.beginPath();
    const steps=100;
    for(let i=0;i<=Math.ceil(steps*progress);i++){
      const t=2*Math.PI*i/steps;
      const x=16*Math.pow(Math.sin(t),3);
      const y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
      if(i===0)ctx.moveTo(cx+x*factor,cy+y*factor);
      else ctx.lineTo(cx+x*factor,cy+y*factor);
    }
    ctx.strokeStyle='#ffe5d7';
    ctx.lineWidth=2.1;ctx.lineCap='round';
    ctx.shadowColor='#f6a7b8';ctx.shadowBlur=13;ctx.stroke();
    if(progress>=.99){
      ctx.closePath();
      ctx.fillStyle='rgba(228,149,173,.38)';
      ctx.fill();
    }
    ctx.restore();
  }
  function drawSoul(s,now){
    const {x,y}=screenPoint(s);
    const radius=portraits.some(p=>p.ready)?Math.min(9,height*.07):Math.min(25,height*.18);
    const gradient=ctx.createRadialGradient(x,y,1,x,y,radius*2.2);
    gradient.addColorStop(0,s.light);
    gradient.addColorStop(.14,s.light);
    gradient.addColorStop(.33,s.glow+'bb');
    gradient.addColorStop(1,'rgba(205,142,160,0)');
    ctx.fillStyle=gradient;ctx.beginPath();
    ctx.arc(x,y,radius*2.2,0,2*Math.PI);ctx.fill();
    circle(x,y,Math.max(4.2,radius*.22),'#fffaf2');
    ctx.textAlign='center';
    ctx.font='500 '+Math.max(10,Math.min(13,height*.09))+'px Georgia,serif';
    ctx.fillStyle='#ffebdf';ctx.fillText(s.name,x,portraits.some(p=>p.ready)?height*.84:y+radius+21);
  }
  function paint(now=0){
    if(!width||!height)return;
    ctx.clearRect(0,0,width,height);
    // A subtle starfield stays within the original paper invitation, rather
    // than adding another full-screen black splash.
    const bg=ctx.createLinearGradient(0,0,width,height);
    bg.addColorStop(0,'#39252f');
    bg.addColorStop(.5,'#432b37');
    bg.addColorStop(1,'#35232e');
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(const s of stars)circle(s.x*width,s.y*height,s.rad,'#ffedda',
      .19+.3*(.5+.5*Math.sin(now*.0015+s.phase)));
    if(!merged && !reduced.matches){
      const a=screenPoint(souls[0]),b=screenPoint(souls[1]);
      ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);
      ctx.quadraticCurveTo(width*.5,height*.15,b.x,b.y);
      const gap=Math.hypot(a.x-b.x,a.y-b.y);
      ctx.globalAlpha=clamp(1-gap/(width*.9),.16,.72);
      ctx.strokeStyle='#e6b3a8';ctx.lineWidth=1.3;
      ctx.setLineDash([3,6]);ctx.stroke();ctx.restore();
      souls.forEach((s,i)=>{drawPortrait(i,now);drawSoul(s,now);});
    } else {
      const cx=width*.5,cy=height*.48;
      const age=reduced.matches?4000:Math.max(0,now-mergeAt);
      const trace=clamp(age/850,0,1);
      drawHeart(cx,cy,trace);
      if(!reduced.matches){
        for(const p of sparks){
          const t=(age/1000-p.delay);
          if(t<=0||t>=1.55)continue;
          const range=Math.min(width*.34,95)*p.speed*t*2;
          const x=cx+Math.cos(p.a)*range;
          const y=cy+Math.sin(p.a)*range-13*t*t;
          circle(x,y,p.size,p.color,(1-t/1.55)*.82);
        }
      }
    }
  }
  function render(now){
    frameId=0;
    if(!shouldAnimate()){stop();return;}
    const interval=mobile.matches?1000/30:1000/60;
    if(!lastFrame||now-lastFrame>=interval){
      lastFrame=now;frameCount++;
      paint(now);
    }
    if(merged && now-mergeAt>2600){
      finished=true;paint(now);stop();return;
    }
    frameId=requestAnimationFrame(render);
  }
  function reconcile(){
    if(!shouldAnimate() || finished){stop();paint(performance.now());return;}
    if(!frameId)frameId=requestAnimationFrame(render);
  }
  function pointerCoords(event){
    const r=canvas.getBoundingClientRect();
    return{x:event.clientX-r.left,y:event.clientY-r.top};
  }
  function merge(){
    if(merged)return;
    merged=true;finished=false;mergeAt=performance.now();
    hint.hidden=true;result.hidden=false;
    createSparks();
    paint(mergeAt+1);
    reconcile();
  }
  canvas.addEventListener('pointerdown',event=>{
    if(merged||!shouldAnimate())return;
    const {x,y}=pointerCoords(event);
    const candidates=souls.map((s,i)=>({...screenPoint(s),i}))
      .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
    const closest=candidates[0];
    if(!closest || Math.hypot(closest.x-x,closest.y-y)>52)return;
    drag={pointerId:event.pointerId,index:closest.i};
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.pointerId!==event.pointerId||merged)return;
    const {x,y}=pointerCoords(event);
    souls[drag.index].x=clamp(x/Math.max(1,width),.09,.91);
    souls[drag.index].y=clamp(y/Math.max(1,height),.17,.68);
    if(Math.hypot(souls[0].x*width-souls[1].x*width,
                  souls[0].y*height-souls[1].y*height)
       <Math.min(70,width*.21)){
      drag=null;merge();
    }else paint(performance.now());
    event.preventDefault();
  });
  function finishPointer(event){
    if(drag?.pointerId!==event.pointerId)return;
    drag=null;
    if(!merged)paint(performance.now());
  }
  canvas.addEventListener('pointerup',finishPointer);
  canvas.addEventListener('pointercancel',finishPointer);
  window.addEventListener('resize',resize,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(scene);
  if('IntersectionObserver' in window)
    new IntersectionObserver(entries=>{
      visible=entries.some(x=>x.isIntersecting);
      reconcile();
    },{threshold:.05}).observe(scene);
  document.addEventListener('wedding:language',localize);
  document.addEventListener('wedding:invitation-opened',stop);
  document.addEventListener('visibilitychange',reconcile);
  new MutationObserver(reconcile).observe(intro,{attributes:true,attributeFilter:['class']});
  new MutationObserver(reconcile).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener?.('change',()=>{if(reduced.matches){merged=true;finished=true;}resize();reconcile()});
  mobile.addEventListener?.('change',()=>{createStars();if(merged)createSparks();resize();reconcile()});
  window.addEventListener('pagehide',stop,{passive:true});
  window.addEventListener('pageshow',reconcile,{passive:true});
  scene.classList.add('is-enhanced');
  portraitStart=performance.now();
  loadPortraits();
  localize();
  resize();
  if(reduced.matches){
    merged=true;finished=true;hint.hidden=false;result.hidden=true;
    paint(performance.now());
  }
  reconcile();
  window.WeddingFindMe={
    status:()=>({running:Boolean(frameId),merged,finished,frames:frameCount,
      sparks:sparkleCount,portraits:portraitCount,visible,width:Math.round(width),height:Math.round(height)})
  };
})();
