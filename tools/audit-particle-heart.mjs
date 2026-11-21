#!/usr/bin/env node
/* V23 Rose Gold Particle Heart: Safari/WebKit test with no Supabase data,
 * real canvas drawing, motion controls and visual state transitions. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const html = [
  '<!doctype html><html lang="vi"><head>',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<link rel="stylesheet" href="/assets/css/romantic-motion.css">',
  '<link rel="stylesheet" href="/assets/css/particle-heart.css">',
  '<style>html,body{margin:0}body{min-height:1200px}',
  '#weddingMagic{margin-top:30px} .hm-forever-scene{width:100%;box-sizing:border-box}</style>',
  '</head><body><section id="weddingMagic" class="hm-forever-scene">',
  '<div class="hm-forever-particles" aria-hidden="true"></div>',
  '<div class="hm-forever-inner">',
  '<div class="hm-crystal-stage" aria-hidden="true">',
  '<span class="hm-crystal-halo"></span><span class="hm-crystal-orbit"></span>',
  '<svg class="hm-crystal-heart" viewBox="0 0 220 200">',
  '<path d="M110 181C91 162 24 117 24 70C24 31 74 16 110 53C146 16 196 31 196 70C196 117 129 162 110 181Z" fill="#d58da1"/>',
  '</svg><span class="hm-crystal-flare"></span></div>',
  '<h2>Hải & Mỹ</h2></div></section>',
  '<script src="/assets/js/site/romantic-motion.js"></script>',
  '<script src="/assets/js/site/particle-heart.js"></script>',
  '</body></html>'
].join('');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
const server=createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/v23-test'){
    res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(html);return;
  }
  const path=resolve(root,'.'+decodeURIComponent(pathname));
  if(!path.startsWith(root+'/')||!existsSync(path)||!statSync(path).isFile()){
    res.writeHead(404).end();return;
  }
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'});
  res.end(readFileSync(path));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});

async function open(opts={}) {
  const context=await browser.newContext({
    viewport:opts.viewport||{width:1440,height:900},
    deviceScaleFactor:opts.mobile?3:1,
    isMobile:!!opts.mobile,
    hasTouch:!!opts.mobile,
    reducedMotion:opts.reduced?'reduce':'no-preference'
  });
  const page=await context.newPage();
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
    if(!r.url().startsWith(origin+'/'))external.push(r.url());
  });
  await page.route('**/*',route=>{
    if(route.request().url().startsWith(origin+'/'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+'/v23-test',{waitUntil:'load',timeout:20000});
  await page.waitForFunction(()=>!!window.WeddingParticleHeart,{timeout:9000});
  return {context,page,errors,external};
}
try{
  const d=await open();
  const {page}=d;
  await page.waitForFunction(()=>window.WeddingParticleHeart.status().elapsed>550,{timeout:8000});
  const started=await page.evaluate(()=>{
    const panel=document.querySelector('.hm-particle-intro');
    const stage=document.querySelector('.hm-crystal-stage');
    const trace=panel.querySelector('.hm-particle-trace-bright');
    const canvas=panel.querySelector('canvas');
    return {
      stageHeight:stage.getBoundingClientRect().height,
      traceOffset:Number(trace.style.strokeDashoffset),
      length:trace.getTotalLength(),
      rect:panel.getBoundingClientRect().height,
      canvasWidth:canvas.width,
      canvasHeight:canvas.height,
      classActive:document.getElementById('weddingMagic').classList.contains('hm-particle-enabled'),
      particles:window.WeddingParticleHeart.status().particles
    };
  });
  assert.equal(started.classActive,true);
  assert.equal(started.particles,180);
  assert.ok(started.traceOffset<started.length,'The SVG line must be actively drawn');
  assert.ok(started.canvasWidth>100&&started.canvasHeight>100);
  await page.waitForFunction(()=>window.WeddingParticleHeart.status().elapsed>=2650,{timeout:9000});
  const halfway=await page.evaluate(()=>{
    const canvas=document.querySelector('.hm-particle-canvas');
    const context=canvas.getContext('2d');
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let painted=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)painted++;
    return {
      painted,
      reveal:Number(document.getElementById('weddingMagic').style.getPropertyValue('--hm-v23-reveal'))
    };
  });
  assert.ok(halfway.painted>0,'Canvas particles must actually be rendered');
  assert.ok(halfway.reveal>0&&halfway.reveal<1,'Crystal should be gradually revealed');
  await page.waitForFunction(()=>window.WeddingParticleHeart.status().finished,{timeout:12000});
  const completed=await page.evaluate(()=>({
    state:window.WeddingParticleHeart.status(),
    scene:document.getElementById('weddingMagic').className,
    opacity:getComputedStyle(document.querySelector('.hm-crystal-heart')).opacity
  }));
  assert.equal(completed.state.running,false,'No idle Canvas rAF after finishing');
  assert.ok(completed.state.frames>=30&&completed.state.frames<=400);
  assert.match(completed.scene,/hm-particle-complete/);
  assert.equal(completed.opacity,'1');
  assert.deepEqual(d.external,[],'No external animation network requests');
  assert.deepEqual(d.errors,[],'No browser script errors');
  await d.context.close();

  const m=await open({mobile:true,viewport:{width:390,height:844}});
  await m.page.waitForFunction(()=>window.WeddingParticleHeart.status().elapsed>350,{timeout:8000});
  const count=await m.page.evaluate(()=>window.WeddingParticleHeart.status().particles);
  assert.equal(count,64,'Mobile uses reduced particle budget');
  const beforePause=await m.page.evaluate(()=>window.WeddingParticleHeart.status().elapsed);
  await m.page.evaluate(()=>document.body.classList.add('photo-lightbox-open'));
  await m.page.waitForFunction(()=>!window.WeddingParticleHeart.status().running,{timeout:2500});
  await m.page.waitForTimeout(170);
  const paused=await m.page.evaluate(()=>window.WeddingParticleHeart.status().elapsed);
  assert.ok(paused-beforePause<110,'Canvas must pause while Lightbox is open');
  await m.page.evaluate(()=>document.body.classList.remove('photo-lightbox-open'));
  await m.page.waitForFunction(()=>window.WeddingParticleHeart.status().running,{timeout:3000});
  // Mode change should immediately stop rendering and show the static heart.
  await m.page.evaluate(()=>document.documentElement.dataset.motion='minimal');
  await m.page.waitForFunction(()=>!window.WeddingParticleHeart.status().allowed &&
    !document.getElementById('weddingMagic').classList.contains('hm-particle-enabled'),{timeout:3000});
  assert.equal(await m.page.locator('.hm-crystal-heart').evaluate(e=>getComputedStyle(e).opacity),'1');
  await m.context.close();

  const r=await open({reduced:true,viewport:{width:1280,height:850}});
  const stat=await r.page.evaluate(()=>({
    status:window.WeddingParticleHeart.status(),
    crystal:getComputedStyle(document.querySelector('.hm-crystal-heart')).opacity,
    overlay:getComputedStyle(document.querySelector('.hm-particle-intro')).display
  }));
  assert.equal(stat.status.running,false);
  assert.equal(stat.status.allowed,false);
  assert.equal(stat.crystal,'1');
  assert.equal(stat.overlay,'none');
  assert.deepEqual(r.errors,[]);
  await r.context.close();

  console.log('PASS: V23 SVG trace, real Canvas particles, crystal reveal, mobile cap, Lightbox pause, minimal/reduced motion, no network assets');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
