(() => {
  const A = window.AdminApp;
  const db = A?.db;

  const listEl = document.getElementById('guestList');
  const statsEl = document.getElementById('guestStats');
  const searchEl = document.getElementById('guestSearch');
  const eventFilterEl = document.getElementById('guestEventFilter');
  const rsvpFilterEl = document.getElementById('guestRsvpFilter');
  const activeFilterEl = document.getElementById('guestActiveFilter');
  const form = document.getElementById('guestForm');
  const formStatus = document.getElementById('guestFormStatus');
  const editIdEl = document.getElementById('guestEditId');
  const saveBtn = document.getElementById('guestSaveBtn');
  const cancelEditBtn = document.getElementById('guestCancelEditBtn');

  const csvInput = document.getElementById('guestCsvInput');
  const csvPanel = document.getElementById('csvPreviewPanel');
  const csvBody = document.getElementById('guestCsvPreviewBody');
  const csvStatus = document.getElementById('guestCsvStatus');

  let csvRows = [];
  let rsvpByInvite = new Map();

  document.addEventListener('admin:guests', load);
  [searchEl,eventFilterEl,rsvpFilterEl,activeFilterEl].forEach(el => el?.addEventListener('input', render));
  document.getElementById('guestSelectAll')?.addEventListener('change', toggleSelectAll);
  document.getElementById('guestBulkEvent')?.addEventListener('change', bulkChangeEvent);
  document.getElementById('guestBulkEnable')?.addEventListener('click', () => bulkToggle(true));
  document.getElementById('guestBulkDisable')?.addEventListener('click', () => bulkToggle(false));
  document.getElementById('guestBulkDelete')?.addEventListener('click', bulkDelete);
  document.getElementById('downloadGuestTemplateBtn')?.addEventListener('click', downloadTemplate);
  document.getElementById('exportGuestsBtn')?.addEventListener('click', exportGuests);
  document.getElementById('cancelCsvImportBtn')?.addEventListener('click', clearCsv);
  document.getElementById('confirmCsvImportBtn')?.addEventListener('click', importCsvRows);
  cancelEditBtn?.addEventListener('click', resetForm);
  csvInput?.addEventListener('change', handleCsvFile);

  function normalize(value='') {
    return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function normalizePhone(value='') {
    return String(value).replace(/[^0-9+]/g,'').trim();
  }

  function eventLabel(v) {
    return v === 'bride' ? 'Nhà gái' : v === 'groom' ? 'Nhà trai' : 'Cả hai';
  }

  function rsvpLabel(v) {
    if (v === 'yes') return 'Có tham dự';
    if (v === 'no') return 'Không tham dự';
    if (v === 'maybe') return 'Chưa chắc';
    return 'Chưa phản hồi';
  }

  function inviteUrl(row) {
    return `${location.origin}/vi/invite/${row.token}`;
  }

  function latestRsvpRows(rows=[]) {
    const map = new Map();
    [...rows]
      .filter(r => r.invite_id)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(r => { if (!map.has(r.invite_id)) map.set(r.invite_id, r); });
    return map;
  }

  async function load() {
    if (!db) return;
    const [{data:guests,error:guestError},{data:rsvps,error:rsvpError}] = await Promise.all([
      db.from('guest_invites').select('*').order('created_at',{ascending:false}),
      db.from('rsvp').select('invite_id,attendance,guest_count,event_choice,created_at').not('invite_id','is',null).order('created_at',{ascending:false})
    ]);
    if (guestError) {
      listEl.innerHTML = '<p class="muted">Không tải được danh sách khách.</p>';
      return;
    }
    if (rsvpError) console.warn('Guest RSVP status unavailable:', rsvpError);
    A.guests = guests || [];
    rsvpByInvite = latestRsvpRows(rsvps || []);
    render();
  }

  function filteredGuests() {
    const q = normalize(searchEl?.value || '');
    const eventFilter = eventFilterEl?.value || 'all';
    const rsvpFilter = rsvpFilterEl?.value || 'all';
    const activeFilter = activeFilterEl?.value || 'all';

    return (A.guests || []).filter(g => {
      const latest = rsvpByInvite.get(g.id);
      const status = latest?.attendance || 'pending';
      const hay = normalize(`${g.guest_name} ${g.phone || ''} ${g.internal_note || ''}`);
      return (!q || hay.includes(q))
        && (eventFilter === 'all' || g.event_choice === eventFilter)
        && (rsvpFilter === 'all' || status === rsvpFilter)
        && (activeFilter === 'all' || (activeFilter === 'active' ? g.is_active : !g.is_active));
    });
  }

  function render() {
    const guests = A.guests || [];
    const rows = filteredGuests();
    const active = guests.filter(g => g.is_active).length;
    const responded = guests.filter(g => rsvpByInvite.has(g.id)).length;
    const attending = guests.filter(g => rsvpByInvite.get(g.id)?.attendance === 'yes')
      .reduce((sum,g) => sum + Number(rsvpByInvite.get(g.id)?.guest_count || 0), 0);

    statsEl.innerHTML =
      '<div class="stat"><span>Tổng khách mời</span><strong>' + guests.length + '</strong></div>' +
      '<div class="stat"><span>Đã phản hồi</span><strong>' + responded + '</strong></div>' +
      '<div class="stat"><span>Dự kiến tham dự</span><strong>' + attending + '</strong></div>' +
      '<div class="stat"><span>Link hoạt động</span><strong>' + active + '</strong></div>';

    listEl.innerHTML = rows.length ? rows.map(g => {
      const latest = rsvpByInvite.get(g.id);
      const status = latest?.attendance || 'pending';
      const source = g.import_source === 'csv' ? 'CSV' : 'Manual';
      return `
        <article class="guest-card" data-id="${g.id}">
          <div class="guest-card-main">
            <label class="guest-select check"><input type="checkbox" class="guest-row-check" value="${g.id}"><span></span></label>
            <div class="guest-card-copy">
              <strong>${A.esc(g.guest_name)}</strong>
              <small>${A.esc(g.phone || 'Không có SĐT')} · ${eventLabel(g.event_choice)} · tối đa ${g.max_guests} người · ${source}</small>
              <div class="guest-status-line">
                <span class="status-pill ${status === 'pending' ? 'maybe' : status}">RSVP: ${rsvpLabel(status)}${latest?.attendance === 'yes' ? ' · ' + latest.guest_count + ' người' : ''}</span>
                <span class="status-pill ${g.is_active ? 'yes' : 'no'}">${g.is_active ? 'Link active' : 'Link disabled'}</span>
              </div>
            </div>
          </div>
          ${g.internal_note ? '<p>' + A.esc(g.internal_note) + '</p>' : ''}
          <div class="invite-link-row">
            <input readonly value="${A.esc(inviteUrl(g))}">
            <button class="btn ghost compact" data-action="edit" data-id="${g.id}">Edit</button>
            <button class="btn ghost compact" data-action="copy" data-id="${g.id}">Copy</button>
            <button class="btn ghost compact" data-action="toggle" data-id="${g.id}">${g.is_active ? 'Tắt' : 'Bật'}</button>
            <button class="btn ghost compact danger-text" data-action="delete" data-id="${g.id}">Xóa</button>
          </div>
        </article>`;
    }).join('') : '<p class="muted">Chưa có khách phù hợp.</p>';

    listEl.querySelectorAll('button[data-action]').forEach(btn => btn.onclick = () => act(btn.dataset.action, btn.dataset.id));
  }

  function selectedIds() {
    return [...document.querySelectorAll('.guest-row-check:checked')].map(x => x.value);
  }

  function toggleSelectAll(e) {
    listEl.querySelectorAll('.guest-row-check').forEach(cb => cb.checked = e.target.checked);
  }

  async function bulkChangeEvent(e) {
    const value = e.target.value;
    const ids = selectedIds();
    if (!value || !ids.length) return;
    const {error} = await db.from('guest_invites').update({event_choice:value,updated_at:new Date().toISOString()}).in('id',ids);
    if (error) return alert(error.message);
    e.target.value='';
    await load();
  }

  async function bulkToggle(isActive) {
    const ids = selectedIds();
    if (!ids.length) return alert('Hãy chọn ít nhất một khách.');
    const {error} = await db.from('guest_invites').update({is_active:isActive,updated_at:new Date().toISOString()}).in('id',ids);
    if (error) return alert(error.message);
    await load();
  }

  async function bulkDelete() {
    const ids = selectedIds();
    if (!ids.length) return alert('Hãy chọn ít nhất một khách.');
    if (!confirm(`Xóa ${ids.length} khách đã chọn? Link của họ sẽ không còn hoạt động.`)) return;
    const {error} = await db.from('guest_invites').delete().in('id',ids);
    if (error) return alert(error.message);
    await load();
  }

  async function act(action,id) {
    const row = (A.guests || []).find(g => g.id === id);
    if (!row) return;

    if (action === 'edit') {
      editIdEl.value = row.id;
      document.getElementById('guestName').value = row.guest_name || '';
      document.getElementById('guestPhone').value = row.phone || '';
      document.getElementById('guestEvent').value = row.event_choice || 'both';
      document.getElementById('guestMax').value = row.max_guests || 1;
      document.getElementById('guestNote').value = row.internal_note || '';
      saveBtn.textContent = 'Lưu thay đổi';
      cancelEditBtn.classList.remove('hidden');
      A.setStatus(formStatus,'Đang chỉnh sửa. Token/link thiệp sẽ được giữ nguyên.');
      form.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    if (action === 'copy') {
      await navigator.clipboard.writeText(inviteUrl(row));
      const btn = listEl.querySelector(`button[data-id="${id}"][data-action="copy"]`);
      if (btn) { btn.textContent='Đã copy'; setTimeout(() => btn.textContent='Copy',1200); }
      return;
    }

    if (action === 'toggle') {
      const {error} = await db.from('guest_invites').update({is_active:!row.is_active,updated_at:new Date().toISOString()}).eq('id',id);
      if (error) return alert(error.message);
      return load();
    }

    if (action === 'delete') {
      if (!confirm('Xóa khách mời và vô hiệu hóa link này?')) return;
      const {error} = await db.from('guest_invites').delete().eq('id',id);
      if (error) return alert(error.message);
      if (editIdEl.value === id) resetForm();
      return load();
    }
  }

  function resetForm() {
    form.reset();
    editIdEl.value='';
    document.getElementById('guestMax').value='1';
    document.getElementById('guestEvent').value='both';
    saveBtn.textContent='Tạo link thiệp';
    cancelEditBtn.classList.add('hidden');
    A.setStatus(formStatus,'');
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const editId = editIdEl.value;
    const payload = {
      guest_name: document.getElementById('guestName').value.trim(),
      phone: document.getElementById('guestPhone').value.trim() || null,
      event_choice: document.getElementById('guestEvent').value,
      max_guests: Number(document.getElementById('guestMax').value || 1),
      internal_note: document.getElementById('guestNote').value.trim() || null,
      updated_at: new Date().toISOString()
    };

    if (!payload.guest_name) return A.setStatus(formStatus,'Tên khách là bắt buộc.','error');
    A.setStatus(formStatus,editId ? 'Đang lưu...' : 'Đang tạo...');

    if (editId) {
      const {error} = await db.from('guest_invites').update(payload).eq('id',editId);
      if (error) return A.setStatus(formStatus,error.message,'error');
      A.setStatus(formStatus,'Đã cập nhật. Link thiệp cũ vẫn giữ nguyên.','success');
      resetForm();
      return load();
    }

    payload.import_source='manual';
    const {data,error} = await db.from('guest_invites').insert(payload).select().single();
    if (error) return A.setStatus(formStatus,error.message,'error');
    const url = inviteUrl(data);
    resetForm();
    A.setStatus(formStatus,'Đã tạo. Link: ' + url,'success');
    await load();
  });

  function parseCsv(text) {
    const rows=[];
    let row=[], cell='', quoted=false;
    for (let i=0;i<text.length;i++) {
      const ch=text[i];
      const next=text[i+1];
      if (ch === '"' && quoted && next === '"') { cell+='"'; i++; continue; }
      if (ch === '"') { quoted=!quoted; continue; }
      if (ch === ',' && !quoted) { row.push(cell); cell=''; continue; }
      if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell); cell='';
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row=[];
        continue;
      }
      cell+=ch;
    }
    row.push(cell);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);
    return rows;
  }

  function findDuplicate(row) {
    const phone=normalizePhone(row.phone);
    const name=normalize(row.guest_name);
    return (A.guests || []).find(g => {
      const existingPhone=normalizePhone(g.phone || '');
      if (phone && existingPhone) return phone === existingPhone;
      return !phone && !existingPhone && name && normalize(g.guest_name) === name;
    }) || null;
  }

  function validateCsvRow(row) {
    const errors=[];
    if (!row.guest_name?.trim()) errors.push('Thiếu tên');
    if (!['bride','groom','both'].includes(row.event_choice)) errors.push('event_choice sai');
    const max=Number(row.max_guests);
    if (!Number.isInteger(max) || max < 1 || max > 10) errors.push('max_guests 1-10');
    if ((row.phone || '').length > 40) errors.push('SĐT quá dài');
    if ((row.internal_note || '').length > 1000) errors.push('Ghi chú quá dài');
    return errors;
  }

  async function handleCsvFile(e) {
    const file=e.target.files?.[0];
    if (!file) return;
    try {
      const text=(await file.text()).replace(/^\uFEFF/,'');
      const parsed=parseCsv(text);
      if (parsed.length < 2) throw new Error('CSV không có dữ liệu.');

      const headers=parsed[0].map(x => String(x).trim().toLowerCase());
      const required=['guest_name','phone','event_choice','max_guests','internal_note'];
      const missing=required.filter(h => !headers.includes(h));
      if (missing.length) throw new Error('Thiếu cột: ' + missing.join(', '));

      csvRows=parsed.slice(1).map((cells,index) => {
        const raw=Object.fromEntries(headers.map((h,i) => [h,String(cells[i] ?? '').trim()]));
        const row={
          _key:'csv-' + index,
          guest_name:raw.guest_name,
          phone:raw.phone,
          event_choice:(raw.event_choice || 'both').toLowerCase(),
          max_guests:Number(raw.max_guests || 1),
          internal_note:raw.internal_note,
          action:'new'
        };
        row.duplicate=findDuplicate(row);
        row.action=row.duplicate ? 'skip' : 'new';
        row.errors=validateCsvRow(row);
        return row;
      });
      renderCsvPreview();
      csvPanel.classList.remove('hidden');
      csvPanel.scrollIntoView({behavior:'smooth',block:'start'});
      A.setStatus(csvStatus,`Đã đọc ${csvRows.length} dòng. Hãy kiểm tra trước khi import.`);
    } catch (error) {
      A.setStatus(csvStatus,error.message,'error');
      csvPanel.classList.remove('hidden');
    } finally {
      e.target.value='';
    }
  }

  function refreshCsvRow(index) {
    const row=csvRows[index];
    row.duplicate=findDuplicate(row);
    if (!row.duplicate && row.action === 'update') row.action='new';
    row.errors=validateCsvRow(row);
  }

  function renderCsvPreview() {
    csvBody.innerHTML=csvRows.map((row,index) => `
      <tr data-index="${index}" class="${row.errors.length ? 'csv-row-error' : ''}">
        <td>${index+1}</td>
        <td><input data-field="guest_name" value="${A.esc(row.guest_name)}"></td>
        <td><input data-field="phone" value="${A.esc(row.phone)}"></td>
        <td><select data-field="event_choice">
          <option value="bride" ${row.event_choice==='bride'?'selected':''}>Nhà gái</option>
          <option value="groom" ${row.event_choice==='groom'?'selected':''}>Nhà trai</option>
          <option value="both" ${row.event_choice==='both'?'selected':''}>Cả hai</option>
        </select></td>
        <td><input data-field="max_guests" type="number" min="1" max="10" value="${row.max_guests}"></td>
        <td><input data-field="internal_note" value="${A.esc(row.internal_note)}"></td>
        <td>${row.duplicate ? '<span class="status-pill maybe">' + A.esc(row.duplicate.guest_name) + '</span>' : '—'}</td>
        <td><select data-field="action">
          <option value="new" ${row.action==='new'?'selected':''}>New</option>
          <option value="skip" ${row.action==='skip'?'selected':''}>Skip</option>
          <option value="update" ${row.action==='update'?'selected':''} ${row.duplicate?'':'disabled'}>Update</option>
        </select></td>
        <td>${row.errors.length ? '<span class="status-pill no">' + A.esc(row.errors.join(' · ')) + '</span>' : '<span class="status-pill yes">OK</span>'}</td>
      </tr>`).join('');

    csvBody.querySelectorAll('input,select').forEach(el => {
      el.addEventListener('change', () => {
        const tr=el.closest('tr');
        const index=Number(tr.dataset.index);
        const field=el.dataset.field;
        if (field === 'max_guests') csvRows[index][field]=Number(el.value || 1);
        else csvRows[index][field]=el.value;
        refreshCsvRow(index);
        renderCsvPreview();
      });
    });
  }

  async function importCsvRows() {
    if (!csvRows.length) return;
    csvRows.forEach((_,i) => refreshCsvRow(i));
    const bad=csvRows.filter(r => r.errors.length && r.action !== 'skip');
    if (bad.length) {
      renderCsvPreview();
      return A.setStatus(csvStatus,`Còn ${bad.length} dòng lỗi. Sửa hoặc chọn Skip trước khi import.`,'error');
    }

    const inserts=csvRows.filter(r => r.action === 'new').map(r => ({
      guest_name:r.guest_name.trim(),
      phone:r.phone.trim() || null,
      event_choice:r.event_choice,
      max_guests:r.max_guests,
      internal_note:r.internal_note.trim() || null,
      import_source:'csv'
    }));
    const updates=csvRows.filter(r => r.action === 'update' && r.duplicate);

    A.setStatus(csvStatus,`Đang import ${inserts.length} mới, cập nhật ${updates.length}...`);

    if (inserts.length) {
      const {error}=await db.from('guest_invites').insert(inserts);
      if (error) return A.setStatus(csvStatus,error.message,'error');
    }

    for (const row of updates) {
      const {error}=await db.from('guest_invites').update({
        guest_name:row.guest_name.trim(),
        phone:row.phone.trim() || null,
        event_choice:row.event_choice,
        max_guests:row.max_guests,
        internal_note:row.internal_note.trim() || null,
        import_source:'csv',
        updated_at:new Date().toISOString()
      }).eq('id',row.duplicate.id);
      if (error) return A.setStatus(csvStatus,error.message,'error');
    }

    const skipped=csvRows.filter(r => r.action === 'skip').length;
    A.setStatus(csvStatus,`Hoàn tất: ${inserts.length} mới · ${updates.length} cập nhật · ${skipped} bỏ qua.`,'success');
    csvRows=[];
    csvBody.innerHTML='';
    await load();
  }

  function clearCsv() {
    csvRows=[];
    csvBody.innerHTML='';
    csvPanel.classList.add('hidden');
    A.setStatus(csvStatus,'');
  }

  function csvCell(value) {
    return '"' + String(value ?? '').replaceAll('"','""') + '"';
  }

  function downloadCsv(filename,headers,rows) {
    const csv='\uFEFF' + [headers,...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');
    a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    downloadCsv(
      'hai-my-wedding-guest-template.csv',
      ['guest_name','phone','event_choice','max_guests','internal_note'],
      [
        ['Nguyễn Văn A','0901234567','bride','2','Bạn cô dâu'],
        ['Trần Văn B','0912345678','groom','2','Bạn chú rể'],
        ['Lê Văn C','0987654321','both','4','Gia đình']
      ]
    );
  }

  function exportGuests() {
    const headers=['guest_name','phone','event_choice','max_guests','internal_note','invite_url','is_active','import_source','rsvp_status','rsvp_guest_count','created_at'];
    const rows=(A.guests || []).map(g => {
      const latest=rsvpByInvite.get(g.id);
      return [
        g.guest_name,g.phone || '',g.event_choice,g.max_guests,g.internal_note || '',
        inviteUrl(g),g.is_active,g.import_source || 'manual',
        latest?.attendance || 'pending',latest?.guest_count ?? '',g.created_at
      ];
    });
    downloadCsv('hai-my-wedding-guests.csv',headers,rows);
  }
})();