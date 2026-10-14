#!/usr/bin/env node
/* Four-stop wedding status regression in the Safari/WebKit engine.
   No private guest data and no network calls to real APIs. */
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {extname,resolve,join} from 'node:path';
import {webkit,devices} from 'playwright';

const root=process.cwd(),out=join(root,'event-status-audit');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.woff':'font/woff','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  let path;
  try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  if(/^\/(?:vi|en|jp)\/?$/.test(path))path='/index.html';
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/')||!existsSync(file)){res.writeHead(404).end();return}
  try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}
  catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const report={engine:'Playwright WebKit',physicalDevice:false,scenarios:[]};

for(const [name,device] of [
  ['iphone13',devices['iPhone 13']],
  ['iphonese',devices['iPhone SE']],
  ['ipad',devices['iPad (gen 7)']]
]) {
  const ctx=await browser.newContext(device);
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
    if(!route.request().url().startsWith(base))return route.abort();
    return route.continue();
  });
  await page.goto(base+'/jp',{waitUntil:'domcontentloaded',timeout:30000});
  await page.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
  await page.waitForSelector('#eventScrollStatus [data-progress-step]');
  await page.waitForLoadState('load');
  // invitation.js intentionally restores localized entry routes to page top
  // after fonts/layout settle; don't race that one-time restoration.
  await page.waitForFunction(()=>document.getElementById('invitationIntro')?.classList.contains('is-bypassed'),
    undefined,{timeout:5000});
  await page.waitForTimeout(1700);

  const observed=[];
  async function checkStep(index){
    await page.evaluate(i=>{
      const item=document.querySelectorAll('#events [data-event-item]')[i];
      const rect=item.getBoundingClientRect();
      window.scrollTo({top:Math.max(0,window.scrollY+rect.top+rect.height/2-window.innerHeight*.48),behavior:'instant'});
    },index);
    // Allow rAF and Safari layout/scroll-anchor adjustments to settle first.
    await page.waitForTimeout(160);
    try {
      await page.waitForFunction(value=>document.getElementById('eventScrollStatus')?.dataset.activeEvent===String(value),
        index+1,{timeout:2400});
    } catch(error) {
      console.log('STEP_WAIT_DIAGNOSTIC '+name+' expected '+(index+1));
    }
    const data=await page.evaluate(()=>{
      const status=document.getElementById('eventScrollStatus');
      const active=Number(status.dataset.activeEvent);
      const bars=[...status.querySelectorAll('[data-progress-step]')];
      const box=status.getBoundingClientRect();
      return {
        active, count:document.getElementById('eventScrollCount').textContent.trim(),
        date:document.getElementById('eventScrollStatusText').textContent.trim(),
        detail:document.getElementById('eventScrollDetail').textContent.trim(),
        current:bars.filter(el=>el.classList.contains('is-current')).length,
        completed:bars.filter(el=>el.classList.contains('is-complete')).length,
        accessible:document.getElementById('eventScrollProgress').getAttribute('aria-valuenow'),
        withinViewport:box.left>=-2&&box.right<=innerWidth+2,
        hasTwoLines:status.querySelector('.event-status-copy').getBoundingClientRect().height>31,
        visible:box.top>=-5&&box.top<innerHeight*.55,
        top:Math.round(box.top),
        left:Math.round(box.left),
        right:Math.round(box.right),
        fixed:getComputedStyle(status).position==='fixed',
        floating:status.classList.contains('is-floating'),
        sectionTop:Math.round(document.getElementById('events').getBoundingClientRect().top),
        sectionBottom:Math.round(document.getElementById('events').getBoundingClientRect().bottom),
        slotTop:Math.round(document.getElementById('eventScrollStatusSlot').getBoundingClientRect().top),
        navBottom:Math.round(document.querySelector('.nav').getBoundingClientRect().bottom),
        scrollY:Math.round(scrollY),
        noOverflow:document.documentElement.scrollWidth<=innerWidth+2
      };
    });
    const passed=data.active===index+1&&data.count===`${index+1} / 4`&&
      data.current===1&&data.completed===index+1&&
      data.accessible===String(index+1)&&data.date.length>4&&data.detail.length>4&&
      data.hasTwoLines&&data.withinViewport&&data.visible&&data.noOverflow;
    observed.push({index:index+1,passed,...data});
    if(!passed)console.log('EVENT_STATUS_FAILURE '+name+' '+JSON.stringify(observed.at(-1)));
  }

  for(const index of [0,1,2,3,2,1,0])await checkStep(index);

  // The same active event must immediately relocalize when the visitor switches.
  await checkStep(2);
  await page.evaluate(()=>window.WeddingI18n.setLanguage('en'));
  await page.waitForFunction(()=>document.getElementById('eventScrollStatusText')?.textContent.includes("Groom's Family"),
    undefined,{timeout:5000});
  const en=await page.evaluate(()=>({
    main:document.getElementById('eventScrollStatusText').textContent.trim(),
    detail:document.getElementById('eventScrollDetail').textContent.trim(),
    count:document.getElementById('eventScrollCount').textContent.trim(),
    aria:document.getElementById('eventScrollProgress').getAttribute('aria-label'),
    lang:document.documentElement.lang
  }));
  await page.evaluate(()=>window.WeddingI18n.setLanguage('vi'));
  await page.waitForFunction(()=>document.getElementById('eventScrollStatusText')?.textContent.includes('Nhà trai'),
    undefined,{timeout:5000});
  const vi=await page.evaluate(()=>({
    main:document.getElementById('eventScrollStatusText').textContent.trim(),
    detail:document.getElementById('eventScrollDetail').textContent.trim(),
    count:document.getElementById('eventScrollCount').textContent.trim(),
    aria:document.getElementById('eventScrollProgress').getAttribute('aria-label')
  }));
  await page.evaluate(()=>window.WeddingI18n.setLanguage('ja'));
  await page.waitForFunction(()=>document.getElementById('eventScrollStatusText')?.textContent.includes('新郎側'),
    undefined,{timeout:5000});

  await page.screenshot({path:join(out,name+'-events-progress.png')});
  await page.evaluate(()=>{
    document.getElementById('forever').scrollIntoView({behavior:'instant',block:'start'});
  });
  await page.waitForTimeout(180);
  const outside=await page.evaluate(()=>{
    const status=document.getElementById('eventScrollStatus').getBoundingClientRect();
    const section=document.getElementById('events').getBoundingClientRect();
    return {statusVisible:status.bottom>0&&status.top<innerHeight,
      eventsVisible:section.bottom>0&&section.top<innerHeight};
  });
  const passed=observed.every(x=>x.passed)&&en.count==='3 / 4'&&en.lang==='en'&&
    en.main.includes("Groom's Family")&&en.detail.includes('Wedding Ceremony')&&
    vi.main.includes('Nhà trai')&&vi.detail.includes('Lễ Thành Hôn')&&
    vi.count==='3 / 4'&&en.aria==='Wedding event progress'&&
    vi.aria==='Tiến trình các sự kiện'&&!outside.statusVisible&&
    !outside.eventsVisible&&errors.length===0;
  report.scenarios.push({name,passed,observed,en,vi,outside,errors});
  if(!passed)console.log('EVENT_STATUS_REPORT '+name+': '+JSON.stringify({en,vi,outside,errors,failures:observed.filter(x=>!x.passed)}));
  console.log(name+' event status scroll/reverse/language/exit: '+(passed?'PASS':'FAIL'));
  await ctx.close();
}
await browser.close();
await new Promise(resolve=>server.close(resolve));
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
if(report.scenarios.some(x=>!x.passed))process.exitCode=1;
