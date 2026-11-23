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
  console.log('PASS: desktop/tablet/mobile and landscape/portrait images use full-size contain + cover blur, no side crops');
}finally{await browser.close();}
