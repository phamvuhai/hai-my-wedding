(() => {
  const A = window.AdminApp;
  const db = A.db;
  const authView = document.getElementById('authView');
  const cmsView = document.getElementById('cmsView');
  const status = document.getElementById('authStatus');

  if (!db) {
    A.setStatus(status, 'Thiếu cấu hình Supabase.', 'error');
    return;
  }

  async function allowed() {
    const { data: { user } } = await db.auth.getUser();
    return user && user.email?.toLowerCase() === A.ADMIN_EMAIL.toLowerCase();
  }

  async function boot() {
    if (!(await allowed())) {
      authView.classList.remove('hidden');
      cmsView.classList.add('hidden');
      return;
    }
    const { data: { user } } = await db.auth.getUser();
    document.getElementById('userEmail').textContent = user.email;
    authView.classList.add('hidden');
    cmsView.classList.remove('hidden');
    try {
      await A.loadData();
      renderOverview();
    } catch (e) {
      const el = document.getElementById('uploadStatus');
      if (el) A.setStatus(el, e.message, 'error');
    }
  }

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    if (email.toLowerCase() !== A.ADMIN_EMAIL.toLowerCase()) {
      A.setStatus(status, 'Email này không có quyền admin.', 'error');
      return;
    }

    A.setStatus(status, 'Đang gửi liên kết đăng nhập...');
    const { error } = await db.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: location.origin + '/admin/',
        shouldCreateUser: true
      }
    });

    if (error) {
      A.setStatus(status, error.message, 'error');
      return;
    }

    A.setStatus(status, 'Đã gửi liên kết đăng nhập. Hãy mở email và bấm vào liên kết để vào Admin.', 'success');
  });

  function renderOverview() {
    const stats = document.getElementById('dashboardStats');
    const recent = document.getElementById('recentRsvp');
    if (stats) {
      const published = (A.images || []).filter((x) => x.is_published).length;
      stats.innerHTML =
        '<div class="stat"><span>Album</span><strong>' + (A.albums || []).length + '</strong></div>' +
        '<div class="stat"><span>Tổng ảnh</span><strong>' + (A.images || []).length + '</strong></div>' +
        '<div class="stat"><span>Đã publish</span><strong>' + published + '</strong></div>' +
        '<div class="stat"><span>Bản nháp</span><strong>' + ((A.images || []).length - published) + '</strong></div>';
    }
    if (recent) recent.innerHTML = '<p class="muted">Mở tab RSVP để xem phản hồi khách mời chi tiết.</p>';
  }

  document.getElementById('logoutBtn').onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
    document.getElementById('overviewTab').classList.toggle('hidden', tab !== 'overview');
    document.getElementById('albumTab').classList.toggle('hidden', tab !== 'album');
    document.getElementById('rsvpTab').classList.toggle('hidden', tab !== 'rsvp');
    document.getElementById('pageTitle').textContent = tab === 'overview' ? 'Tổng quan' : tab === 'album' ? 'Album' : 'RSVP';
    if (tab === 'overview') renderOverview();
    if (tab === 'rsvp') document.dispatchEvent(new Event('admin:rsvp'));
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  db.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      authView.classList.remove('hidden');
      cmsView.classList.add('hidden');
    }
  });

  boot();
})();