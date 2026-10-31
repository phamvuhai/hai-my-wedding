(() => {
  const cfg = window.WEDDING_CONFIG || {};
  const ADMIN_EMAIL = 'phamvuhai23@gmail.com';
  const status = document.getElementById('status');
  const loginForm = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const params = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));

  // Backward compatibility with password recovery emails issued before the
  // dedicated reset page existed. Preserve the token and validation errors.
  if (params.has('code') || params.has('token_hash') ||
      params.has('error') || params.has('error_code') ||
      fragment.get('type') === 'recovery' || fragment.has('access_token') ||
      fragment.has('error')) {
    location.replace('/admin/reset-password/' + location.search + location.hash);
    return;
  }

  function setStatus(message, type = '') {
    status.textContent = message;
    status.className = 'status ' + type;
  }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    setStatus('Thiếu cấu hình đăng nhập.', 'error');
    return;
  }

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const isAdmin = email => String(email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (params.get('reset') === 'success') {
    setStatus('Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.', 'success');
  }
  const toggle = document.getElementById('togglePassword');
  toggle.addEventListener('click', () => {
    const visible = passwordEl.type === 'password';
    passwordEl.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Ẩn' : 'Hiện';
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailEl.value.trim();
    if (!isAdmin(email)) {
      setStatus('Email này không có quyền quản trị.', 'error');
      return;
    }

    setStatus('Đang đăng nhập...');
    const { error } = await db.auth.signInWithPassword({
      email, password: passwordEl.value
    });
    if (error) {
      setStatus(/invalid login credentials/i.test(error.message)
        ? 'Email hoặc mật khẩu không đúng.'
        : 'Không thể đăng nhập. Vui lòng thử lại.', 'error');
      return;
    }
    location.replace('/admin/');
  });

  document.getElementById('forgotBtn').addEventListener('click', async () => {
    const email = emailEl.value.trim() || ADMIN_EMAIL;
    if (!isAdmin(email)) {
      setStatus('Nhập đúng email quản trị trước.', 'error');
      return;
    }

    setStatus('Đang gửi email đặt lại mật khẩu...');
    // Supabase must allowlist this exact redirect URL under Auth > URL Configuration.
    const redirectTo = new URL('/admin/reset-password/', location.origin).href;
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      setStatus(/rate limit/i.test(error.message)
        ? 'Đã gửi quá nhiều email trong thời gian ngắn. Vui lòng thử lại sau.'
        : 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.', 'error');
      return;
    }
    setStatus('Nếu email quản trị tồn tại, một liên kết đặt lại mật khẩu sẽ được gửi. Hãy kiểm tra hộp thư.', 'success');
  });

  async function redirectIfLoggedIn() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;
    if (isAdmin(session.user?.email)) location.replace('/admin/');
    else await db.auth.signOut();
  }

  // Keep a successful-reset notice visible instead of navigating immediately.
  if (params.get('reset') !== 'success') setTimeout(redirectIfLoggedIn, 350);
})();