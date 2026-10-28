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
  const posterNumber=(v,defaultValue,min=0,max=100)=>{
    const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):defaultValue;
  };
  function stop(){clearInterval(state.heroTimer);state.heroTimer=0;}
  function posterSettings(hero){
    const data=state.config||{};
    const blur=[8,14,20].includes(Number(data.posterBlur))?Number(data.posterBlur):14;
    const shade=[40,55,70].includes(Number(data.posterShade))?Number(data.posterShade):55;
    const desktopX=posterNumber(data.posterDesktopX,50),desktopY=posterNumber(data.posterDesktopY,50);
    const mobileX=posterNumber(data.posterMobileX,50),mobileY=posterNumber(data.posterMobileY,50);
    hero.style.setProperty('--poster-blur',blur+'px');
    hero.style.setProperty('--poster-shade',(shade/100).toFixed(2));
    hero.style.setProperty('--poster-focus-desktop',desktopX+'% '+desktopY+'%');
    hero.style.setProperty('--poster-focus-mobile',mobileX+'% '+mobileY+'%');
    hero.classList.toggle('poster-no-portrait',data.posterForeground===false);
  }

  /* Triptych carousel: show one, two, or three actual published photos, without placeholders. */
  function show(index){
    const hero=document.getElementById('home');
    const cards=[...(hero?.querySelectorAll('.v3-photo-card')||[])];
    const backgrounds=[...(hero?.querySelectorAll('.hero-full-photo .v3-backdrop-slide')||[])];
    const n=cards.length;if(!n)return;
    state.heroIndex=(index+n)%n;
    const frame=hero.querySelector('.hero-feature-photo');
    frame.dataset.photoCount=String(n);
    cards.forEach((card,i)=>{
      card.classList.remove('is-center','is-left','is-right','is-hidden');
      let role='is-hidden';
      if(n===1){role='is-center';}
      else if(n===2){role=i===state.heroIndex?'is-left':'is-right';}
      else if(i===state.heroIndex){role='is-center';}
      else if(i===(state.heroIndex+1)%n){role='is-right';}
      else{role='is-left';}
      card.classList.add(role);
      card.setAttribute('aria-hidden',String(role==='is-hidden'));
      const img=card.querySelector('img');
      if(img)img.setAttribute('aria-hidden','false');
    });
    // The blurred background follows the prominent photo, not a separate timer.
    backgrounds.forEach((el,i)=>el.classList.toggle('is-current',i===state.heroIndex));
    hero.querySelectorAll('.v3-hero-dot').forEach((el,i)=>{
      const active=i===state.heroIndex;
      el.classList.toggle('is-active',active);
      el.setAttribute('aria-pressed',String(active));
    });
  }
  function tick(){
    stop();
    const autoAllowed=state.config?.heroAutoplay!==false&&!state.heroPaused&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('invitation-locked');
    if(state.heroUrls.length>1&&autoAllowed){
      state.heroTimer=setInterval(()=>show(state.heroIndex+1),7000);
    }
    const pause=document.getElementById('v3HeroPause');
    if(pause){
      pause.hidden=reduced.matches||state.config?.heroAutoplay===false;
      const playing=Boolean(state.heroTimer);
      pause.textContent=playing?'Ⅱ':'▶';
      pause.setAttribute('aria-label',copy[language()][playing?'pause':'play']);
      pause.setAttribute('aria-pressed',String(!playing));
    }
  }
  function createSlides(){
    if(!state.heroReady||!state.photos.length)return;
    const hero=document.getElementById('home');
    const frame=hero?.querySelector('.hero-feature-photo');
    const background=hero?.querySelector('.hero-full-photo');
    const original=document.getElementById('heroImage');
    const backOriginal=document.getElementById('heroFullImage');
    if(!hero||!frame||!background||!original||!backOriginal)return;
    let selected=(Array.isArray(state.config?.heroIds)?state.config.heroIds:[]).map(choose).filter(Boolean);
    if(!selected.length){
      selected=[state.photos.find(i=>i.is_hero),...state.photos.filter(i=>i.show_on_homepage)].filter(Boolean);
    }
    if(!selected.length)selected=state.photos.slice(0,3);
    selected=[...new Map(selected.map(i=>[i.id,i])).values()].slice(0,3);
    if(!selected.length)return;
    const previousId=state.heroUrls[state.heroIndex];
    const stack=frame.querySelector('.v3-photo-stack');
    const unchanged=selected.map(i=>i.id).join('|')===state.heroUrls.join('|')&&
      stack?.querySelectorAll('.v3-photo-card').length===selected.length&&
      background.querySelectorAll('.v3-backdrop-slide').length===selected.length;
    stop();
    const firstPoster=!hero.classList.contains('hero-poster-triptych');
    hero.classList.remove('hero-layout-full','hero-layout-split','hero-layout-minimal');
    hero.classList.add('hero-layout-framed','hero-v3','hero-poster','hero-poster-triptych');
    posterSettings(hero);
    if(firstPoster)document.dispatchEvent(new Event('hero:layout-changed'));
    if(unchanged){
      stack.querySelectorAll('.v3-photo-card img').forEach((im,i)=>{
        const source=url(selected[i]);
        if(im.src!==source)im.src=source; // app.js may reassign the legacy Hero on language change
        im.alt=alt(selected[i]);
      });
      hero.querySelectorAll('.v3-hero-dot').forEach((button,i)=>button.setAttribute('aria-label',copy[language()].photo+' '+(i+1)));
      show(Math.max(0,selected.findIndex(i=>i.id===previousId)));
      tick();return;
    }
    state.heroPaused=false;state.heroIndex=0;
    // Keep #heroImage in the DOM for the original cover handoff / preload contract.
    let gallery=stack;
    if(!gallery){gallery=document.createElement('div');gallery.className='v3-photo-stack';frame.appendChild(gallery);}
    gallery.replaceChildren();
    background.querySelectorAll('.v3-backdrop-slide:not(#heroFullImage)').forEach(el=>el.remove());
    selected.forEach((img,index)=>{
      const source=url(img);
      const card=document.createElement('figure');
      card.className='v3-photo-card';card.dataset.photoIndex=String(index);
      const foreground=index===0?original:document.createElement('img');
      foreground.className='v3-triptych-image';
      foreground.src=source;foreground.alt=alt(img);
      foreground.decoding='async';foreground.loading=index===0?'eager':'lazy';
      foreground.setAttribute('aria-hidden','false');
      card.appendChild(foreground);gallery.appendChild(card);
      const backdrop=index===0?backOriginal:document.createElement('img');
      backdrop.className='v3-backdrop-slide'+(index===0?' is-current':'');
      backdrop.src=source;backdrop.alt='';backdrop.setAttribute('aria-hidden','true');
      backdrop.decoding='async';backdrop.loading=index===0?'eager':'lazy';
      if(index>0)background.appendChild(backdrop);
    });
    state.heroUrls=selected.map(i=>i.id);
    let controls=document.getElementById('v3HeroControls');
    if(!controls){
      controls=document.createElement('div');controls.id='v3HeroControls';controls.className='v3-hero-controls';
      hero.querySelector('.hero-content')?.appendChild(controls);
    }
    controls.replaceChildren();
    if(selected.length>1){
      const dots=document.createElement('div');dots.className='v3-hero-dots';
      selected.forEach((_,i)=>{
        const b=document.createElement('button');b.type='button';
        b.className='v3-hero-dot';b.textContent=String(i+1).padStart(2,'0');
        b.setAttribute('aria-label',copy[language()].photo+' '+(i+1));
        b.onclick=()=>{show(i);tick();};dots.appendChild(b);
      });
      controls.appendChild(dots);
      const pause=document.createElement('button');pause.type='button';
      pause.id='v3HeroPause';pause.className='v3-hero-pause';
      pause.onclick=()=>{state.heroPaused=!state.heroPaused;tick();};
      controls.appendChild(pause);
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
  document.addEventListener('wedding:language',()=>{renderStories();renderSchedule();});
  document.addEventListener('wedding:invitation-opened',tick);
  document.addEventListener('visibilitychange',tick);
  reduced.addEventListener?.('change',tick);
  if(window.WeddingHeroReady)state.heroReady=true;
  setDay('bride');load();
})();