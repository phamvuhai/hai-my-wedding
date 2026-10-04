(() => {
  const cfg = window.WEDDING_CONFIG || {};
  let client = null;
  let currentInvite = null;
  let welcomeTimer = null;

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

  function displayName(invite) {
    if (!invite) return '';
    const display = invite.display_name || invite.guest_name || '';
    return invite.companion_name ? `${display} & ${invite.companion_name}` : display;
  }

  function copyFor(language, invite) {
    if (language === 'jp') language = 'ja';
    const display = displayName(invite);
    const texts = {
      vi: {
        kicker: 'TRÂN TRỌNG KÍNH MỜI',
        lead: 'đến chung vui cùng chúng mình trong ngày trọng đại.',
        note: 'Sự hiện diện của bạn sẽ là niềm vui và vinh hạnh của Hải & Mỹ.',
        private: 'Thiệp mời này được dành riêng cho',
        open: 'MỞ THIỆP CƯỚI',
        welcomeTitle: display
          ? `Cảm ơn ${display} đã ghé xem thiệp cưới của chúng mình ♡`
          : 'Cảm ơn bạn đã ghé xem thiệp cưới của chúng mình ♡',
        welcomeBody: 'Sự hiện diện của bạn sẽ làm ngày vui của Hải & Mỹ thêm trọn vẹn.',
        privateLinkTitle: 'Link thiệp riêng của bạn',
        privateLinkText: 'Link này đi kèm tên và phản hồi RSVP của bạn, vì vậy vui lòng không chia sẻ cho người khác. Nếu muốn chia sẻ website cưới, hãy dùng link chung:',
        rsvpPrivateTitle: 'Bạn có thể cập nhật lại phản hồi',
        rsvpPrivateText: 'Bạn có thể sửa tên và cập nhật RSVP bất cứ lúc nào bằng chính link thiệp này. Vì đây là link cá nhân, vui lòng không chia sẻ.',
        publicLinkLabel: 'Link chung của Hải & Mỹ'
      },
      en: {
        kicker: 'YOU ARE CORDIALLY INVITED',
        lead: 'to celebrate this special day with us.',
        note: 'Your presence would mean so much to Hai & My.',
        private: 'This invitation is specially prepared for',
        open: 'OPEN INVITATION',
        welcomeTitle: display
          ? `Thank you, ${display}, for opening our wedding invitation ♡`
          : 'Thank you for opening our wedding invitation ♡',
        welcomeBody: "We can't wait to celebrate this special day with you.",
        privateLinkTitle: 'Your private invitation link',
        privateLinkText: 'This link is tied to your name and RSVP, so please do not share it with others. To share our wedding website, please use the public link:',
        rsvpPrivateTitle: 'You can update your RSVP',
        rsvpPrivateText: 'You can edit your name and update your RSVP anytime using this invitation link. Because it is personal to you, please do not share it.',
        publicLinkLabel: 'Hai & My public wedding link'
      },
      ja: {
        kicker: '心よりご招待申し上げます',
        lead: '私たちの大切な日を一緒にお祝いください。',
        note: 'ご出席いただけることを、Hai & My 心より楽しみにしております。',
        private: 'この招待状は',
        privateSuffix: 'のためにご用意しました',
        open: '招待状を見る',
        welcomeTitle: display
          ? `${display} 様、招待状をご覧いただきありがとうございます ♡`
          : '私たちの結婚式の招待状をご覧いただき、ありがとうございます ♡',
        welcomeBody: '大切な一日を一緒にお祝いできることを楽しみにしています。',
        privateLinkTitle: 'あなた専用の招待リンク',
        privateLinkText: 'このリンクにはお名前とRSVP情報が紐づいているため、他の方には共有しないでください。ウェディングサイトを共有する場合は、共通リンクをご利用ください。',
        rsvpPrivateTitle: 'RSVPはいつでも更新できます',
        rsvpPrivateText: 'この招待リンクから、お名前やRSVP内容をいつでも変更できます。個人専用リンクのため、他の方への共有はお控えください。',
        publicLinkLabel: 'Hai & My 共通リンク'
      }
    };
    return {...(texts[language] || texts.vi), display};
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
      if (!c.display) {
        privateEl.textContent = '';
        privateEl.hidden = true;
      } else if (lang() === 'ja') {
        privateEl.textContent = `${c.private} ${c.display} 様 ${c.privateSuffix}`;
        privateEl.hidden = false;
      } else {
        privateEl.textContent = `${c.private} ${c.display}`;
        privateEl.hidden = false;
      }
    }
    if (openLabel) openLabel.textContent = c.open;
    renderPrivateNotices(invite);
    applyInviteEventPriority(invite);
  }

  function renderPrivateNotices(invite) {
    const c = copyFor(lang(), invite);
    const publicUrl = location.origin;

    const cover = document.getElementById('personalLinkNotice');
    const coverTitle = document.getElementById('personalLinkNoticeTitle');
    const coverText = document.getElementById('personalLinkNoticeText');
    const coverLink = document.getElementById('personalPublicLink');
    const rsvpNotice = document.getElementById('rsvpPersonalNotice');
    const rsvpTitle = document.getElementById('rsvpPersonalNoticeTitle');
    const rsvpText = document.getElementById('rsvpPersonalNoticeText');
    const rsvpLink = document.getElementById('rsvpPublicLink');

    [cover, rsvpNotice].forEach(el => { if (el) el.hidden = !invite; });
    if (!invite) return;

    if (coverTitle) coverTitle.textContent = c.privateLinkTitle;
    if (coverText) coverText.textContent = c.privateLinkText;
    if (rsvpTitle) rsvpTitle.textContent = c.rsvpPrivateTitle;
    if (rsvpText) rsvpText.textContent = c.rsvpPrivateText;

    [coverLink, rsvpLink].forEach(link => {
      if (!link) return;
      link.href = publicUrl;
      link.textContent = `${c.publicLinkLabel}: ${publicUrl}`;
    });
  }

  function applyInviteEventPriority(invite) {
    if (!invite) return;
    const choice = invite.event_choice || 'both';
    const invitedDays = choice === 'both' ? ['bride', 'groom'] : [choice];
    const activeDay = choice === 'groom' ? 'groom' : 'bride';
    const language = lang() === 'jp' ? 'ja' : lang();
    const badgeLabel = {
      vi: 'Dành cho bạn',
      en: 'Your invitation',
      ja: 'ご招待'
    }[language] || 'Dành cho bạn';

    document.querySelectorAll('.event-invite-badge').forEach(badge => {
      badge.textContent = badgeLabel;
    });

    if (window.WeddingEvents?.setEventDay) {
      window.WeddingEvents.setEventDay(activeDay, { invitedDays });
    } else {
      const section = document.getElementById('events');
      if (section) {
        section.dataset.activeDay = activeDay;
        section.dataset.invitedDays = invitedDays.join(',');
      }
    }
  }

  function renderWelcome(invite = currentInvite) {
    const overlay = document.getElementById('inviteWelcome');
    const title = document.getElementById('inviteWelcomeTitle');
    const body = document.getElementById('inviteWelcomeBody');
    if (!overlay || !title || !body) return;

    const c = copyFor(lang(), invite);
    title.textContent = c.welcomeTitle;
    body.textContent = c.welcomeBody;
  }

  function dismissWelcome() {
    const overlay = document.getElementById('inviteWelcome');
    if (!overlay || !overlay.classList.contains('is-visible')) return;
    clearTimeout(welcomeTimer);
    overlay.classList.add('is-leaving');
    welcomeTimer = setTimeout(() => {
      overlay.classList.remove('is-visible', 'is-leaving');
      overlay.setAttribute('aria-hidden', 'true');
    }, 420);
  }

  function showWelcome() {
    const overlay = document.getElementById('inviteWelcome');
    if (!overlay) return;

    renderWelcome(currentInvite);
    clearTimeout(welcomeTimer);
    overlay.classList.remove('is-leaving');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');

    welcomeTimer = setTimeout(dismissWelcome, 3000);
  }

  function bindWelcomeDismiss() {
    const dismiss = () => dismissWelcome();
    window.addEventListener('scroll', dismiss, {passive:true});
    window.addEventListener('wheel', dismiss, {passive:true});
    window.addEventListener('touchmove', dismiss, {passive:true});
    document.addEventListener('pointerdown', dismiss, {passive:true});
    document.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp',' ','Enter','Escape'].includes(event.key)) dismissWelcome();
    });
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
      nameInput.readOnly = false;
      delete nameInput.dataset.inviteLocked;
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

  async function loadExistingRsvp(token) {
    const database = db();
    const form = document.getElementById('rsvpForm');
    if (!database || !form || !token) return;

    try {
      const { data, error } = await database.rpc('get_wedding_rsvp', {p_token: token});
      if (error) throw error;
      const rsvp = Array.isArray(data) ? data[0] : data;
      if (!rsvp) return;

      const nameInput = form.querySelector('[name="name"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const guestSelect = form.querySelector('[name="guest_count"]');
      const eventSelect = form.querySelector('[name="event_choice"]');
      const messageInput = form.querySelector('[name="message"]');
      const attendance = form.querySelector(`[name="attending"][value="${rsvp.attendance}"]`);

      if (nameInput) nameInput.value = rsvp.guest_name || nameInput.value;
      if (phoneInput) phoneInput.value = rsvp.phone || '';
      if (attendance) attendance.checked = true;
      if (guestSelect) guestSelect.value = String(rsvp.guest_count ?? 1);
      if (eventSelect && !eventSelect.disabled) eventSelect.value = rsvp.event_choice || 'both';
      if (messageInput) messageInput.value = rsvp.message || '';

      form.dataset.existingRsvpId = String(rsvp.id);
      form.dataset.responseSource = rsvp.response_source || 'invite';
    } catch (error) {
      console.warn('Unable to load existing RSVP:', error);
    }
  }

  async function markOpened() {
    const token = tokenFromUrl();
    if (!token || !currentInvite) return;
    const database = db();
    if (!database) return;
    try {
      await database.rpc('mark_wedding_invite_opened', {p_token: token});
      document.dispatchEvent(new CustomEvent('wedding:invite-opened', {
        detail: {inviteId: currentInvite.id}
      }));
    } catch (error) {
      console.warn('Unable to mark invitation opened:', error);
    }
  }

  async function load() {
    const token = tokenFromUrl();
    const database = db();

    if (!token || !database) {
      renderWelcome(null);
      return;
    }

    const { data, error } = await database.rpc('get_wedding_invite', { p_token: token });
    const invite = Array.isArray(data) ? data[0] : data;
    if (error || !invite) {
      document.body.classList.add('invite-invalid');
      renderWelcome(null);
      return;
    }

    currentInvite = invite;
    window.WeddingGuest = { token, invite };
    renderInvite(invite);
    renderWelcome(invite);
    renderPrivateNotices(invite);
    prefill(invite);
    await loadExistingRsvp(token);

    document.addEventListener('wedding:language', () => {
      renderInvite(invite);
      renderWelcome(invite);
      renderPrivateNotices(invite);
      applyInviteEventPriority(invite);
    });
  }

  document.addEventListener('wedding:invitation-opened', () => {
    showWelcome();
    markOpened();
  });

  window.WeddingPersonalized = { markOpened, showWelcome, dismissWelcome };

  bindWelcomeDismiss();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();