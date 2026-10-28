/* Wedding Editorial V3 — image-driven story and accessible hero, using published Album only. */
(() => {
  'use strict';
  const SLOTS=['story','promise','events','moments','rsvp'];
  const ALLOWED=new Set(['split','letter','film','quote']);
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={db:null,photos:[],byId:new Map(),config:null,heroTimer:0,heroIndex:0,heroPaused:false,heroUrls:[],heroReady:false,activeDay:'bride'};
  const language=()=>['vi','en','ja'].includes(window.WeddingI18n?.language)?window.WeddingI18n.language:'vi';
  const copy={
    vi:{story:'Từ cuộc gặp gỡ đầu tiên, chúng mình đã chọn cùng nhau đi tiếp.',promise:'Từ hôm nay, mỗi chặng đường đều có chúng mình.',moments:'Những khoảnh khắc nhỏ tạo nên một tình yêu thật lớn.',rsvp:'Cảm ơn bạn đã là một phần trong câu chuyện của Hải & Mỹ.',event:'Hai gia đình, một niềm hạnh phúc',pause:'Tạm dừng chuyển ảnh',play:'Tiếp tục chuyển ảnh',photo:'Ảnh cưới'},
    en:{story:'From our very first hello to a lifetime of togetherness.',promise:'From this day forward, every road is ours to share.',moments:'A thousand little moments, one beautiful love story.',rsvp:'Thank you for being part of our story.',event:'Two families, one beautiful forever',pause:'Pause slideshow',play:'Play slideshow',photo:'Wedding photo'},
    ja:{story:'出会いから今日まで、ふたりで歩んできました。',promise:'これからも、ずっと一緒に。',moments:'小さな幸せが、かけがえのない思い出に。',rsvp:'私たちの物語に寄り添っていただき、ありがとうございます。',event:'ふたつの家族がひとつになる日',pause:'スライドを一時停止',play:'スライドを再開',photo:'ウェディング写真'}
  };
  const cfg=window.WEDDING_CONFIG||{};
  if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase)return;
  state.db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  function url(img){
    if(!img?.image_path)return '';
    const base=state.db.storage.from('wedding-gallery').getPublicUrl(img.image_path).data.publicUrl;
    return img.updated_at?base+'?v='+encodeURIComponent(img.updated_at):base;
  }
  function alt(img){
    const l=language();return (l==='en'?(img.alt_text_en||img.title_en):l==='ja'?(img.alt_text_ja||img.title_ja):null)||img.alt_text||img.title||'Hải & Mỹ';
  }
  const valid=img=>img&&img.is_published&&img.image_path;
  const choose=id=>valid(state.byId.get(id))?state.byId.get(id):null;
  function fallbackBlocks(){
    const a=state.photos.filter(i=>i.show_on_homepage);
    const p=a.length?a:state.photos;
    return [
      {id:'default-story',slot:'story',style:'split',imageId:p[0]?.id||'',visible:true,text:{}},
      {id:'default-promise',slot:'promise',style:'letter',imageId:p[1]?.id||p[0]?.id||'',visible:true,text:{}},
      {id:'default-moments',slot:'moments',style:'film',imageId:p[2]?.id||p[0]?.id||'',visible:true,text:{}},
      {id:'default-rsvp',slot:'rsvp',style:'quote',imageId:'',visible:true,text:{}}
    ];
  }
  function blocks(){
    const items=Array.isArray(state.config?.blocks)?state.config.blocks:fallbackBlocks();
    return items.slice(0,25).filter(b=>b&&SLOTS.includes(b.slot)&&ALLOWED.has(b.style)&&b.visible!==false);
  }
  function storyHtml(b,idx){
    const l=language(), words=String(b.text?.[l]||b.text?.vi||copy[l][b.slot]||'').slice(0,420);
    const img=choose(b.imageId);
    const caption='<div class="v3-story-copy"><span class="v3-story-chapter">H ♡ M · '+safe(b.slot==='story'?'OUR STORY':b.slot==='moments'?'OUR MOMENTS':'FOREVER & ALWAYS')+'</span><p>'+safe(words)+'</p><small>Hải & Mỹ</small></div>';
    if(b.style==='quote')return '<div class="v3-story-block v3-story-quote">'+caption+'</div>';
    if(!img)return '<div class="v3-story-block v3-story-quote">'+caption+'</div>';
    const photo=i=>'<img loading="lazy" decoding="async" src="'+safe(url(i))+'" alt="'+safe(alt(i))+'" style="object-position:'+Math.max(0,Math.min(100,Number(i.focus_x??50)))+'% '+Math.max(0,Math.min(100,Number(i.focus_y??50)))+'%">';
    if(b.style==='film'){
      const others=state.photos.filter(x=>x.id!==img.id).slice(0,2);
      return '<div class="v3-story-block v3-story-film"><div class="v3-film-images">'+[img,...others].map(photo).join('')+'</div>'+caption+'</div>';
    }
    return '<div class="v3-story-block v3-story-'+b.style+(idx%2?' v3-story-reversed':'')+'"><div class="v3-story-visual">'+photo(img)+'</div>'+caption+'</div>';
  }
  function renderStories(){
    const all=blocks();
    for(const slot of SLOTS){
      const host=document.querySelector('[data-collage-slot="'+slot+'"]');if(!host)continue;
      const items=all.filter(b=>b.slot===slot);
      host.innerHTML=items.length?'<div class="v3-story-container">'+items.map(storyHtml).join('')+'</div>':'';
      host.hidden=!items.length;
    }
    const l=language();
    document.querySelector('[data-v3-schedule-tagline]')?.replaceChildren(document.createTextNode(copy[l].event));
  }
  function renderSchedule(){
    const img=choose(state.config?.schedulePhotoId)||state.photos.find(i=>i.is_hero)||state.photos[0];
    const wrap=document.getElementById('v3SchedulePhotoWrap'),target=document.getElementById('v3SchedulePhoto');
    if(wrap&&target&&img){
      target.src=url(img);target.alt=alt(img);target.style.objectPosition=(Number(img.focus_x??50))+'% '+(Number(img.focus_y??50))+'%';
      target.onerror=()=>{wrap.hidden=true;};target.onload=()=>{wrap.hidden=false;};
    }
    const goodbye=choose(state.config?.farewellPhotoId)||state.photos.find(i=>i.show_on_homepage&&i.id!==img?.id);
    const foot=document.getElementById('v3Farewell'),end=document.getElementById('v3FarewellImage');
    if(foot&&end&&goodbye){end.src=url(goodbye);end.alt=alt(goodbye);end.onload=()=>{foot.hidden=false;};end.onerror=()=>{foot.hidden=true;};}
  }
  function setDay(day){
    if(!['bride','groom'].includes(day))return;
    state.activeDay=day;
    document.querySelectorAll('[data-v3-day-button]').forEach(b=>{
      const active=b.dataset.v3DayButton===day;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
    });
    document.querySelectorAll('.v3-event-panel[data-event-day]').forEach(p=>p.classList.toggle('is-active',p.dataset.eventDay===day));
  }
  document.querySelectorAll('[data-v3-day-button]').forEach(b=>b.addEventListener('click',()=>setDay(b.dataset.v3DayButton)));
  if(window.WeddingEvents?.highlightInvitedDays){
    const old=window.WeddingEvents.highlightInvitedDays;
    window.WeddingEvents.highlightInvitedDays=(days=[])=>{old(days);if(days.length===1)setDay(days[0]);};
  }
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function stop(){clearInterval(state.heroTimer);state.heroTimer=0;}
  function show(index){
    const slides=[...document.querySelectorAll('.v3-slide')];if(!slides.length)return;
    state.heroIndex=(index+slides.length)%slides.length;
    slides.forEach((s,i)=>s.classList.toggle('is-current',i===state.heroIndex));
    document.querySelectorAll('.v3-hero-dot').forEach((b,i)=>{const active=i===state.heroIndex;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function tick(){
    stop();
    if(state.heroUrls.length>1&&state.config?.heroAutoplay!==false&&!state.heroPaused&&!reduced.matches&&!document.hidden){
      state.heroTimer=setInterval(()=>show(state.heroIndex+1),7000);
    }
    const pause=document.getElementById('v3HeroPause');
    if(pause){const playing=!!state.heroTimer;pause.textContent=playing?'Ⅱ':'▶';pause.setAttribute('aria-label',copy[language()][playing?'pause':'play']);pause.setAttribute('aria-pressed',String(!playing));}
  }
  function createSlides(){
    if(!state.heroReady||!state.photos.length)return;
    const hero=document.getElementById('home'),frame=hero?.querySelector('.hero-feature-photo'),original=document.getElementById('heroImage');
    if(!hero||!frame||!original)return;
    let selected=(Array.isArray(state.config?.heroIds)?state.config.heroIds:[]).map(choose).filter(Boolean);
    if(!selected.length){
      selected=[state.photos.find(i=>i.is_hero),...state.photos.filter(i=>i.show_on_homepage)].filter(Boolean);
    }
    selected=[...new Map(selected.map(i=>[i.id,i])).values()].slice(0,3);
    if(!selected.length)return;
    // Use the existing first Hero <img> to preserve the opening handoff / image-ready contract.
    stop();state.heroPaused=false;state.heroIndex=0;
    frame.querySelectorAll('.v3-slide:not(#heroImage)').forEach(e=>e.remove());
    hero.classList.remove('hero-layout-full','hero-layout-split','hero-layout-minimal');
    hero.classList.add('hero-layout-framed','hero-v3');
    original.classList.add('v3-slide','is-current');
    original.src=url(selected[0]);original.alt=alt(selected[0]);
    const focus=i=>(Math.max(0,Math.min(100,Number(i.focus_x??50)))+'% '+Math.max(0,Math.min(100,Number(i.focus_y??50)))+'%');
    original.style.objectPosition=focus(selected[0]);
    for(let n=1;n<selected.length;n++){
      const im=document.createElement('img');im.className='v3-slide';im.loading='lazy';im.decoding='async';im.src=url(selected[n]);im.alt=alt(selected[n]);im.style.objectPosition=focus(selected[n]);frame.appendChild(im);
    }
    state.heroUrls=selected.map(i=>i.id);
    let controls=document.getElementById('v3HeroControls');
    if(!controls){controls=document.createElement('div');controls.id='v3HeroControls';controls.className='v3-hero-controls';hero.querySelector('.hero-content')?.appendChild(controls);}
    controls.innerHTML='';
    if(selected.length>1){
      const dots=document.createElement('div');dots.className='v3-hero-dots';
      selected.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className='v3-hero-dot';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',copy[language()].photo+' '+(i+1));b.onclick=()=>{show(i);tick();};dots.appendChild(b);});
      controls.appendChild(dots);
      const pause=document.createElement('button');pause.type='button';pause.id='v3HeroPause';pause.className='v3-hero-pause';pause.onclick=()=>{
        if(state.heroTimer){state.heroPaused=true;}else{state.heroPaused=false;}
        tick();
      };controls.appendChild(pause);
    }
    show(0);tick();
  }
  let initialLoaded=false;
  async function load(){
    try{
      const [photos,config]=await Promise.all([
        state.db.from('gallery_images').select('id,image_path,title,title_en,title_ja,alt_text,alt_text_en,alt_text_ja,focus_x,focus_y,sort_order,is_published,is_hero,show_on_homepage,updated_at').eq('is_published',true).order('sort_order',{ascending:true}).limit(100),
        state.db.from('site_content').select('value_vi').eq('key','v3_design').maybeSingle()
      ]);
      if(photos.error)throw photos.error;
      state.photos=(photos.data||[]).filter(valid);
      state.byId=new Map(state.photos.map(i=>[i.id,i]));
      try{state.config=config.error?null:(config.data?.value_vi?JSON.parse(config.data.value_vi):null);}catch{state.config=null;}
      initialLoaded=true;
      renderStories();renderSchedule();createSlides();
    }catch(error){console.error('Wedding V3 loading error',error);}
  }
  document.addEventListener('wedding:hero-ready',()=>{state.heroReady=true;if(initialLoaded)createSlides();});
  document.addEventListener('wedding:language',()=>{renderStories();renderSchedule();if(initialLoaded)setTimeout(createSlides,0);});
  document.addEventListener('visibilitychange',tick);
  reduced.addEventListener?.('change',tick);
  if(window.WeddingHeroReady)state.heroReady=true;
  setDay('bride');load();
})();