/* Wedding scroll motion — extracted V17 + V18 modules; preserves IIFE isolation,
   execution order and one-time reveal behavior. */
/* ===== BEGIN wedding-text-motion-v17.js ===== */
/* Wedding V17 — cinematic text reveal
 * Additive, non-destructive layer over motion.js and wedding-v4.js.
 * Never wraps user input, RSVP, payment details, links or Album photographs.
 */
(() => {
  'use strict';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const all=[
    ['.hero-copy > .eyebrow','letters'],
    ['.hero-copy > .hero-date','soft'],
    ['.hero-copy > .hero-note','line'],
    ['#story .story-side > .eyebrow','letters'],
    ['#story .story-paper-kicker','letters'],
    /* Story body already has motion.js's punctuation-safe motion-line engine. */
    ['.countdown-heading > .eyebrow','letters'],
    ['.countdown-heading > h2','headline'],
    ['#events .v3-section-heading .v3-kicker','letters'],
    ['#events .v3-section-heading > h2','headline'],
    ['#events .v3-section-heading > p','line'],
    ['#events .v3-schedule-intro [data-v3-schedule-tagline]','soft'],
    ['#events .v3-day-head > h3','headline'],
    ['#forever .our-promise-kicker','letters'],
    ['#forever #promiseTitle','headline'],
    ['#forever .our-promise-letter > p[data-i18n="promise.body1"]','line'],
    ['#forever .our-promise-letter > p[data-i18n="promise.body2"]','line'],
    ['#forever .our-promise-signature','soft'],
    ['.gallery-section .section-heading > .eyebrow','letters'],
    ['.gallery-section .section-heading > h2','headline'],
    ['.gallery-section .section-heading > p','line'],
    ['#rsvp .rsvp-copy > .eyebrow','letters'],
    ['#rsvp .rsvp-copy > h2','headline'],
    ['#rsvp .rsvp-copy > p:last-child','line'],
    ['#weddingGifts .wedding-gift-eyebrow','letters'],
    ['#weddingGifts .wedding-gift-heading > h2','headline'],
    ['#weddingGifts .wedding-gift-heading > p','line'],
    ['#weddingGifts .wedding-gift-card','card'],
    ['#weddingGifts .wedding-gift-footer','soft'],
    ['.footer .footer-small','soft'],
    /* Story Builder blocks can be added/removed independently from the CMS. */
    ['.romance-collage-slot .v3-story-chapter','letters'],
    ['.romance-collage-slot .v3-story-copy > p','line']
  ];
  const rules=all.map(([selector,effect])=>({selector,effect}));
  const seen=new WeakSet();
  const allowAnimation=()=>!reduced.matches&&'IntersectionObserver' in window;
  const observer=allowAnimation()?new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  },{threshold:0.12,rootMargin:'0px 0px -6% 0px'}):null;

  const graphemes=text=>{
    if(typeof Intl.Segmenter==='function'){
      return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(part=>part.segment);
    }
    // Retain combining marks and variation selectors, including Vietnamese diacritics.
    const result=[];
    for(const c of Array.from(text)){
      if(result.length&&/[\u0300-\u036f\u1ab0-\u1aff\ufe00-\ufe0f]/u.test(c))
        result[result.length-1]+=c;
      else result.push(c);
    }
    return result;
  };

  function letterize(el){
    const text=(el.querySelector('.v17-accessible')?.textContent||el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text||graphemes(text).length>44)return;
    if(el.dataset.v17Text===text&&el.querySelector('.v17-char'))return;
    const wasVisible=el.classList.contains('v17-visible');
    el.setAttribute('aria-label',text);
    el.dataset.v17Text=text;
    const fragment=document.createDocumentFragment();
    let index=0;
    for(const part of text.split(/(\s+)/)){
      if(!part)continue;
      if(/^\s+$/.test(part)){fragment.appendChild(document.createTextNode(part));continue;}
      // Keep Latin/Vietnamese words intact when wrapping on narrow devices.
      // Japanese graphemes may wrap naturally at permitted break opportunities.
      const cjk=/[\u3040-\u30ff\u3400-\u9fff]/u.test(part);
      const holder=cjk?fragment:document.createElement('span');
      if(!cjk)holder.className='v17-word';
      for(const char of graphemes(part)){
        const span=document.createElement('span');
        span.className='v17-char';
        span.setAttribute('aria-hidden','true');
        span.style.setProperty('--v17-char-delay',String(Math.min(index++,36)*32)+'ms');
        span.textContent=char;
        holder.appendChild(span);
      }
      if(!cjk)fragment.appendChild(holder);
    }
    const accessible=document.createElement('span');
    accessible.className='v17-accessible';
    accessible.textContent=text;
    fragment.appendChild(accessible);
    el.replaceChildren(fragment);
    if(wasVisible)el.classList.add('v17-language-updated');
  }
  function reveal(el){
    if(!el||el.classList.contains('v17-visible'))return;
    el.classList.add('v17-visible');
    if(el.dataset.v17Effect==='headline'){
      const flourish=el.nextElementSibling;
      if(flourish?.classList.contains('v17-decor'))flourish.classList.add('v17-decor-visible');
    }
  }
  function inViewport(el){
    const rect=el.getBoundingClientRect();
    const height=window.innerHeight||document.documentElement.clientHeight||800;
    return rect.top<height*.92&&rect.bottom>0;
  }
  function register(el,effect,index){
    if(!el||seen.has(el)||el.closest('[hidden], [aria-hidden="true"]'))return;
    // Animating controls or contact details would make interaction unreliable.
    if(el.closest('button, a, input, form, .wedding-gift-qr, .wedding-gift-fields'))return;
    seen.add(el);
    el.classList.add('v17-text','v17-'+effect);
    el.dataset.v17Effect=effect;
    el.style.setProperty('--v17-item-delay',String((index%3)*55)+'ms');
    el.style.setProperty('--v17-card-delay',String((index%3)*110)+'ms');
    if(effect==='letters')letterize(el);
    if(!observer||inViewport(el))reveal(el);
    else observer.observe(el);
  }
  function addDecor(el){
    if(!el||el.dataset.v17Decor||el.closest('[hidden]'))return;
    el.dataset.v17Decor='1';
    const span=document.createElement('span');
    span.className='v17-decor';
    span.setAttribute('aria-hidden','true');
    span.innerHTML='<i></i><b>♡</b><i></i>';
    el.insertAdjacentElement('afterend',span);
    if(el.classList.contains('v17-visible'))span.classList.add('v17-decor-visible');
  }
  function scan(){
    let index=0;
    for(const {selector,effect} of rules){
      document.querySelectorAll(selector).forEach(el=>register(el,effect,index++));
    }
    [
      '#events .v3-section-heading > h2',
      '#weddingGifts .wedding-gift-heading > h2'
    ].forEach(selector=>document.querySelectorAll(selector).forEach(addDecor));
  }
  function resyncLanguage(){
    // i18n.js replaces textContent; reattach graphemes after translations land.
    setTimeout(()=>{
      for(const {selector,effect} of rules){
        if(effect!=='letters')continue;
        document.querySelectorAll(selector).forEach(el=>{
          if(seen.has(el))letterize(el);
        });
      }
      scan();
    },0);
  }
  const scopeRoots=[
    ...document.querySelectorAll('.romance-collage-slot'),
    document.getElementById('weddingGifts')
  ].filter(Boolean);
  const mountObserver=new MutationObserver(()=>scan());
  scopeRoots.forEach(root=>mountObserver.observe(root,{childList:true,subtree:false}));
  document.addEventListener('wedding:language',resyncLanguage);
  document.addEventListener('wedding:content-loaded',scan);
  document.addEventListener('wedding:invite-loaded',scan);
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',scan,{once:true});
  else scan();
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)scan();
  });
  if(reduced.addEventListener)reduced.addEventListener('change',()=>{
    if(reduced.matches)document.querySelectorAll('.v17-text').forEach(reveal);
  });
  document.documentElement.classList.add('v17-motion-ready');
})();
;
/* ===== END wedding-text-motion-v17.js ===== */

/* ===== BEGIN wedding-split-motion-v18.js ===== */
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
  function register(node,direction,group,previouslySeen){
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
      document.querySelectorAll(selector).forEach(node=>register(node,direction,group,previouslyRevealed.has(group)));
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
;
/* ===== END wedding-split-motion-v18.js ===== */
