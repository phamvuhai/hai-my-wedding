(() => {
  const cfg = window.WEDDING_CONFIG || {};
  let client = null;

  function tokenFromUrl() {
    const parts = location.pathname.split('/').filter(Boolean);
    const i = parts.indexOf('invite');
    return (i >= 0 && parts[i + 1]) || new URLSearchParams(location.search).get('invite') || '';
  }

  function db() {
    if (client) return client;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
  }

  function lang() {
    return window.WeddingI18n?.language || 'vi';
  }

  function copyFor(language, invite) {
    const display = invite.display_name || invite.guest_name || '';
    const companion = invite.companion_name ? `${display} & ${invite.companion_name}` : display;
    const texts = {
      vi: {
        kicker: 'TRÂN TRỌNG KÍNH MỜI',
        lead: 'đến chung vui cùng chúng mình trong ngày trọng đại.',
        note: 'Sự hiện diện của bạn sẽ là niềm vui và vinh hạnh của Hải & Mỹ.',
        private: 'Thiệp mời này được dành riêng cho',
        open: 'MỞ THIỆP CƯỚI'
      },
      en: {
        kicker: 'YOU ARE CORDIALLY INVITED',
        lead: 'to celebrate this special day with us.',
        note: 'Your presence would mean so much to Hai & My.',
        private: 'This invitation is especially for',
        open: 'OPEN INVITATION'
      },
      ja: {
        kicker: '心よりご招待申し上げます',
        lead: '私たちの大切な日を一緒にお祝いください。',
        note: 'ご出席いただけることを、Hai & My 心より楽しみにしております。',
        private: 'こちらの招待状は',
        open: '招待状を見る'
      }
    };
    return {...(texts[language] || texts.vi), display: companion};
  }

  function renderInvite(invite) {
    const c = copyFor(lang(), invite);
    const nameEl = document.getElementById('personalInviteName');
    const leadEl = document.getElementById('personalInviteLead');
    const noteEl = document.getElementById('personalInviteNote');
    const privateEl = document.getElementById('personalInvitePrivate');
    const kickerEl = document.querySelector('.intro-invite');
    const openLabel = document.querySelector('#openInvitation [data-i18n="intro.open"]');

    if (kickerEl) kickerEl.textContent = c.kicker;
    if (nameEl) {
      nameEl.textContent = c.display;
      nameEl.hidden = !c.display;
    }
    if (leadEl) {
      leadEl.textContent = c.lead;
      leadEl.hidden = !c.display;
    }
    if (noteEl) {
      noteEl.textContent = c.note;
      noteEl.hidden = !c.display;
    }
    if (privateEl) {
      privateEl.textContent = c.display ? `${c.private} ${c.display}` : '';
      privateEl.hidden = !c.display;
    }
    if (openLabel) openLabel.textContent = c.open;
  }

  function prefill(invite) {
    const form = document.getElementById('rsvpForm');
    if (!form) return;

    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const eventSelect = form.querySelector('[name="event_choice"]');
    const guestSelect = form.querySelector('[name="guest_count"]');

    if (nameInput && invite.guest_name) {
      nameInput.value = invite.guest_name;
      nameInput.readOnly = true;
      nameInput.dataset.inviteLocked = 'true';
    }
    if (phoneInput && invite.phone) phoneInput.value = invite.phone;

    if (eventSelect && invite.event_choice) {
      eventSelect.value = invite.event_choice;
      if (invite.event_choice !== 'both') {
        [...eventSelect.options].forEach(o => o.hidden = o.value !== invite.event_choice);
        eventSelect.disabled = true;
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

  async function markOpened() {
    const token = tokenFromUrl();
    if (!token || !window.WeddingGuest?.invite) return;
    const database = db();
    if (!database) return;
    try {
      await database.rpc('mark_wedding_invite_opened', {p_token: token});
      document.dispatchEvent(new CustomEvent('wedding:invite-opened', {
        detail: {inviteId: window.WeddingGuest.invite.id}
      }));
    } catch (error) {
      console.warn('Unable to mark invitation opened:', error);
    }
  }

  async function load() {
    const token = tokenFromUrl();
    const database = db();
    if (!token || !database) return;

    const { data, error } = await database.rpc('get_wedding_invite', { p_token: token });
    const invite = Array.isArray(data) ? data[0] : data;
    if (error || !invite) {
      document.body.classList.add('invite-invalid');
      return;
    }

    window.WeddingGuest = { token, invite };
    renderInvite(invite);
    prefill(invite);

    document.addEventListener('wedding:language', () => renderInvite(invite));
    document.addEventListener('wedding:invitation-opened', markOpened, {once:true});
  }

  window.WeddingPersonalized = { markOpened };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();