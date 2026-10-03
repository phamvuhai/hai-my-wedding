(() => {
  const cfg = window.WEDDING_CONFIG || {};
  const ADMIN_EMAIL = 'phamvuhai23@gmail.com';
  const status = document.getElementById('status');
  const resetStatus = document.getElementById('resetStatus');
  const loginForm = document.getElementById('loginForm');
  const resetForm = document.getElementById('resetForm');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const params = new URLSearchParams(location.search);

  let authFlowActive =
    params.get('setup') === '1' ||
    params.has('code') ||
    location.hash.includes('type=recovery') ||
    location.hash.includes('access_token=');

  function setStatus(el, message, type = '') {
    if (!el) return;
    el.textContent = message;
    el.className = 'status ' + type;
  }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    setStatus(status, 'Thiếu cấu hình đăng nhập.', 'error');
    return;
  }

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  function isAdmin(email = '') {
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  function toggle(input, button) {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Ẩn' : 'Hiện';
  }

  function showResetMode() {
    authFlowActive = true;
    loginForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Đặt mật khẩu mới';
    document.getElementById('formSubtitle').textContent = 'Nhập mật khẩu mới cho tài khoản quản trị.';
  }

  document.getElementById('togglePassword').onclick = () =>
    toggle(passwordEl, document.getElementById('togglePassword'));

  document.getElementById('toggleNewPassword').onclick = () =>
    toggle(document.getElementById('newPassword'), document.getElementById('toggleNewPassword'));

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if (!isAdmin(email)) {
      setStatus(status, 'Email này không có quyền quản trị.', 'error');
      return;
    }

    setStatus(status, 'Đang đăng nhập...');
    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      const message = /invalid login credentials/i.test(error.message)
        ? 'Email hoặc mật khẩu chưa đúng. Nếu đây là lần đầu sử dụng Admin, chọn “Thiết lập tài khoản lần đầu”.'
        : error.message;
      setStatus(status, message, 'error');
      return;
    }

    setStatus(status, 'Đăng nhập thành công.', 'success');
    location.replace('/admin/');
  });

  document.getElementById('forgotBtn').addEventListener('click', async () => {
    const email = emailEl.value.trim() || ADMIN_EMAIL;

    if (!isAdmin(email)) {
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

    setStatus(status, 'Đã gửi email đặt lại mật khẩu. Hãy mở liên kết trong email.', 'success');
  });

  document.getElementById('setupBtn').addEventListener('click', async () => {
    const email = emailEl.value.trim() || ADMIN_EMAIL;

    if (!isAdmin(email)) {
      setStatus(status, 'Nhập đúng email quản trị trước.', 'error');
      return;
    }

    setStatus(status, 'Đang gửi liên kết thiết lập tài khoản...');
    const { error } = await db.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: location.origin + '/admin/login/?setup=1'
      }
    });

    if (error) {
      setStatus(status, error.message, 'error');
      return;
    }

    setStatus(status, 'Đã gửi email thiết lập. Mở liên kết trong email, sau đó đặt mật khẩu mới.', 'success');
  });

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      showResetMode();
      return;
    }

    if (event === 'SIGNED_IN' && params.get('setup') === '1') {
      if (isAdmin(session?.user?.email || '')) {
        showResetMode();
      } else if (session) {
        await db.auth.signOut();
      }
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

    const { data: userData } = await db.auth.getUser();
    if (!isAdmin(userData?.user?.email || '')) {
      setStatus(resetStatus, 'Phiên thiết lập không hợp lệ. Vui lòng mở lại liên kết từ email quản trị.', 'error');
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

  async function redirectIfLoggedIn() {
    if (authFlowActive) return;

    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    if (isAdmin(session.user?.email || '')) {
      location.replace('/admin/');
    } else {
      await db.auth.signOut();
    }
  }

  setTimeout(redirectIfLoggedIn, 350);
})();