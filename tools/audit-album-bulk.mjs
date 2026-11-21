#!/usr/bin/env node
/* Offline browser smoke test. Supabase is mocked; no production data is modified. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {webkit} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  let path=new URL(req.url,'http://localhost').pathname;
  if(path==='/admin'||path==='/admin/')path='/admin/index.html';
  const absolute=resolve(root,'.'+decodeURIComponent(path));
  if(!absolute.startsWith(root+'/')||!existsSync(absolute)){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream'});
  res.end(readFileSync(absolute));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await webkit.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',route=>route.abort());
  await page.addInitScript(()=>{
    const album={id:'00000000-0000-0000-0000-000000000001',title:'Pre-wedding',slug:'pre-wedding',sort_order:0};
    const images=[];
    const clone=x=>structuredClone(x);
    function from(table){
      const state={table,operation:'select',filter:null,input:null,single:false};
      const executor=()=>{
        const rows=table==='gallery_albums'?[album]:table==='gallery_images'?images:[];
        let matched=state.filter?rows.filter(state.filter):rows;
        if(state.operation==='insert'){
          const row=clone(state.input);images.push(row);
          return Promise.resolve({data:state.single?clone(row):[clone(row)],error:null});
        }
        if(state.operation==='update'){
          matched.forEach(row=>Object.assign(row,state.input));
          return Promise.resolve({data:state.single?clone(matched[0]):matched.map(clone),error:null});
        }
        if(state.operation==='delete'){
          for(const row of matched){const index=rows.indexOf(row);if(index!==-1)rows.splice(index,1);}
          return Promise.resolve({data:matched.map(clone),error:null});
        }
        return Promise.resolve({data:state.single?clone(matched[0]):matched.map(clone),error:null});
      };
      const methods={
        select:()=>methods,order:()=>methods,limit:()=>methods,
        eq:(key,value)=>{const prev=state.filter;state.filter=x=>(!prev||prev(x))&&x[key]===value;return methods;},
        neq:(key,value)=>{const prev=state.filter;state.filter=x=>(!prev||prev(x))&&x[key]!==value;return methods;},
        in:(key,values)=>{const prev=state.filter;state.filter=x=>(!prev||prev(x))&&values.includes(x[key]);return methods;},
        insert:data=>{state.operation='insert';state.input=data;return methods;},
        update:data=>{state.operation='update';state.input=data;return methods;},
        delete:()=>{state.operation='delete';return methods;},
        single:()=>{state.single=true;return executor();},
        then:(resolve,reject)=>executor().then(resolve,reject)
      };
      return methods;
    }
    window.supabase={createClient:()=>({
      auth:{getUser:async()=>({data:{user:{email:'phamvuhai23@gmail.com'}},error:null}),
        getSession:async()=>({data:{session:{user:{email:'phamvuhai23@gmail.com'}}}}),
        onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({})},
      from, storage:()=>({
        upload:async()=>({data:{path:'mock'},error:null}),
        remove:async()=>({data:[],error:null}),
        getPublicUrl:path=>({data:{publicUrl:'https://example.test/'+path}}),
        download:async()=>({data:null,error:new Error('not needed in smoke test')})
      }),
      rpc:async(name,args)=>{
        if(name==='reorder_gallery_images'){
          if(args.p_image_ids.length!==images.filter(x=>x.album_id===args.p_album_id).length)
            return {data:null,error:{message:'stale album'}};
          args.p_image_ids.forEach((id,i)=>{const item=images.find(x=>x.id===id);if(item)item.sort_order=(i+1)*10;});
          return {data:args.p_image_ids.length,error:null};
        }
        if(name==='move_gallery_images'){
          args.p_image_ids.forEach((id,i)=>{const item=images.find(x=>x.id===id);if(item){item.album_id=args.p_target_album_id;item.sort_order=(i+1)*10;}});
          return {data:args.p_image_ids.length,error:null};
        }
        return {data:null,error:{message:'unsupported mock rpc'}};
      }
    })};
    window.__mockGalleryImages=images;
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/admin',{waitUntil:'load'});
  await page.waitForSelector('#cmsView:not(.hidden)',{timeout:12000});
  await page.locator('[data-tab="album"]').click();
  await page.locator('[data-album-mode="bulk"]').click();
  assert.equal(await page.locator('#bulkUploadPanel').isVisible(),true);
  const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFklEQVR4nGN8Nm3afwYkwMSABggLAADKCAMZxpQtEgAAAABJRU5ErkJggg==','base64');
  await page.locator('#bulkFileInput').setInputFiles([
    {name:'Photo_001.png',mimeType:'image/png',buffer:pixel},
    {name:'Photo_002.png',mimeType:'image/png',buffer:pixel}
  ]);
  await page.waitForSelector('.bulk-photo-card:nth-child(2)');
  await page.locator('#bulkStartBtn').click();
  await page.waitForFunction(()=>document.getElementById('bulkStatus').textContent.includes('Đã upload'),null,{timeout:35000});
  assert.match(await page.locator('#bulkStatus').innerText(),/2\/2 ảnh/);
  assert.equal(await page.evaluate(()=>window.__mockGalleryImages.length),2);
  assert.equal(await page.evaluate(()=>window.__mockGalleryImages.every(x=>!x.is_published&&!x.show_on_homepage)),true);
  await page.locator('[data-album-mode="sort"]').click();
  await page.waitForSelector('.sort-photo-card:nth-child(2)');
  await page.locator('.sort-photo-card:first-child [data-down]').click();
  assert.equal(await page.locator('#sortSaveBtn').isEnabled(),true);
  await page.locator('#sortSaveBtn').click();
  await page.waitForFunction(()=>document.getElementById('sortStatus').textContent.includes('Đã lưu'));
  const ordered=await page.evaluate(()=>[...window.__mockGalleryImages].sort((a,b)=>a.sort_order-b.sort_order).map(x=>x.title));
  assert.deepEqual(ordered,['Photo_002','Photo_001']);
  await page.locator('#bulkLibrarySelectAll').check();
  await page.locator('#bulkLibraryAction').selectOption('publish');
  await page.locator('#bulkLibraryApply').click();
  await page.waitForFunction(()=>document.getElementById('bulkLibraryStatus').textContent.includes('thành công'));
  assert.equal(await page.evaluate(()=>window.__mockGalleryImages.every(x=>x.is_published)),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: upload, draft defaults, photo order, save RPC, bulk publish, no JS errors');
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
