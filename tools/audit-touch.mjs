#!/usr/bin/env node
/* WebKit iPhone/iPad smoke tests for touch effects and mocked personalized links.
   Never uses actual guest invite tokens or submits to production Supabase. */
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {extname,resolve,join} from 'node:path';
import {webkit,devices} from 'playwright';

const root=process.cwd(),out=join(root,'touch-audit');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((req,res)=>{
  let path;
  try {path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  if(path==='/'||/^\/(?:vi|jp|en)(?:\/invite\/[^/]+)?\/?$/.test(path))path='/index.html';
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/')||!existsSync(file)){res.writeHead(404).end();return}
  try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}
  catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const report={engine:'WebKit simulated touch',results:[]};

async function visit(context,path) {
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
    if(!route.request().url().startsWith(url))return route.abort();
    return route.continue();
  });
  await page.addInitScript(()=>{
    const fakeInvite={id:'test-invite-only',guest_name:'Nguyễn Văn Minh',
      display_name:'Nguyễn Văn Minh',event_choice:'both',max_guests:2};
    const chain=()=>new Proxy({}, {get(_target,key){
      if(key==='then')return (resolve,reject)=>Promise.resolve({data:[],error:null}).then(resolve,reject);
      return ()=>chain();
    }});
    window.supabase={createClient:()=>({
      from:()=>chain(),
      rpc:async(name,args)=>{
        if(name==='get_wedding_invite')
          return {data:args?.p_token==='qa-touch-guest'?[fakeInvite]:null,error:null};
        return {data:null,error:null};
      }
    })};
    window.__rsvpCount=0;
    document.addEventListener('wedding:rsvp-success',()=>window.__rsvpCount++);
  });
  await page.goto(url+path,{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>document.documentElement.dataset.motion && window.WeddingTouchEffects,
    undefined,{timeout:10000});
  return {page,errors};
}

for(const [name,device] of [
  ['iphone13',devices['iPhone 13']],
  ['iphonese',devices['iPhone SE']],
  ['ipad',devices['iPad (gen 7)']]
]){
  const context=await browser.newContext(device);
  const {page,errors}=await visit(context,'/jp/invite/qa-touch-guest');
  await page.waitForFunction(()=>document.querySelector('#personalGuestFeature')?.hidden===false,
    undefined,{timeout:9000});
  const jp=await page.evaluate(()=>({
    cover:document.querySelector('#personalGuestName')?.textContent.trim(),
    hero:document.querySelector('#heroGuestName')?.textContent.trim(),
    label:document.querySelector('#personalGuestLabel')?.textContent.trim(),
    name:document.querySelector('#rsvpForm [name="name"]')?.value,
    token:window.WeddingGuest?.token
  }));
  await page.locator('.minimal-language [data-lang="en"]').click();
  await page.waitForFunction(()=>document.getElementById('personalGuestLabel')?.textContent==='SPECIALLY INVITED',
    undefined,{timeout:5000});
  const english=await page.evaluate(()=>({
    cover:document.getElementById('personalGuestName').textContent.trim(),
    label:document.getElementById('personalGuestLabel').textContent.trim(),
    path:location.pathname
  }));
  await page.locator('#openInvitation').click();
  await page.waitForFunction(()=>document.getElementById('invitationIntro').classList.contains('is-opened'),
    undefined,{timeout:8000});
  await page.waitForTimeout(200);
  const opened=await page.evaluate(()=>({
    visible:!document.getElementById('heroGuestGreeting').hidden,
    name:document.getElementById('heroGuestName').textContent.trim(),
    path:location.pathname
  }));

  // Synthetic touch pointer events: no real swipes or scrolling are prevented.
  const touch=await page.evaluate(()=>{
    const hero=document.querySelector('.hero-note');
    const box=hero.getBoundingClientRect();
    const x=box.left+box.width/2, y=Math.max(90,Math.min(innerHeight-60,box.top+12));
    const fire=(type,id,xPos,yPos)=>{
      hero.dispatchEvent(new PointerEvent(type,{bubbles:true,isPrimary:true,pointerType:'touch',
        pointerId:id,clientX:xPos,clientY:yPos}));
    };
    const before=document.querySelectorAll('.wedding-touch-halo').length;
    fire('pointerdown',191,x,y);fire('pointerup',191,x,y);
    const tapVisible=document.querySelectorAll('.wedding-touch-halo').length>before;
    const beforeSwipe=document.querySelectorAll('.wedding-touch-halo').length;
    fire('pointerdown',192,x,y);fire('pointerup',192,x,y+70);
    const swipeNoBurst=document.querySelectorAll('.wedding-touch-halo').length===beforeSwipe;
    const layer=document.querySelector('.wedding-touch-layer');
    return {active:window.WeddingTouchEffects?.active,tapVisible,swipeNoBurst,
      noInputBlock:layer&&getComputedStyle(layer).pointerEvents==='none'};
  });

  // Test actual submit-success integration against the fake Supabase RPC only.
  await page.locator('#rsvpForm input[name="attending"][value="yes"]').check();
  await page.locator('#rsvpForm button[type="submit"]').click();
  await page.waitForFunction(()=>window.__rsvpCount===1,undefined,{timeout:5000});
  const saved=await page.evaluate(()=>({
    emitted:window.__rsvpCount,
    status:document.getElementById('formStatus')?.className,
    feedback:document.getElementById('rsvpForm').classList.contains('touch-rsvp-celebrate')
  }));
  await page.screenshot({path:join(out,name+'-personalized.png')});
  const good=jp.cover==='Nguyễn Văn Minh 様'&&jp.name==='Nguyễn Văn Minh'&&
    jp.hero==='Nguyễn Văn Minh 様'&&jp.token==='qa-touch-guest'&&
    english.cover==='Nguyễn Văn Minh'&&english.label==='SPECIALLY INVITED'&&
    opened.visible&&opened.name==='Nguyễn Văn Minh'&&opened.path==='/en/invite/qa-touch-guest'&&
    touch.active&&touch.tapVisible&&touch.swipeNoBurst&&touch.noInputBlock&&
    saved.emitted===1&&saved.feedback&&errors.length===0;
  report.results.push({name,good,jp,english,opened,touch,saved,errors});
  console.log(name+' guest-name/touch/RSVP='+good+' '+JSON.stringify({jp,touch,saved,errors}));
  await context.close();
}

// Public / invalid links must never show any guest identity.
const context=await browser.newContext(devices['iPhone 13']);
for(const [path,expectedVisible] of [['/jp',false],['/jp/invite/invalid-qa-token',false]]){
  const {page,errors}=await visit(context,path);
  await page.waitForTimeout(450);
  const feature=await page.evaluate(()=>({
    coverHidden:document.getElementById('personalGuestFeature').hidden,
    heroHidden:document.getElementById('heroGuestGreeting').hidden
  }));
  const good=feature.coverHidden&&!feature.heroHidden===false&&errors.length===0;
  report.results.push({name:path,good,feature,errors});
  console.log(path+' no personal data='+good);
  await page.close();
}
await context.close();
await browser.close();
await new Promise(ok=>server.close(ok));
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
if(report.results.some(x=>!x.good))process.exitCode=1;
