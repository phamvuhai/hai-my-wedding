#!/usr/bin/env node
/* V22: Reproduce Admin Photo Library in mobile Safari with 48 mock pictures.
 * No real Admin sign-in, Supabase requests, credentials or production writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const fixture=String.raw\`<!doctype html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/css/admin.css"></head>
<body>
<input type="hidden" id="v3ScheduleImage">
<div id="v14VisualEditor"></div>
<div class="v14-picker-backdrop" id="v14PhotoPicker" hidden>
  <div class="v14-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="v14PickerTitle" tabindex="-1">
    <div class="v14-picker-head"><div><p class="eyebrow">PHOTO LIBRARY</p><h3 id="v14PickerTitle">Chọn ảnh</h3><p id="v14PickerHint"></p></div>
    <button type="button" class="v14-picker-close" id="v14PickerClose">×</button></div>
    <label class="v14-search-label" for="v14PickerSearch">Tìm ảnh theo tên
      <input type="search" id="v14PickerSearch" placeholder="Nhập tên ảnh hoặc Album..." autocomplete="off"></label>
    <div class="v14-picker-grid" id="v14PickerGrid"></div>
    <div class="v14-picker-foot"><button id="v14PickerAutomatic" type="button">Dùng ảnh tự động</button>
      <button id="v14PickerAdd" type="button">Upload ảnh mới</button>
      <button id="v14PickerCancel" type="button">Đóng</button></div>
  </div>
</div>
<script src="/assets/js/admin/visual-editor.js"></script>
</body></html>\`;
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/picker-test') {
    res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(fixture);
    return;
  }
  const file=resolve(root,'.'+decodeURIComponent(path));
  if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()) {
    res.writeHead(404).end();return;
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const validPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGN8fWILAymAiSTVoxpGNQwpDQCLUgKHpX12FgAAAABJRU5ErkJggg==','base64');
const browser=await webkit.launch({headless:true});
async function run({mobile}){
  const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1320,height:900},
    deviceScaleFactor:mobile?3:1,
    isMobile:mobile,hasTouch:mobile
  });
  const requests=[];
  const errors=[];
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const photos=Array.from({length:48},(_,i)=>({
      id:'pic-'+i,
      title:'BUI'+String(1700+i).padStart(4,'0'),
      alt_text:'Wedding Photo '+i,
      album_id:'pre-wedding-id',is_published:true,show_in_album:true,
      image_path:'pre-wedding/pic-'+i+'-FULL.webp',
      image_variants:{
        '320':'pre-wedding/pic-'+i+'-w320.webp',
        '480':'pre-wedding/pic-'+i+'-w480.webp',
        '960':'pre-wedding/pic-'+i+'-w960.webp'
      }
    }));
    window.AdminApp={
      images:photos,albums:[{id:'pre-wedding-id',title:'Pre-Wedding'}],
      esc: value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
      publicUrl:path=>'https://pictures.test/'+path
    };
  });
  await page.route('https://pictures.test/**',async route=>{
    const url=route.request().url();
    requests.push(url);
    // Simulate one broken compact preview: must fall back to 480px.
    if(url.includes('pic-1-w320.webp')){
      await route.fulfill({status:404,contentType:'text/plain',body:'missing compact image'});
      return;
    }
    // Simulate one completely unavailable image: it should show a readable error.
    if(url.includes('pic-2-')){
      await route.fulfill({status:404,contentType:'text/plain',body:'offline test'});
      return;
    }
    await route.fulfill({status:200,contentType:'image/png',body:validPng});
  });
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+'/picker-test',{waitUntil:'load'});
  await page.evaluate(()=>document.querySelector('[data-v14-pick="v3ScheduleImage"]').click());
  await page.waitForSelector('#v14PhotoPicker:not([hidden])');
  assert.equal(await page.locator('#v14PickerGrid .v14-picker-photo').count(),48);
  const geometry=await page.evaluate(()=>{
    const tile=document.querySelector('#v14PickerGrid .v14-picker-photo');
    const thumb=tile.querySelector('.v14-picker-thumb');
    const grid=document.getElementById('v14PickerGrid');
    return {
      tileHeight:tile.getBoundingClientRect().height,
      thumbHeight:thumb.getBoundingClientRect().height,
      gridHeight:grid.getBoundingClientRect().height,
      focusedSearch:document.activeElement===document.getElementById('v14PickerSearch')
    };
  });
  assert.ok(geometry.thumbHeight>=82,'Thumbnail must keep a full image-sized box, not a thin line');
  assert.ok(geometry.tileHeight>100,'Photo tile must have visible height');
  assert.ok(geometry.gridHeight>=90,'Scrollable photo grid must be visible');
  assert.equal(geometry.focusedSearch,!mobile,'Do not open iOS keyboard automatically');
  await page.waitForFunction(()=>document.querySelector('#v14PickerGrid [data-v14-photo-id="pic-0"]')?.classList.contains('is-image-ready'),null,{timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#v14PickerGrid [data-v14-photo-id="pic-1"]')?.classList.contains('is-image-ready'),null,{timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#v14PickerGrid [data-v14-photo-id="pic-2"]')?.classList.contains('is-image-error'),null,{timeout:12000});
  assert.ok(requests.some(url=>url.includes('pic-1-w480.webp')),'Unreachable 320px preview must fall back to 480px');
  assert.equal(requests.some(url=>url.includes('pic-0-FULL.webp')),false,'Do not load original full photo when compact variant works');
  assert.equal(await page.locator('#v14PickerGrid [data-v14-photo-id="pic-47"] img[src]').count(),0,
    'Far-away image should not download before scrolling');
  assert.ok(requests.filter(url=>url.includes('-FULL.webp')).length<=1,
    'Only broken preview may fall back to original; never load all originals');
  // Search while keyboard is open should still show full-height thumbnails.
  await page.locator('#v14PickerSearch').fill('BUI1707');
  assert.equal(await page.locator('#v14PickerGrid .v14-picker-photo').count(),1);
  await page.waitForFunction(()=>document.querySelector('#v14PickerGrid [data-v14-photo-id="pic-7"]')?.classList.contains('is-image-ready'),null,{timeout:12000});
  await page.locator('#v14PickerGrid [data-v14-photo-id="pic-7"]').click();
  assert.equal(await page.locator('#v3ScheduleImage').inputValue(),'pic-7','Picking a photo still updates the original V3 field');
  assert.equal(await page.locator('#v14PhotoPicker').getAttribute('hidden'),'','Picker closes after selection');
  assert.deepEqual(errors,[], 'No JavaScript runtime errors');
  await context.close();
  return {mobile,geometry,requests:requests.length};
}
try{
  const a=await run({mobile:true});
  const b=await run({mobile:false});
  console.log('PASS: Admin Photo Library iPhone/Desktop shows 48 items, fixed-size images, compact loading, 404 fallback, search and selection');
  console.log(JSON.stringify({mobile:a,desktop:b}));
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
