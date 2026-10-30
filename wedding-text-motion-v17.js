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
    const letters=graphemes(text);
    letters.forEach((char,index)=>{
      const span=document.createElement('span');
      span.className='v17-char';
      span.setAttribute('aria-hidden','true');
      span.style.setProperty('--v17-char-delay',String(Math.min(index,36)*32)+'ms');
      span.textContent=char;
      fragment.appendChild(span);
    });
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