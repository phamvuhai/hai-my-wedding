(() => {
  'use strict';
  const cfg = window.WEDDING_CONFIG || {};
  const ADMIN_EMAIL = 'phamvuhai23@gmail.com';
  const form = document.getElementById('resetForm');
  const status = document.getElementById('resetStatus');
  const subtitle = document.querySelector('.login-card .subtitle');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const saveButton = document.getElementById('savePassword');
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  const hasCode = query.has('code');
  const hasTokenHash = query.get('type') === 'recovery' && query.has('token_hash');
  const hasImplicitTokens = fragment.get('type') === 'recovery'
    && fragment.has('access_token') && fragment.has('refresh_token');
  const hasError = query.has('error') || query.has('error_code') || fragment.has('error');
  let validated = false;

  function setStatus(message, type = '') {
    status.textContent = message;
    status.className = 'status ' + type;
  }
  function invalidLink(message) {
    form.classList.add('hidden');
    subtitle.textContent = 'Không thể xác thực yêu cầu đặt lại mật khẩu.';
    setStatus(message || 'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu email mới tại trang đăng nhập Admin.', 'error');
  }

  // Remove password recovery credentials from browser history before any async work.
  if (location.search || location.hash) {
    history.replaceState(history.state, '', '/admin/reset-password/');
  }
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    invalidLink('Thiếu cấu hình xác thực. Vui lòng liên hệ quản trị viên.');
    return;
  }

  // Explicitly validate the one-time recovery credentials. A previously
  // authenticated Admin session alone must NEVER unlock this form.
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { detectSessionInUrl: false }
  });

  const toggle = document.getElementById('toggleNewPassword');
  toggle.addEventListener('click', () => {
    const visible = newPassword.type === 'password';
    newPassword.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Ẩn' : 'Hiện';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validated) {
      invalidLink();
      return;
    }
    if (newPassword.value.length < 8) {
      setStatus('Mật khẩu mới phải có ít nhất 8 ký tự.', 'error');
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      setStatus('Hai mật khẩu không khớp.', 'error');
      return;
    }

    saveButton.disabled = true;
    setStatus('Đang cập nhật mật khẩu...');
    try {
      const { data, error: userError } = await db.auth.getUser();
      if (userError || data?.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        invalidLink();
        return;
      }
      const { error } = await db.auth.updateUser({ password: newPassword.value });
      if (error) {
        setStatus('Không thể cập nhật mật khẩu. Vui lòng yêu cầu lại liên kết nếu liên kết đã hết hạn.', 'error');
        return;
      }
      validated = false;
      newPassword.value = '';
      confirmPassword.value = '';
      setStatus('Đã cập nhật mật khẩu thành công.', 'success');
      await db.auth.signOut();
      location.replace('/admin/login/?reset=success');
    } catch {
      setStatus('Có lỗi khi cập nhật mật khẩu. Vui lòng thử lại.', 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  async function verifyRecovery() {
    if (hasError) {
      invalidLink('Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu email mới.');
      return;
    }
    if (!hasCode && !hasTokenHash && !hasImplicitTokens) {
      invalidLink('Trang này chỉ hoạt động khi mở từ liên kết đặt lại mật khẩu trong email quản trị.');
      return;
    }

    setStatus('Đang xác thực liên kết...');
    try {
      let result;
      if (hasCode) {
        result = await db.auth.exchangeCodeForSession(query.get('code'));
      } else if (hasTokenHash) {
        result = await db.auth.verifyOtp({
          token_hash: query.get('token_hash'), type: 'recovery'
        });
      } else {
        result = await db.auth.setSession({
          access_token: fragment.get('access_token'),
          refresh_token: fragment.get('refresh_token')
        });
      }
      if (result?.error) {
        invalidLink();
        return;
      }
      const { data, error } = await db.auth.getUser();
      if (error || data?.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        invalidLink('Liên kết này không thuộc tài khoản quản trị. Vui lòng yêu cầu lại bằng email Admin.');
        return;
      }
      validated = true;
      subtitle.textContent = 'Tạo mật khẩu mới cho tài khoản quản trị Hải & Mỹ.';
      form.classList.remove('hidden');
      setStatus('Liên kết hợp lệ. Vui lòng nhập mật khẩu mới.', 'success');
      newPassword.focus();
    } catch {
      invalidLink();
    }
  }
  verifyRecovery();
})();