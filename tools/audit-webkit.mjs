#!/usr/bin/env node
/* Safari-engine smoke tests (Playwright WebKit, not a physical iPhone). */
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {extname,resolve,join} from 'node:path';
import {webkit,devices} from 'playwright';

const root=process.cwd(),out=join(root,'webkit-audit');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const patterns=/^\/(?:vi|jp|en)(?:\/(?:invite\/[^/]+|album))?\/?$/;
const server=createServer((req,res)=>{
 let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(path==='/'||patterns.test(path))path='/index.html';
 else if(path==='/admin'||path==='/admin/')path='/admin/index.html';
 else if(path==='/admin/login')path='/admin/login/index.html';
 else if(path==='/admin/reset-password'||path==='/admin/reset-password/')path='/admin/reset-password/index.html';
 const file=resolve(root,'.'+path);
 if(!file.startsWith(root+'/')||!existsSync(file)){res.writeHead(404).end();return;}
 try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));}
 catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const scenarios=[
 {name:'iphone13',device:devices['iPhone 13']},
 {name:'iphonese',device:devices['iPhone SE']}
];
const report={engine:'Playwright WebKit',physicalDevice:false,scenarios:[],errors:[]};
for(const entry of scenarios){
 const context=await browser.newContext(entry.device);
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const req=route.request();
  if(!req.url().startsWith(base)||!['GET','HEAD'].includes(req.method()))return route.abort();
  return route.continue();
 });
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:25000});
 let ready=false,opened=false;
 try{
  await page.waitForFunction(()=>document.getElementById('invitationIntro')?.classList.contains('is-ready'),{timeout:6000});
  ready=true;
 }catch(e){errors.push('not ready: '+e.message.slice(0,100));}
 await page.screenshot({path:join(out,entry.name+'-cover.png')});
 if(ready) {
  await page.evaluate(()=>{
   window.__weddingOpeningComplete=false;
   document.addEventListener('wedding:invitation-opened',()=>{
     window.__weddingOpeningComplete=true;
   },{once:true});
  });
  await page.locator('#openInvitation').click();
  await page.waitForTimeout(3900);
  await page.screenshot({path:join(out,entry.name+'-homepage.png')});
  try{
   await page.waitForFunction(()=>window.__weddingOpeningComplete===true,{timeout:7500});
   await page.waitForTimeout(380);
   opened=true;
  }catch(e){errors.push('not opened: '+e.message.slice(0,100));}
 }
 const scrollBefore=await page.evaluate(()=>({
  scrollY:scrollY,
  docHeight:document.documentElement.scrollHeight,
  bodyHeight:document.body.scrollHeight,
  documentOverflow:getComputedStyle(document.documentElement).overflowY,
  bodyOverflow:getComputedStyle(document.body).overflowY,
  bodyClasses:document.body.className
 }));
 // The site supports smooth scrolling; force an instant jump for screenshot assertions.
 await page.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
 const form=page.locator('#rsvpForm');
 const exists=await form.count()>0;
 let formVisible=false;
 if(exists){
  await form.evaluate(node=>{
   node.scrollIntoView({behavior:'auto',block:'start'});
   const y=node.getBoundingClientRect().top+window.scrollY-90;
   window.scrollTo({top:y,behavior:'auto'});
  });
  await page.waitForTimeout(900);
  formVisible=await form.evaluate(node=>{
   const box=node.getBoundingClientRect();
   return box.width>0&&box.height>0&&box.top<window.innerHeight&&box.bottom>0;
  });
  await page.screenshot({path:join(out,entry.name+'-rsvp-form.png')});
 }
 const metrics=await page.evaluate(()=>({
  width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  title:document.title,language:document.documentElement.lang,
  locked:document.body.classList.contains('invitation-locked'),
  scrollY:window.scrollY,
  rsvpTop:Math.round(document.getElementById('rsvpForm')?.getBoundingClientRect().top||0),
  rsvpHeight:Math.round(document.getElementById('rsvpForm')?.getBoundingClientRect().height||0),
  docHeight:document.documentElement.scrollHeight,
  bodyHeight:document.body.scrollHeight,
  htmlOverflow:getComputedStyle(document.documentElement).overflowY,
  bodyOverflow:getComputedStyle(document.body).overflowY,
  bodyClasses:document.body.className,
  coupleNames:[...document.querySelectorAll('.minimal-names span')].map(el=>el.textContent.trim())
 }));
 // Regression: Japanese RSVP on iPhone previously stretched each radio input
 // to full width, pushing option text to the far right and wrapping it badly.
 const localizedRsvp=[];
 for(const [lang,expectedText,expectedPlaceholder] of [
  ['jp','はい、出席します','新郎新婦へのメッセージをご記入ください...'],
  ['en',"Yes, I'll be there",'Write a message to the couple...'],
  ['vi','Có, tôi sẽ đến','Gửi một lời chúc đến cô dâu chú rể...']
 ]){
  await page.goto(base+'/'+lang,{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(expected=>document.querySelector('.radio-row .radio span')?.textContent.trim()===expected,expectedText,{timeout:7000});
  const checks=await page.evaluate(()=>{
   const labels=[...document.querySelectorAll('#rsvpForm .radio-row label.radio')];
   return {
    options:labels.map(label=>{
     const radio=label.querySelector('input[type="radio"]');
     const text=label.querySelector('span');
     const a=label.getBoundingClientRect(),b=radio.getBoundingClientRect(),c=text.getBoundingClientRect();
     return {
      controlWidth:b.width,
      controlHeight:b.height,
      labelWidth:a.width,
      textWidth:c.width,
      gap:c.left-b.right,
      aligned:Math.abs((b.top+b.height/2)-(c.top+c.height/2))<18,
      textFits:c.right<=a.right-8,
      controlFits:b.left>=a.left-1&&b.right<a.right,
      radioNotStretched:b.width<=24&&b.height<=24,
      textReadable:c.width>=120
     };
    }),
    textareaPlaceholder:document.querySelector('#rsvpForm textarea[name="message"]')?.placeholder,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
   };
  });
  // Visual regressions: calligraphy clipping, oversized gallery header and
  // overlapping event entries, at iPhone SE and iPhone 13 widths in each locale.
  await page.evaluate(async()=>{ try { await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1400))]); }catch{} });
  // Wait for the asynchronously loaded calligraphy font AND its width fitter.
  // Measuring during the hidden fallback state produces false iPhone SE failures.
  await page.waitForFunction(()=>
    document.querySelector('.hero-couple-names')?.classList.contains('hero-fit-ready') &&
    [...document.querySelectorAll('.hero-name-fit-text')].every(el=>Number(el.dataset.fitFontSize)>0),
    undefined,{timeout:6500}
  );
  // Current V7 wedding schedule uses .v3-event-panel, not the deleted
  // .event-day-panel/.event-card timeline. Validate visible text and touch links.
  await page.locator('.gallery-display').scrollIntoViewIfNeeded();
  await page.waitForTimeout(760);
  await page.locator('#events .v3-event-panel.is-active').scrollIntoViewIfNeeded();
  await page.waitForTimeout(760);
  const mobileLayout=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const rect=el=>el?.getBoundingClientRect();
    const inside=(el,padding=1)=>{
      const b=rect(el);
      return !!b&&b.width>0&&b.left>=-padding&&b.right<=viewport+padding;
    };
    const names=[...document.querySelectorAll('.hero-name-fit-text')].map(el=>({
      text:el.textContent.trim(),left:Math.round(rect(el)?.left||0),
      right:Math.round(rect(el)?.right||0),
      width:Math.round(rect(el)?.width||0),
      fontPx:Math.round(parseFloat(getComputedStyle(el).fontSize)),
      intrinsicWidth:Math.round(el.scrollWidth)
    }));
    const gallery=[...document.querySelectorAll('.gallery-display span')].map(el=>({
      text:el.textContent.trim(),left:Math.round(rect(el)?.left||0),
      right:Math.round(rect(el)?.right||0)
    }));
    const families=[...document.querySelectorAll('#events .v3-event-panel')];
    const panel=families.find(el=>el.classList.contains('is-active'));
    const items=[...(panel?.querySelectorAll('.v3-event-item')||[])];
    const eventReadability=items.map(item=>{
      const title=item.querySelector('h4');
      const address=item.querySelector('.v3-event-detail p');
      const map=item.querySelector('.v3-event-map');
      return {
        titlePx:title?parseFloat(getComputedStyle(title).fontSize):0,
        addressPx:address?parseFloat(getComputedStyle(address).fontSize):0,
        mapHeight:rect(map)?.height||0,
        mapWithinViewport:inside(map),
        bodyWithinViewport:inside(item)
      };
    });
    const nonOverlap=items.length===2&&(()=>{
      const x=rect(items[0]),y=rect(items[1]);
      return x.bottom<=y.top+4||y.bottom<=x.top+4||
        x.right<=y.left+4||y.right<=x.left+4;
    })();
    const arrival=document.querySelector('#events .v3-arrival-note');
    const nameFits=names.length===2&&names.every(x=>
      x.left>=-1&&x.right<=viewport+1&&x.width>20&&
      x.intrinsicWidth<=viewport-18);
    const galleryFits=gallery.length===2&&gallery.every(x=>
      x.left>=-1&&x.right<=viewport+1);
    const largeNames=names.length===2&&names.every(x=>x.fontPx>=
      (viewport>=390?30:29));
    const readableEvents=eventReadability.length===2&&eventReadability.every(x=>
      x.titlePx>=17&&x.addressPx>=11&&x.mapHeight>=32&&
      x.mapWithinViewport&&x.bodyWithinViewport);
    const eventsFit=families.length===2&&!!panel&&items.length===2&&nonOverlap;
    const arrivalSafe=inside(arrival);
    return {viewport,names,gallery,families:families.map(p=>p.dataset.eventDay),
      eventReadability,largeNames,readableEvents,
      arrivalSafe,nameFits,galleryFits,eventsFit};
  });
  if(lang==='jp'){
    await page.locator('.hero-copy').scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,entry.name+'-japanese-hero-font.png')});
    await page.locator('.gallery-display').scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,entry.name+'-gallery-layout.png')});
    await page.locator('#events .v3-event-panel[data-event-day="bride"]').scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,entry.name+'-schedule-layout.png')});
    await page.locator('#events [data-v3-day-button="groom"]').click();
    await page.waitForTimeout(500);
    const groomVisible=await page.locator('#events .v3-event-panel[data-event-day="groom"]')
      .evaluate(el=>el.classList.contains('is-active')&&
        getComputedStyle(el).display!=='none');
    if(!groomVisible)errors.push('Groom event switch did not reveal its panel');
    await page.screenshot({path:join(out,entry.name+'-groom-card-design.png')});
  }
  if(!mobileLayout.nameFits||!mobileLayout.galleryFits||!mobileLayout.eventsFit||
     !mobileLayout.largeNames||!mobileLayout.readableEvents||!mobileLayout.arrivalSafe){
    console.log('MOBILE_LAYOUT_FAILURE '+entry.name+' '+lang+': '+JSON.stringify(mobileLayout));
    errors.push(lang+' current V7 mobile visual layout failed: '+JSON.stringify(mobileLayout));
  }
  const first=page.locator('#rsvpForm .radio-row label.radio').first();
  const second=page.locator('#rsvpForm .radio-row label.radio').nth(1);
  await first.click();
  const selectedYes=await page.locator('#rsvpForm input[name="attending"][value="yes"]').isChecked();
  await second.click();
  const selectedNo=await page.locator('#rsvpForm input[name="attending"][value="no"]').isChecked();
  const layoutPassed=checks.options.length===2&&!checks.horizontalOverflow&&
   checks.options.every(o=>o.radioNotStretched&&o.textFits&&o.controlFits&&o.aligned&&
    o.textReadable&&o.gap>=4&&o.gap<=22);
  const passed=layoutPassed&&selectedYes&&selectedNo&&checks.textareaPlaceholder===expectedPlaceholder;
  if(lang==='jp'){
   await page.locator('#rsvpForm').scrollIntoViewIfNeeded();
   await page.screenshot({path:join(out,entry.name+'-japanese-rsvp-fixed.png')});
  }
  localizedRsvp.push({lang,passed,layoutPassed,selectedYes,selectedNo,checks,mobileLayout});
  console.log(entry.name+' '+lang+' RSVP alignment='+passed+
   ' widths='+checks.options.map(o=>Math.round(o.controlWidth)).join(','));
 }
 if(localizedRsvp.some(x=>!x.passed))errors.push('localized RSVP layout/selection/placeholder failed');
 report.scenarios.push({name:entry.name,ready,opened,formVisible,scrollBefore,metrics,errors,localizedRsvp});
 report.errors.push(...errors.map(e=>entry.name+': '+e));
 await context.close();
 console.log(entry.name+' ready='+ready+' opened='+opened+' form='+formVisible+' overflow='+(metrics.scrollWidth>metrics.width+2)+' pageErrors='+errors.length);
}
await browser.close();
await new Promise(ok=>server.close(ok));
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
if(report.scenarios.some(x=>!x.ready||!x.opened||!x.formVisible||x.metrics.locked||x.metrics.scrollWidth>x.metrics.width+2||x.errors.length))process.exitCode=1;
