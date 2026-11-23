#!/usr/bin/env node
/* Offline WebKit mobile-first regression, no Supabase writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd(),mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer((req,res)=>{
 let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(path==='/'||/^\/(?:vi|en|jp)(?:\/invite\/[^/]+)?\/?$/.test(path))path='/index.html';
 const file=resolve(root,'.'+path);
 if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const screens=[
 {width:320,height:640},
 {width:360,height:740},
 {width:375,height:667},
 {width:390,height:844},
 {width:430,height:932},
 {width:768,height:1024},
 {width:820,height:1180},
 {width:844,height:390}
];
try {
  assert.ok(readFileSync('index.html','utf8').includes('/assets/css/mobile-editorial.css'),
    'Responsive mobile stylesheet must be loaded after legacy CSS');
  for(const {width,height} of screens){
    const isPhone=width<768;
    const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,
      isMobile:isPhone,reducedMotion:'reduce'});
    const page=await ctx.newPage();
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(e.message));
    await page.route('**/*',route=>{
      if(route.request().url().startsWith(base+'/'))return route.continue();
      return route.abort();
    });
    await page.goto(base+'/vi',{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForFunction(()=>!!document.getElementById('rsvpForm'),null,{timeout:7000});
    const data=await page.evaluate(()=>{
      const by=id=>document.getElementById(id);
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height}};
      const ids=['home','story','countdown','events','forever','weddingMagic','homeGallery','rsvp','rsvpForm','weddingGifts'];
      const elements=Object.fromEntries(ids.map(id=>[id,!!by(id)]));
      const photo=by('ourPromisePhoto');
      const form=by('rsvpForm');
      const fields=[...form.querySelectorAll('input[type="text"],input[type="tel"],select,textarea')].map(x=>({
        width:rect(x).w,font:getComputedStyle(x).fontSize
      }));
      const eventBtns=[...document.querySelectorAll('[data-v3-day-button]')].map(x=>({r:rect(x),display:getComputedStyle(x).display}));
      const eventCards=[...document.querySelectorAll('[data-event-day]')].map(x=>({name:x.dataset.eventDay,html:x.innerHTML}));
      const sections=['#story .story-grid','#events .container','#forever .our-promise-layout','#rsvp .rsvp-wrap'].map(sel=>({sel,r:rect(document.querySelector(sel))}));
      return {
        width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
        elements,sections,fields,eventBtns,
        hero:rect(by('home')),
        heroFit:getComputedStyle(by('heroFullImage')).objectFit,
        promiseFit:getComputedStyle(photo).objectFit,
        gift:by('weddingGifts').hidden,
        times:eventCards.map(v=>({name:v.name,times:[...v.html.matchAll(/class="v3-event-time"[^>]*>\s*<strong>(\d\d:\d\d)<\/strong>/g)].map(m=>m[1])})),
        css:Array.from(document.styleSheets).some(sheet=>sheet.href?.includes('mobile-editorial.css'))
      };
    });
    const label=width+'x'+height;
    assert.ok(Object.values(data.elements).every(Boolean),label+' all sections present');
    assert.equal(data.css,true,label+' responsive CSS present');
    assert.ok(data.scrollWidth<=data.width+2,label+' no horizontal overflow: '+JSON.stringify(data.sections));
    assert.equal(data.heroFit,'contain',label+' Hero image cannot crop');
    assert.equal(data.promiseFit,'contain',label+' Promise image cannot crop');
    assert.deepEqual(data.times.find(x=>x.name==='bride').times,['09:00','18:00'],label+' Bride times');
    assert.deepEqual(data.times.find(x=>x.name==='groom').times,['09:00','11:00'],label+' Groom times');
    for(const sec of data.sections)assert.ok(sec.r.left>=-3&&sec.r.right<=data.width+3,label+' section fits '+sec.sel);
    if(isPhone){
      for(const field of data.fields)assert.ok(parseFloat(field.font)>=16,label+' iOS form font avoids zoom');
      for(const btn of data.eventBtns)if(btn.display!=='none')assert.ok(btn.r.h>=44,label+' tap-safe date toggle');
    }
    assert.deepEqual(jsErrors,[],label+' runtime errors');
    await ctx.close();
    console.log('PASS '+label+' mobile editorial, photo contain, sections, RSVP and 18:00 schedule');
  }
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
