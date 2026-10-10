import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../admin/utils.js',import.meta.url),'utf8');
function boot({updateError=null}={}) {
  const downloads=[],patches=[],alerts=[];
  const A={
    db:{from:table=>({
      update:values=>({
        eq:async(key,id)=>{
          patches.push({table,values,key,id});
          return {error:updateError};
        }
      })
    })},
    loadData:async()=>{A.reloaded=(A.reloaded||0)+1;}
  };
  const context={
    window:{AdminApp:A},
    document:{createElement:()=>({
      href:'',download:'',click(){downloads.push({filename:this.download,url:this.href});}
    })},
    URL:{
      createObjectURL:blob=>{context.lastBlob=blob;return 'blob:mock';},
      revokeObjectURL:()=>{}
    },
    Blob:class {
      constructor(parts,opts){this.parts=parts;this.options=opts;}
    },
    alert:msg=>alerts.push(msg)
  };
  runInNewContext(code,context);
  return {A,context,downloads,patches,alerts};
}

test('CSV helper escapes quotes, preserves Unicode and BOM',()=>{
  const {A,context,downloads}=boot();
  A.utils.downloadCsv('guests.csv',['Tên','Ghi chú'],[['Mỹ','Bạn "VIP"']]);
  assert.equal(downloads[0].filename,'guests.csv');
  assert.equal(context.lastBlob.parts[0],'\uFEFF"Tên","Ghi chú"\r\n"Mỹ","Bạn ""VIP"""');
  assert.equal(context.lastBlob.options.type,'text/csv;charset=utf-8');
});

test('guest normalization and latest RSVP selection match legacy semantics',()=>{
  const {A}=boot();
  assert.equal(A.utils.normalizeText('  HẢI  '),'hai');
  assert.equal(A.utils.normalizePhone(' +84 (901) 234-567 '),'+84901234567');
  assert.equal(A.utils.eventLabel('bride'),'Nhà gái');
  const responses=[
    {invite_id:'g1',created_at:'2026-09-01T10:00:00Z',attendance:'no'},
    {invite_id:'g1',created_at:'2026-10-01T10:00:00Z',attendance:'yes'},
    {invite_id:'g2',created_at:'2026-09-11T10:00:00Z',attendance:'maybe'},
    {invite_id:null,created_at:'2026-10-02T10:00:00Z'}
  ];
  const byInvite=A.utils.latestRsvpByInvite(responses);
  assert.equal(byInvite.size,2);
  assert.equal(byInvite.get('g1').attendance,'yes');
  assert.equal(byInvite.get('g2').attendance,'maybe');
});

test('image optimizer picks the first target candidate and releases canvas',async()=>{
  const {A}=boot();
  const output=[];
  const render=size=>{
    const canvas={
      width:size,height:size/2,
      toBlob:resolve=>resolve({size:output.length===1?700:400})
    };
    output.push(canvas);
    return canvas;
  };
  const result=await A.utils.optimizeWebp({
    plans:[[1600,.9],[1200,.8],[1000,.7]],
    render,targetBytes:500,limitBytes:900,label:'public'
  });
  assert.equal(result.blob.size,400);
  assert.equal(result.width,1200);
  assert.equal(output.length,2);
  assert.equal(output[0].width,1);
  assert.equal(output[1].height,1);
});

test('gallery metadata patch reloads only on success',async()=>{
  const ok=boot();
  assert.equal(await ok.A.utils.patchGalleryImage('img-1',{is_published:true}),true);
  assert.equal(ok.patches[0].table,'gallery_images');
  assert.equal(ok.patches[0].key,'id');
  assert.equal(ok.A.reloaded,1);
  const bad=boot({updateError:{message:'Forbidden'}});
  assert.equal(await bad.A.utils.patchGalleryImage('img-2',{is_hero:true}),false);
  assert.equal(bad.A.reloaded,undefined);
  assert.equal(bad.alerts[0],'Forbidden');
});
