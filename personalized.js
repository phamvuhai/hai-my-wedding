(() => {
  const cfg = window.WEDDING_CONFIG || {};

  function tokenFromUrl() {
    const parts = location.pathname.split('/').filter(Boolean);
    const i = parts.indexOf('invite');
    return (i >= 0 && parts[i + 1]) || new URLSearchParams(location.search).get('invite') || '';
  }

  async function load() {
    const token = tokenFromUrl();
    if (!token || !cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;

    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await db.rpc('get_wedding_invite', { p_token: token });
    const invite = Array.isArray(data) ? data[0] : data;
    if (error || !invite) return;

    window.WeddingGuest = { token, invite };

    const name = invite.guest_name || '';
    const introInvite = document.querySelector('.intro-invite');
    if (introInvite && name) {
      const guest = document.createElement('p');
      guest.className = 'intro-guest-name';
      guest.textContent = name;
      introInvite.insertAdjacentElement('afterend', guest);
    }

    const form = document.getElementById('rsvpForm');
    if (!form) return;

    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const eventSelect = form.querySelector('[name="event_choice"]');
    const guestSelect = form.querySelector('[name="guest_count"]');

    if (nameInput && name) nameInput.value = name;
    if (phoneInput && invite.phone) phoneInput.value = invite.phone;

    if (eventSelect && invite.event_choice) {
      eventSelect.value = invite.event_choice;
      if (invite.event_choice !== 'both') {
        [...eventSelect.options].forEach(o => o.hidden = o.value !== invite.event_choice);
      }
    }

    if (guestSelect && invite.max_guests) {
      [...guestSelect.options].forEach(o => {
        o.hidden = Number(o.value) > Number(invite.max_guests);
      });
      if (Number(guestSelect.value) > Number(invite.max_guests)) guestSelect.value = '1';
    }

    form.dataset.inviteId = invite.id;
    form.dataset.inviteEvent = invite.event_choice || 'both';
    form.dataset.maxGuests = String(invite.max_guests || 1);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();