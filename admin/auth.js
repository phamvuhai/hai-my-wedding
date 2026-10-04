(() => {
  const A = window.AdminApp;
  const db = A?.db;
  const cms = document.getElementById('cmsView');

  function goLogin() {
    location.replace('/admin/login/');
  }

  if (!db) {
    goLogin();
    return;
  }

  async function guard() {
    const { data, error } = await db.auth.getUser();
    const user = data?.user;

    if (error || !user || user.email?.toLowerCase() !== A.ADMIN_EMAIL.toLowerCase()) {
      const { data: sessionData } = await db.auth.getSession();
      if (sessionData?.session) await db.auth.signOut();
      goLogin();
      return;
    }

    document.getElementById('userEmail').textContent = user.email || '';
    cms.classList.remove('hidden');

    try {
      await A.loadData();
      document.dispatchEvent(new Event('admin:overview'));
    } catch (error) {
      console.error('Admin data error:', error);
      const el = document.getElementById('uploadStatus');
      if (el) A.setStatus(el, 'Không tải được dữ liệu quản trị: ' + error.message, 'error');
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });
    document.getElementById('overviewTab').classList.toggle('hidden', tab !== 'overview');
    document.getElementById('contentTab').classList.toggle('hidden', tab !== 'content');
    document.getElementById('rsvpTab').classList.toggle('hidden', tab !== 'rsvp');
    document.getElementById('guestsTab').classList.toggle('hidden', tab !== 'guests');
    document.getElementById('albumTab').classList.toggle('hidden', tab !== 'album');
    const titles = {overview:'Tổng quan',content:'Nội dung website',rsvp:'RSVP',guests:'Khách mời',album:'Album'};
    document.getElementById('pageTitle').textContent = titles[tab] || 'Admin';

    if (tab === 'overview') document.dispatchEvent(new Event('admin:overview'));
    if (tab === 'content') document.dispatchEvent(new Event('admin:content'));
    if (tab === 'rsvp') document.dispatchEvent(new Event('admin:rsvp'));
    if (tab === 'guests') document.dispatchEvent(new Event('admin:guests'));
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.go));
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await db.auth.signOut();
    goLogin();
  });

  db.auth.onAuthStateChange(async (_event, session) => {
    const email = session?.user?.email?.toLowerCase();
    if (!session || email !== A.ADMIN_EMAIL.toLowerCase()) {
      if (session) await db.auth.signOut();
      goLogin();
    }
  });

  guard();
})();