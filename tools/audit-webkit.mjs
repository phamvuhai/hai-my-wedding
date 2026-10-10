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
  await page.locator('#openInvitation').click();
  await page.waitForTimeout(3900);
  await page.screenshot({path:join(out,entry.name+'-paper.png')});
  try{
   await page.waitForFunction(()=>document.getElementById('invitationIntro')?.classList.contains('is-opened'),{timeout:5500});
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
 const form=page.locator('#rsvpForm');
 const exists=await form.count()>0;
 let formVisible=false;
 if(exists){
  await form.evaluate(node=>{
   node.scrollIntoView({behavior:'instant',block:'start'});
   const y=node.getBoundingClientRect().top+window.scrollY-90;
   window.scrollTo({top:y,behavior:'instant'});
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
  coupleNames:[...document.querySelectorAll('.couture-couple strong')].map(el=>el.textContent.trim())
 }));
 report.scenarios.push({name:entry.name,ready,opened,formVisible,scrollBefore,metrics,errors});
 report.errors.push(...errors.map(e=>entry.name+': '+e));
 await context.close();
 console.log(entry.name+' ready='+ready+' opened='+opened+' form='+formVisible+' overflow='+(metrics.scrollWidth>metrics.width+2)+' pageErrors='+errors.length);
}
await browser.close();
await new Promise(ok=>server.close(ok));
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
if(report.scenarios.some(x=>!x.ready||!x.opened||!x.formVisible||x.metrics.locked||x.metrics.scrollWidth>x.metrics.width+2||x.errors.length))process.exitCode=1;
