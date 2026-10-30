/* V13 section image overview (preview-only, edits remain in Design V3). */
(() => {
  const root=document.getElementById('v13SectionPreview');
  if(!root)return;
  const A=window.AdminApp;
  const slots=[
    ['Hero 01','v3Hero0'],['Hero 02','v3Hero1'],['Hero 03','v3Hero2'],
    ['Wedding Schedule','v3ScheduleImage'],['Our Promise','v3PromiseImage'],
    ['Farewell','v3FarewellImageSelect']
  ];
  const render=()=>{
    const images=A?.images||[];
    root.innerHTML=slots.map(([label,id])=>{
      const chosen=document.getElementById(id)?.value;
      const image=images.find(item=>item.id===chosen);
      const path=image?.image_path;
      const url=path?A.publicUrl(path):'';
      const status=image?(image.show_in_album===false?'Website only':'Website + Album'):'Tự động chọn';
      return '<figure class="v13-section-card">'+
        (url?'<img loading="lazy" src="'+A.esc(url)+'" alt="">':'<div class="v13-empty">Ảnh tự động</div>')+
        '<figcaption><strong>'+A.esc(label)+'</strong><span>'+A.esc(status)+'</span></figcaption></figure>';
    }).join('');
  };
  root.addEventListener('change',render);
  document.addEventListener('admin:data',render);
  document.addEventListener('admin:v3',()=>setTimeout(render,100));
  ['v3Hero0','v3Hero1','v3Hero2','v3ScheduleImage','v3PromiseImage','v3FarewellImageSelect']
    .forEach(id=>document.getElementById(id)?.addEventListener('change',render));
  setTimeout(render,150);
})();