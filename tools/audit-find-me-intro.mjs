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
    await page.waitForFunction(()=>window.WeddingFindMe.status().frames>3,null,{timeout:9000});
    const intro=page.locator('#invitationIntro');
    const canvas=page.locator('#findMeCanvas');
    await canvas.scrollIntoViewIfNeeded();
    const initial=await page.evaluate(()=>{
      const r=document.getElementById('findMeCanvas').getBoundingClientRect();
      return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},
        hint:document.getElementById('findMeHint').textContent,
        animation:window.WeddingFindMe.status(),
        buttonVisible:document.getElementById('openInvitation').getBoundingClientRect().width>50};
    });
    assert.ok(initial.rect.width>180 && initial.rect.height>=88,'Interactive canvas must be visible');
    assert.equal(initial.animation.merged,false);
    assert.ok(initial.buttonVisible,'Open invitation button remains present');
    assert.ok(initial.hint.includes('Kéo'),'Vietnamese interaction hint is visible');
    const r=initial.rect;
    const a={x:r.x+r.width*.28,y:r.y+r.height*.44};
    const b={x:r.x+r.width*.72-24,y:r.y+r.height*.44};
    await page.mouse.move(a.x,a.y);
    await page.mouse.down();
    await page.mouse.move(b.x,b.y,{steps:14});
    await page.mouse.up();
    await page.waitForFunction(()=>window.WeddingFindMe.status().merged,{timeout:8000});
    assert.equal(await page.locator('#findMeResult').isVisible(),true,'Romantic reveal replaces instruction after merge');
    const state=await page.evaluate(()=>window.WeddingFindMe.status());
    assert.equal(state.sparks,width<=500?48:120,'Responsive particle budget');
    // The interactive scene must not be a required gate for opening.
    await page.locator('#openInvitation').click();
    await page.waitForFunction(()=>document.getElementById('invitationIntro').classList.contains('is-opened'),null,{timeout:9000});
    await page.waitForFunction(()=>window.WeddingFindMe.status().running===false,null,{timeout:5000});
    assert.deepEqual(errors,[],'No JavaScript runtime errors '+JSON.stringify(errors));
    await context.close();
  }
  // Guests may always skip the interaction. This also validates the opening
  // on an actual personal invitation route.
  const direct=await visit(390,844,{path:'/vi/invite/fake-token'});
  await direct.page.locator('#openInvitation').click();
  await direct.page.waitForFunction(()=>document.getElementById('invitationIntro').classList.contains('is-opened'),null,{timeout:9000});
  assert.equal(await direct.page.evaluate(()=>window.WeddingFindMe.status().running),false);
  await direct.context.close();

  const reduced=await visit(390,844,{reduce:true});
  const fallback=await reduced.page.evaluate(()=>window.WeddingFindMe.status());
  assert.equal(fallback.running,false);
  assert.equal(fallback.merged,true);
  assert.equal(fallback.finished,true);
  assert.ok(await reduced.page.locator('#openInvitation').isVisible());
  await reduced.context.close();

  // /vi already bypasses the cover; no hidden Canvas loop must run.
  const bypass=await visit(390,844,{path:'/vi'});
  await bypass.page.waitForFunction(()=>!window.WeddingFindMe.status().running,null,{timeout:4000});
  await bypass.context.close();
  console.log('PASS V25: Canvas meet/merge, small particle budget, skip Open CTA, iPhone SE/13 and desktop, Reduce Motion and bypass route');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
