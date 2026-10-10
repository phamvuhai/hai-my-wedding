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
 const closed=await page.evaluate(()=>({
  cover:!!document.querySelector('.atelier-invite'),
  envelope:!!document.querySelector('.atelier-envelope-front'),
  textNames:[...document.querySelectorAll('.atelier-names strong')].map(x=>x.textContent.trim()),
  horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
 }));
 await page.evaluate(()=>document.addEventListener('wedding:invitation-opened',()=>window.__finished=true,{once:true}));
 await page.click('#openInvitation');
 await wait(2200);
 await page.screenshot({path:join(out,cfg.name+'-mid-opening.png')});
 await wait(1650);
 await page.screenshot({path:join(out,cfg.name+'-revealed.png')});
 const open=await page.evaluate(()=>{
  const el=document.querySelector('.atelier-paper'),r=el.getBoundingClientRect();
  const names=[...el.querySelectorAll('.atelier-names strong')].map(n=>({text:n.textContent.trim(),rect:n.getBoundingClientRect().toJSON()}));
  return {
   coverOpening:document.querySelector('#invitationIntro').classList.contains('is-opening'),
   cardRect:r.toJSON(),foil:!!el.querySelector('.atelier-paper-foil'),
   cardVisible:getComputedStyle(el).opacity!=='0',
   names,
   namesFit:names.every(n=>n.rect.left>=r.left-3&&n.rect.right<=r.right+3&&n.rect.top>=r.top-3&&n.rect.bottom<=r.bottom+3),
   cardInViewport:r.top>=-15&&r.bottom<=innerHeight+25,
   paperZ:Number.parseInt(getComputedStyle(el).zIndex||'0',10),
   pocketZ:Number.parseInt(getComputedStyle(document.querySelector('.atelier-envelope-front')).zIndex||'0',10),
   pocketOpacity:Number.parseFloat(getComputedStyle(document.querySelector('.atelier-envelope-front')).opacity)

  };
 });
 await page.waitForFunction(()=>window.__finished===true,{timeout:6000});
 const finish=await page.evaluate(()=>({opened:document.querySelector('#invitationIntro').classList.contains('is-opened'),route:location.pathname,locked:document.body.classList.contains('invitation-locked')}));
 await page.screenshot({path:join(out,cfg.name+'-homepage.png')});
 await page.close();
 const passed=closed.cover&&closed.envelope&&closed.textNames.length===2&&!closed.horizontalOverflow&&open.coverOpening&&open.cardVisible&&open.foil&&open.namesFit&&open.cardInViewport&&open.paperZ>open.pocketZ&&open.pocketOpacity<.38&&finish.opened&&!finish.locked&&errors.length===0;
 report.push({viewport:cfg.name,passed,closed,open,finish,errors});
 console.log(cfg.name+': '+(passed?'PASS':'FAIL')+' cardTop='+Math.round(open.cardRect.top)+' cardBottom='+Math.round(open.cardRect.bottom)+' namesFit='+open.namesFit+' paperZ='+open.paperZ+' pocketOpacity='+open.pocketOpacity+' errors='+errors.length);
}
const localized=await browser.newPage();
await localized.goto(url+'/vi',{waitUntil:'domcontentloaded',timeout:30000});
const bypass=await localized.evaluate(()=>document.querySelector('#invitationIntro')?.classList.contains('is-bypassed'));
console.log('localized route bypass='+bypass);
await localized.close();
await browser.close();
await new Promise(done=>serve.close(done));
writeFileSync(join(out,'report.json'),JSON.stringify({report,localizedRouteBypassed:bypass},null,2));
if(!bypass||report.some(x=>!x.passed))process.exitCode=1;
