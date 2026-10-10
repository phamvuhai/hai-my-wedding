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
  return {
   cover:!!document.querySelector('.invitation-intro.invite-minimal'),
   names:[...document.querySelectorAll('.minimal-names span')].map(x=>x.textContent.trim()),
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
 const passed=closed.cover&&closed.names.length===2&&closed.buttonVisible&&
  !closed.horizontalOverflow&&finish.opened&&!finish.locked&&!finish.horizontalOverflow&&errors.length===0;
 report.push({viewport:cfg.name,passed,closed,finish,errors});
 console.log(cfg.name+': '+(passed?'PASS':'FAIL')+' buttonVisible='+closed.buttonVisible+' errors='+errors.length);
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
