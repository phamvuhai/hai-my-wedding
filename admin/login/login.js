(() => {
  const cfg = window.WEDDING_CONFIG || {};
  const ADMIN_EMAIL = 'phamvuhai23@gmail.com';
  const status = document.getElementById('status');
  const resetStatus = document.getElementById('resetStatus');
  const loginForm = document.getElementById('loginForm');
  const resetForm = document.getElementById('resetForm');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    setStatus(status, 'Thiếu cấu hình đăng nhập.', 'error');
    return;
  }

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  function setStatus(el, message, type = '') {
    el.textContent = message;
    el.className = 'status ' + type;
  }

  function toggle(input, button) {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Ẩn' : 'Hiện';
  }

  document.getElementById('togglePassword').onclick = () =>
    toggle(passwordEl, document.getElementById('togglePassword'));
  document.getElementById('toggleNewPassword').onclick = () =>
    toggle(document.getElementById('newPassword'), document.getElementById('toggleNewPassword'));

  async function redirectIfLoggedIn() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      location.replace('/admin/');
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setStatus(status, 'Email này không có quyền quản trị.', 'error');
      return;
    }

    setStatus(status, 'Đang đăng nhập...');
    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      const message = /invalid login credentials/i.test(error.message)
        ? 'Email hoặc mật khẩu chưa đúng. Nếu chưa từng đặt mật khẩu, chọn “Quên mật khẩu?”.'
        : error.message;
      setStatus(status, message, 'error');
      return;
    }

    setStatus(status, 'Đăng nhập thành công.', 'success');
    location.replace('/admin/');
  });

  document.getElementById('forgotBtn').addEventListener('click', async () => {
    const email = emailEl.value.trim() || ADMIN_EMAIL;
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setStatus(status, 'Nhập đúng email quản trị trước.', 'error');
      return;
    }

    setStatus(status, 'Đang gửi email đặt lại mật khẩu...');
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + '/admin/login/'
    });

    if (error) {
      setStatus(status, error.message, 'error');
      return;
    }
    setStatus(status, 'Đã gửi email. Mở liên kết trong email để đặt mật khẩu mới.', 'success');
  });

  db.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      loginForm.classList.add('hidden');
      resetForm.classList.remove('hidden');
      document.getElementById('formTitle').textContent = 'Đặt mật khẩu mới';
      document.getElementById('formSubtitle').textContent = 'Nhập mật khẩu mới cho tài khoản quản trị.';
    }
  });

  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password.length < 8) {
      setStatus(resetStatus, 'Mật khẩu cần ít nhất 8 ký tự.', 'error');
      return;
    }
    if (password !== confirm) {
      setStatus(resetStatus, 'Hai mật khẩu chưa khớp.', 'error');
      return;
    }

    setStatus(resetStatus, 'Đang lưu mật khẩu mới...');
    const { error } = await db.auth.updateUser({ password });
    if (error) {
      setStatus(resetStatus, error.message, 'error');
      return;
    }

    setStatus(resetStatus, 'Đổi mật khẩu thành công. Đang vào Admin...', 'success');
    location.replace('/admin/');
  });

  redirectIfLoggedIn();
})();