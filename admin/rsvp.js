(() => {
  const A = window.AdminApp;
  const db = A.db;
  const search = document.getElementById('rsvpSearch');
  const statusFilter = document.getElementById('rsvpStatusFilter');
  const eventFilter = document.getElementById('rsvpEventFilter');
  const body = document.getElementById('rsvpBody');
  const stats = document.getElementById('rsvpStats');

  document.addEventListener('admin:rsvp', load);
  search?.addEventListener('input', render);
  statusFilter?.addEventListener('change', render);
  eventFilter?.addEventListener('change', render);
  document.getElementById('exportRsvpBtn')?.addEventListener('click', exportCsv);

  async function load() {
    const { data, error } = await db.from('rsvp').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('RSVP error:', error);
      body.innerHTML = '<tr><td colspan="7" class="empty-cell">Không tải được danh sách RSVP.</td></tr>';
      return;
    }
    A.rsvps = data || [];
    render();
  }

  function csvCell(value) {
    const s = String(value ?? '').replaceAll('"','""');
    return '"' + s + '"';
  }

  function exportCsv() {
    const headers = ['Tên','Điện thoại','Trạng thái','Số người','Sự kiện','Lời nhắn','Ngày'];
    const rows = (A.rsvps || []).map(r => [
      r.guest_name, r.phone || '', r.attendance, r.guest_count,
      r.event_choice, r.message || '', new Date(r.created_at).toLocaleString('vi-VN')
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hai-my-wedding-rsvp.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    const q = (search?.value || '').trim().toLowerCase();
    const status = statusFilter?.value || 'all';
    const eventName = eventFilter?.value || 'all';

    const list = (A.rsvps || []).filter((r) => {
      const matchesText = !q || `${r.guest_name || ''} ${r.phone || ''} ${r.message || ''}`.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || r.attendance === status;
      const matchesEvent = eventName === 'all' || r.event_choice === eventName;
      return matchesText && matchesStatus && matchesEvent;
    });

    const yes = (A.rsvps || []).filter((r) => r.attendance === 'yes');
    const no = (A.rsvps || []).filter((r) => r.attendance === 'no');

    stats.innerHTML =
      '<div class="stat"><span>Phản hồi</span><strong>' + A.rsvps.length + '</strong></div>' +
      '<div class="stat"><span>Tham dự</span><strong>' + yes.length + '</strong></div>' +
      '<div class="stat"><span>Không tham dự</span><strong>' + no.length + '</strong></div>' +
      '<div class="stat"><span>Tổng khách</span><strong>' + yes.reduce((s, r) => s + Number(r.guest_count || 0), 0) + '</strong></div>';

    body.innerHTML = list.length ? list.map((r) => {
      const attendance = r.attendance === 'yes' ? 'Có' : r.attendance === 'no' ? 'Không' : 'Chưa chắc';
      const badge = r.attendance === 'yes' ? 'yes' : r.attendance === 'no' ? 'no' : 'maybe';
      const eventLabel = r.event_choice === 'bride' ? 'Nhà gái' : r.event_choice === 'groom' ? 'Nhà trai' : 'Cả hai';
      return '<tr>' +
        '<td><strong>' + A.esc(r.guest_name) + '</strong></td>' +
        '<td>' + A.esc(r.phone || '—') + '</td>' +
        '<td><span class="status-pill ' + badge + '">' + attendance + '</span></td>' +
        '<td>' + Number(r.guest_count || 0) + '</td>' +
        '<td>' + eventLabel + '</td>' +
        '<td>' + A.esc(r.message || '—') + '</td>' +
        '<td>' + new Date(r.created_at).toLocaleString('vi-VN') + '</td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="7" class="empty-cell">Không có RSVP phù hợp bộ lọc.</td></tr>';
  }
})();