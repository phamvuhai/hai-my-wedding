/* Self-contained cinematic pointer engine. Loaded before motion.js. */
(()=>{
  'use strict';
  function init({ mode, reduce, coarse, body, qs, qsa }) {
    const disabled = reduce || coarse || mode === 'minimal';
    const existing = qs('.motion-cursor');

    if (disabled) {
      existing?._motionCleanup?.();
      existing?.remove();
      qs('.motion-silk-canvas')?.remove();
      qsa('.motion-cursor-trail').forEach(el => el.remove());
      body.classList.remove('context-cursor-enabled','cinematic-cursor-enabled');
      return;
    }

    if (existing) {
      existing.dataset.motionMode = mode;
      body.classList.add('context-cursor-enabled','cinematic-cursor-enabled');
      return;
    }

    body.classList.add('context-cursor-enabled','cinematic-cursor-enabled');

    const silk = document.createElement('canvas');
    silk.className = 'motion-silk-canvas';
    silk.setAttribute('aria-hidden','true');
    body.appendChild(silk);
    const silkCtx = silk.getContext('2d',{alpha:true});

    const cursor = document.createElement('div');
    cursor.className = 'motion-cursor motion-cursor-cinematic';
    cursor.dataset.theme = 'wine';
    cursor.dataset.section = 'default';
    cursor.dataset.action = 'default';
    cursor.dataset.motionMode = mode;
    cursor.setAttribute('aria-hidden','true');
    cursor.innerHTML = [
      '<span class="motion-cursor-aura"></span>',
      '<span class="motion-cursor-ring"></span>',
      '<span class="motion-cursor-core"></span>',
      '<span class="motion-cursor-label"></span>'
    ].join('');
    body.appendChild(cursor);

    const aura = qs('.motion-cursor-aura',cursor);
    const ring = qs('.motion-cursor-ring',cursor);
    const core = qs('.motion-cursor-core',cursor);
    const label = qs('.motion-cursor-label',cursor);

    let targetX = innerWidth*.5;
    let targetY = innerHeight*.5;
    let ringX = targetX;
    let ringY = targetY;
    let auraX = targetX;
    let auraY = targetY;
    let labelX = targetX;
    let labelY = targetY;
    let lastX = targetX;
    let lastY = targetY;
    let lastMoveAt = performance.now();
    let frame = 0;
    let dpr = 1;

    const trail = [];
    const particles = [];
    let lastSparkAt = 0;

    let activeGalleryPhoto = null;
    let activeStory = null;
    let activeCount = null;
    let activeEvent = null;
    let activeRsvp = null;

    const clamp01 = v => Math.max(0,Math.min(1,v));

    const resizeSilk = () => {
      if (!silkCtx) return;
      dpr = Math.min(devicePixelRatio||1,2);
      silk.width = Math.max(1,Math.round(innerWidth*dpr));
      silk.height = Math.max(1,Math.round(innerHeight*dpr));
      silk.style.width = innerWidth+'px';
      silk.style.height = innerHeight+'px';
      silkCtx.setTransform(dpr,0,0,dpr,0,0);
    };
    resizeSilk();

    const setLabel = value => {
      const next=value||'';
      if (label.textContent!==next) label.textContent=next;
      cursor.classList.toggle('has-label',Boolean(next));
    };

    const clearStory = () => {
      if (!activeStory) return;
      ['--story-pointer-x','--story-pointer-y','--story-pointer-rotate','--story-light-x','--story-light-y','--story-back-x','--story-back-y','--story-mid-x','--story-mid-y']
        .forEach(k=>activeStory.style.removeProperty(k));
      activeStory=null;
    };

    const setStoryPointer = (story,x,y) => {
      if (activeStory && activeStory!==story) clearStory();
      activeStory=story;
      if (!story) return;
      const r=story.getBoundingClientRect();
      const nx=clamp01((x-r.left)/Math.max(1,r.width));
      const ny=clamp01((y-r.top)/Math.max(1,r.height));
      const dx=(nx-.5)*2,dy=(ny-.5)*2;
      story.style.setProperty('--story-pointer-x',`${(dx*5.5).toFixed(2)}px`);
      story.style.setProperty('--story-pointer-y',`${(dy*4).toFixed(2)}px`);
      story.style.setProperty('--story-pointer-rotate',`${(dx*.48).toFixed(3)}deg`);
      story.style.setProperty('--story-back-x',`${(-dx*4.1).toFixed(2)}px`);
      story.style.setProperty('--story-back-y',`${(-dy*3).toFixed(2)}px`);
      story.style.setProperty('--story-mid-x',`${(-dx*2.1).toFixed(2)}px`);
      story.style.setProperty('--story-mid-y',`${(-dy*1.5).toFixed(2)}px`);
      story.style.setProperty('--story-light-x',`${(nx*100).toFixed(1)}%`);
      story.style.setProperty('--story-light-y',`${(ny*100).toFixed(1)}%`);
    };

    const resetGalleryNeighbors = () => {
      const gallery=qs('#homeGallery');
      if (!gallery) return;
      qsa('.home-photo',gallery).forEach(photo=>{
        photo.style.removeProperty('--gallery-neighbor-x');
        photo.style.removeProperty('--gallery-neighbor-y');
      });
    };

    const setGalleryPointer = (photo,x,y) => {
      if (activeGalleryPhoto && activeGalleryPhoto!==photo) {
        activeGalleryPhoto.classList.remove('cursor-photo-active');
        resetGalleryNeighbors();
      }
      activeGalleryPhoto=photo;
      if (!photo) return;

      const r=photo.getBoundingClientRect();
      const nx=clamp01((x-r.left)/Math.max(1,r.width));
      const ny=clamp01((y-r.top)/Math.max(1,r.height));
      photo.style.setProperty('--gallery-pointer-x',`${(nx*100).toFixed(1)}%`);
      photo.style.setProperty('--gallery-pointer-y',`${(ny*100).toFixed(1)}%`);
      photo.classList.add('cursor-photo-active');

      if (mode==='wow') {
        const gallery=photo.closest('.home-gallery');
        if (gallery) {
          qsa('.home-photo',gallery).forEach(other=>{
            if (other===photo) {
              other.style.setProperty('--gallery-neighbor-x','0px');
              other.style.setProperty('--gallery-neighbor-y','0px');
              return;
            }
            const o=other.getBoundingClientRect();
            const cx=o.left+o.width/2,cy=o.top+o.height/2;
            const dx=cx-x,dy=cy-y;
            const dist=Math.max(90,Math.hypot(dx,dy));
            const strength=Math.max(0,1-dist/720)*3.8;
            other.style.setProperty('--gallery-neighbor-x',`${((dx/dist)*strength).toFixed(2)}px`);
            other.style.setProperty('--gallery-neighbor-y',`${((dy/dist)*strength).toFixed(2)}px`);
          });
        }
      }
    };

    const setCountdownPointer = (cell,x,y) => {
      if (activeCount && activeCount!==cell) activeCount.classList.remove('cursor-count-active');
      activeCount=cell;
      if (!cell) return;
      const r=cell.getBoundingClientRect();
      cell.style.setProperty('--count-light-x',`${(clamp01((x-r.left)/Math.max(1,r.width))*100).toFixed(1)}%`);
      cell.style.setProperty('--count-light-y',`${(clamp01((y-r.top)/Math.max(1,r.height))*100).toFixed(1)}%`);
      cell.classList.add('cursor-count-active');
    };

    const setEventPointer = (card,x,y) => {
      if (activeEvent && activeEvent!==card) activeEvent.classList.remove('cursor-event-active');
      activeEvent=card;
      if (!card) return;
      const r=card.getBoundingClientRect();
      card.style.setProperty('--event-light-x',`${(clamp01((x-r.left)/Math.max(1,r.width))*100).toFixed(1)}%`);
      card.style.setProperty('--event-light-y',`${(clamp01((y-r.top)/Math.max(1,r.height))*100).toFixed(1)}%`);
      card.classList.add('cursor-event-active');
    };

    const setRsvpPointer = (form,x,y) => {
      if (activeRsvp && activeRsvp!==form) activeRsvp.classList.remove('cursor-rsvp-active');
      activeRsvp=form;
      if (!form) return;
      const r=form.getBoundingClientRect();
      form.style.setProperty('--rsvp-light-x',`${(clamp01((x-r.left)/Math.max(1,r.width))*100).toFixed(1)}%`);
      form.style.setProperty('--rsvp-light-y',`${(clamp01((y-r.top)/Math.max(1,r.height))*100).toFixed(1)}%`);
      form.classList.add('cursor-rsvp-active');
    };

    const setHeroPointer = (hero,x,y) => {
      if (!hero) return;
      const r=hero.getBoundingClientRect();
      const nx=clamp01((x-r.left)/Math.max(1,r.width));
      const ny=clamp01((y-r.top)/Math.max(1,r.height));
      const dx=(nx-.5)*2,dy=(ny-.5)*2;
      hero.style.setProperty('--cinema-x',`${(nx*100).toFixed(1)}%`);
      hero.style.setProperty('--cinema-y',`${(ny*100).toFixed(1)}%`);
      hero.style.setProperty('--hero-copy-pointer-x',`${(-dx*5).toFixed(2)}px`);
      hero.style.setProperty('--hero-copy-pointer-y',`${(-dy*3).toFixed(2)}px`);
      hero.style.setProperty('--hero-photo-pointer-x',`${(dx*9).toFixed(2)}px`);
      hero.style.setProperty('--hero-photo-pointer-y',`${(dy*6).toFixed(2)}px`);
      hero.style.setProperty('--hero-full-pointer-x',`${(dx*5).toFixed(2)}px`);
      hero.style.setProperty('--hero-full-pointer-y',`${(dy*3.3).toFixed(2)}px`);
      hero.style.setProperty('--hero-curtain-pointer-x',`${(-dx*2.5).toFixed(2)}px`);
      hero.style.setProperty('--hero-curtain-pointer-y',`${(-dy*1.5).toFixed(2)}px`);
      hero.style.setProperty('--hero-decor-pointer-x',`${(dx*14).toFixed(2)}px`);
      hero.style.setProperty('--hero-decor-pointer-y',`${(dy*8).toFixed(2)}px`);
    };

    const setForeverPointer = (section,x,y) => {
      if (!section) return;
      const r=section.getBoundingClientRect();
      section.style.setProperty('--forever-light-x',`${(clamp01((x-r.left)/Math.max(1,r.width))*100).toFixed(1)}%`);
      section.style.setProperty('--forever-light-y',`${(clamp01((y-r.top)/Math.max(1,r.height))*100).toFixed(1)}%`);
    };

    const sectionInfo = target => {
      if (!target?.closest) return {section:'default',theme:'wine'};
      if (target.closest('.invitation-intro')) return {section:'opening',theme:'light'};
      if (target.closest('.photo-lightbox,.album-overlay')) return {section:'gallery',theme:'light'};
      if (target.closest('.nav')) return {section:'nav',theme:'light'};
      if (target.closest('.hero')) return {section:'hero',theme:'light'};
      if (target.closest('.editorial-story,#story')) return {section:'story',theme:'wine'};
      if (target.closest('.countdown-section')) return {section:'countdown',theme:'light'};
      if (target.closest('.events,#events')) return {section:'events',theme:'wine'};
      if (target.closest('.gallery-section')) return {section:'gallery',theme:'wine'};
      if (target.closest('.forever-transition,#forever')) return {section:'forever',theme:'light'};
      if (target.closest('.rsvp-section,#rsvp')) return {section:'rsvp',theme:'wine'};
      if (target.closest('.footer')) return {section:'footer',theme:'light'};
      return {section:'default',theme:'wine'};
    };

    const actionInfo = (target,section) => {
      if (!target?.closest) return {action:'default',label:''};
      if (target.closest('input,select,textarea,[contenteditable="true"]')) return {action:'form',label:''};
      if (target.closest('.home-photo')) return {action:'view',label:'VIEW ↗'};
      if (target.closest('.gallery-cta .btn,[data-album-link]')) return {action:'open',label:'OPEN ↗'};
      if (target.closest('.map-link')) return {action:'map',label:'MAP ↗'};
      if (target.closest('#rsvpForm button[type="submit"],.rsvp-form .btn-primary')) return {action:'send',label:'SEND'};
      if (target.closest('.event-card,.event-family')) return {action:'event',label:'VIEW'};
      if (target.closest('.invite-v2-open-btn,.invite-v2-stage')) return {action:'open',label:'OPEN'};
      if (target.closest('.hero .btn')) return {action:'explore',label:'EXPLORE'};
      if (target.closest('a,button')) return {action:'link',label:''};
      if (section==='hero') return {action:'explore',label:'EXPLORE'};
      if (section==='countdown') return {action:'pulse',label:''};
      if (section==='forever') return {action:'heart',label:'♡'};
      if (section==='footer') return {action:'signature',label:'H&M'};
      return {action:'default',label:''};
    };

    const pushTrailPoint = (x,y,speed) => {
      trail.unshift({x,y,life:1,speed});
      if (trail.length>28) trail.length=28;
    };

    const spawnSpark = (x,y,speed) => {
      if (mode!=='wow' || speed<7) return;
      const now=performance.now();
      if (now-lastSparkAt<70) return;
      lastSparkAt=now;
      const count=speed>22?2:1;
      for(let i=0;i<count;i++){
        const angle=Math.random()*Math.PI*2;
        const force=.25+Math.random()*.65;
        particles.push({
          x:x+(Math.random()-.5)*8,
          y:y+(Math.random()-.5)*8,
          vx:Math.cos(angle)*force,
          vy:Math.sin(angle)*force-.15,
          life:1,
          size:1.2+Math.random()*2.2,
          heart:Math.random()<.12
        });
      }
      if (particles.length>42) particles.splice(0,particles.length-42);
    };

    const drawSilk = () => {
      if (!silkCtx) return;
      silkCtx.clearRect(0,0,innerWidth,innerHeight);

      const light=cursor.dataset.theme==='light';
      const accent=light?[231,190,116]:[170,104,89];
      const highlight=light?[255,235,192]:[242,199,179];

      if (trail.length>1) {
        silkCtx.save();
        silkCtx.lineCap='round';
        silkCtx.lineJoin='round';
        silkCtx.globalCompositeOperation='lighter';

        for(let i=0;i<trail.length-1;i++){
          const a=trail[i],b=trail[i+1];
          const life=Math.min(a.life,b.life);
          if(life<=0) continue;
          const width=(.65+life*3.2)*(mode==='wow'?1:.72);
          silkCtx.beginPath();
          silkCtx.moveTo(a.x,a.y);
          const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
          silkCtx.quadraticCurveTo(mx,my,b.x,b.y);
          silkCtx.lineWidth=width;
          silkCtx.strokeStyle=`rgba(${accent[0]},${accent[1]},${accent[2]},${(.04+life*.22).toFixed(3)})`;
          silkCtx.shadowColor=`rgba(${accent[0]},${accent[1]},${accent[2]},.22)`;
          silkCtx.shadowBlur=8+life*10;
          silkCtx.stroke();

          if(i<7){
            silkCtx.beginPath();
            silkCtx.moveTo(a.x,a.y);
            silkCtx.lineTo(b.x,b.y);
            silkCtx.lineWidth=Math.max(.35,width*.22);
            silkCtx.strokeStyle=`rgba(${highlight[0]},${highlight[1]},${highlight[2]},${(life*.26).toFixed(3)})`;
            silkCtx.shadowBlur=0;
            silkCtx.stroke();
          }
        }
        silkCtx.restore();
      }

      for(let i=trail.length-1;i>=0;i--){
        trail[i].life-=mode==='wow'?.032:.045;
        if(trail[i].life<=0) trail.splice(i,1);
      }

      silkCtx.save();
      silkCtx.globalCompositeOperation='lighter';
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        p.x+=p.vx;
        p.y+=p.vy;
        p.vy+=.006;
        p.life-=.035;
        if(p.life<=0){particles.splice(i,1);continue;}
        const alpha=Math.max(0,p.life)*.58;
        silkCtx.fillStyle=`rgba(${highlight[0]},${highlight[1]},${highlight[2]},${alpha.toFixed(3)})`;
        silkCtx.strokeStyle=silkCtx.fillStyle;
        if(p.heart){
          silkCtx.font=`${8+p.size*2}px Georgia,serif`;
          silkCtx.textAlign='center';
          silkCtx.textBaseline='middle';
          silkCtx.fillText('♡',p.x,p.y);
        }else{
          silkCtx.save();
          silkCtx.translate(p.x,p.y);
          silkCtx.rotate(Math.PI/4);
          silkCtx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
          silkCtx.restore();
        }
      }
      silkCtx.restore();
    };

    const updateContext = (target,x,y) => {
      const info=sectionInfo(target);
      const action=actionInfo(target,info.section);
      cursor.dataset.section=info.section;
      cursor.dataset.theme=info.theme;
      cursor.dataset.action=action.action;
      setLabel(action.label);

      const story=target?.closest?.('.editorial-story,#story')||null;
      if(story) setStoryPointer(story,x,y); else clearStory();

      const photo=target?.closest?.('.home-photo')||null;
      if(photo) setGalleryPointer(photo,x,y);
      else if(activeGalleryPhoto){
        activeGalleryPhoto.classList.remove('cursor-photo-active');
        activeGalleryPhoto=null;
        resetGalleryNeighbors();
      }

      const count=target?.closest?.('.countdown > div')||null;
      if(count) setCountdownPointer(count,x,y);
      else if(activeCount){activeCount.classList.remove('cursor-count-active');activeCount=null;}

      const eventCard=target?.closest?.('.event-card')||null;
      if(eventCard) setEventPointer(eventCard,x,y);
      else if(activeEvent){activeEvent.classList.remove('cursor-event-active');activeEvent=null;}

      const rsvp=target?.closest?.('.rsvp-form')||null;
      if(rsvp) setRsvpPointer(rsvp,x,y);
      else if(activeRsvp){activeRsvp.classList.remove('cursor-rsvp-active');activeRsvp=null;}

      setHeroPointer(target?.closest?.('.hero')||null,x,y);
      setForeverPointer(target?.closest?.('.forever-transition,#forever')||null,x,y);
    };

    const renderCursor = () => {
      ringX+=(targetX-ringX)*.15;
      ringY+=(targetY-ringY)*.15;
      auraX+=(targetX-auraX)*.08;
      auraY+=(targetY-auraY)*.08;
      labelX+=(targetX-labelX)*.20;
      labelY+=(targetY-labelY)*.20;

      core.style.transform=`translate3d(${targetX}px,${targetY}px,0) translate(-50%,-50%)`;
      ring.style.transform=`translate3d(${ringX}px,${ringY}px,0) translate(-50%,-50%)`;
      aura.style.transform=`translate3d(${auraX}px,${auraY}px,0) translate(-50%,-50%)`;
      label.style.transform=`translate3d(${labelX}px,${labelY}px,0) translate(-50%,-50%)`;

      drawSilk();
      frame=requestAnimationFrame(renderCursor);
    };

    const onPointerMove = e => {
      if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen') return;
      const now=performance.now();
      const dt=Math.max(8,now-lastMoveAt);
      const dx=e.clientX-lastX,dy=e.clientY-lastY;
      const speed=Math.hypot(dx,dy)/(dt/16.67);
      targetX=e.clientX;
      targetY=e.clientY;
      lastX=targetX;
      lastY=targetY;
      lastMoveAt=now;

      cursor.classList.add('is-active');
      cursor.style.setProperty('--cursor-speed',Math.min(30,speed).toFixed(2));
      updateContext(e.target,targetX,targetY);
      pushTrailPoint(targetX,targetY,speed);
      spawnSpark(targetX,targetY,speed);
    };

    const onLeave=()=>{
      cursor.classList.remove('is-active');
      activeGalleryPhoto?.classList.remove('cursor-photo-active');
    };
    const onEnter=()=>cursor.classList.add('is-active');
    const onBlur=()=>cursor.classList.remove('is-active');

    addEventListener('pointermove',onPointerMove,{passive:true});
    addEventListener('resize',resizeSilk,{passive:true});
    document.documentElement.addEventListener('mouseleave',onLeave);
    document.documentElement.addEventListener('mouseenter',onEnter);
    addEventListener('blur',onBlur);

    frame=requestAnimationFrame(renderCursor);
    cursor._motionCleanup=()=>{
      cancelAnimationFrame(frame);
      removeEventListener('pointermove',onPointerMove);
      removeEventListener('resize',resizeSilk);
      removeEventListener('blur',onBlur);
      document.documentElement.removeEventListener('mouseleave',onLeave);
      document.documentElement.removeEventListener('mouseenter',onEnter);
      silk.remove();
    };
  }

  window.WeddingCursor = Object.freeze({ init });
})();
