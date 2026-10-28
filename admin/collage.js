/* Romantic Collage editor: stores image references in site_content; upload stays in Album. */
(() => {
  'use strict';
  const A = window.AdminApp;
  if (!A?.db) return;
  const db = A.db;
  const SLOTS = [
    ['story','Sau câu chuyện tình yêu'],
    ['promise','Sau đếm ngược'],
    ['events','Sau lịch cưới'],
    ['moments','Sau album ảnh'],
    ['rsvp','Sau xác nhận RSVP']
  ];
  const ALLOWED = new Set(['polaroid','film','full']);
  let items = [];
  let editing = -1;
  let loaded = false;
  let dirty = false;
  let busy = false;
  const el = id => document.getElementById(id);
  const esc = A.esc;
  const published = () => A.images.filter(img => img.is_published && img.image_path);
  const sortedPhotos = () => published().slice().sort((a,b) =>
    Number(b.is_featured)-Number(a.is_featured) ||
    Number(a.sort_order || 0)-Number(b.sort_order || 0) ||
    String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const slotName = key => SLOTS.find(x => x[0] === key)?.[1] || key;
  const uuid = () => window.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  const sanitize = value => String(value || '').slice(0,240);

  function seed() {
    const slots = ['story','story','promise','events','events','moments','rsvp'];
    const styles = ['polaroid','polaroid','full','film','polaroid','polaroid','film'];
    return sortedPhotos().slice(0,7).map((img,i) => ({
      id: uuid(), imageId: img.id, slot: slots[i], style: styles[i],
      visible: true, caption: {vi:'',en:'',ja:''}
    }));
  }
  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0,40).filter(x => x && typeof x.imageId === 'string' && SLOTS.some(s => s[0] === x.slot))
      .map(x => ({
        id: String(x.id || uuid()), imageId: x.imageId, slot: x.slot,
        style: ALLOWED.has(x.style) ? x.style : 'polaroid', visible:x.visible !== false,
        caption:{
          vi:sanitize(x.caption?.vi),en:sanitize(x.caption?.en),ja:sanitize(x.caption?.ja)
        }
      }));
  }
  function markDirty() {
    dirty = true;
    A.setStatus(el('collageStatus'),'Bạn có thay đổi chưa Publish.','');
  }
  function renderPicker() {
    const picker = el('collagePhoto');
    if (!picker) return;
    const selected = picker.value;
    picker.innerHTML = '<option value="">Chọn ảnh đã Publish trong Album</option>' +
      sortedPhotos().map(img => '<option value="' + esc(img.id) + '">' +
      esc((img.title || 'Ảnh không tiêu đề') + ' · ' + img.id.slice(0,8)) + '</option>').join('');
    if (published().some(img => img.id === selected)) picker.value = selected;
    el('collagePhotoHint').textContent = published().length
      ? 'Đã có ' + published().length + ' ảnh được Publish. Có thể thêm ảnh mới trong tab Album.'
      : 'Chưa có ảnh Publish. Vào tab Album để upload và Publish ảnh trước.';
  }
  function card(item, index) {
    const img = A.images.find(photo => photo.id === item.imageId);
    const title = img?.title || '(Ảnh đã bị xóa hoặc chưa tải)';
    const photo = img?.image_path ? '<img loading="lazy" src="' + esc(A.publicUrl(img.image_path)) + '" alt="">' : '<span>Không có ảnh</span>';
    return '<article class="collage-item' + (item.visible ? '' : ' collage-item-hidden') + '" draggable="true" data-index="' + index + '">' +
      '<div class="collage-item-photo">' + photo + '</div>' +
      '<div class="collage-item-meta"><small>' + esc(slotName(item.slot)) + '</small><strong>' + esc(title) + '</strong>' +
      '<span>' + esc(item.style) + (item.visible ? ' · Hiển thị' : ' · Đang ẩn') + '</span>' +
      (item.caption.vi ? '<em>' + esc(item.caption.vi) + '</em>' : '') + '</div>' +
      '<div class="collage-item-actions">' +
      '<button type="button" data-action="up" data-index="' + index + '" aria-label="Lên">↑</button>' +
      '<button type="button" data-action="down" data-index="' + index + '" aria-label="Xuống">↓</button>' +
      '<button type="button" data-action="edit" data-index="' + index + '">Sửa</button>' +
      '<button type="button" data-action="remove" data-index="' + index + '">Xóa</button>' +
      '</div></article>';
  }
  function renderList() {
    const root = el('collageList');
    if (!root) return;
    root.innerHTML = SLOTS.map(([slot,title]) => {
      const matching = items.map((item,index) => ({item,index})).filter(x => x.item.slot === slot);
      if (!matching.length) return '';
      return '<section class="collage-list-group"><h4>' + esc(title) + '</h4>' +
        matching.map(x => card(x.item,x.index)).join('') + '</section>';
    }).join('') || '<p class="muted">Chưa chọn ảnh. Hãy thêm ảnh bên trên hoặc dùng các ảnh có sẵn trong Album.</p>';
    el('collageCount').textContent = items.filter(x => x.visible).length + ' ảnh đang hiển thị';
  }
  function resetForm() {
    editing = -1;
    el('collagePhoto').value = '';
    el('collageSlot').value = 'story';
    el('collageStyle').value = 'polaroid';
    ['vi','en','ja'].forEach(lang => { el('collageCaption_' + lang).value = ''; });
    el('collageVisible').checked = true;
    el('collageAdd').textContent = '＋ Thêm ảnh vào thiệp';
    el('collageCancel').hidden = true;
  }
  function editItem(index) {
    const item = items[index];
    if (!item) return;
    editing = index;
    el('collagePhoto').value = item.imageId;
    el('collageSlot').value = item.slot;
    el('collageStyle').value = item.style;
    el('collageVisible').checked = item.visible;
    ['vi','en','ja'].forEach(lang => { el('collageCaption_' + lang).value = item.caption?.[lang] || ''; });
    el('collageAdd').textContent = '✓ Cập nhật ảnh';
    el('collageCancel').hidden = false;
    el('collageForm').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function swapInSlot(index,step) {
    const indexes = items.map((item,i) => item.slot === items[index]?.slot ? i : -1).filter(i => i !== -1);
    const position = indexes.indexOf(index), target = indexes[position + step];
    if (target === undefined) return;
    [items[index],items[target]] = [items[target],items[index]];
    markDirty();renderList();
  }
  function addOrUpdate() {
    const imageId = el('collagePhoto').value;
    const img = published().find(x => x.id === imageId);
    if (!img) { A.setStatus(el('collageStatus'),'Hãy chọn ảnh đã Publish trong Album.','error');return; }
    const value = {
      id: editing >= 0 ? items[editing].id : uuid(),
      imageId, slot:el('collageSlot').value, style:el('collageStyle').value,
      visible:el('collageVisible').checked,
      caption:Object.fromEntries(['vi','en','ja'].map(lang => [lang,sanitize(el('collageCaption_'+lang).value.trim())]))
    };
    if (editing >= 0) items[editing] = value;
    else if (items.length < 40) items.push(value);
    else { A.setStatus(el('collageStatus'),'Giới hạn 40 ảnh trong thiệp.','error');return; }
    markDirty();renderList();resetForm();
  }
  async function load() {
    if (busy || loaded) return;
    busy = true;
    A.setStatus(el('collageStatus'),'Đang tải bố cục...');
    const {data,error} = await db.from('site_content').select('value_vi').eq('key','collage_layout').maybeSingle();
    busy = false;
    if (error) { A.setStatus(el('collageStatus'),error.message,'error');return; }
    if (data?.value_vi) {
      try {
        items = normalize(JSON.parse(data.value_vi).items);
      } catch {
        A.setStatus(el('collageStatus'),'Cấu hình hiện tại không hợp lệ. Chưa chỉnh sửa dữ liệu.','error');
        return;
      }
      A.setStatus(el('collageStatus'),'Đã tải bố cục đang Publish.','success');
    } else {
      items = seed();
      A.setStatus(el('collageStatus'),'Bố cục gợi ý đang hiển thị trên website. Nhấn Publish để lưu lựa chọn của bạn.','');
    }
    loaded = true;
    dirty = false;
    renderPicker();renderList();
  }

  el('collageAdd')?.addEventListener('click',addOrUpdate);
  el('collageCancel')?.addEventListener('click',resetForm);
  el('collageList')?.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || !items[index]) return;
    const action = button.dataset.action;
    if (action === 'edit') editItem(index);
    else if (action === 'remove') { items.splice(index,1);markDirty();renderList();resetForm(); }
    else if (action === 'up' || action === 'down') swapInSlot(index,action === 'up' ? -1 : 1);
  });
  let dragging = -1;
  el('collageList')?.addEventListener('dragstart', event => {
    const row = event.target.closest('.collage-item');
    if (!row) return;
    dragging = Number(row.dataset.index);
    event.dataTransfer.effectAllowed = 'move';
  });
  el('collageList')?.addEventListener('dragover', event => {
    const row = event.target.closest('.collage-item');
    if (row && dragging >= 0 && items[dragging]?.slot === items[Number(row.dataset.index)]?.slot) event.preventDefault();
  });
  el('collageList')?.addEventListener('drop', event => {
    const row = event.target.closest('.collage-item');
    if (!row || dragging < 0) return;
    const target = Number(row.dataset.index);
    if (dragging !== target && items[dragging]?.slot === items[target]?.slot) {
      event.preventDefault();
      const [item] = items.splice(dragging,1);
      items.splice(target,0,item);
      markDirty();renderList();
    }
    dragging = -1;
  });
  el('collageList')?.addEventListener('dragend',() => { dragging = -1; });

  el('collageSave')?.addEventListener('click', async () => {
    if (!loaded || busy) return;
    const missing = items.some(item => !published().some(img => img.id === item.imageId));
    if (missing) { A.setStatus(el('collageStatus'),'Có ảnh chưa Publish hoặc đã bị xóa. Hãy sửa trước khi lưu.','error');return; }
    busy = true;
    const btn = el('collageSave');
    btn.disabled = true;
    A.setStatus(el('collageStatus'),'Đang Publish bố cục...');
    const payload = {
      key:'collage_layout', value_vi:JSON.stringify({version:1,items}),
      value_en:null, value_ja:null, updated_at:new Date().toISOString()
    };
    const {error} = await db.from('site_content').upsert(payload,{onConflict:'key'});
    busy = false;btn.disabled = false;
    if (error) { A.setStatus(el('collageStatus'),error.message,'error');return; }
    dirty = false;
    A.setStatus(el('collageStatus'),'Đã Publish! Tải lại thiệp để xem thay đổi.','success');
  });
  document.addEventListener('admin:collage',() => { renderPicker();if (!loaded) load();else renderList(); });
  document.addEventListener('admin:data',() => { renderPicker();if (loaded && !dirty) renderList(); });
})();
