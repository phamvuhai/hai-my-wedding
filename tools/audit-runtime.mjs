#!/usr/bin/env node
/* Runtime CSS coverage and responsive screenshot audit. Read-only; no live API mutations. */
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import puppeteer from 'puppeteer-core';
import postcss from 'postcss';

const root=process.cwd(),out=join(root,'runtime-audit');
mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const routes=/^\/(?:vi|en|jp)(?:\/(?:invite\/[^/]+|album))?\/?$/;
const server=createServer((req,res)=>{
 let path;
 try{path=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400).end();return;}
 if(path==='/'||routes.test(path))path='/index.html';
 if(path==='/admin'||path==='/admin/')path='/admin/index.html';
 if(path==='/admin/login'||path==='/admin/login/')path='/admin/login/index.html';
 const full=resolve(root,'.'+path);
 if(!full.startsWith(root+'/')||!existsSync(full)){res.writeHead(404).end('Not found');return;}
 try{
  const content=readFileSync(full);
  res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(content);
 }catch{res.writeHead(404).end('Not a file');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await puppeteer.launch({
 headless:true,
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
});
const cases=[
 {name:'desktop',width:1440,height:900,deviceScaleFactor:1,isMobile:false},
 {name:'tablet',width:820,height:1180,deviceScaleFactor:2,isMobile:true,hasTouch:true},
 {name:'mobile',width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true},
 {name:'small-phone',width:360,height:640,deviceScaleFactor:2,isMobile:true,hasTouch:true}
];
const coverage=new Map(), report={scenarios:[],unusedCandidates:[],css:[],errors:[]};
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
const sections=['story','events','homeGallery','forever','rsvp'];

for(const cfg of cases){
 const page=await browser.newPage();
 await page.setViewport(cfg);
 const errors=[],screens=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error'&&!/supabase|font|favicon|ERR_BLOCKED/i.test(msg.text()))errors.push(msg.text().slice(0,180));});
 await page.setRequestInterception(true);
 page.on('request',req=>{
  if(!['GET','HEAD'].includes(req.method())&&!req.url().startsWith(base))return req.abort();
  req.continue().catch(()=>{});
 });
 await page.coverage.startCSSCoverage({resetOnNavigation:false});
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
 await wait(950);
 const screenshot=async(label,fullPage=false)=>{
  const filename=cfg.name+'-'+label+'.png';
  await page.screenshot({path:join(out,filename),fullPage});
  screens.push(filename);
 };
 await screenshot('cover');
 const before=await page.evaluate(()=>({
  cover:!!document.querySelector('.couture-invite'),
  names:document.querySelectorAll('.couture-couple strong').length,
  overflow:document.documentElement.scrollWidth>innerWidth+2
 }));
 const button=await page.$('#openInvitation');
 if(button)await button.click();
 await wait(1450);
 await screenshot('opening');
 let opened=false;
 try{
  await page.waitForFunction(()=>document.querySelector('#invitationIntro')?.classList.contains('is-opened'),{timeout:9500});
  opened=true;
 }catch(e){errors.push('Invitation timeout: '+e.message.slice(0,110));}
 await wait(280);
 await screenshot('hero');
 const seenSections=[];
 for(const id of sections){
  const el=await page.$('#'+id);
  if(!el)continue;
  await el.evaluate(node=>node.scrollIntoView({behavior:'instant',block:'center'}));
  await wait(250);
  const geom=await page.evaluate(sel=>{
   const r=document.querySelector(sel)?.getBoundingClientRect();
   return r?{visible:r.width>0&&r.height>0,top:Math.round(r.top),height:Math.round(r.height)}:null;
  },'#'+id);
  seenSections.push({id,...geom});
  if(['story','homeGallery','rsvp'].includes(id))await screenshot(id);
 }
 const after=await page.evaluate(()=>({
  horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
  scrollWidth:document.documentElement.scrollWidth,
  viewport:innerWidth,
  invitationLocked:document.body.classList.contains('invitation-locked'),
  hasRsvp:!!document.querySelector('#rsvp')
 }));
 for(const item of await page.coverage.stopCSSCoverage()){
  if(!item.url.startsWith(base+'/css/'))continue;
  const file=item.url.split('?')[0].slice(base.length+1);
  const data=coverage.get(file)||{text:item.text,ranges:[]};
  data.ranges.push(...item.ranges);
  coverage.set(file,data);
 }
 report.scenarios.push({name:cfg.name,viewport:[cfg.width,cfg.height],before,opened,after,sections:seenSections,errors,screens});
 report.errors.push(...errors.map(e=>cfg.name+': '+e));
 console.log('SCENARIO '+cfg.name+' opened='+opened+' overflow='+after.horizontalOverflow+' errors='+errors.length);
 await page.close();
}

const admin=await browser.newPage();
await admin.setViewport({width:1280,height:900});
admin.on('pageerror',e=>report.errors.push('admin-login: '+e.message));
await admin.goto(base+'/admin/login',{waitUntil:'domcontentloaded',timeout:30000});
await wait(500);
await admin.screenshot({path:join(out,'admin-login.png')});
report.adminLogin={title:await admin.title(),url:admin.url()};
await admin.close();

const sourceFiles=['index.html','invitation.js','invitation-couture.css','app.js','motion.js','motion/cursor.js','personalized.js','music.js','particles.js','admin/index.html','admin/rsvp.js','admin/guests.js','admin/library.js','admin/editor.js'];
const referenced=sourceFiles.filter(existsSync).map(path=>readFileSync(path,'utf8')).join('\n');
for(const [file,data] of coverage){
 const ranges=data.ranges;
 const total=ranges.reduce((sum,r)=>sum+(r.end-r.start),0);
 report.css.push({file,bytes:data.text.length,usedBytes:total,coveragePct:Math.min(100,Math.round(total/Math.max(1,data.text.length)*100))});
 const doc=postcss.parse(data.text,{from:file});
 const lines=[0];
 for(let i=0;i<data.text.length;i++)if(data.text[i]==='\n')lines.push(i+1);
 const offset=loc=>(lines[loc.line-1]||0)+loc.column-1;
 doc.walkRules(rule=>{
  if(!rule.source?.start||!rule.source?.end)return;
  const a=offset(rule.source.start),b=offset(rule.source.end)+1;
  if(ranges.some(r=>r.start<b&&r.end>a))return;
  if(rule.selector.length>180)return;
  const names=[...rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m=>m[1]);
  if(names.length&&!names.some(n=>referenced.includes(n))){
   report.unusedCandidates.push({file,line:rule.source.start.line,selector:rule.selector.replace(/\s+/g,' ').slice(0,165),classes:names});
  }
 });
}
report.css.sort((a,b)=>a.file.localeCompare(b.file));
report.unusedCandidates=report.unusedCandidates.slice(0,100);
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
await browser.close();
await new Promise(done=>server.close(done));
console.log('CSS_COVERAGE '+JSON.stringify(report.css));
console.log('UNUSED_CANDIDATES '+JSON.stringify(report.unusedCandidates.slice(0,45)));
console.log('RUNTIME_ERRORS '+JSON.stringify(report.errors.slice(0,20)));
if(report.scenarios.some(s=>!s.opened||s.after.horizontalOverflow||!s.before.cover||!s.after.hasRsvp))process.exitCode=1;
