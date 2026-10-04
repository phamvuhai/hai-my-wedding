(() => {
  const A = window.AdminApp;
  const db = A?.db;
  const listEl = document.getElementById('guestList');
  const statsEl = document.getElementById('guestStats');
  const searchEl = document.getElementById('guestSearch');
  const form = document.getElementById('guestForm');
  const formStatus = document.getElementById('guestFormStatus');

  document.addEventListener('admin:guests', load);
  searchEl?.addEventListener('input', render);

  function eventLabel(v) {
    return v === 'bride' ? 'Nhà gái' : v === 'groom' ? 'Nhà trai' : 'Cả hai';
  }

  function inviteUrl(row) {
    const lang = 'vi';
    return `${location.origin}/${lang}/invite/${row.token}`;
  }

  async function load() {
    if (!db) return;
    const { data, error } = await db.from('guest_invites').select('*').order('created_at', { ascending:false });
    if (error) {
      listEl.innerHTML = '<p class="muted">Không tải được danh sách khách.</p>';
      return;
    }
    A.guests = data || [];
    render();
  }

  function render() {
    const q = (searchEl?.value || '').trim().toLowerCase();
    const rows = (A.guests || []).filter(g => !q || `${g.guest_name} ${g.phone || ''}`.toLowerCase().includes(q));
    const active = (A.guests || []).filter(g => g.is_active).length;
    statsEl.innerHTML =
      '<div class="stat"><span>Tổng khách</span><strong>' + A.guests.length + '</strong></div>' +
      '<div class="stat"><span>Link đang hoạt động</span><strong>' + active + '</strong></div>' +
      '<div class="stat"><span>Nhà gái</span><strong>' + A.guests.filter(g=>g.event_choice==='bride').length + '</strong></div>' +
      '<div class="stat"><span>Nhà trai / cả hai</span><strong>' + A.guests.filter(g=>g.event_choice!=='bride').length + '</strong></div>';

    listEl.innerHTML = rows.length ? rows.map(g => `
      <article class="guest-card">
        <div class="guest-card-main">
          <div>
            <strong>${A.esc(g.guest_name)}</strong>
            <small>${A.esc(g.phone || 'Không có SĐT')} · ${eventLabel(g.event_choice)} · tối đa ${g.max_guests} người</small>
          </div>
          <span class="status-pill ${g.is_active ? 'yes' : 'no'}">${g.is_active ? 'Active' : 'Disabled'}</span>
        </div>
        ${g.internal_note ? '<p>' + A.esc(g.internal_note) + '</p>' : ''}
        <div class="invite-link-row">
          <input readonly value="${A.esc(inviteUrl(g))}">
          <button class="btn ghost compact" data-action="copy" data-id="${g.id}">Copy</button>
          <button class="btn ghost compact" data-action="toggle" data-id="${g.id}">${g.is_active ? 'Tắt link' : 'Bật link'}</button>
          <button class="btn ghost compact danger-text" data-action="delete" data-id="${g.id}">Xóa</button>
        </div>
      </article>
    `).join('') : '<p class="muted">Chưa có khách phù hợp.</p>';

    listEl.querySelectorAll('button[data-action]').forEach(btn => btn.onclick = () => act(btn.dataset.action, btn.dataset.id));
  }

  async function act(action, id) {
    const row = A.guests.find(g => g.id === id);
    if (!row) return;
    if (action === 'copy') {
      await navigator.clipboard.writeText(inviteUrl(row));
      const btn = listEl.querySelector(`button[data-id="${id}"][data-action="copy"]`);
      if (btn) { btn.textContent = 'Đã copy'; setTimeout(() => btn.textContent = 'Copy', 1200); }
      return;
    }
    if (action === 'toggle') {
      const { error } = await db.from('guest_invites').update({is_active:!row.is_active,updated_at:new Date().toISOString()}).eq('id', id);
      if (error) return alert(error.message);
      return load();
    }
    if (action === 'delete') {
      if (!confirm('Xóa khách mời và vô hiệu hóa link này?')) return;
      const { error } = await db.from('guest_invites').delete().eq('id', id);
      if (error) return alert(error.message);
      return load();
    }
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      guest_name: document.getElementById('guestName').value.trim(),
      phone: document.getElementById('guestPhone').value.trim() || null,
      event_choice: document.getElementById('guestEvent').value,
      max_guests: Number(document.getElementById('guestMax').value || 1),
      internal_note: document.getElementById('guestNote').value.trim() || null
    };
    A.setStatus(formStatus, 'Đang tạo...');
    const { data, error } = await db.from('guest_invites').insert(payload).select().single();
    if (error) return A.setStatus(formStatus, error.message, 'error');
    form.reset();
    document.getElementById('guestMax').value = '1';
    document.getElementById('guestEvent').value = 'both';
    A.setStatus(formStatus, 'Đã tạo. Link: ' + inviteUrl(data), 'success');
    await load();
  });
})();