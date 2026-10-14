import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import puppeteer from 'puppeteer-core';

const root=process.cwd(),out=join(root,'atelier-qa');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'};
const serve=createServer((req,res)=>{
 let route;
 try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(route==='/'||/^\/(?:vi|en|jp)(?:\/(?:invite\/[^/]+|album))?\/?$/.test(route))route='/index.html';
 const file=resolve(root,'.'+route);
 if(!file.startsWith(root+'/')||!existsSync(file)){res.writeHead(404).end();return;}
 try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));}
 catch{res.writeHead(404).end();}
});
await new Promise(done=>serve.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+serve.address().port;
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const wait=ms=>new Promise(done=>setTimeout(done,ms));
const configs=[
 {name:'mobile',width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true},
 {name:'small-phone',width:375,height:667,deviceScaleFactor:2,isMobile:true,hasTouch:true},
 {name:'tablet',width:820,height:1180,deviceScaleFactor:2,isMobile:true,hasTouch:true},
 {name:'desktop',width:1440,height:900,deviceScaleFactor:1,isMobile:false}
];
const report=[];
for(const cfg of configs){
 const page=await browser.newPage();
 await page.setViewport(cfg);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&!r.url().startsWith(url))return r.abort();r.continue().catch(()=>{});});
 await page.goto(url+'/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#invitationIntro')?.classList.contains('is-ready'),{timeout:7000});
 await wait(350);
 await page.screenshot({path:join(out,cfg.name+'-closed.png')});
 const closed=await page.evaluate(()=>{
  const button=document.querySelector('#openInvitation');
  const r=button?.getBoundingClientRect();
  const card=document.querySelector('.luxury-card');
  const cardRect=card?.getBoundingClientRect();
  const names=[...document.querySelectorAll('.minimal-names span')];
  const namesFit=!!cardRect&&names.every(n=>{
    const b=n.getBoundingClientRect();
    return b.width>0&&b.left>=cardRect.left+14&&b.right<=cardRect.right-14;
  });
  return {
   cover:!!document.querySelector('.invitation-intro.invite-luxury'),
   cardVisible:!!cardRect&&cardRect.width>300&&cardRect.top>=-4&&cardRect.left>=0&&cardRect.right<=innerWidth+2,
   floralAssets:document.querySelectorAll('.luxury-floral img').length===2,
   names:names.map(x=>x.textContent.trim()),
   namesFit,
   buttonVisible:!!r&&r.width>=120&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight,
   horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
  };
 });
 await page.evaluate(()=>document.addEventListener('wedding:invitation-opened',()=>window.__finished=true,{once:true}));
 await page.click('#openInvitation');
 await page.waitForFunction(()=>window.__finished===true,{timeout:6000});
 const finish=await page.evaluate(()=>({
  opened:document.querySelector('#invitationIntro').classList.contains('is-opened'),
  route:location.pathname,
  locked:document.body.classList.contains('invitation-locked'),
  horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
 }));
 await page.screenshot({path:join(out,cfg.name+'-homepage.png')});
 await page.close();
 const passed=closed.cover&&closed.cardVisible&&closed.floralAssets&&closed.namesFit&&closed.names.length===2&&closed.buttonVisible&&
  !closed.horizontalOverflow&&finish.opened&&!finish.locked&&!finish.horizontalOverflow&&errors.length===0;
 report.push({viewport:cfg.name,passed,closed,finish,errors});
 console.log(cfg.name+': '+(passed?'PASS':'FAIL')+' buttonVisible='+closed.buttonVisible+' errors='+errors.length);
}

const localized=await browser.newPage();
await localized.goto(url+'/vi',{waitUntil:'domcontentloaded',timeout:30000});
const bypass=await localized.evaluate(()=>document.querySelector('#invitationIntro')?.classList.contains('is-bypassed'));
console.log('localized route bypass='+bypass);
await localized.close();

// Language switch must stay on the entry cover until its Open button is clicked.
const languagePage=await browser.newPage();
await languagePage.goto(url+'/',{waitUntil:'domcontentloaded',timeout:30000});
await languagePage.waitForSelector('#openInvitation');
await languagePage.click('.minimal-language [data-lang="en"]');
const languageBeforeOpen=await languagePage.evaluate(()=>({
 lang:window.WeddingI18n?.language,
 route:location.pathname,
 button:document.querySelector('#openInvitation [data-i18n="intro.open"]')?.textContent.trim()
}));
await languagePage.evaluate(()=>document.addEventListener('wedding:invitation-opened',()=>window.__langDone=true,{once:true}));
await languagePage.click('#openInvitation');
await languagePage.waitForFunction(()=>window.__langDone===true,{timeout:7000});
const languageAfterOpen=await languagePage.evaluate(()=>({route:location.pathname,locked:document.body.classList.contains('invitation-locked')}));
const languagePassed=languageBeforeOpen.lang==='en'&&languageBeforeOpen.route==='/'&&
 languageBeforeOpen.button.length>0&&languageAfterOpen.route==='/en'&&!languageAfterOpen.locked;
console.log('language switch and open='+languagePassed);
await languagePage.close();

// On Japanese route, scroll without moving the mouse: cursor halo must react
// and switch to the section newly underneath its fixed screen coordinates.
const scrollPage=await browser.newPage();
await scrollPage.setViewport({width:1440,height:900,deviceScaleFactor:1,isMobile:false});
const scrollErrors=[];
scrollPage.on('pageerror',e=>scrollErrors.push(e.message));
await scrollPage.goto(url+'/jp',{waitUntil:'domcontentloaded',timeout:30000});
await scrollPage.waitForFunction(()=>!!document.querySelector('.motion-cursor'),{timeout:12000});
const japanese=await scrollPage.evaluate(()=>({
 nav:document.querySelector('[data-i18n="nav.events"]')?.textContent.trim(),
 hero:document.querySelector('[data-i18n="hero.cta"]')?.textContent.trim(),
 events:document.querySelector('[data-i18n="events.title"]')?.textContent.trim()
}));
const japanesePassed=japanese.nav==='結婚式の日程'&&
 japanese.hero==='結婚式の日程を見る'&&japanese.events==='結婚式の日程';
await scrollPage.mouse.move(720,510);
await scrollPage.waitForFunction(()=>document.querySelector('.motion-cursor')?.classList.contains('is-active'),{timeout:5000});
await scrollPage.evaluate(()=>{
 const cursor=document.querySelector('.motion-cursor');
 window.__cursorScrollPulseSeen=false;
 new MutationObserver(()=>{
   if(cursor.classList.contains('is-scroll-active')) window.__cursorScrollPulseSeen=true;
 }).observe(cursor,{attributes:true,attributeFilter:['class']});
 const story=document.getElementById('story');
 const top=story.getBoundingClientRect().top+window.scrollY-180;
 window.scrollTo({top,behavior:'instant'});
});
await scrollPage.waitForFunction(()=>document.querySelector('.motion-cursor')?.dataset.section==='story',{timeout:6000});
const cursorScroll=await scrollPage.evaluate(()=>({
 section:document.querySelector('.motion-cursor')?.dataset.section,
 pulseSeen:window.__cursorScrollPulseSeen,
 scrollY:window.scrollY,
 pointerFixed:document.querySelector('.motion-cursor-core')?.style.transform.replace(/\s+/g,'').includes('720px,510px')
}));
const cursorScrollPassed=cursorScroll.section==='story'&&cursorScroll.pulseSeen&&cursorScroll.pointerFixed&&scrollErrors.length===0;
console.log('Japanese wedding schedule='+japanesePassed);
console.log('stationary pointer scroll reaction='+cursorScrollPassed+' '+JSON.stringify(cursorScroll));
await scrollPage.close();
await browser.close();
await new Promise(done=>serve.close(done));
writeFileSync(join(out,'report.json'),JSON.stringify({report,localizedRouteBypassed:bypass,languagePassed,languageBeforeOpen,languageAfterOpen,japanese,japanesePassed,cursorScroll,cursorScrollPassed,scrollErrors},null,2));
if(!bypass||!languagePassed||!japanesePassed||!cursorScrollPassed||report.some(x=>!x.passed))process.exitCode=1;
