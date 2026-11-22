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
  '<link rel="stylesheet" href="/assets/css/compact-wedding.css">'+
  '<link rel="stylesheet" href="/assets/css/luxury-editorial.css"></head>'+
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
 await page.waitForSelector('#weddingGifts .wedding-gift-disclosure',{timeout:8000});
 if(brideEnabled)await page.waitForSelector('#weddingGifts [data-gift-zoom="bride"]',{timeout:8000});
 assert.equal(await page.locator('#weddingGifts .wedding-gift-disclosure').evaluate(el=>el.open),false,
   'Gift details collapsed by default');
 assert.ok(await page.locator('#weddingGifts summary').isVisible(),'Discreet gift summary is visible');
 const initialHeight=await page.locator('#weddingGifts').evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(initialHeight<210,'Collapsed bank section should be compact');
 await page.locator('#weddingGifts summary').click();
 assert.equal(await page.locator('#weddingGifts .wedding-gift-disclosure').evaluate(el=>el.open),true);
 const layout=await page.evaluate(()=>{
   const gift=document.getElementById('weddingGifts');
   const groom=gift.querySelector('[data-gift-side="groom"]');
   const bride=gift.querySelector('[data-gift-side="bride"]');
   const image=groom.querySelector('.wedding-gift-qr');
   const a=groom.getBoundingClientRect(),b=bride?.getBoundingClientRect();
   return {
     width:innerWidth,
     a:{x:a.x,y:a.y,width:a.width,height:a.height},
     b:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null,
     qr:image.getBoundingClientRect().width,
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     cards:gift.querySelectorAll('.wedding-gift-card').length
   };
 });
 assert.equal(layout.cards,brideEnabled?2:1,'Only configured gift cards should render');
 if(brideEnabled){
   assert.ok(Math.abs(layout.a.y-layout.b.y)<3,'Two enabled cards share a row on '+width);
   assert.ok(layout.b.x>layout.a.x,'Groom before bride');
   assert.ok(layout.a.width>=130&&layout.b.width>=130,'Cards readable');
 }
 assert.ok(layout.qr<=170&&layout.qr>=85,'Small scannable QR');
 assert.equal(layout.overflow,false,'No horizontal overflow at '+width);
 assert.equal(await page.locator('#weddingGifts .wedding-gift-qr img').count(),brideEnabled?2:1);
 assert.equal(await page.locator('#weddingGifts .wedding-gift-pending').count(),0,
   'No unavailable account placeholders');
 await page.locator('#weddingGifts [data-gift-zoom="groom"]').click();
 await page.waitForSelector('#weddingQrDialog[open]',{timeout:4000});
 const dialog=await page.evaluate(()=>{
   const d=document.getElementById('weddingQrDialog');
   return {size:d.querySelector('img').getBoundingClientRect().width,alt:d.querySelector('img').alt};
 });
 assert.ok(dialog.size>=220,'Enlarged QR scannable');
 assert.ok(dialog.alt.length>5);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.getElementById('weddingQrDialog').open,null,{timeout:4000});
 await page.locator('#weddingGifts [data-gift-copy="groom"]').click();
 await page.waitForFunction(()=>!!window.__copied,{timeout:3000});
 assert.ok(!errors.length,'No JavaScript errors: '+errors.join('; '));
 await ctx.close();
 return {width:layout.width,qr:layout.qr,cards:layout.cards,initialHeight};
}
try{
 const results=[];
 for(const width of [340,390,768,1280])results.push(await check(width,false,'vi'));
 results.push(await check(390,true,'en'));
 results.push(await check(390,true,'ja'));
 console.log('PASS V27: gift summary collapsed, only configured bank cards, two-up when enabled, QR zoom, clipboard, no overflow and locales');
 console.log(JSON.stringify(results));
} finally {
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
