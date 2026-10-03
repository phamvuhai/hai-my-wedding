(() => {
  const A=window.AdminApp, db=A.db;
  const authView=document.getElementById('authView'), cmsView=document.getElementById('cmsView'), status=document.getElementById('authStatus');
  if(!db){A.setStatus(status,'Thiếu cấu hình Supabase.','error');return;}
  async function allowed(){const {data:{user}}=await db.auth.getUser();return user&&user.email?.toLowerCase()===A.ADMIN_EMAIL.toLowerCase();}
  async function boot(){
    if(!(await allowed())){authView.classList.remove('hidden');cmsView.classList.add('hidden');return;}
    const {data:{user}}=await db.auth.getUser();document.getElementById('userEmail').textContent=user.email;
    authView.classList.add('hidden');cmsView.classList.remove('hidden');
    try{await A.loadData();}catch(e){A.setStatus(document.getElementById('uploadStatus'),e.message,'error');}
  }
  document.getElementById('authForm').addEventListener('submit',async e=>{
    e.preventDefault();const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
    if(email.toLowerCase()!==A.ADMIN_EMAIL.toLowerCase()){A.setStatus(status,'Email này không có quyền admin.','error');return;}
    A.setStatus(status,'Đang đăng nhập...');const {error}=await db.auth.signInWithPassword({email,password});
    if(error){A.setStatus(status,error.message,'error');return;}await boot();
  });
  document.getElementById('signupBtn').onclick=async()=>{
    const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
    if(email.toLowerCase()!==A.ADMIN_EMAIL.toLowerCase()){A.setStatus(status,'Chỉ email quản trị đã whitelist mới có thể đăng ký.','error');return;}
    if(password.length<8){A.setStatus(status,'Mật khẩu cần ít nhất 8 ký tự.','error');return;}
    A.setStatus(status,'Đang tạo tài khoản...');
    const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/admin/'}});
    if(error){A.setStatus(status,error.message,'error');return;}
    if(data.session){A.setStatus(status,'Tạo tài khoản thành công.','success');await boot();}
    else A.setStatus(status,'Đã gửi email xác nhận. Xác nhận email rồi quay lại đăng nhập.','success');
  };
  document.getElementById('logoutBtn').onclick=async()=>{await db.auth.signOut();location.reload();};
  document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===btn));
    const tab=btn.dataset.tab;document.getElementById('albumTab').classList.toggle('hidden',tab!=='album');document.getElementById('rsvpTab').classList.toggle('hidden',tab!=='rsvp');document.getElementById('pageTitle').textContent=tab==='album'?'Album':'RSVP';if(tab==='rsvp')document.dispatchEvent(new Event('admin:rsvp'));
  });
  db.auth.onAuthStateChange((_e,s)=>{if(!s){authView.classList.remove('hidden');cmsView.classList.add('hidden')}});boot();
})();