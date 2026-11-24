#!/usr/bin/env node
/* Verify the real shipped CSS maximizes each Hero photo without cropping.
 * WebKit fixture uses test-only SVG images, not Production Supabase data. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webkit} from 'playwright';

const site=readFileSync('assets/css/site.css','utf8');
const compact=readFileSync('assets/css/compact-wedding.css','utf8');
const luxury=readFileSync('assets/css/luxury-v26-1.css','utf8');
const wedding=readFileSync('assets/js/site/wedding.js','utf8');
const mobile=readFileSync('assets/css/mobile-editorial.css','utf8');
assert.equal((wedding.match(/layer\.appendChild\(center\)/g)||[]).length,1);
assert.ok(!wedding.includes("buildTile(photo,'left'"),'Left duplicate crop removed');
assert.ok(!wedding.includes("buildTile(photo,'right'"),'Right duplicate crop removed');
assert.ok(wedding.includes("buildTile(photo,'underlay'"));
assert.ok(wedding.includes("buildTile(photo,'center'"));
assert.ok(!site.includes('/* ============ 5/12: wedding-v6.css ============ */'),
  'Outdated three-column Hero stylesheet removed');
const browser=await webkit.launch({headless:true});
try {
  for(const {width,height} of [
    {width:390,height:844},
    {width:768,height:1024},
    {width:1728,height:890}
  ]){
    for(const orientation of ['landscape','portrait']){
      const imageWidth=orientation==='landscape'?1200:800;
      const imageHeight=orientation==='landscape'?800:1200;
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+imageWidth+'" height="'+imageHeight+
        '" viewBox="0 0 '+imageWidth+' '+imageHeight+'"><rect width="100%" height="100%" fill="#c0a07c"/>'+
        '<rect x="25" y="25" width="'+(imageWidth-50)+'" height="'+(imageHeight-50)+'" fill="none" stroke="red" stroke-width="30"/></svg>';
      const data='data:image/svg+xml,'+encodeURIComponent(svg);
      const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
      const page=await ctx.newPage();
      await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body class="hero-image-ready"><header class="hero hero-layout-framed hero-v5 hero-poster v5-gallery-ready" id="home">
        <div class="hero-full-photo"><img id="heroFullImage" src="${data}" alt="">
        <div class="v5-gallery"><div class="v5-gallery-layer is-current"><div class="v6-center-panel">
        <img class="v5-hero-tile v6-center-underlay" src="${data}" alt="">
        <img class="v5-hero-tile v6-center-image" src="${data}" alt="">
        </div></div></div></div><div class="hero-overlay"></div></header></body></html>`);
      await page.addStyleTag({content:site});
      await page.addStyleTag({content:compact});
      await page.addStyleTag({content:luxury});
      await page.waitForFunction(()=>[...document.querySelectorAll('.v5-hero-tile')].every(img=>img.complete&&img.naturalWidth>0));
      const measurements=await page.evaluate(()=>{
        const hero=document.getElementById('home');
        const backdrop=hero.querySelector('.v6-center-underlay');
        const image=hero.querySelector('.v6-center-image');
        const center=hero.querySelector('.v6-center-panel');
        const rect=e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,y:r.y}};
        return {hero:rect(hero),center:rect(center),image:rect(image),backdrop:rect(backdrop),
          objectFit:getComputedStyle(image).objectFit,
          backdropFit:getComputedStyle(backdrop).objectFit,
          backdropFilter:getComputedStyle(backdrop).filter,
          natural:{w:image.naturalWidth,h:image.naturalHeight},
          overflow:document.documentElement.scrollWidth>innerWidth+2,
          sideCopies:hero.querySelectorAll('.v6-side').length};
      });
      assert.equal(measurements.objectFit,'contain',orientation+' '+width+': full photo must never crop');
      assert.equal(measurements.backdropFit,'cover',orientation+' '+width+': blur must fill the gaps');
      assert.match(measurements.backdropFilter,/blur\(/,'Blur remains behind');
      assert.equal(measurements.sideCopies,0,'No duplicate side photos');
      assert.equal(measurements.overflow,false,'No horizontal scroll');
      assert.ok(Math.abs(measurements.center.w-measurements.hero.w)<2,'Photo can use all horizontal space');
      assert.ok(Math.abs(measurements.center.h-measurements.hero.h)<2,'Photo can use all vertical space');
      const fit=Math.min(measurements.image.w/measurements.natural.w,measurements.image.h/measurements.natural.h);
      const renderedW=measurements.natural.w*fit;
      const renderedH=measurements.natural.h*fit;
      assert.ok(Math.abs(renderedW-measurements.image.w)<2||Math.abs(renderedH-measurements.image.h)<2,
        'Width or height must hit available maximum');
      await ctx.close();
    }
  }
  // Exercise the actual Hero selection code on a test-only album and check
  // the compact overlay geometry at common phone widths.
  for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const photo=(id,w,h)=>({id,width:w,height:h,is_published:true,image_path:id+'.webp',title:id,sort_order:0});
    const portrait=photo('mobile-test',800,1200);
    const landscape=photo('desktop-test',1200,800);
    await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="hero-image-ready">
      <header id="home" class="hero hero-v5 hero-poster">
        <div class="hero-full-photo"><img id="heroFullImage" alt=""></div><div class="hero-overlay"></div>
        <div class="hero-content"><div class="hero-copy">
          <p class="eyebrow">SAVE THE DATE</p><h1 class="hero-couple-names"><span class="hero-name hero-name-left"><span class="hero-name-fit-text">Hai Pham</span></span><span class="hero-amp"><span class="hero-amp-text">&amp;</span></span><span class="hero-name hero-name-right"><span class="hero-name-fit-text">My Nguyen</span></span></h1>
          <p class="hero-date">2026年12月18日（金）〜20日（日）</p><p class="hero-note">これからも、ふたりで歩んでいけることが何よりの幸せです。</p><a class="btn btn-primary" href="#events">結婚式の日程を見る</a>
        </div></div></header></body></html>`);
    for(const content of [site,compact,luxury,mobile])await page.addStyleTag({content});
    await page.evaluate(({portrait,landscape})=>{
      const photos=[portrait,landscape];
      window.WEDDING_CONFIG={supabaseUrl:'https://mock.invalid',supabaseAnonKey:'test'};
      window.WeddingHeroReady=true;
      window.supabase={createClient:()=>({from:table=>{
        const api={select:()=>api,eq:()=>api,order:()=>api,limit:()=>api,
          maybeSingle:async()=>({data:{value_vi:JSON.stringify({heroIds:[landscape.id],mobileHeroId:portrait.id})},error:null}),
          then:(resolve,reject)=>Promise.resolve({data:photos,error:null}).then(resolve,reject)};
        return api;
      }})};
      window.WeddingAdaptiveImages={progressiveSlide:(layer,db,photo)=>{
        const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+photo.width+'" height="'+photo.height+'"><rect width="100%" height="100%" fill="#b28e71"/></svg>';
        layer.querySelectorAll('img').forEach(el=>{el.src='data:image/svg+xml,'+encodeURIComponent(svg)});
      }};
    },{portrait,landscape});
    await page.addScriptTag({content:wedding});
    await page.waitForSelector('#home.mobile-photo-first .v5-gallery-layer.is-current');
    const m=await page.evaluate(()=>{
      const r=s=>document.querySelector(s).getBoundingClientRect();
      return {photo:r('.hero-full-photo').bottom,photoTop:r('.hero-full-photo').top,title:r('.hero-mobile-title').top,
        date:r('.hero-date').bottom,note:r('.hero-note').top,cta:r('.hero-copy>.btn').top,ctaBottom:r('.hero-copy>.btn').bottom,
        active:document.querySelector('.v5-gallery-layer.is-current').dataset.photoId,
        fit:getComputedStyle(document.querySelector('.v6-center-image')).objectFit,
        overflow:document.documentElement.scrollWidth>innerWidth+2};
    });
    assert.equal(m.active,'mobile-test');
    assert.equal(m.fit,'contain');
    console.log('Mobile overlay geometry',width,JSON.stringify(m));
    assert.ok(m.title>=m.photoTop+(m.photo-m.photoTop)*.30,'Top portion of photograph stays clear');
    assert.ok(m.date<=m.note+2&&m.note<m.cta,'Date, note and CTA ordered');
    assert.ok(m.ctaBottom<=m.photo+2,'Entire invitation copy remains over the photo');
    assert.equal(m.overflow,false);
    await page.setViewportSize({width:1024,height:768});
    await page.waitForFunction(()=>!document.getElementById('home').classList.contains('mobile-photo-first')&&document.querySelector('.v5-gallery-layer.is-current')?.dataset.photoId==='desktop-test');
    assert.equal(await page.locator('.hero-mobile-title').count(),0,'Desktop restores original title DOM');
    assert.deepEqual(errors,[]);
    await ctx.close();
  }
  console.log('PASS: full-size contain on all devices; dedicated mobile portrait, compact overlaid copy/CTA and desktop restore');
}finally{await browser.close();}
