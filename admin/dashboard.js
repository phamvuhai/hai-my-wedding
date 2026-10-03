(() => {
  const A = window.AdminApp;
  const db = A?.db;
  const statsEl = document.getElementById('dashboardStats');
  const recentEl = document.getElementById('recentRsvp');

  document.addEventListener('admin:overview', loadOverview);

  async function loadOverview() {
    if (!db || !statsEl || !recentEl) return;

    const published = (A.images || []).filter((img) => img.is_published).length;

    const { data: rsvps, error } = await db
      .from('rsvp')
      .select('guest_name,attendance,guest_count,event_choice,created_at')
      .order('created_at', { ascending: false });

    const list = error ? [] : (rsvps || []);
    const yes = list.filter((r) => r.attendance === 'yes');
    const totalGuests = yes.reduce((sum, r) => sum + Number(r.guest_count || 0), 0);

    statsEl.innerHTML =
      '<div class="stat"><span>RSVP</span><strong>' + list.length + '</strong></div>' +
      '<div class="stat"><span>Tham dự</span><strong>' + yes.length + '</strong></div>' +
      '<div class="stat"><span>Tổng khách</span><strong>' + totalGuests + '</strong></div>' +
      '<div class="stat"><span>Ảnh đã publish</span><strong>' + published + '</strong></div>';

    const recent = list.slice(0, 5);
    recentEl.innerHTML = recent.length
      ? recent.map((r) => {
          const attendance = r.attendance === 'yes' ? 'Có tham dự' : r.attendance === 'no' ? 'Không tham dự' : 'Chưa chắc';
          const eventName = r.event_choice === 'bride' ? 'Nhà gái' : r.event_choice === 'groom' ? 'Nhà trai' : 'Cả hai';
          return '<article class="recent-item">' +
            '<div class="recent-head"><strong>' + A.esc(r.guest_name || 'Khách') + '</strong><span>' + attendance + '</span></div>' +
            '<small>' + eventName + ' · ' + Number(r.guest_count || 0) + ' người · ' + new Date(r.created_at).toLocaleDateString('vi-VN') + '</small>' +
            '</article>';
        }).join('')
      : '<p class="muted">Chưa có phản hồi RSVP.</p>';
  }
})();