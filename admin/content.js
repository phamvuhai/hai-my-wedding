(() => {
  const A = window.AdminApp;
  const db = A?.db;
  const root = document.getElementById('contentEditor');
  const status = document.getElementById('contentStatus');
  const saveBtn = document.getElementById('saveContentBtn');

  const labels = {
    'hero.note':'Hero · Lời mời',
    'story.title':'Câu chuyện · Tiêu đề',
    'story.text':'Câu chuyện · Nội dung',
    'guide.subtitle':'Hướng dẫn · Mô tả',
    'travel.hcm.text':'Di chuyển · TP.HCM',
    'travel.rg.text':'Di chuyển · Rạch Giá',
    'rsvp.subtitle':'RSVP · Mô tả',
    'footer.thanks':'Footer · Lời cảm ơn'
  };

  document.addEventListener('admin:content', load);

  async function load() {
    if (!db || !root) return;
    A.setStatus(status, 'Đang tải...');
    const { data, error } = await db.from('site_content').select('*').order('key');
    if (error) {
      A.setStatus(status, error.message, 'error');
      return;
    }
    A.contentRows = data || [];
    render();
    A.setStatus(status, '');
  }

  function render() {
    root.innerHTML = A.contentRows.map((row) => `
      <article class="content-row" data-key="${A.esc(row.key)}">
        <div class="content-row-head">
          <strong>${A.esc(labels[row.key] || row.key)}</strong>
          <code>${A.esc(row.key)}</code>
        </div>
        <div class="content-language-grid">
          <label>Tiếng Việt<textarea data-lang="vi" rows="4">${A.esc(row.value_vi || '')}</textarea></label>
          <label>English<textarea data-lang="en" rows="4">${A.esc(row.value_en || '')}</textarea></label>
          <label>日本語<textarea data-lang="ja" rows="4">${A.esc(row.value_ja || '')}</textarea></label>
        </div>
      </article>
    `).join('');
  }

  saveBtn?.addEventListener('click', async () => {
    const rows = [...root.querySelectorAll('.content-row')].map((el) => ({
      key: el.dataset.key,
      value_vi: el.querySelector('[data-lang="vi"]').value.trim() || null,
      value_en: el.querySelector('[data-lang="en"]').value.trim() || null,
      value_ja: el.querySelector('[data-lang="ja"]').value.trim() || null,
      updated_at: new Date().toISOString()
    }));
    if (!rows.length) return;
    A.setStatus(status, 'Đang lưu...');
    const { error } = await db.from('site_content').upsert(rows, { onConflict:'key' });
    if (error) return A.setStatus(status, error.message, 'error');
    A.setStatus(status, 'Đã lưu. Website public sẽ nhận nội dung mới khi tải lại.', 'success');
    await load();
  });
})();