#!/usr/bin/env node
/* Safari-compatible offline image-delivery test; zero production credentials/data. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/image-test'){
    res.writeHead(200,{'content-type':'text/html;charset=utf-8'});
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><img id="test" alt=""><script src="/assets/js/site/adaptive-images.js"></script><script src="/assets/js/admin/photo-processor.js"></script></body></html>');
    return;
  }
  const file=resolve(root,'.'+decodeURIComponent(path));
  if(!file.startsWith(root+'/')||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':extname(file)==='.js'?'application/javascript':'application/octet-stream'});
  res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await webkit.launch({headless:true});
const expected=['480','960','1440'];

async function testContext(connection,viewport={width:390,height:844},dpr=3){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr});
  await context.addInitScript(net => {
    Object.defineProperty(navigator,'connection',{value:net,configurable:true});
  },connection);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/')||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
    return route.abort();
  });
  await page.goto(origin+'/image-test',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.WeddingAdaptiveImages&&!!window.AdminPhotoProcessor);
  return {context,page,errors};
}
const image={
  image_path:'pre-wedding/archival.webp',image_variants:{
    480:'pre-wedding/archival-a-w480.webp',
    960:'pre-wedding/archival-a-w960.webp',
    1440:'pre-wedding/archival-a-w1440.webp'
  },
  width:2400,updated_at:'2026-11-21T00:00:00Z'
};
try {
  const {context,page,errors}=await testContext({saveData:false,effectiveType:'4g'});
  const normal=await page.evaluate(img=>{
    const adaptive=window.WeddingAdaptiveImages;
    const db={storage:{from:()=>({
      getPublicUrl:path=>({data:{publicUrl:'https://example.invalid/storage/'+path}})
    })}};
    const tags=adaptive.attrs(db,img,{role:'thumb',sizes:'48vw',loading:'lazy'});
    const hero=adaptive.attrs(db,img,{role:'hero',sizes:'100vw',loading:'eager',priority:'high'});
    adaptive.apply(document.getElementById('test'),db,img,{role:'thumb',sizes:'48vw'});
    const legacy=adaptive.attrs(db,{image_path:img.image_path,width:2400},{role:'thumb'});
    return {
      mode:adaptive.bandwidth(),
      list:adaptive.sources(db,img,'thumb').map(x=>x.width),
      src:tags.src,srcset:tags.srcset,sizes:tags.sizes,loading:tags.loading,
      heroSrc:hero.src,heroPriority:hero.fetchpriority,
      legacySrc:legacy.src,legacySet:legacy.srcset,
      actualSrcset:document.getElementById('test').getAttribute('srcset'),
      invalidPaths:adaptive.variants({...img,image_variants:{480:'javascript:bad.webp','evil':'x',960:'pre-wedding/archival-a-w960.webp'}}).map(x=>x.path)
    };
  },image);
  assert.equal(normal.mode,'auto');
  assert.deepEqual(normal.list,[480,960,1440,2400]);
  assert.match(normal.srcset,/480w.*960w.*1440w.*2400w/);
  assert.ok(normal.src.includes('archival-a-w960.webp'),'Mobile thumbnail resolves within expected pixel width');
  assert.equal(normal.sizes,'48vw');
  assert.equal(normal.loading,'lazy');
  assert.equal(normal.heroPriority,'high');
  assert.ok(normal.heroSrc.includes('archival-a-w1440.webp'));
  assert.equal(normal.actualSrcset,normal.srcset);
  assert.equal(normal.legacySet,'');
  assert.ok(normal.legacySrc.includes('archival.webp'));
  assert.deepEqual(normal.invalidPaths,['pre-wedding/archival-a-w960.webp']);

  // Generate actual WebP variants through the same browser canvas path as Admin upload.
  const storage=await page.evaluate(async()=>{
    const processor=window.AdminPhotoProcessor;
    const canvas=document.createElement('canvas');
    canvas.width=1600;canvas.height=900;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#b06a72';ctx.fillRect(0,0,1600,900);
    ctx.fillStyle='#f4d0a4';ctx.fillRect(100,200,700,420);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));
    const uploads=[];
    const mock={
      storage:{from:()=>({
        upload:async(path,b,options)=>{uploads.push({path,bytes:b.size,contentType:options.contentType});return {error:null};},
        remove:async()=>({error:null})
      })}
    };
    const paths=await processor.uploadResponsiveVariants(mock,blob,'pre-wedding/archival.webp',1600,{strict:true});
    return {keys:Object.keys(paths),paths,uploads};
  });
  assert.deepEqual(storage.keys,expected);
  assert.equal(storage.uploads.length,3);
  assert.ok(storage.uploads.every(x=>x.contentType==='image/webp'&&x.bytes>0));
  assert.deepEqual(errors,[]);
  await context.close();

  const slow=await testContext({saveData:true,effectiveType:'4g'});
  const slowResult=await slow.page.evaluate(img=>{
    const a=window.WeddingAdaptiveImages;
    const db={storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://test.invalid/'+path}})})}};
    return {mode:a.bandwidth(),items:a.sources(db,img,'thumb').map(x=>x.width),
      lightbox:a.sources(db,img,'lightbox').map(x=>x.width),fallback:a.sources(db,{image_path:img.image_path,width:2400},'thumb').length};
  },image);
  assert.equal(slowResult.mode,'save');
  assert.deepEqual(slowResult.items,[480,960]);
  assert.deepEqual(slowResult.lightbox,[480,960,1440]);
  assert.equal(slowResult.fallback,1);
  await slow.context.close();

  const medium=await testContext({saveData:false,effectiveType:'3g'});
  const mediumResult=await medium.page.evaluate(img=>window.WeddingAdaptiveImages.sources(null,img,'thumb').map(x=>x.width),image);
  assert.deepEqual(mediumResult,[480,960,1440]);
  await medium.context.close();
  console.log('PASS: network-aware caps, legacy fallback, WebP upload variants, srcset, DPR and hero priority');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
