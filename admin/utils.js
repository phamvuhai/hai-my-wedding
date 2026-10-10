/* Reusable admin helpers: exports, guest lookups, image encoding and gallery edits. */
(() => {
  const A = window.AdminApp;
  if (!A) return;
  const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const csvText=(headers,rows,lineEnding='\r\n')=>
    '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join(lineEnding);
  function downloadCsv(filename,headers,rows,lineEnding='\r\n') {
    const url=URL.createObjectURL(new Blob([csvText(headers,rows,lineEnding)],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function latestRsvpByInvite(rows=[]) {
    const map=new Map();
    [...rows].filter(r=>r.invite_id)
      .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
      .forEach(r=>{if(!map.has(r.invite_id))map.set(r.invite_id,r);});
    return map;
  }
  async function optimizeWebp({plans,render,targetBytes,limitBytes,label}) {
    let best=null;
    for(const [maxSize,quality] of plans) {
      const canvas=render(maxSize);
      const width=canvas.width,height=canvas.height;
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
      canvas.width=1;canvas.height=1;
      if(!blob)continue;
      const candidate={blob,width,height,maxSize,quality};
      if(!best||blob.size<best.blob.size)best=candidate;
      if(blob.size<=targetBytes)return candidate;
    }
    if(best&&best.blob.size<=limitBytes)return best;
    const mb=(Number(best?.blob?.size||0)/(1024*1024)).toFixed(2);
    throw new Error('Ảnh '+label+' sau khi tối ưu vẫn quá lớn ('+mb+' MB). Giới hạn upload là '+Math.round(limitBytes/(1024*1024))+' MB.');
  }
  async function patchGalleryImage(id,values) {
    const {error}=await A.db.from('gallery_images').update(values).eq('id',id);
    if(error){alert(error.message);return false;}
    await A.loadData();
    return true;
  }
  A.utils=Object.freeze({
    csvCell,csvText,downloadCsv,latestRsvpByInvite,optimizeWebp,patchGalleryImage,
    normalizeText(value='') {return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');},
    normalizePhone(value='') {return String(value).replace(/[^0-9+]/g,'').trim();},
    eventLabel(value) {return value==='bride'?'Nhà gái':value==='groom'?'Nhà trai':'Cả hai';}
  });
})();