(() => {
  const A = window.AdminApp;
  const db = A.db;
  const search = document.getElementById('rsvpSearch');
  const statusFilter = document.getElementById('rsvpStatusFilter');
  const eventFilter = document.getElementById('rsvpEventFilter');
  const sourceFilter = document.getElementById('rsvpSourceFilter');
  const body = document.getElementById('rsvpBody');
  const stats = document.getElementById('rsvpStats');

  const modal = document.getElementById('rsvpEditModal');
  const editForm = document.getElementById('rsvpEditForm');
  const editId = document.getElementById('rsvpEditId');
  const editName = document.getElementById('rsvpEditName');
  const editPhone = document.getElementById('rsvpEditPhone');
  const editAttendance = document.getElementById('rsvpEditAttendance');
  const editCount = document.getElementById('rsvpEditCount');
  const editEvent = document.getElementById('rsvpEditEvent');
  const editSource = document.getElementById('rsvpEditSource');
  const editMessage = document.getElementById('rsvpEditMessage');
  const editMeta = document.getElementById('rsvpEditMeta');
  const editStatus = document.getElementById('rsvpEditStatus');
  const deleteModal = document.getElementById('rsvpDeleteModal');
  const deleteId = document.getElementById('rsvpDeleteId');
  const deleteMessage = document.getElementById('rsvpDeleteMessage');
  const deleteStatus = document.getElementById('rsvpDeleteStatus');
  const deleteConfirm = document.getElementById('rsvpDeleteConfirm');

  document.addEventListener('admin:rsvp', load);
  search?.addEventListener('input', render);
  statusFilter?.addEventListener('change', render);
  eventFilter?.addEventListener('change', render);
  sourceFilter?.addEventListener('change', render);
  document.getElementById('exportRsvpBtn')?.addEventListener('click', exportCsv);
  body?.addEventListener('click', onTableClick);
  editForm?.addEventListener('submit', saveEdit);
  document.querySelectorAll('[data-rsvp-close]').forEach(el => el.addEventListener('click', closeEdit));
  document.querySelectorAll('[data-rsvp-delete-close]').forEach(el => el.addEventListener('click', closeDelete));
  deleteConfirm?.addEventListener('click', confirmDelete);

  function sourceLabel(source) {
    if (source === 'invite') return 'Được mời';
    if (source === 'admin') return 'Admin nhập';
    return 'Khách tự nhập';
  }

  function sourceBadge(source) {
    if (source === 'invite') return 'invite';
    if (source === 'admin') return 'admin';
    return 'public';
  }

  async function load() {
    const { data, error } = await db
      .from('rsvp')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('RSVP error:', error);
      body.innerHTML = '<tr><td colspan="9" class="empty-cell">Không tải được danh sách RSVP.</td></tr>';
      return;
    }
    A.rsvps = data || [];
    render();
  }


  function exportCsv() {
    const headers = ['Tên','Nguồn','Điện thoại','Trạng thái','Số người','Sự kiện','Lời nhắn','Ngày tạo','Cập nhật'];
    const rows = (A.rsvps || []).map(r => [
      r.guest_name,
      sourceLabel(r.response_source),
      r.phone || '',
      r.attendance,
      r.guest_count,
      r.event_choice,
      r.message || '',
      new Date(r.created_at).toLocaleString('vi-VN'),
      r.updated_at ? new Date(r.updated_at).toLocaleString('vi-VN') : ''
    ]);
    A.utils.downloadCsv('hai-my-wedding-rsvp.csv',headers,rows,'\n');
  }

  function render() {
    const q = (search?.value || '').trim().toLowerCase();
    const status = statusFilter?.value || 'all';
    const eventName = eventFilter?.value || 'all';
    const source = sourceFilter?.value || 'all';

    const list = (A.rsvps || []).filter((r) => {
      const matchesText = !q || `${r.guest_name || ''} ${r.phone || ''} ${r.message || ''}`.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || r.attendance === status;
      const matchesEvent = eventName === 'all' || r.event_choice === eventName;
      const matchesSource = source === 'all' || (r.response_source || 'public') === source;
      return matchesText && matchesStatus && matchesEvent && matchesSource;
    });

    const all = A.rsvps || [];
    const yes = all.filter((r) => r.attendance === 'yes');
    const invited = all.filter((r) => (r.response_source || (r.invite_id ? 'invite' : 'public')) === 'invite');
    const publicRows = all.filter((r) => (r.response_source || (r.invite_id ? 'invite' : 'public')) === 'public');

    stats.innerHTML =
      '<div class="stat"><span>Phản hồi</span><strong>' + all.length + '</strong></div>' +
      '<div class="stat"><span>Tham dự</span><strong>' + yes.length + '</strong></div>' +
      '<div class="stat"><span>Được mời</span><strong>' + invited.length + '</strong></div>' +
      '<div class="stat"><span>Khách tự nhập</span><strong>' + publicRows.length + '</strong></div>' +
      '<div class="stat"><span>Tổng khách</span><strong>' + yes.reduce((s, r) => s + Number(r.guest_count || 0), 0) + '</strong></div>';

    body.innerHTML = list.length ? list.map((r) => {
      const attendance = r.attendance === 'yes' ? 'Có' : r.attendance === 'no' ? 'Không' : 'Chưa chắc';
      const badge = r.attendance === 'yes' ? 'yes' : r.attendance === 'no' ? 'no' : 'maybe';
      const eventLabel = r.event_choice === 'bride' ? 'Nhà gái' : r.event_choice === 'groom' ? 'Nhà trai' : 'Cả hai';
      const source = r.response_source || (r.invite_id ? 'invite' : 'public');

      return '<tr>' +
        '<td><strong>' + A.esc(r.guest_name) + '</strong></td>' +
        '<td><span class="source-pill ' + sourceBadge(source) + '">' + sourceLabel(source) + '</span></td>' +
        '<td>' + A.esc(r.phone || '—') + '</td>' +
        '<td><span class="status-pill ' + badge + '">' + attendance + '</span></td>' +
        '<td>' + Number(r.guest_count || 0) + '</td>' +
        '<td>' + eventLabel + '</td>' +
        '<td>' + A.esc(r.message || '—') + '</td>' +
        '<td>' + new Date(r.created_at).toLocaleString('vi-VN') + '</td>' +
        '<td><div class="rsvp-row-actions">' +
          '<button class="btn ghost compact" type="button" data-rsvp-edit="' + A.esc(r.id) + '">Edit</button>' +
          '<button class="btn ghost compact danger-text" type="button" data-rsvp-delete="' + A.esc(r.id) + '">Xóa</button>' +
        '</div></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="9" class="empty-cell">Không có RSVP phù hợp bộ lọc.</td></tr>';
  }

  function onTableClick(event) {
    const editButton = event.target.closest('[data-rsvp-edit]');
    if (editButton) {
      const row = (A.rsvps || []).find(r => String(r.id) === String(editButton.dataset.rsvpEdit));
      if (row) openEdit(row);
      return;
    }

    const deleteButton = event.target.closest('[data-rsvp-delete]');
    if (deleteButton) {
      const row = (A.rsvps || []).find(r => String(r.id) === String(deleteButton.dataset.rsvpDelete));
      if (row) openDelete(row);
    }
  }

  function openEdit(row) {
    editId.value = row.id;
    editName.value = row.guest_name || '';
    editPhone.value = row.phone || '';
    editAttendance.value = row.attendance || 'maybe';
    editCount.value = Number(row.guest_count || 0);
    editEvent.value = row.event_choice || 'both';
    editMessage.value = row.message || '';
    const source = row.response_source || (row.invite_id ? 'invite' : 'public');
    editSource.value = sourceLabel(source);
    editMeta.textContent = row.invite_id
      ? `Invite ID: ${row.invite_id} · RSVP #${row.id}`
      : `Public RSVP · RSVP #${row.id}`;
    editStatus.textContent = '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('admin-modal-open');
  }

  function closeEdit() {
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden','true');
    document.body.classList.remove('admin-modal-open');
  }

  function openDelete(row) {
    if (!deleteModal) return;
    deleteId.value = row.id;
    deleteMessage.textContent = `Bạn có chắc muốn xóa RSVP của “${row.guest_name || 'khách này'}” không? Hành động này không thể hoàn tác.`;
    deleteStatus.textContent = '';
    deleteModal.classList.remove('hidden');
    deleteModal.setAttribute('aria-hidden','false');
    document.body.classList.add('admin-modal-open');
  }

  function closeDelete() {
    deleteModal?.classList.add('hidden');
    deleteModal?.setAttribute('aria-hidden','true');
    document.body.classList.remove('admin-modal-open');
  }

  async function confirmDelete() {
    const id = deleteId?.value;
    if (!id) return;

    deleteStatus.textContent = 'Đang xóa...';
    if (deleteConfirm) deleteConfirm.disabled = true;

    const { error } = await db
      .from('rsvp')
      .delete()
      .eq('id', id);

    if (deleteConfirm) deleteConfirm.disabled = false;

    if (error) {
      console.error(error);
      deleteStatus.textContent = 'Không thể xóa RSVP.';
      return;
    }

    A.rsvps = (A.rsvps || []).filter(r => String(r.id) !== String(id));
    deleteStatus.textContent = 'Đã xóa RSVP.';
    render();
    setTimeout(closeDelete, 420);
  }

  async function saveEdit(event) {
    event.preventDefault();
    const id = editId.value;
    const attendance = editAttendance.value;
    let count = Math.max(0, Math.min(10, Number(editCount.value || 0)));
    if (attendance === 'no') count = 0;

    const payload = {
      guest_name: editName.value.trim(),
      phone: editPhone.value.trim() || null,
      attendance,
      guest_count: count,
      event_choice: editEvent.value,
      message: editMessage.value.trim() || null,
      updated_at: new Date().toISOString()
    };

    if (!payload.guest_name) {
      editStatus.textContent = 'Tên khách là bắt buộc.';
      return;
    }

    editStatus.textContent = 'Đang lưu...';
    const submit = editForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;

    const { data, error } = await db
      .from('rsvp')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (submit) submit.disabled = false;

    if (error) {
      console.error(error);
      editStatus.textContent = 'Không thể cập nhật RSVP.';
      return;
    }

    const index = (A.rsvps || []).findIndex(r => String(r.id) === String(id));
    if (index >= 0) A.rsvps[index] = data;
    editStatus.textContent = 'Đã cập nhật RSVP.';
    render();
    setTimeout(closeEdit, 450);
  }
})();