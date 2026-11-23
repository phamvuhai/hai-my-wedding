#!/usr/bin/env node
/* V25 original Find Me Canvas: offline WebKit mobile, desktop, reduced motion,
 * personalized invite and opening CTA regression; no Production data. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';
const root=process.cwd();
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
  let path=new URL(req.url,'http://localhost').pathname;
  if(path==='/' || /^\/(vi|en|jp)(?:\/invite\/[^/]+)?\/?$/.test(path))path='/index.html';
  const absolute=resolve(root,'.'+decodeURIComponent(path));
  if(!absolute.startsWith(root+'/')||!existsSync(absolute)||!statSync(absolute).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream'}).end(readFileSync(absolute));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
async function visit(width,height,opts={}){
  const context=await browser.newContext({
    viewport:{width,height},deviceScaleFactor:width<=500?3:1,
    isMobile:width<=500,hasTouch:width<=500,
    reducedMotion:opts.reduce?'reduce':'no-preference'
  });
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    // This test never uses live Supabase settings or guest tokens.
    const chain=()=>new Proxy({}, {get(_t,key){
      if(key==='then')return (resolve,reject)=>Promise.resolve({data:[],error:null}).then(resolve,reject);
      return ()=>chain();
    }});
    window.supabase={createClient:()=>({
      from:()=>chain(),
      rpc:async()=>({data:null,error:null}),
      storage:{from:()=>({getPublicUrl:p=>({data:{publicUrl:'https://offline.invalid/'+p}})})}
    })};
  });
  await page.route('**/*',route=>{
    if(route.request().url().startsWith(origin+'/'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+(opts.path||'/'),{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>!!window.WeddingFindMe,{timeout:12000});
  return {context,page,errors};
}
try {
  for(const [width,height] of [[390,844],[1280,850],[320,568]]){
    const {context,page,errors}=await visit(width,height);
    const canvas=page.locator('#findMeCanvas');
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>window.WeddingFindMe.status().photoLoaded,{timeout:6000});
    const initial=await page.evaluate(()=>{
      const c=document.getElementById('findMeCanvas');
      const r=c.getBoundingClientRect();
      return {rect:{width:r.width,height:r.height},
        hint:document.getElementById('findMeHint').textContent,
        status:window.WeddingFindMe.status(),
        button:document.getElementById('openInvitation').getBoundingClientRect().width};
    });
    assert.ok(initial.rect.width>180&&initial.rect.height>100,'Canvas is visible');
    assert.ok(initial.button>50,'Open Invitation button is present');
    assert.ok(initial.hint.includes('Từng điểm sáng'),'Updated static caption');
    assert.equal(initial.status.automatic,true,'Autoplay without pointer input');
    assert.ok(initial.status.particles>100,'Particles are generated from the image');
    assert.equal(await page.locator('#findMeResult').count(),0,'No merge-result element');
    await page.bringToFront();
    await page.waitForFunction(()=>window.WeddingFindMe.status().finished,null,{timeout:16000}).catch(async error=>{
      console.error('Find Me diagnostic',JSON.stringify(await page.evaluate(()=>({
        state:window.WeddingFindMe.status(),
        hidden:document.hidden,
        locked:document.body.classList.contains('invitation-locked'),
        intro:document.getElementById('invitationIntro').className,
        scrollY:window.scrollY,
        stage:document.getElementById('findMeStage').getBoundingClientRect().toJSON(),
        viewport:{width:innerWidth,height:innerHeight}
      }))));
      throw error;
    });
    const final=await page.evaluate(()=>window.WeddingFindMe.status());
    assert.equal(final.running,false,'RAF must stop after five seconds');
    assert.equal(final.elapsed,5000,'Full reveal completes');
    assert.deepEqual(errors,[],'No runtime errors: '+JSON.stringify(errors));
    await context.close();
  }
  // Opening must work immediately, without waiting for the animation to end.
  const direct=await visit(390,844,{path:'/vi/invite/fake-token'});
  await direct.page.locator('#openInvitation').click();
  await direct.page.waitForFunction(()=>document.getElementById('invitationIntro').classList.contains('is-opened'),null,{timeout:9000});
  assert.equal(await direct.page.evaluate(()=>window.WeddingFindMe.status().running),false);
  await direct.context.close();
  const reduced=await visit(390,844,{reduce:true});
  await reduced.page.waitForFunction(()=>window.WeddingFindMe.status().photoLoaded,null,{timeout:7000});
  assert.equal(await reduced.page.evaluate(()=>window.WeddingFindMe.status().finished),true);
  assert.ok(await reduced.page.locator('#openInvitation').isVisible());
  await reduced.context.close();
  const bypass=await visit(390,844,{path:'/vi'});
  await bypass.page.waitForFunction(()=>!window.WeddingFindMe.status().running,null,{timeout:4000});
  await bypass.context.close();
  console.log('PASS V26: automatic sampled-particle reveal, mobile/desktop, full photo finish, instant Open CTA and reduced motion');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
