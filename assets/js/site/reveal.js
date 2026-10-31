/* Wedding V4: chapter entrance observer. Decorative backgrounds have no controls or lightbox. */
(() => {
 'use strict';
 document.body.classList.add('v4-motion-ready');
 const targets=['.story-paper-stack','.countdown-heading','.v3-section-heading','.v3-schedule-photo','.v3-event-panel','.gallery-editorial-head','.rsvp-copy','.v3-farewell','.v3-story-block:not(.v3-story-quote)','.our-promise-visual','.our-promise-letter'];
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const observer=('IntersectionObserver'in window)&&!reduced.matches?new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
     entry.target.classList.add('v4-in-view');
     observer.unobserve(entry.target);
   }
 },{threshold:.06,rootMargin:'0px 0px -7% 0px'}):null;
 function register(){
   let n=0;
   document.querySelectorAll(targets.join(',')).forEach(el=>{
     if(el.dataset.v4Observed)return;
     el.dataset.v4Observed='1';
     el.classList.add('v4-reveal',n++%2?'v4-enter-right':'v4-enter-left');
     if(!observer)el.classList.add('v4-in-view');
     else observer.observe(el);
   });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});else register();
 const mount=document.querySelector('main');
 if(mount){
   const slots=document.querySelectorAll('[data-collage-slot]');
   slots.forEach(slot=>new MutationObserver(register).observe(slot,{childList:true,subtree:false}));
 }
 document.addEventListener('wedding:content-loaded',register);
 document.addEventListener('wedding:language',register);
})();
