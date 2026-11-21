#!/usr/bin/env node
/* Offline WebKit checks for V19 romantic motion. No real guest tokens or writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {extname,resolve} from 'node:path';
import {webkit,devices} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  let path=url.pathname;
  if(path==='/'||/^\/(?:vi|en|jp)\/?$/.test(path))path='/index.html';
  let file;
  try{file=resolve(root,'.'+decodeURIComponent(path));}catch{res.writeHead(400).end();return;}
  if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});

function mockSupabase(){
  const chain=()=>new Proxy({}, {get(_obj,key){
    if(key==='then')return resolve=>Promise.resolve({data:[],error:null}).then(resolve);
    if(key==='maybeSingle'||key==='single')return async()=>({data:null,error:null});
    return ()=>chain();
  }});
  window.supabase={createClient:()=>({
    from:()=>chain(),rpc:async()=>({data:null,error:null}),
    storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:origin+'/assets/'+path}})})},
    auth:{getSession:async()=>({data:{session:null},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}
  })};
}
async function visit(context,path='/vi'){
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/')||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
    return route.abort();
  });
  await page.addInitScript(mockSupabase);
  await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>Boolean(window.WeddingRomanticMotion&&window.WeddingI18n),
    null,{timeout:12000});
  return {page,errors};
}
try{
  const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const {page,errors}=await visit(desktop);
  assert.equal(await page.locator('.hm-forever-scene').count(),1,'Crystal-heart section must exist');
  assert.equal(await page.locator('.hm-crystal-heart').count(),1,'Crystal heart SVG must exist');
  assert.equal(await page.locator('.hm-forever-particle').count(),24,'Decorative particle budget');
  assert.equal(await page.locator('#openInvitation .hm-silk-glint').count(),1,'Original open button enhanced');
  assert.equal(await page.locator('.hero-copy > .btn .hm-silk-glint').count(),1,'Original Hero link enhanced');
  assert.equal(await page.locator('.rsvp-form button[type=submit] .hm-silk-glint').count(),1,'Original RSVP button enhanced');
  await page.evaluate(()=>window.WeddingI18n.setLanguage('en'));
  await page.waitForFunction(()=>document.getElementById('hmForeverTitle').textContent.trim()==='Two hearts, one journey');
  assert.equal(await page.locator('.hero-copy > .btn .hm-silk-glint').count(),1,'I18n must preserve silk decoration');
  await page.evaluate(()=>{
    const el=document.querySelector('#story .story-copy');
    const r=el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:r.left+r.width*.85,clientY:r.top+r.height*.15,bubbles:true}));
  });
  await page.waitForTimeout(110);
  const tilt=await page.locator('#story .story-copy').evaluate(el=>el.style.getPropertyValue('--hm-ry'));
  assert.notEqual(tilt,'0deg','Desktop parallax must respond to pointer');
  await page.locator('#story .story-copy').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerleave',{bubbles:true,pointerType:'mouse'})));
  assert.equal(await page.locator('#story .story-copy').evaluate(el=>el.style.getPropertyValue('--hm-ry')),'0deg');
  assert.equal(await page.locator('#openInvitation').getAttribute('type'),'button','Open invitation remains actionable');
  assert.ok(!errors.some(e=>e.includes('romantic-motion')),'No motion script error');
  await desktop.close();

  const mobile=await browser.newContext({...devices['iPhone 13']});
  const {page:phone}=await visit(mobile,'/jp');
  const metrics=await phone.evaluate(()=>{
    const scene=document.getElementById('weddingMagic');
    const r=scene.getBoundingClientRect();
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,sceneWidth:r.width,
      particles:scene.querySelectorAll('.hm-forever-particle').length,
      btn:!!document.querySelector('#openInvitation .hm-silk-glint')};
  });
  assert.ok(metrics.sceneWidth<=metrics.width+1,'Crystal-heart scene must fit mobile width');
  assert.ok(metrics.scrollWidth<=metrics.width+2,'No horizontal overflow on iPhone');
  assert.equal(metrics.particles,24);
  assert.equal(metrics.btn,true);
  assert.equal(await phone.locator('#hmForeverTitle').innerText(),'ふたつの心、ひとつの未来');
  await mobile.close();

  const calm=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const {page:reducedPage}=await visit(calm);
  const reducedStyles=await reducedPage.evaluate(()=>{
    const heart=document.querySelector('.hm-crystal-heart');
    const paper=document.querySelector('#story .story-copy');
    return {animation:getComputedStyle(heart).animationName,enabled:document.documentElement.classList.contains('hm-cinematic-enabled'),
      transform:getComputedStyle(paper).transform};
  });
  assert.equal(reducedStyles.animation,'none','Reduced motion crystal must remain static');
  assert.equal(reducedStyles.enabled,false,'Reduced motion must prevent pointer tilt');
  await calm.close();
  console.log('PASS: crystal heart, 24 particles, silk buttons, VI/EN/JA, parallax, mobile layout, reduced motion');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
