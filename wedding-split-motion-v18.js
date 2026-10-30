/* Wedding V18 — Split & Converge scroll motion.
   Pairs enter from opposite sides and settle at their original CSS layout position.
   Existing V4/V17 transforms are neutralized only on the paired nodes.
 */
(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const rules=[
    ['.hero-couple-names .hero-name-left','left','hero'],
    ['.hero-couple-names .hero-name-right','right','hero'],
    ['#story .story-side','left','story'],
    ['#story .story-paper-stack','right','story'],
    ['.countdown-section .countdown-heading','left','countdown'],
    ['.countdown-section #countdown','right','countdown'],
    ['#events .v3-event-panel.bride-side','left','events'],
    ['#events .v3-event-panel.groom-side','right','events'],
    ['#forever .our-promise-visual','left','promise'],
    ['#forever .our-promise-letter','right','promise'],
    ['.gallery-section .gallery-display','left','gallery'],
    ['.gallery-section .section-heading','right','gallery'],
    ['#rsvp .rsvp-copy','left','rsvp'],
    ['#rsvp .rsvp-form','right','rsvp'],
    ['#weddingGifts .wedding-gift-card[data-gift-side="groom"]','left','gifts'],
    ['#weddingGifts .wedding-gift-card[data-gift-side="bride"]','right','gifts'],
    ['.footer .footer-name-groom','left','footer'],
    ['.footer .footer-name-bride','right','footer'],
    ['.romance-collage-slot .v3-story-split .v3-story-visual','left','story-builder'],
    ['.romance-collage-slot .v3-story-split .v3-story-copy','right','story-builder'],
    ['.romance-collage-slot .v3-story-letter .v3-story-visual','left','story-builder'],
    ['.romance-collage-slot .v3-story-letter .v3-story-copy','right','story-builder']
  ];
  const registered=new WeakSet();
  const resolvedGroups=new Set();
  const observer=('IntersectionObserver' in window)&&!reduced.matches
    ?new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const el=entry.target;
        if(el.dataset.v18Group==='hero'&&document.body.classList.contains('invitation-locked'))continue;
        reveal(el);
        observer.unobserve(el);
      }
    },{threshold:.07,rootMargin:'0px 0px -5% 0px'})
    :null;

  function inView(el){
    const rect=el.getBoundingClientRect();
    const h=window.innerHeight||document.documentElement.clientHeight||800;
    return rect.top<h*.94&&rect.bottom>0;
  }
  function reveal(el){
    if(!el||el.classList.contains('v18-in-view'))return;
    el.classList.add('v18-in-view');
    if(el.dataset.v18Group)resolvedGroups.add(el.dataset.v18Group);
  }
  function neutralizeOld(node){
    node.classList.remove('v4-reveal','v4-enter-left','v4-enter-right','motion-item');
    // Suppress nested V17 animations while retaining readable text and accessibility.
    const nested=[node,...node.querySelectorAll('.v17-text, .v4-reveal, .motion-item')];
    nested.forEach(el=>{
      if(el!==node)el.classList.remove('v4-reveal','v4-enter-left','v4-enter-right','motion-item');
      el.classList.remove('v17-text','v17-headline','v17-line','v17-soft','v17-letters','v17-card');
      el.classList.add('v18-legacy-clean');
      el.querySelectorAll('.v17-decor').forEach(decor=>decor.classList.add('v17-decor-visible'));
    });
    const parent=node.closest('.v3-story-block, .gallery-editorial-head');
    if(parent)parent.classList.remove('v4-reveal','v4-enter-left','v4-enter-right');
  }
  function register(node,direction,group,index,previouslySeen){
    if(!node||registered.has(node))return;
    if(node.closest('[hidden]')||node.parentElement?.closest('[aria-hidden="true"]'))return;
    registered.add(node);
    neutralizeOld(node);
    node.dataset.v18Group=group;
    node.dataset.v18Split=direction;
    node.style.setProperty('--v18-pair-delay',direction==='right'?'var(--v18-stagger)':'0ms');
    node.classList.add('v18-split','v18-from-'+direction);
    if(!observer||reduced.matches){
      reveal(node);return;
    }
    if(group!=='hero'&&previouslySeen){
      reveal(node);return;
    }
    if(group==='hero'&&document.body.classList.contains('invitation-locked')){
      observer.observe(node);return;
    }
    if(inView(node)){
      // Paint the offscreen starting position before beginning the transition.
      requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(node)));
      return;
    }
    observer.observe(node);
  }
  function scan(){
    const previouslyRevealed=new Set(resolvedGroups);
    rules.forEach(([selector,direction,group])=>{
      document.querySelectorAll(selector).forEach((node,index)=>register(node,direction,group,index,previouslyRevealed.has(group)));
    });
  }
  let scanScheduled=false;
  function scheduleScan(){
    if(scanScheduled)return;
    scanScheduled=true;
    requestAnimationFrame(()=>{scanScheduled=false;scan()});
  }
  const dynamicRoots=[
    ...document.querySelectorAll('.romance-collage-slot'),
    document.getElementById('weddingGifts')
  ].filter(Boolean);
  const dynamicObserver=new MutationObserver(scheduleScan);
  dynamicRoots.forEach(el=>dynamicObserver.observe(el,{childList:true,subtree:true}));
  document.addEventListener('wedding:language',scheduleScan);
  document.addEventListener('wedding:content-loaded',scheduleScan);
  document.addEventListener('wedding:invite-loaded',scheduleScan);
  document.addEventListener('wedding:invitation-opened',()=>{
    document.querySelectorAll('[data-v18-group="hero"]').forEach(reveal);
  });
  document.querySelectorAll('[data-v3-day-button]').forEach(btn=>
    btn.addEventListener('click',scheduleScan));
  if(reduced.addEventListener)reduced.addEventListener('change',()=>{
    if(reduced.matches)document.querySelectorAll('.v18-split').forEach(reveal);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});
  else scan();
  root.classList.add('v18-motion-ready');
})();