#!/usr/bin/env node
/* V27 editorial: offline WebKit layout and functional smoke, no Production data. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';
const root=process.cwd();
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer((req,res)=>{
  let path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'||/^\/(vi|en|jp)(?:\/invite\/[^/]+)?\/?$/.test(path))path='/index.html';
  const file=resolve(root,'.'+decodeURIComponent(path));
  if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
async function visit(width,height,path='/vi',opts={}){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width<=500?3:1,
    hasTouch:width<=500,isMobile:width<=500,reducedMotion:opts.reduced?'reduce':'no-preference'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const chain=()=>new Proxy({}, {get(_t,key){
      if(key==='then')return resolve=>Promise.resolve({data:[],error:null}).then(resolve);
      return ()=>chain();
    }});
    window.supabase={createClient:()=>({
      from:()=>chain(),rpc:async()=>({data:null,error:null}),
      storage:{from:()=>({getPublicUrl:p=>({data:{publicUrl:'https://mock.invalid/'+p}})})},
      auth:{getSession:async()=>({data:{session:null},error:null}),
        onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}
    })};
  });
  await page.route('**/*',route=>{
    if(route.request().url().startsWith(origin+'/'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:25000});
  return {context,page,errors};
}
try{
  for(const [width,height] of [[390,844],[320,568],[768,1024],[1280,850]]){
    const {context,page,errors}=await visit(width,height);
    await page.waitForFunction(()=>Boolean(window.WeddingI18n&&document.getElementById('days')),{timeout:10000});
    const snapshot=await page.evaluate(()=>{
      const box=id=>document.getElementById(id)?.getBoundingClientRect();
      const story=document.querySelector('#story .editorial-story-layout')?.getBoundingClientRect();
      return {screen:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+2,
        hero:!!box('home'),story:!!story,storyWidth:story?.width||0,
        countdown:box('countdown')?.width||0,photo:!!box('ourPromisePhoto'),
        album:!!box('homeGallery'),rsvp:!!box('rsvpForm'),
        events:document.querySelectorAll('#events [data-event-day]').length,
        magic:document.querySelectorAll('#weddingMagic').length,
        outdated:document.querySelectorAll('.romance-collage-slot,.hero-marquee').length};
    });
    assert.equal(snapshot.overflow,false,'No horizontal scroll at '+width+'px');
    assert.ok(snapshot.hero&&snapshot.story&&snapshot.photo&&snapshot.album&&snapshot.rsvp);
    assert.equal(snapshot.events,2,'Both wedding schedules retained');
    assert.equal(snapshot.magic,0,'Redundant crystal heart removed');
    assert.equal(snapshot.outdated,0,'No duplicate story/collage or marquee');
    assert.ok(snapshot.countdown>80&&snapshot.countdown<width,'Compact countdown');
    assert.ok(snapshot.storyWidth<=width,'Editorial Story fits viewport');
    // Tabs are intentionally mobile/tablet-only; desktop shows both panels at once.
    const groomTab=page.locator('#events [data-v3-day-button="groom"]');
    if(await groomTab.isVisible()){
      await groomTab.click();
      assert.equal(await groomTab.getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#events [data-event-day="groom"]').evaluate(el=>el.classList.contains('is-active')),true);
    }else{
      assert.equal(await page.locator('#events [data-event-day="bride"]').isVisible(),true);
      assert.equal(await page.locator('#events [data-event-day="groom"]').isVisible(),true);
    }
    await page.evaluate(()=>window.WeddingI18n.setLanguage('en'));
    assert.equal(await page.locator('#story h2').innerText(),'From us, to family.');
    assert.deepEqual(errors,[],'No page errors at '+width+'px');
    await context.close();
  }
  const direct=await visit(390,844,'/');
  await direct.page.locator('#openInvitation').click();
  await direct.page.waitForFunction(()=>document.getElementById('invitationIntro').classList.contains('is-opened'),null,{timeout:9000});
  await direct.context.close();
  console.log('PASS V27: editorial compact layout, two schedules, countdown, story, gallery, RSVP, four viewports, languages and Open Invitation');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
