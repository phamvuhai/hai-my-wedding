/* Admin-only migration utility for legacy gallery images (Supabase Free).
   No processing runs until an authenticated admin clicks the button. */
(() => {
  'use strict';
  const A=window.AdminApp,P=window.AdminPhotoProcessor,db=A?.db;
  const btn=document.getElementById('adaptiveBackfillBtn');
  const stopBtn=document.getElementById('adaptiveBackfillStop');
  const label=document.getElementById('adaptiveBackfillCount');
  const status=document.getElementById('adaptiveBackfillStatus');
  const bar=document.getElementById('adaptiveBackfillProgress');
  if(!db||!P||!btn||!label||!bar)return;
  let active=false,stop=false;
  const pending=()=>A.images.filter(img=>img.image_path && Number(img.width||0)>320 && !img.image_variants?.['320']);

  function render(){
    const total=pending().length;
    label.textContent=total
      ? total+' ảnh chưa có bản xem trước 320px'
      : 'Mọi ảnh đã có metadata adaptive (hoặc chưa có ảnh)';
    btn.disabled=active||!total;
    stopBtn.disabled=!active;
    if(!active)bar.style.width='0%';
  }
  async function verify(){
    const {data,error}=await db.auth.getUser();
    if(error||data?.user?.email?.toLowerCase()!==A.ADMIN_EMAIL.toLowerCase()){
      throw new Error('Phiên Admin hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  async function run(){
    if(active)return;
    try{await verify();}catch(e){A.setStatus(status,e.message,'error');return;}
    const items=pending();
    if(!items.length)return render();
    if(!confirm('Bổ sung bản xem nhanh 320px cho '+items.length+' ảnh?\n\nGiữ nguyên bản 480/960/1440px, ảnh gốc và mọi thiết lập Album/Publish.'))return;
    active=true;stop=false;render();
    const errors=[];
    let done=0;
    try {
      const storage=db.storage.from('wedding-gallery');
      for(const img of items){
        if(stop)break;
        A.setStatus(status,'Đang xử lý '+(done+1)+'/'+items.length+': '+(img.title||img.image_path));
        let newPaths={};
        try{
          const existing=img.image_variants||{};
          const sourcePath=existing['480']||img.image_path;
          const sourceWidth=existing['480']?480:img.width;
          const response=await storage.download(sourcePath);
          if(response.error || !response.data)throw response.error || new Error('Không tải được ảnh public.');
          newPaths=await P.uploadResponsiveVariants(db,response.data,img.image_path,sourceWidth,{strict:true});
          if(!Object.keys(newPaths).length)throw new Error('Không tạo được bản 320px.');
          const stored={...existing,...newPaths};
          const {data,error}=await db.from('gallery_images').update({image_variants:stored})
            .eq('id',img.id).select('id').single();
          if(error||data?.id!==img.id)throw error || new Error('Không thể cập nhật metadata.');
          img.image_variants=stored;
        }catch(error){
          if(Object.keys(newPaths).length){
            const cleanup=await storage.remove(P.variantPaths(newPaths));
            if(cleanup.error)console.warn('Legacy variant cleanup failed',cleanup.error);
          }
          errors.push((img.title||img.id)+': '+(error?.message||'Lỗi chưa xác định'));
        }
        done++;
        bar.style.width=Math.round(done/items.length*100)+'%';
      }
      await A.loadData();
      const succeeded=done-errors.length;
      const suffix=stop?' Đã tạm dừng. Có thể tiếp tục sau.':'';
      A.setStatus(status,'Hoàn tất: '+succeeded+' thành công, '+errors.length+' lỗi / '+done+' ảnh đã xử lý.'+suffix+(errors.length?' '+errors.slice(0,3).join(' · '):''),errors.length?'error':'success');
    }catch(error){A.setStatus(status,'Không thể cập nhật thư viện: '+error.message,'error');}
    finally{active=false;stop=false;render();}
  }
  btn.addEventListener('click',run);
  stopBtn.addEventListener('click',()=>{stop=true;stopBtn.disabled=true;});
  document.addEventListener('admin:data',render);
  render();
})();