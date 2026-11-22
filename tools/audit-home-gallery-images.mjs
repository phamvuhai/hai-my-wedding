#!/usr/bin/env node
/* Regression: Homepage Gallery must not show errors before a lazy image gets
   src, and must recover when 320/480px WebP URLs fail. WebKit fixture only.
   Does not use or mutate Production Supabase data. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const fixture=String.raw`<!doctype html><html lang="vi"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0}.spacer{height:1350px}
#homeGallery{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.home-photo{height:320px;display:block;position:relative;overflow:hidden}
.home-photo img{display:block;width:100%;height:100%;object-fit:cover}
</style></head><body><div class="spacer"></div>
<div id="homeGallery"></div>
<script src="/assets/js/site/adaptive-images.js"></script>
<script src="/assets/js/site/album.js"></script>
</body></html>`;
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/gallery-test'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(fixture);return;}
 const file=resolve(root,'.'+decodeURIComponent(pathname));
 if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':extname(file)==='.js'?'application/javascript':'text/plain'}).end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGN8fWILAymAiSTVoxpGNQwpDQCLUgKHpX12FgAAAABJRU5ErkJggg==','base64');
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   Object.defineProperty(navigator,'connection',{configurable:true,value:{effectiveType:'4g',saveData:true,downlink:.6}});
 });
 await page.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(origin+'/'))return route.continue();
   if(!u.startsWith('https://img.test/'))return route.abort();
   requests.push(u);
   const success=
     u.includes('p1-480.webp') ||
     u.includes('p2-960.webp') ||
     u.includes('p4-320.webp') ||
     u.includes('p3-960.webp') && u.includes('retry=true');
   return route.fulfill(success
     ? {status:200,contentType:'image/png',body:png}
     : {status:404,contentType:'text/plain',body:'Offline fixture intentionally missing'});
 });
 await page.goto(origin+'/gallery-test',{waitUntil:'load'});
 await page.evaluate(()=>{
   const root=document.getElementById('homeGallery');
   root.innerHTML=[1,2,3,4].map(n=>
     '<button class="home-photo" data-photo-id="p'+n+'" type="button">'+
       '<img data-home-progressive alt="Photo '+n+'">'+
       '<span class="photo-curtain"></span></button>').join('');
 });
 await page.waitForFunction(()=>document.querySelectorAll('.home-photo').length===4);
 const unsourced=await page.evaluate(()=>({
   complete:document.querySelector('.home-photo img').complete,
   errors:document.querySelectorAll('.album-v12-error-state').length,
   urls:[...document.querySelectorAll('.home-photo img')].filter(x=>x.getAttribute('src')).length
 }));
 assert.equal(unsourced.complete,true,'Empty images often have complete=true in Safari');
 assert.equal(unsourced.errors,0,'Do not mark empty-src lazy images broken');
 assert.equal(unsourced.urls,0,'No eager download before progressive assignment');

 await page.evaluate(()=>{
   const client={storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://img.test/'+path}})})}};
   for(let n=1;n<=4;n++){
     const photo={
       image_path:'pre/p'+n+'-FULL.webp',width:2400,updated_at:'2026-11-22',
       image_variants:{
         '320':'pre/p'+n+'-320.webp',
         '480':'pre/p'+n+'-480.webp',
         '960':'pre/p'+n+'-960.webp'
       }
     };
     const img=document.querySelector('[data-photo-id="p'+n+'"] img');
     window.WeddingAdaptiveImages.progressiveApply(img,client,photo,{role:'home'});
   }
 });
 const beforeScroll=await page.evaluate(()=>({
   errors:document.querySelectorAll('.album-v12-error-state').length,
   first:document.querySelector('[data-photo-id="p1"] img').getAttribute('src')
 }));
 assert.equal(beforeScroll.errors,0,'Pending thumbnails are not failures');
 assert.equal(beforeScroll.first,null,'Offscreen thumbnail waits for IntersectionObserver');
 await page.locator('[data-photo-id="p1"]').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('[data-photo-id="p1"]')?.classList.contains('album-v12-ready'),null,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('[data-photo-id="p2"]')?.classList.contains('album-v12-ready'),null,{timeout:10000});
 assert.ok(requests.some(u=>u.includes('p1-320.webp')),'Try 320px first');
 assert.ok(requests.some(u=>u.includes('p1-480.webp')),'320 failure falls back to 480');
 assert.ok(requests.some(u=>u.includes('p2-480.webp')),'480 attempted after 320');
 assert.ok(requests.some(u=>u.includes('p2-960.webp')),'Two compact failures fall back to 960');
 assert.equal(await page.locator('[data-photo-id="p1"] img').isHidden(),false);
 assert.equal(await page.locator('[data-photo-id="p2"] img').isHidden(),false);
 assert.equal(await page.locator('[data-photo-id="p1"]').isDisabled(),false);
 assert.equal(await page.locator('[data-photo-id="p2"] .album-v12-error').count(),0);
 // The last two cards only start loading when their row becomes visible.
 await page.locator('[data-photo-id="p3"]').scrollIntoViewIfNeeded();
 await page.waitForSelector('[data-photo-id="p3"].album-v12-error-state',{timeout:10000});
 assert.equal(await page.locator('[data-photo-id="p3"]').isDisabled(),false,
   'Final thumbnail failure should not disable opening the photo');
 assert.equal(await page.locator('[data-photo-id="p3"] .album-v12-error').count(),1);
 assert.equal(requests.some(u=>u.includes('-FULL.webp')),false,
   'The home gallery never downloads multi-megabyte originals while offscreen or on errors');
 // A later successful image request recovers the existing tile, including
 // its disabled/error text and hidden image state.
 await page.evaluate(()=>{
   const img=document.querySelector('[data-photo-id="p3"] img');
   img.src='https://img.test/pre/p3-960.webp?retry=true';
 });
 await page.waitForFunction(()=>document.querySelector('[data-photo-id="p3"]')?.classList.contains('album-v12-ready'),null,{timeout:10000});
 assert.equal(await page.locator('[data-photo-id="p3"] .album-v12-error').count(),0);
 assert.equal(await page.locator('[data-photo-id="p3"] img').isHidden(),false);
 assert.equal(await page.locator('[data-photo-id="p3"]').isDisabled(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: no false lazy image error, compact 320->480->960 fallback, no full originals, visible error, later recovery');
 await context.close();
} finally {
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
