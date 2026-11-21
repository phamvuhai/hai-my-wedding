/* Album Detail zoom — iPhone Safari / Android / desktop.
 * Double-tap, two-finger pinch, drag to pan, wheel and an accessible
 * zoom/reset button. No external assets or image processing dependencies.
 */
(() => {
  'use strict';
  const lightbox = document.getElementById('photoLightbox');
  const stage = document.getElementById('photoLightboxStage');
  const image = document.getElementById('photoLightboxImage');
  const button = document.getElementById('photoLightboxZoom');
  if (!lightbox || !stage || !image || !button) return;

  let scale = 1, panX = 0, panY = 0;
  let gesture = null, lastTap = null, blockedUntil = 0;
  const LIMIT = 4;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lang = () => window.WeddingI18n?.language || 'vi';

  function label() {
    const zoomed = scale > 1.01;
    const copy = {
      vi: zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh',
      en: zoomed ? 'Reset photo zoom' : 'Zoom in on photo',
      ja: zoomed ? '画像を元の大きさに戻す' : '画像を拡大'
    };
    button.setAttribute('aria-label', copy[lang()] || copy.vi);
    button.setAttribute('title', copy[lang()] || copy.vi);
    button.setAttribute('aria-pressed', String(zoomed));
    button.textContent = zoomed ? '−' : '+';
  }
  function fitPan() {
    if (scale <= 1.001) {
      panX = 0; panY = 0; return;
    }
    const bounds = stage.getBoundingClientRect();
    const width = image.offsetWidth * scale;
    const height = image.offsetHeight * scale;
    const maxX = Math.max(0, (width - bounds.width) / 2);
    const maxY = Math.max(0, (height - bounds.height) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  }
  function paint() {
    fitPan();
    image.style.transform = scale <= 1.001 ? '' :
      'translate3d(' + panX.toFixed(1) + 'px,' + panY.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
    stage.classList.toggle('is-zoomed', scale > 1.01);
    label();
  }
  function zoomTo(value, pointX, pointY) {
    const previous = scale;
    const next = clamp(value, 1, LIMIT);
    if (next <= 1.001) {
      scale = 1; panX = 0; panY = 0;
    } else {
      const rect = stage.getBoundingClientRect();
      const cx = Number.isFinite(pointX) ? pointX - (rect.left + rect.width / 2) : 0;
      const cy = Number.isFinite(pointY) ? pointY - (rect.top + rect.height / 2) : 0;
      const ratio = next / previous;
      panX = panX * ratio + cx * (1 - ratio);
      panY = panY * ratio + cy * (1 - ratio);
      scale = next;
    }
    blockedUntil = Date.now() + 360;
    paint();
  }
  function reset() {
    scale = 1; panX = 0; panY = 0;
    gesture = null; lastTap = null;
    blockedUntil = Date.now() + 160;
    paint();
  }
  const distance = (a, b) => Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
  const center = (a, b) => ({
    x: (a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2
  });

  stage.addEventListener('touchstart', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.touches.length >= 2) {
      const [a,b] = event.touches;
      const midpoint = center(a,b);
      gesture = {
        type:'pinch', initialDistance:Math.max(distance(a,b),1),
        initialScale:scale, initialX:panX, initialY:panY,
        initialMid:midpoint
      };
      blockedUntil=Date.now()+700;
      lastTap=null;
    } else if (event.touches.length === 1) {
      const a = event.touches[0];
      gesture = {
        type:'pan', x:a.clientX, y:a.clientY,
        initialX:panX, initialY:panY, moved:false
      };
    }
  }, {passive:true});

  stage.addEventListener('touchmove', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.touches.length >= 2) {
      const [a,b] = event.touches;
      if (!gesture || gesture.type !== 'pinch') {
        const midpoint = center(a,b);
        gesture = {
          type:'pinch',initialDistance:Math.max(distance(a,b),1),
          initialScale:scale,initialX:panX,initialY:panY,initialMid:midpoint
        };
      }
      const midpoint = center(a,b);
      // Pinch updates relative to the starting scale and tracks midpoint drift.
      const target = clamp(gesture.initialScale *
        (distance(a,b) / gesture.initialDistance), 1, LIMIT);
      const startScale = gesture.initialScale;
      const r = target / startScale;
      const box = stage.getBoundingClientRect();
      const x = gesture.initialMid.x - (box.left + box.width/2);
      const y = gesture.initialMid.y - (box.top + box.height/2);
      scale = target;
      panX = gesture.initialX*r + x*(1-r) + (midpoint.x-gesture.initialMid.x);
      panY = gesture.initialY*r + y*(1-r) + (midpoint.y-gesture.initialMid.y);
      blockedUntil=Date.now()+700;
      paint();
      if (event.cancelable) event.preventDefault();
    } else if (event.touches.length === 1 && scale > 1.01) {
      const a = event.touches[0];
      if (!gesture || gesture.type !== 'pan') {
        gesture = {type:'pan',x:a.clientX,y:a.clientY,
          initialX:panX,initialY:panY,moved:false};
      }
      const dx=a.clientX-gesture.x, dy=a.clientY-gesture.y;
      panX=gesture.initialX+dx;
      panY=gesture.initialY+dy;
      if(Math.abs(dx)+Math.abs(dy)>5)gesture.moved=true;
      blockedUntil=Date.now()+550;
      paint();
      if(event.cancelable)event.preventDefault();
    }
  }, {passive:false});

  stage.addEventListener('touchend', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (gesture?.type === 'pinch' || event.touches.length >= 2) {
      blockedUntil=Date.now()+750;
      if(event.touches.length===1){
        const a=event.touches[0];
        gesture={type:'pan',x:a.clientX,y:a.clientY,
          initialX:panX,initialY:panY,moved:false};
      } else gesture=null;
      return;
    }
    if (event.touches.length) return;
    if (!gesture?.moved && event.changedTouches?.length===1) {
      const t=event.changedTouches[0];
      const now=Date.now();
      if(lastTap && now-lastTap.at<330 &&
         Math.hypot(t.clientX-lastTap.x,t.clientY-lastTap.y)<35){
        zoomTo(scale>1.01 ? 1 : 2.5,t.clientX,t.clientY);
        lastTap=null;
        blockedUntil=Date.now()+600;
      } else {
        lastTap={at:now,x:t.clientX,y:t.clientY};
      }
    }
    gesture=null;
  }, {passive:true});
  stage.addEventListener('touchcancel',()=>{gesture=null;blockedUntil=Date.now()+500;},{passive:true});

  // Desktop: double-click to zoom, drag when enlarged, Ctrl/trackpad wheel.
  let mouseDrag=null;
  stage.addEventListener('dblclick', event => {
    if (!lightbox.classList.contains('is-open')) return;
    event.preventDefault();
    zoomTo(scale>1.01 ? 1 : 2.5,event.clientX,event.clientY);
  });
  stage.addEventListener('pointerdown', event => {
    if(event.pointerType==='touch' || scale<=1.01 || event.button!==0)return;
    mouseDrag={x:event.clientX,y:event.clientY,panX,panY};
    stage.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  stage.addEventListener('pointermove', event=>{
    if(!mouseDrag)return;
    panX=mouseDrag.panX+(event.clientX-mouseDrag.x);
    panY=mouseDrag.panY+(event.clientY-mouseDrag.y);
    paint();
  });
  const endDrag=()=>{mouseDrag=null;};
  stage.addEventListener('pointerup',endDrag);
  stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('wheel',event=>{
    if(!lightbox.classList.contains('is-open'))return;
    if(event.ctrlKey || scale>1.01){
      event.preventDefault();
      zoomTo(scale + (event.deltaY<0?0.32:-0.32),event.clientX,event.clientY);
    }
  },{passive:false});

  button.addEventListener('click',()=>zoomTo(scale>1.01?1:2.5));
  image.addEventListener('dragstart',event=>event.preventDefault());
  image.addEventListener('load',()=>{if(scale>1.01)paint();});
  window.addEventListener('resize',paint,{passive:true});
  document.addEventListener('wedding:language',label);

  label();
  window.WeddingPhotoZoom={
    reset, zoomTo, isZoomed:()=>scale>1.01,
    canSwipe:()=>scale<=1.01 && !gesture?.type?.includes('pinch') &&
      Date.now()>blockedUntil,
    status:()=>({scale,panX,panY,blocked:Date.now()<=blockedUntil})
  };
})();
