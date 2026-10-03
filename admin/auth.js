(() => {
  const A = window.AdminApp;
  const db = A?.db;
  if (!db) {
    location.replace('/admin/login/');
    return;
  }

  async function guard() {
    const { data: { session } } = await db.auth.getSession();
    const user = session?.user;

    if (!user || user.email?.toLowerCase() !== A.ADMIN_EMAIL.toLowerCase()) {
      if (session) await db.auth.signOut();
      location.replace('/admin/login/');
      return false;
    }

    document.getElementById('userEmail').textContent = user.email || '';
    try {
      await A.loadData();
      document.dispatchEvent(new Event('admin:overview'));
    } catch (error) {
      const el = document.getElementById('uploadStatus');
      if (el) A.setStatus(el, error.message, 'error');
    }
    return true;
  }

  function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });
    document.getElementById('overviewTab').classList.toggle('hidden', tab !== 'overview');
    document.getElementById('rsvpTab').classList.toggle('hidden', tab !== 'rsvp');
    document.getElementById('albumTab').classList.toggle('hidden', tab !== 'album');
    document.getElementById('pageTitle').textContent =
      tab === 'overview' ? 'Tổng quan' : tab === 'rsvp' ? 'RSVP' : 'Album';

    if (tab === 'overview') document.dispatchEvent(new Event('admin:overview'));
    if (tab === 'rsvp') document.dispatchEvent(new Event('admin:rsvp'));
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.go));
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await db.auth.signOut();
    location.replace('/admin/login/');
  });

  db.auth.onAuthStateChange((_event, session) => {
    if (!session) location.replace('/admin/login/');
  });

  guard();
})();