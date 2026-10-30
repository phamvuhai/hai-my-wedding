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
    const all=state.photos.filter(i=>i.show_on_homepage);
    const p=all.length?all:state.photos;
    return [
      {id:'v4-chapter-1',slot:'story',style:'split',imageId:p[1]?.id||'',visible:true,text:{"vi":"Hạnh phúc không phải lúc nào cũng là điều lớn lao. Đôi khi, đó chỉ là được kể cho nhau nghe một ngày đã qua, cùng cười vì những chuyện rất nhỏ và biết rằng luôn có một người ở đó để lắng nghe.","en":"Happiness is not always something grand. Sometimes it is sharing an ordinary day, laughing at little things, and knowing there is always someone who will listen.","ja":"幸せは、特別な出来事だけではありません。今日あったことを話し、小さなことで笑い合い、耳を傾けてくれる人がそばにいる。それが私たちの宝物です。"}},
      {id:'v4-chapter-2',slot:'story',style:'letter',imageId:p[2]?.id||'',visible:true,text:{"vi":"Có những ngày rực rỡ, cũng có những ngày thật bình thường. Nhưng khi cùng nhìn về một hướng, chúng mình hiểu rằng điều quý giá nhất không phải đi được bao xa, mà là vẫn muốn bước tiếp cùng nhau.","en":"Some days shine while others are beautifully ordinary. We have learned that what matters most is not how far we go, but choosing to keep walking together.","ja":"輝く日もあれば、何気ない日もあります。大切なのはどこまで行けるかよりも、これからも一緒に歩みたいと思えることだと感じています。"}},
      {id:'v4-chapter-3',slot:'promise',style:'quote',imageId:'',visible:true,text:{"vi":"“Chẳng cần ngày nào cũng rực rỡ, chỉ mong những ngày bình thường luôn có nhau.”","en":"“Every day need not be extraordinary. May we always share the ordinary ones.”","ja":"「毎日が特別でなくてもいい。何気ない日々を、これからも一緒に。」"}},
      {id:'v4-chapter-4',slot:'promise',style:'split',imageId:p[3]?.id||'',visible:true,text:{"vi":"Và rồi, từ lời hẹn luôn ở bên nhau, chúng mình chọn một lời hứa lớn hơn: trở thành gia đình, cùng chăm sóc một mái ấm và đón chờ những điều tốt đẹp phía trước.","en":"A simple promise to stay by each other's side grew into something more: a family, a home, and the hope of welcoming all the beautiful days ahead.","ja":"そして、いつもそばにいるという約束は、家族になり、ふたりで家庭を築くという大切な決意になりました。"}},
      {id:'v4-chapter-5',slot:'events',style:'letter',imageId:p[4]?.id||'',visible:true,text:{"vi":"Hai ngày vui, hai gia đình và thật nhiều yêu thương. Từ những nghi lễ ấm áp bên người thân đến buổi tiệc quây quần cùng bạn bè, chúng mình mong được cùng mọi người lưu giữ thật nhiều kỷ niệm đẹp.","en":"Two celebrations, two families and so much love. From intimate family traditions to joyful gatherings with friends, we hope to share beautiful memories with everyone.","ja":"ふたつの家族が迎える、愛に満ちた二日間。温かな儀式から楽しい披露宴まで、皆さまと素敵な思い出を重ねられたら幸いです。"}},
      {id:'v4-chapter-6',slot:'moments',style:'film',imageId:p[5]?.id||'',visible:true,text:{"vi":"Mỗi bức ảnh là một lời nhắc rằng hạnh phúc được dệt nên từ những điều nhỏ bé. Chúng mình sẽ giữ những khoảnh khắc này, để một ngày nhìn lại vẫn thấy nguyên vẹn sự dịu dàng của hôm nay.","en":"Every photograph reminds us that a beautiful life is woven from little things. We will keep these moments so we can remember how this chapter felt.","ja":"一枚一枚の写真は、小さな幸せの積み重ね。いつか見返したときにも、今の優しい気持ちを思い出せるよう大切に残していきます。"}},
      {id:'v5-chapter-8',slot:'events',style:'split',imageId:p[6]?.id||p[0]?.id||'',visible:true,text:{"vi":"Hôm nay, chúng mình không chỉ đánh dấu một ngày đặc biệt, mà còn mở ra những ngày tháng mới: cùng học cách quan tâm, cùng sẻ chia và luôn dành cho nhau một nơi để trở về.","en":"Today is not only a celebration. It is the beginning of a new chapter: caring for each other, sharing the little things, and always having a place to call home.","ja":"この日は、ひとつの節目であると同時に、新しい毎日の始まりです。互いを思いやり、喜びを分かち合い、いつでも帰れる場所をふたりでつくっていきます。"}},
      {id:'v5-chapter-9',slot:'moments',style:'split',imageId:p[7]?.id||p[1]?.id||'',visible:true,text:{"vi":"Mai này khi nhìn lại, điều chúng mình muốn nhớ nhất không chỉ là những tấm hình thật đẹp, mà còn là cảm giác được yêu thương, được lớn lên và được cùng nhau đi qua những ngày bình dị.","en":"When we look back one day, we hope to remember more than lovely photographs: the feeling of being loved, growing together, and sharing the beauty of ordinary days.","ja":"いつか振り返ったとき、美しい写真だけではなく、愛されている安心感や、ともに成長し、何気ない日々を分かち合った温かさを思い出したいと思います。"}},
      {id:'v4-chapter-7',slot:'rsvp',style:'quote',imageId:'',visible:true,text:{"vi":"“Ngày vui sẽ trọn vẹn hơn khi có bạn ở đây. Cảm ơn vì đã cùng chúng mình viết nên một kỷ niệm đáng nhớ.”","en":"“Our celebration will be lovelier with you here. Thank you for being part of a memory we will always cherish.”","ja":"「皆さまと過ごすひとときが、私たちの宝物になります。心から、ありがとうございます。」"}}
    ].filter(block=>['v4-chapter-1','v4-chapter-3','v4-chapter-6','v4-chapter-7'].includes(block.id))
      .map(block=>block.style==='film'?{...block,imageIds:[p[6]?.id,p[7]?.id].filter(Boolean)}:block);
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
      const configured=Array.isArray(b.imageIds)?b.imageIds.map(choose).filter(Boolean):[];
      const used=new Set([img.id]);const images=[img];
      for(const next of [...configured,...state.photos]){
        if(!next||used.has(next.id))continue;
        images.push(next);used.add(next.id);
        if(images.length===3)break;
      }
      return '<div class="v3-story-block v3-story-film"><div class="v3-film-images">'+images.map(photo).join('')+'</div>'+caption+'</div>';
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
  function renderPromisePhoto(){
    const image=document.getElementById('ourPromisePhoto');
    if(!image)return;
    const fallback=image.parentElement?.querySelector('.our-promise-fallback');
    const pool=state.photos.filter(photo=>photo.show_on_homepage);
    const choices=pool.length?pool:state.photos;
    const excluded=new Set([state.config?.schedulePhotoId,state.config?.farewellPhotoId]);
    const preferred=choices.filter(photo=>!excluded.has(photo.id)&&!photo.is_hero);
    const aspect=photo=>(Number(photo.width)||1)/(Number(photo.height)||1);
    const portraits=preferred
      .filter(photo=>aspect(photo)>=.48&&aspect(photo)<=.88)
      .sort((a,b)=>(Number(b.width)||0)*(Number(b.height)||0)-(Number(a.width)||0)*(Number(a.height)||0));
    // Explicit Admin photo wins, then high-resolution portrait, then other published photos.
    const seen=new Set();
    const candidates=[choose(state.config?.promisePhotoId),...portraits,...preferred,...choices]
      .filter(photo=>{
        if(!valid(photo)||seen.has(photo.id))return false;
        seen.add(photo.id);
        return true;
      });
    let current=0;
    const complete=()=>{
      image.hidden=false;
      if(fallback)fallback.hidden=true;
      image.parentElement?.classList.add('is-photo-loaded');
    };
    const failed=()=>{
      image.hidden=true;
      if(fallback)fallback.hidden=false;
      image.parentElement?.classList.remove('is-photo-loaded');
    };
    const attempt=()=>{
      const photo=candidates[current++];
      if(!photo){failed();return;}
      const next=url(photo);
      if(!next){attempt();return;}
      image.alt=alt(photo);
      image.style.objectPosition=Math.max(0,Math.min(100,Number(photo.focus_x??50)))+'% '+Math.max(0,Math.min(100,Number(photo.focus_y??50)))+'%';
      image.onload=complete;
      image.onerror=attempt;
      image.hidden=false;
      if(image.getAttribute('src')!==next)image.src=next;
      else if(image.complete)(image.naturalWidth?complete:attempt)();
    };
    if(candidates.length){attempt();return;}
    // HTML has a genuine published-photo fallback even when the CMS is unavailable.
    image.onload=complete;
    image.onerror=failed;
    if(image.complete)(image.naturalWidth?complete:failed)();
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
    const blur=[4,6,10].includes(Number(data.posterBlur))?Number(data.posterBlur):6;
    const shade=[30,40,55].includes(Number(data.posterShade))?Number(data.posterShade):40;
    const desktopX=posterNumber(data.posterDesktopX,50),desktopY=posterNumber(data.posterDesktopY,50);
    const mobileX=posterNumber(data.posterMobileX,50),mobileY=posterNumber(data.posterMobileY,50);
    hero.style.setProperty('--poster-blur',blur+'px');
    hero.style.setProperty('--poster-shade',(shade/100).toFixed(2));
    hero.style.setProperty('--poster-focus-desktop',desktopX+'% '+desktopY+'%');
    hero.style.setProperty('--poster-focus-mobile',mobileX+'% '+mobileY+'%');
    hero.classList.toggle('poster-no-portrait',data.posterForeground===false);
  }

  /* Wedding V5 full-bleed poster: gallery-only background, no foreground cards or viewer. */
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const slides=()=>[...document.querySelectorAll('#home .v5-gallery-layer')];
  function setBackdrop(index){
    const nodes=slides();
    if(!nodes.length)return;
    state.heroIndex=(index+nodes.length)%nodes.length;
    nodes.forEach((layer,i)=>layer.classList.toggle('is-current',i===state.heroIndex));
  }
  function tick(){
    stop();
    if(state.heroUrls.length<2||reducedMotion.matches||document.hidden||document.body.classList.contains('invitation-locked'))return;
    state.heroTimer=setInterval(()=>setBackdrop(state.heroIndex+1),7000);
  }
  function heroPhotos(){
    const configured=(Array.isArray(state.config?.heroIds)?state.config.heroIds:[])
      .map(choose).filter(Boolean);
    const fallback=[...state.photos.filter(i=>i.is_hero),...state.photos.filter(i=>i.show_on_homepage),...state.photos];
    return [...new Map((configured.length?configured:fallback).map(img=>[img.id,img])).values()].slice(0,8);
  }
  function buildTile(img,role,index){
    const tile=document.createElement('img');
    tile.className='v5-hero-tile '+(role==='center'?'v6-center-image':role==='underlay'?'v6-center-underlay':'v6-side');
    tile.src=url(img);tile.alt='';tile.setAttribute('aria-hidden','true');
    tile.draggable=false;tile.decoding='async';
    tile.loading=index===0?'eager':'lazy';
    // Both side copies reuse the exact same image as the full, uncropped center.
    tile.style.setProperty('--tile-focus',role==='left'?'20% 50%':role==='right'?'80% 50%':'50% 50%');
    return tile;
  }
  function createSlides(){
    if(!state.heroReady||!state.photos.length)return;
    const hero=document.getElementById('home');
    const background=hero?.querySelector('.hero-full-photo');
    if(!hero||!background)return;
    const chosen=heroPhotos();if(!chosen.length)return;
    const ids=chosen.map(i=>i.id);
    const oldIds=state.heroUrls;
    const unchanged=ids.length===oldIds.length&&ids.every((id,i)=>id===oldIds[i])&&slides().length===ids.length;
    const originalIndex=unchanged?state.heroIndex:0;
    stop();
    hero.classList.remove('hero-layout-full','hero-layout-split','hero-layout-minimal','hero-poster-triptych');
    hero.classList.add('hero-layout-framed','hero-v3','hero-poster','hero-v5');
    posterSettings(hero);
    document.getElementById('v3HeroControls')?.remove();
    const obsolete=background.querySelectorAll('.v3-backdrop-slide:not(#heroFullImage)');
    obsolete.forEach(img=>img.remove());
    if(!unchanged){
      background.querySelector('.v5-gallery')?.remove();
      const gallery=document.createElement('div');
      gallery.className='v5-gallery';
      gallery.setAttribute('aria-hidden','true');
      state.heroUrls=ids;
      chosen.forEach((photo,i)=>{
        const layer=document.createElement('div');layer.className='v5-gallery-layer';
        layer.dataset.slide=String(i);
        layer.appendChild(buildTile(photo,'left',i));
        const center=document.createElement('div');
        center.className='v6-center-panel';
        center.appendChild(buildTile(photo,'underlay',i));
        center.appendChild(buildTile(photo,'center',i));
        layer.appendChild(center);
        layer.appendChild(buildTile(photo,'right',i));
        gallery.appendChild(layer);
      });
      background.appendChild(gallery);
    }
    hero.classList.add('v5-gallery-ready');
    setBackdrop(originalIndex);
    if(!unchanged)document.dispatchEvent(new Event('hero:layout-changed'));
    tick();
  }
  let initialLoaded=false;
  async function load(){
    try{
      const [photos,config]=await Promise.all([
        state.db.from('gallery_images').select('id,image_path,title,title_en,title_ja,alt_text,alt_text_en,alt_text_ja,width,height,focus_x,focus_y,sort_order,is_published,is_hero,show_on_homepage,updated_at').eq('is_published',true).order('sort_order',{ascending:true}).limit(100),
        state.db.from('site_content').select('value_vi').eq('key','v3_design').maybeSingle()
      ]);
      if(photos.error)throw photos.error;
      state.photos=(photos.data||[]).filter(valid);
      state.byId=new Map(state.photos.map(i=>[i.id,i]));
      try{state.config=config.error?null:(config.data?.value_vi?JSON.parse(config.data.value_vi):null);}catch{state.config=null;}
      initialLoaded=true;
      // The Promise image must not depend on optional Story blocks rendering successfully.
      renderPromisePhoto();renderSchedule();createSlides();renderStories();
    }catch(error){console.error('Wedding V3 loading error',error);}
  }
  document.addEventListener('wedding:hero-ready',()=>{state.heroReady=true;if(initialLoaded)createSlides();});
  document.addEventListener('wedding:language',()=>{renderStories();renderSchedule();renderPromisePhoto();});
  document.addEventListener('wedding:invitation-opened',tick);
  document.addEventListener('visibilitychange',tick);
  reduced.addEventListener?.('change',tick);
  if(window.WeddingHeroReady)state.heroReady=true;
  setDay('bride');load();
})();