#!/usr/bin/env node
/* V24: Compact responsive wedding gift layout on actual WebKit with
 * fixture-only Supabase bank settings; never accesses Production endpoints. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';
const root=process.cwd();
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css'};
const fixture='<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<link rel="stylesheet" href="/assets/css/site.css">'+
  '<link rel="stylesheet" href="/assets/css/compact-wedding.css"></head>'+
  '<body><main><section id="weddingGifts" class="section wedding-gifts chapter-member"></section></main>'+
  '<script src="/assets/js/site/gifts.js"></script></body></html>';
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/v24-fixture'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(fixture);return;}
 const file=resolve(root,'.'+decodeURIComponent(path));
 if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){
   res.writeHead(404).end();return;
 }
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
 res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGN8fWILAymAiSTVoxpGNQwpDQCLUgKHpX12FgAAAABJRU5ErkJggg==','base64');
async function check(width,brideEnabled=false,locale='vi'){
 const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:width<=500?3:1,hasTouch:width<=500,isMobile:width<=500});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({brideEnabled,locale})=>{
   const settings={
     enabled:true,visibility:'public',
     groom:{enabled:true,bank:'TPBank',holder:'EXAMPLE GROOM',account:'04480062888',qrPath:''},
     bride:{enabled:brideEnabled,bank:brideEnabled?'Example Bank':'',holder:'EXAMPLE BRIDE',
            account:brideEnabled?'123456789':'',qrPath:brideEnabled?'wedding-gifts/example-bride.png':''}
   };
   window.WEDDING_CONFIG={supabaseUrl:'https://offline.supabase.invalid',supabaseAnonKey:'offline-key'};
   window.WeddingI18n={language:locale};
   window.supabase={createClient:()=>({
     from:()=>({
       select:()=>({eq:()=>({maybeSingle:async()=>({data:{value_vi:JSON.stringify(settings)},error:null})})})
     }),
     storage:{from:()=>({
       getPublicUrl:path=>({data:{publicUrl:'https://fixture-images.invalid/'+path}})
     })}
   })};
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});
 },{brideEnabled,locale});
 await page.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
   if(url.startsWith('https://fixture-images.invalid/')){
     return route.fulfill({status:200,contentType:'image/png',body:tinyPng});
   }
   return route.abort();
 });
 await page.goto(origin+'/v24-fixture',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>{
   const b=document.querySelector('#weddingGifts [data-gift-side="bride"]');
   return !!b && document.querySelectorAll('#weddingGifts .wedding-gift-card').length===2;
 },null,{timeout:8000});
 // Wait for asynchronous Supabase preferences; the default bride starts disabled.
 if(brideEnabled) await page.waitForSelector('#weddingGifts [data-gift-zoom="bride"]',{timeout:8000});
 const layout=await page.evaluate(()=>{
   const gift=document.getElementById('weddingGifts');
   const groom=gift.querySelector('[data-gift-side="groom"]');
   const bride=gift.querySelector('[data-gift-side="bride"]');
   const image=groom.querySelector('.wedding-gift-qr');
   const a=groom.getBoundingClientRect(),b=bride.getBoundingClientRect();
   return {
     width:innerWidth,
     gridColumns:getComputedStyle(gift.querySelector('.wedding-gift-grid')).gridTemplateColumns,
     a:{x:a.x,y:a.y,width:a.width,height:a.height},
     b:{x:b.x,y:b.y,width:b.width,height:b.height},
     qr:image.getBoundingClientRect().width,
     sectionHeight:gift.getBoundingClientRect().height,
     overflow:document.documentElement.scrollWidth>innerWidth+1
   };
 });
 assert.ok(Math.abs(layout.a.y-layout.b.y)<3,'Two cards must be on the same row at '+width+'px');
 assert.ok(layout.b.x>layout.a.x,'Groom card must precede Bride horizontally');
 assert.ok(layout.a.width>=130 && layout.b.width>=130,'Gift cards must be readable');
 assert.ok(layout.qr<=170 && layout.qr>=85,'QR width must be small but legible');
 assert.equal(layout.overflow,false,'No horizontal overflow at '+width);
 assert.ok(layout.sectionHeight<970,'Gift section must stay compact');
 assert.equal(await page.locator('#weddingGifts .wedding-gift-qr img').count(),brideEnabled?2:1,
   'Only configured QR images are shown');
 assert.equal(await page.locator('#weddingGifts [data-gift-side="bride"] .wedding-gift-pending').count(),brideEnabled?0:1,
   'Disabled Bride card stays as a truthful compact placeholder');
 const qr=page.locator('#weddingGifts [data-gift-zoom="groom"]');
 await qr.click();
 await page.waitForSelector('#weddingQrDialog[open]',{timeout:4000});
 const dialog=await page.evaluate(()=>{
   const d=document.getElementById('weddingQrDialog');
   return {size:d.querySelector('img').getBoundingClientRect().width,
       close:getComputedStyle(d).display, alt:d.querySelector('img').alt};
 });
 assert.ok(dialog.size>=220,'Tap must reveal a large scannable QR');
 assert.ok(dialog.alt.length>5);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.getElementById('weddingQrDialog').open,null,{timeout:4000});
 await page.locator('#weddingGifts [data-gift-copy="groom"]').click();
 await page.waitForFunction(()=>!!window.__copied,{timeout:3000});
 assert.ok(!errors.length,'No JavaScript errors: '+errors.join('; '));
 await ctx.close();
 return layout;
}
try{
  const results=[];
  for(const width of [340,390,768,1280])results.push(await check(width,false,'vi'));
  results.push(await check(390,true,'en'));
  results.push(await check(390,true,'ja'));
  const pageText=readFileSync(resolve(root,'assets/js/site/i18n.js'),'utf8');
  assert.ok(pageText.includes('Cho chúng mình biết bạn có thể đến chung vui nhé'),'VI RSVP summary shortened');
  assert.ok(pageText.includes('Let us know if you can celebrate with us'),'EN RSVP summary shortened');
  assert.ok(pageText.includes('ご出席いただけるか、お知らせください'),'JA RSVP summary shortened');
  console.log('PASS V24: two compact aligned cards, zoom QR, truthful disabled Bride, enabled Bride, clipboard, overflow and locales');
  console.log(JSON.stringify(results.map(x=>({width:x.width,qr:Math.round(x.qr),height:Math.round(x.sectionHeight),overflow:x.overflow}))));
} finally {
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
