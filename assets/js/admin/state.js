(() => {
  const cfg = window.WEDDING_CONFIG || {};
  const A = window.AdminApp = {
    ADMIN_EMAIL: 'phamvuhai23@gmail.com',
    albums: [], images: [], rsvps: [], guests: [], contentRows: [], editRecord: null,
    sourceImage: null, sourceBlob: null, sourceName: '', rotation: 0,
    esc: s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])),
    safeName: s => String(s || 'image').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase(),
    setStatus(el,msg,type=''){ el.textContent=msg; el.className='status '+type; }
  };
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;
  A.db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  A.publicUrl = path => A.db.storage.from('wedding-gallery').getPublicUrl(path).data.publicUrl;
  A.loadData = async () => {
    const [a,i] = await Promise.all([
      A.db.from('gallery_albums').select('*').order('sort_order'),
      A.db.from('gallery_images').select('*').order('sort_order').order('created_at',{ascending:false})
    ]);
    if (a.error || i.error) throw (a.error || i.error);
    A.albums = a.data || []; A.images = i.data || [];
    document.dispatchEvent(new CustomEvent('admin:data'));
  };
})();