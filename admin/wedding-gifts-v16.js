/* V16 Wedding gift Admin — independent public settings for groom and bride.
   Stores structured JSON in existing site_content key (RLS: site owner only).
   QR files use wedding-gallery/wedding-gifts/ and never appear in the Album. */
(()=>{
 'use strict';
 const A=window.AdminApp,db=A?.db,$=id=>document.getElementById(id);
 if(!$('giftSave'))return;
 const KEY='wedding_gifts_v1';
 const defaults={enabled:true,visibility:'public',
  groom:{enabled:true,bank:'TPBank',holder:'PHAM VU HAI',account:'04480062888',qrPath:'',qrAccount:''},
  bride:{enabled:false,bank:'',holder:'NGUYEN THI MY',account:'',qrPath:'',qrAccount:''}};
 let cfg=JSON.parse(JSON.stringify(defaults)),pendingUploads=0,loaded=false;
 const formKeys=['giftEnabled','giftVisibility','giftGroomEnabled','giftGroomBank','giftGroomHolder','giftGroomAccount','giftBrideEnabled','giftBrideBank','giftBrideHolder','giftBrideAccount'];
 const status=(message,type='')=>A.setStatus($('giftSaveStatus'),message,type);
 const escapeString=s=>String(s||'').trim();
 function setForm(){
  $('giftEnabled').checked=cfg.enabled!==false;
  $('giftVisibility').value=cfg.visibility==='private'?'private':'public';
  for(const id of ['Groom','Bride']){
   const obj=cfg[id.toLowerCase()];
   $('gift'+id+'Enabled').checked=obj.enabled===true;
   for(const [id2,prop] of [['Bank','bank'],['Holder','holder'],['Account','account']])
    $('gift'+id+id2).value=obj[prop]||'';
   preview(id);
  }
 }
 function preview(id){
  const side=cfg[id.toLowerCase()],img=$('gift'+id+'QrPreview'),note=$('gift'+id+'QrNote');
  if(side.qrPath){
   img.src=A.publicUrl(side.qrPath);img.hidden=false;note.hidden=true;
  }else{img.hidden=true;img.removeAttribute('src');note.hidden=false;}
 }
 function updateConfig(){
  cfg.enabled=$('giftEnabled').checked;
  cfg.visibility=$('giftVisibility').value==='private'?'private':'public';
  for(const id of ['Groom','Bride']){
   const side=cfg[id.toLowerCase()];
   side.enabled=$('gift'+id+'Enabled').checked;
   for(const [part,key]of [['Bank','bank'],['Holder','holder'],['Account','account']])
    side[key]=escapeString($('gift'+id+part).value);
  }
 }
 async function load(){
  if(!db||loaded)return;
  const {data,error}=await db.from('site_content').select('value_vi').eq('key',KEY).maybeSingle();
  if(error){status('Không tải được cài đặt: '+error.message,'error');return}
  if(data?.value_vi){
   try{
    const parsed=JSON.parse(data.value_vi);
    cfg={...defaults,...parsed,
     groom:{...defaults.groom,...parsed.groom},
     bride:{...defaults.bride,...parsed.bride}};
   }catch(err){status('Cấu hình chưa hợp lệ: '+err.message,'error');return}
  }
  loaded=true;setForm();
 }
 async function upload(id,file){
  if(!file)return;
  const msg=$('gift'+id+'QrStatus'),input=$('gift'+id+'QrFile');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024){
   msg.textContent='QR phải là PNG/JPG/WebP và dưới 3 MB.';input.value='';return;
  }
  if(!db){msg.textContent='Chưa kết nối Supabase.';return;}
  pendingUploads++;$('giftSave').disabled=true;
  msg.textContent='Đang upload mã QR...';
  try{
   const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path='wedding-gifts/'+id.toLowerCase()+'-'+crypto.randomUUID()+'.'+ext;
   const {error}=await db.storage.from('wedding-gallery').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'31536000'});
   if(error)throw error;
   cfg[id.toLowerCase()].qrPath=path;
   cfg[id.toLowerCase()].qrAccount=escapeString($('gift'+id+'Account').value).replace(/[\s-]/g,'');
   preview(id);
   msg.textContent='Đã upload QR. Nhấn Lưu & Công bố để áp dụng lên website.';
   status('QR đã upload nhưng chưa được công bố.');
  }catch(err){msg.textContent='Upload thất bại: '+err.message;status('Không thể upload QR: '+err.message,'error')}
  finally{pendingUploads--;$('giftSave').disabled=pendingUploads>0;input.value='';}
 }
 for(const id of ['Groom','Bride'])$('gift'+id+'QrFile').addEventListener('change',e=>upload(id,e.target.files?.[0]));
 $('giftSave').addEventListener('click',async()=>{
  if(pendingUploads>0){status('Vui lòng hoàn tất upload QR trước khi lưu.','error');return}
  updateConfig();
  for(const side of ['groom','bride']){
   const item=cfg[side];
   if(item.enabled&&(!item.bank||!item.holder||!item.account)){
    status('Thiếu thông tin ngân hàng của '+(side==='groom'?'Nhà trai':'Nhà gái')+'.','error');return;
   }
   if(item.enabled && item.qrPath && item.qrAccount!==item.account.replace(/[\s-]/g,'')){
    status('Số tài khoản đã thay đổi sau khi upload QR. Vui lòng upload QR mới cho '+(side==='groom'?'Nhà trai':'Nhà gái')+'.','error');return;
   }
   if(item.account&&!/^[0-9\s-]{5,45}$/.test(item.account)){
    status('Số tài khoản chỉ được chứa chữ số, khoảng trắng hoặc dấu gạch ngang.','error');return;
   }
  }
  if(cfg.groom.enabled&&cfg.groom.account.replace(/[\s-]/g,'')!=='04480062888'&&!cfg.groom.qrPath){
   status('Số tài khoản Nhà trai đã thay đổi. Hãy upload QR mới để tránh mã QR trỏ đến tài khoản cũ.','error');return;
  }
  $('giftSave').disabled=true;status('Đang lưu & công bố...');
  try{
   const {error}=await db.from('site_content').upsert({
     key:KEY,value_vi:JSON.stringify(cfg),value_en:null,value_ja:null,updated_at:new Date().toISOString()
   },{onConflict:'key'});
   if(error)throw error;
   status('Đã công bố! Tải lại website để xem thay đổi.','success');
   document.dispatchEvent(new CustomEvent('admin:gift-settings',{detail:{enabled:cfg.enabled,visibility:cfg.visibility}}));
  }catch(err){status('Không lưu được: '+err.message,'error')}
  finally{$('giftSave').disabled=false}
 });
 document.addEventListener('admin:v3',load);
 load();
})();