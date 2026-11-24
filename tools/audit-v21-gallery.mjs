#!/usr/bin/env node
/* V21: offline Safari full-flow smoke. No production Supabase requests or credentials. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const mime={'.js':'application/javascript','.html':'text/html;charset=utf-8','.css':'text/css'};
const http=createServer((req,res)=>{
  let path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'||/^\/(vi|en|jp)\/?(?:album)?\/?$/.test(path))path='/index.html';
  const absolute=resolve(root,'.'+decodeURIComponent(path));
  if(!absolute.startsWith(root+'/')||!existsSync(absolute)||!statSync(absolute).isFile()){
    res.writeHead(404).end();return;
  }
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream'});
  res.end(readFileSync(absolute));
});
await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+http.address().port;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGN8fWILAymAiSTVoxpGNQwpDQCLUgKHpX12FgAAAABJRU5ErkJggg==','base64');
const browser=await webkit.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true});
  const page=await context.newPage();
  const imageRequests=[];
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{
    if(request.url().startsWith('https://img.test/'))imageRequests.push(request.url());
  });
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/')||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
    return route.abort();
  });
  await page.route('https://img.test/**',route=>{
    // Full HD failure for the second photo must not blank the preview.
    if(route.request().url().includes('/full-1.webp'))
      return route.fulfill({status:404,body:'missing full',contentType:'text/plain'});
    return route.fulfill({status:200,body:png,contentType:'image/png'});
  });
  await page.route('**/assets/js/config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WEDDING_CONFIG={supabaseUrl:'https://offline.mock.invalid',supabaseAnonKey:'offline-only'};"
  }));
  await page.addInitScript(()=>{
    const photos=Array.from({length:25},(_,i)=>({
      id:'p'+String(i+1).padStart(2,'0'), album_id:'album-1',
      title:'Photo '+(i+1),caption:'Caption '+(i+1),image_path:'pre/full-'+i+'.webp',
      image_variants:{480:'pre/preview-'+i+'-w480.webp',960:'pre/medium-'+i+'-w960.webp'},
      width:i%3===0?3000:2000,height:i%3===0?2000:3000,display_size:i%3===0?'wide':i%3===1?'tall':'auto',sort_order:i*10,focus_x:50,focus_y:50,
      is_published:true,show_in_album:true,show_on_homepage:false,is_hero:false,created_at:'2026-11-21'
    }));
    const album={id:'album-1',title:'Pre-Wedding',slug:'pre-wedding',sort_order:0};
    const design={albumChapters:[{id:'asakusa',title:{vi:'Duyên lành',en:'Asakusa',ja:'浅草'},photoIds:photos.slice(0,10).map(x=>x.id)},{id:'tokyo',title:{vi:'Hẹn giữa Tokyo',en:'Tokyo',ja:'東京'},photoIds:photos.slice(10,20).map(x=>x.id)},{id:'showa',title:{vi:'Mùa thu có nhau',en:'Autumn',ja:'秋'},photoIds:photos.slice(20).map(x=>x.id)}]};
    function from(table){
      const state={filters:[],select:'',limit:Infinity};
      const run=()=>{
        let data=(table==='gallery_images'?photos:table==='gallery_albums'?[album]:[]).filter(x=>state.filters.every(([k,v])=>x[k]===v));
        // Only Album requests should receive the fixture photo list.
        if(table==='gallery_images' && !state.filters.some(x=>x[0]==='show_in_album'))data=[];
        return Promise.resolve({data:data.slice(0,state.limit),error:null});
      };
      const api={
        select:columns=>{state.select=columns;return api;},
        eq:(key,value)=>{state.filters.push([key,value]);return api;},
        order:()=>api,limit:n=>{state.limit=n;return api;},
        maybeSingle:async()=>({data:table==='site_content'&&state.filters.some(([k,v])=>k==='key'&&v==='v3_design')?{value_vi:JSON.stringify(design)}:null,error:null}),
        single:async()=>({data:null,error:null}),
        then:(resolve,reject)=>run().then(resolve,reject)
      };
      return api;
    }
    window.supabase={createClient:()=>({
      from,
      storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://img.test/'+path}})})},
      auth:{getSession:async()=>({data:{session:null},error:null}),
        onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}
    })};
  });
  await page.goto(origin+'/vi',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.WeddingProgressiveGallery && !!window.WeddingAdaptiveImages,{timeout:14000});
  // Go through real public Album route and actual event listeners.
  await page.evaluate(()=>document.querySelector('[data-album-link]')?.click());
  await page.waitForSelector('#albumOverlay.is-open',{timeout:12000});
  await page.waitForFunction(()=>document.querySelectorAll('#albumOverlayGrid [data-album-photo-id]').length>=10,{timeout:12000});
  const initial=await page.locator('#albumOverlayGrid [data-album-photo-id]').count();
  assert.ok(initial>=10 && initial<25,'Album renders batches, not all 25 images at once');
  assert.equal(await page.locator('#albumOverlayGrid [data-album-chapter="asakusa"]').count(),1);
  assert.equal(await page.locator('#albumOverlayGrid [data-album-photo-id="p01"] > span small').count(),0,'Caption is detail-only');
  async function assertPacked(){
    const geometry=await page.evaluate(()=>{
      const grid=document.getElementById('albumOverlayGrid'),g=grid.getBoundingClientRect();
      const rows=new Map();
      for(const el of grid.querySelectorAll('[data-album-photo-id]')){
        const r=el.getBoundingClientRect(),y=Math.round(r.top);
        if(!rows.has(y))rows.set(y,[]);
        rows.get(y).push({left:r.left,right:r.right,id:el.dataset.albumPhotoId});
      }
      return {left:g.left,right:g.right,rows:[...rows.values()]};
    });
    for(const row of geometry.rows){
      assert.ok(Math.abs(row[0].left-geometry.left)<2,'Row begins at left edge');
      assert.ok(Math.abs(row.at(-1).right-geometry.right)<2,'Row fills right edge: '+JSON.stringify(row));
    }
  }
  await assertPacked();
  await page.setViewportSize({width:1280,height:900});
  await assertPacked();
  await page.setViewportSize({width:390,height:844});
  await assertPacked();
  await page.waitForSelector('#albumOverlayGrid .is-photo-ready',{timeout:12000});
  assert.ok(imageRequests.some(x=>x.includes('-w480.webp')),'Preview loaded');
  assert.ok(!imageRequests.some(x=>x.includes('/full-')),'No full image before clicking detail');
  const distant=page.locator('#albumOverlayGrid [data-album-photo-id="p25"]');
  assert.equal(await distant.count(),0,'Offscreen rows are not initially created');

  // Open photo 1 — only now can its Full HD be requested.
  await page.locator('#albumOverlayGrid [data-album-photo-id="p01"]').click();
  await page.waitForSelector('#photoLightbox.is-open',{timeout:12000});
  await page.waitForFunction(()=>document.getElementById('photoLightboxCounter').textContent.trim()==='1 / 25');
  await page.waitForFunction(()=>document.getElementById('photoLightboxImage').getAttribute('src')?.includes('full-0.webp'),{timeout:10000});
  assert.ok(imageRequests.some(x=>x.includes('/full-0.webp')),'Full image starts after opening detail');
  assert.equal(await page.locator('#photoLightboxCaption').textContent(),'Caption 1');
  assert.ok(await page.locator('#photoLightboxImage').evaluate(el=>el.naturalWidth>0),'Image visible in detail');
  assert.ok(await page.locator('#photoLightboxZoom').isVisible(),'Zoom button visible on iPhone');
  await page.locator('#photoLightboxZoom').click();
  assert.ok((await page.evaluate(()=>window.WeddingPhotoZoom.status().scale))>2,'Zoom button enlarges detail image');
  // Two-finger pinch must NOT cause a slide change, even when it ends at scale 1.
  await page.evaluate(()=>{
    window.WeddingPhotoZoom.reset();
    const stage=document.getElementById('photoLightboxStage');
    function emit(type,touches,changed){
      const event=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(event,'touches',{value:touches});
      Object.defineProperty(event,'changedTouches',{value:changed});
      stage.dispatchEvent(event);
    }
    const t=(id,x,y)=>({identifier:id,target:stage,clientX:x,clientY:y});
    emit('touchstart',[t(1,150,250),t(2,240,250)],[t(1,150,250),t(2,240,250)]);
    emit('touchmove',[t(1,105,250),t(2,285,250)],[t(1,105,250),t(2,285,250)]);
    emit('touchend',[],[t(1,105,250),t(2,285,250)]);
  });
  assert.ok((await page.evaluate(()=>window.WeddingPhotoZoom.status().scale))>1.5,'Pinch gesture increases zoom scale');
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'1 / 25','Pinch may not navigate to another photo');
  // A single-finger pan while zoomed must stay on this same photo.
  await page.evaluate(()=>{
    const stage=document.getElementById('photoLightboxStage');
    const t=(id,x,y)=>({identifier:id,target:stage,clientX:x,clientY:y});
    function emit(type,touches,changed){
      const event=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(event,'touches',{value:touches});
      Object.defineProperty(event,'changedTouches',{value:changed});
      stage.dispatchEvent(event);
    }
    emit('touchstart',[t(1,180,280)],[t(1,180,280)]);
    emit('touchmove',[t(1,80,280)],[t(1,80,280)]);
    emit('touchend',[],[t(1,80,280)]);
  });
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'1 / 25','Panning a zoomed photo does not swipe to next');
  assert.equal(await page.locator('#photoLightboxPrev').isDisabled(),true);
  await page.keyboard.press('ArrowLeft');
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'1 / 25','First photo must not wrap to last');
  await page.locator('#photoLightboxNext').click();
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'2 / 25');
  assert.equal(await page.evaluate(()=>window.WeddingPhotoZoom.status().scale),1,'Switching photo resets zoom');
  await page.waitForFunction(()=>!document.getElementById('photoLightboxRetry').hidden,null,{timeout:8000});
  assert.ok(await page.locator('#photoLightboxImage').evaluate(el=>el.naturalWidth>0),
    'Failed full resolution retains a visible WebP preview');
  await page.locator('#photoLightboxPrev').click();
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'1 / 25');
  for(let i=0;i<24;i++)await page.keyboard.press('ArrowRight');
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'25 / 25');
  assert.equal(await page.locator('#photoLightboxNext').isDisabled(),true);
  await page.keyboard.press('ArrowRight');
  assert.equal((await page.locator('#photoLightboxCounter').innerText()).trim(),'25 / 25','Last photo must not wrap to first');

  // Release HD, then lazy-load further batches as the user scrolls.
  await page.locator('#photoLightboxClose').click();
  await page.waitForFunction(()=>!document.getElementById('photoLightbox').classList.contains('is-open'),null,{timeout:12000});
  await page.evaluate(()=>{const overlay=document.getElementById('albumOverlay');overlay.scrollTop=overlay.scrollHeight;});
  await page.waitForFunction(()=>document.querySelectorAll('#albumOverlayGrid [data-album-photo-id]').length>10,{timeout:12000});
  assert.equal(await page.locator('#albumOverlayGrid [data-album-chapter="tokyo"]').count(),1,'Chapter heading follows lazy batch');
  await assertPacked();
  await page.evaluate(()=>{const overlay=document.getElementById('albumOverlay');overlay.scrollTop=overlay.scrollHeight;});
  await page.waitForFunction(()=>document.querySelectorAll('#albumOverlayGrid [data-album-photo-id]').length===25,null,{timeout:12000});
  await assertPacked();
  await page.setViewportSize({width:1280,height:900});
  await assertPacked();
  assert.deepEqual(await page.locator('#albumOverlayGrid [data-album-photo-id]').evaluateAll(els=>els.map(e=>e.dataset.albumPhotoId)),Array.from({length:25},(_,i)=>'p'+String(i+1).padStart(2,'0')),'Album DOM order preserved');
  assert.equal(errors.filter(x=>/progressive-gallery|adaptive-images|renderLightbox/i.test(x)).length,0,'No gallery JavaScript errors');
  console.log('PASS: V21 + Album Detail zoom: pinch/pan, no gesture swipe, image reset, HD 404 fallback, bounded arrows and batched scroll');
} finally {
  await browser.close();
  await new Promise(resolve=>http.close(resolve));
}
