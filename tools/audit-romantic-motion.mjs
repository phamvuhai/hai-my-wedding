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
    storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://mock.invalid/'+path}})})},
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
try {
  const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const {page,errors}=await visit(desktop);
  assert.equal(await page.locator('#weddingMagic').count(),0,'Redundant crystal scene removed in V27');
  assert.equal(await page.locator('#story .editorial-story-visual #ourPromisePhoto').count(),1,'Promise photo retained inside Story');
  assert.equal(await page.locator('#story .editorial-story-copy h2').count(),1,'Single editorial story heading');
  assert.equal(await page.locator('#countdown #days').count(),1,'Compact hero countdown is present');
  assert.equal(await page.locator('#events [data-event-day]').count(),2,'Both wedding schedules remain');
  assert.equal(await page.locator('#rsvpForm').count(),1,'RSVP remains');
  await page.waitForFunction(()=>!!document.querySelector('.hero-copy > .btn .hm-silk-glint'),null,{timeout:6000});
  assert.equal(await page.locator('#openInvitation .hm-silk-glint').count(),1,'Open Invitation button remains enhanced');
  assert.equal(await page.locator('.hero-copy > .btn .hm-silk-glint').count(),1,'Hero link remains enhanced');
  assert.equal(await page.locator('.rsvp-form button[type=submit] .hm-silk-glint').count(),1,'RSVP button remains enhanced');
  await page.evaluate(()=>window.WeddingI18n.setLanguage('en'));
  await page.waitForFunction(()=>document.querySelector('#story h2').textContent.trim()==='From us, to family.');
  assert.equal(await page.locator('.hero-copy > .btn .hm-silk-glint').count(),1,'Language switch must preserve button glints');
  assert.equal(await page.locator('#weddingMagic').count(),0,'Removed scene stays removed in English');
  assert.equal(await page.locator('#openInvitation').getAttribute('type'),'button');
  assert.ok(!errors.some(e=>e.includes('romantic-motion')),'No motion runtime errors: '+JSON.stringify(errors));
  await desktop.close();

  const mobile=await browser.newContext({...devices['iPhone 13']});
  const {page:phone,errors:mobileErrors}=await visit(mobile,'/jp');
  const metrics=await phone.evaluate(()=>{
    const story=document.querySelector('#story .editorial-story-layout');
    const hero=document.getElementById('home');
    const stage=document.getElementById('countdown');
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      storyWidth:story.getBoundingClientRect().width,
      heroWidth:hero.getBoundingClientRect().width,
      countdownWidth:stage.getBoundingClientRect().width,
      open:!!document.querySelector('#openInvitation .hm-silk-glint')};
  });
  assert.ok(metrics.scrollWidth<=metrics.width+2,'No horizontal overflow on iPhone');
  assert.ok(metrics.storyWidth<=metrics.width+1,'Story fits mobile');
  assert.ok(metrics.countdownWidth<metrics.width,'Countdown remains compact');
  assert.equal(metrics.open,true);
  assert.deepEqual(mobileErrors,[],'No mobile JavaScript errors');
  await mobile.close();

  const calm=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const {page:reducedPage}=await visit(calm);
  assert.equal(await reducedPage.evaluate(()=>document.documentElement.classList.contains('hm-cinematic-enabled')),false,
    'Reduced motion prevents nonessential cinematic pointer motion');
  assert.equal(await reducedPage.locator('#story .editorial-story-visual').count(),1);
  await calm.close();
  console.log('PASS V27: one editorial Story, no crystal heart, compact countdown, schedules, RSVP, glint, language, mobile and reduced motion');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
