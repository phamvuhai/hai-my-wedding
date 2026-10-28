(() => {
  const dictionaries = {
    vi: {
      "nav.story":"Câu chuyện","nav.events":"Lịch cưới","nav.rsvp":"Xác nhận",
      "name.groom":"Hải Phạm","name.bride":"Mỹ Nguyễn",
      "hero.note":"Từ hai hành trình riêng, chúng mình đã tìm thấy một người để cùng bước tiếp. Niềm vui ấy sẽ trọn vẹn hơn khi được sẻ chia cùng bạn trong ngày chúng mình về chung một nhà.","hero.cta":"Xem lịch cưới",
      "intro.open":"MỞ THIỆP","intro.tap":"Một lời mời dành cho bạn","intro.hint":"Nhấn vào phong bì hoặc nút bên dưới để mở","intro.invite":"TRÂN TRỌNG KÍNH MỜI","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026","intro.formalLead":"Đến chung vui cùng chúng tôi trong ngày hạnh phúc","intro.eventDate":"18 — 20 · 12 · 2026","intro.eventPlace":"TP. HỒ CHÍ MINH · RẠCH GIÁ","intro.closing":"Sự hiện diện của bạn là niềm vui của chúng tôi.",
      "promise.kicker":"LỜI HẸN CỦA CHÚNG MÌNH","promise.title":"Và rồi, chúng mình chọn nhau.","promise.body1":"Chúng mình không hứa rằng chặng đường phía trước sẽ luôn dễ dàng. Nhưng qua từng ngày, chúng mình càng tin rằng điều đáng quý nhất là có một người để lắng nghe, sẻ chia và cùng bước tiếp.","promise.body2":"Vì thế, Hải và Mỹ chọn nắm tay nhau, cùng xây dựng một mái nhà, gìn giữ những điều bình dị và đón chờ những chặng đường phía trước — bằng tình yêu, sự kiên nhẫn và một lời hẹn luôn có nhau.","promise.signature":"Hải ♡ Mỹ","promise.caption":"MỘT LỜI HẸN · MỘT MÁI NHÀ","events.monthYear":"THÁNG 12 · 2026","events.photoCaption":"Hai gia đình, một niềm hạnh phúc.","events.brideTag":"GIA ĐÌNH NHÀ GÁI","events.groomTag":"GIA ĐÌNH NHÀ TRAI","events.selectDay":"Chọn lịch cưới nhà gái hoặc nhà trai","story.title":"Từ hai hành trình, chung một mái nhà","story.text":"Tình yêu của chúng mình không chỉ là những khoảnh khắc đáng nhớ, mà còn là sự quan tâm trong những ngày bình thường: một lời hỏi han, một nụ cười và cảm giác an tâm khi có nhau ở cạnh. Qua từng ngày, chúng mình học cách lắng nghe, sẻ chia và cùng vun đắp những dự định. Rồi một ngày, điều giản dị nhất trở thành điều quan trọng nhất: được gọi nhau là gia đình.",
      "countdown.title":"Đếm ngược\nđến ngày vui","countdown.short":"Ngày mình về chung một nhà","countdown.month":"THÁNG 12","countdown.days":"Ngày","countdown.hours":"Giờ","countdown.minutes":"Phút","countdown.seconds":"Giây",
      "events.title":"Lịch cưới","events.subtitle":"Từ lễ gia tiên đến tiệc mừng, mỗi khoảnh khắc đều thêm ý nghĩa nhờ sự hiện diện của người thân và bạn bè. Chọn Nhà gái hoặc Nhà trai để xem thời gian, địa điểm và chỉ đường.","events.status.label":"Đang xem",
      "family.bride":"Nhà gái","family.groom":"Nhà trai","event.home":"TƯ GIA","event.reception":"TIỆC CƯỚI",
      "event.vuquy":"Lễ Vu Quy","event.thanhhon":"Lễ Thành Hôn","event.reception.title":"Tiệc cưới","event.friday":"Thứ Sáu · 18.12.2026","event.sunday":"Chủ Nhật · 20.12.2026","event.friday.short":"Thứ Sáu","event.sunday.short":"Chủ Nhật",
      "map.open":"Mở bản đồ","map.directions":"Chỉ đường",
      "gallery.title":"Những điều mình muốn giữ mãi","gallery.subtitle":"Có những bức ảnh lưu lại một nụ cười, có những bức ảnh nhắc ta nhớ một ngày bình yên. Mỗi khoảnh khắc đều là một mảnh ghép của câu chuyện mà Hải và Mỹ sẽ luôn trân trọng.","gallery.empty":"Album đang được chuẩn bị ♡","gallery.view":"Xem toàn bộ album →",
      "guide.arrival.text":"Bạn nên có mặt trước giờ bắt đầu khoảng 15–20 phút để thuận tiện đón tiếp.",
      "rsvp.title":"Hẹn gặp bạn trong ngày vui nhé?","rsvp.subtitle":"Được đón bạn đến chung vui là niềm hạnh phúc của chúng mình. Hãy dành ít phút xác nhận tham dự để Hải và Mỹ có thể chuẩn bị chu đáo và đón tiếp bạn thật trọn vẹn nhé!",
      "rsvp.namePlaceholder":"Nguyễn Văn A","rsvp.phonePlaceholder":"09xx xxx xxx","rsvp.messagePlaceholder":"Gửi một lời chúc đến cô dâu chú rể...","rsvp.name":"Họ và tên","rsvp.phone":"Số điện thoại","rsvp.optional":"(không bắt buộc)","rsvp.attend":"Bạn có thể tham dự?","rsvp.yes":"Có, tôi sẽ đến","rsvp.no":"Rất tiếc, tôi không thể","rsvp.count":"Số người tham dự","rsvp.event":"Tham dự sự kiện","rsvp.message":"Gửi một lời chúc ♡","rsvp.submit":"Gửi xác nhận",
      "rsvp.guest1":"1 người","rsvp.guest2":"2 người","rsvp.guest3":"3 người","rsvp.guest4":"4 người","rsvp.guest5":"5 người",
      "rsvp.bride":"Nhà gái — 18/12/2026","rsvp.groom":"Nhà trai — 20/12/2026","rsvp.both":"Cả hai ngày",
      "rsvp.sending":"Đang gửi xác nhận...","rsvp.success":"Cảm ơn bạn! Hải Phạm và Mỹ Nguyễn đã nhận được xác nhận ❤️","rsvp.updated":"Đã cập nhật phản hồi của bạn ❤️","rsvp.sentButton":"✓ Đã gửi RSVP","rsvp.updatedButton":"✓ Đã cập nhật RSVP","rsvp.error":"Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.","rsvp.maxGuestsError":"Số người tham dự vượt quá giới hạn của thiệp mời.","rsvp.eventError":"Vui lòng chọn sự kiện bạn sẽ tham dự.",
      "footer.thanks":"Cảm ơn bạn đã dành tình cảm, lời chúc và thời gian quý báu cho chúng mình. Hành trình mới sẽ đẹp hơn khi có những người thân yêu cùng chứng kiến. Thương mến, Hải & Mỹ ♡","footer.month":"Tháng 12 · 2026",
      "album.back":"← Về thiệp cưới","album.title":"Album của Hải Phạm và Mỹ Nguyễn","album.subtitle":"Những khoảnh khắc chúng tôi muốn lưu lại cùng nhau.","album.loading":"Đang tải album...","album.all":"Tất cả","album.empty":"Album này chưa có ảnh. Hẹn bạn quay lại sớm nhé ♡","album.moments":"khoảnh khắc","album.close":"Đóng","album.prev":"Ảnh trước","album.next":"Ảnh tiếp theo",
      "album.prewedding":"Pre-Wedding","album.bride":"Nhà gái","album.groom":"Nhà trai"
    },
    en: {
      "nav.story":"Our Story","nav.events":"Wedding Events","nav.rsvp":"RSVP",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"From two different paths, we found someone to walk beside for a lifetime. Our celebration will be even more meaningful with you there to share the joy.","hero.cta":"View wedding schedule",
      "intro.open":"OPEN INVITATION","intro.tap":"A little invitation for you","intro.hint":"Click the envelope or button below to open","intro.invite":"YOU ARE CORDIALLY INVITED","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026","intro.formalLead":"Join us in celebrating our special day","intro.eventDate":"18 — 20 · 12 · 2026","intro.eventPlace":"HO CHI MINH CITY · RACH GIA","intro.closing":"Your presence would mean so much to us.",
      "promise.kicker":"OUR PROMISE","promise.title":"And so, we choose each other.","promise.body1":"We cannot promise that every day ahead will be easy. But with each passing day, we have come to believe that one of life's greatest gifts is having someone to listen, share the little things, and walk beside us.","promise.body2":"And so, Hai and My choose each other: to build a home, treasure the ordinary moments, and welcome every new chapter with love, patience, and a promise to stand by one another.","promise.signature":"Hai ♡ My","promise.caption":"ONE PROMISE · ONE HOME","events.monthYear":"DECEMBER · 2026","events.photoCaption":"Two families, one beautiful celebration.","events.brideTag":"BRIDE'S FAMILY","events.groomTag":"GROOM'S FAMILY","events.selectDay":"Choose the bride's or groom's wedding schedule","story.title":"Two paths, one home","story.text":"Our love is not made only of extraordinary moments. It lives in everyday kindness, shared laughter, and the quiet comfort of being together. With time, we have learned to listen, care and dream side by side. And the simplest wish has become our most meaningful promise: to build a home together.",
      "countdown.title":"Counting down\nto our day","countdown.short":"Until we say “I do”","countdown.month":"DECEMBER","countdown.days":"Days","countdown.hours":"Hours","countdown.minutes":"Minutes","countdown.seconds":"Seconds",
      "events.title":"Wedding Events","events.subtitle":"From our family ceremonies to the wedding celebrations, every moment means more with loved ones beside us. Choose the bride's or groom's family for times, venues and directions.","events.status.label":"Viewing",
      "family.bride":"Bride's Family","family.groom":"Groom's Family","event.home":"AT HOME","event.reception":"RECEPTION",
      "event.vuquy":"Bride's Ceremony","event.thanhhon":"Wedding Ceremony","event.reception.title":"Wedding Reception","event.friday":"Friday · 18.12.2026","event.sunday":"Sunday · 20.12.2026","event.friday.short":"Friday","event.sunday.short":"Sunday",
      "map.open":"Open map","map.directions":"Directions",
      "gallery.title":"The moments we hold dear","gallery.subtitle":"Some photographs hold a smile; others bring back a peaceful afternoon. Each one is a little piece of the story we will treasure together.","gallery.empty":"Our album is being prepared ♡","gallery.view":"View full album →",
      "guide.arrival.text":"We recommend arriving about 15–20 minutes before the scheduled start time.",
      "rsvp.title":"Will you celebrate with us?","rsvp.subtitle":"Having you celebrate with us would mean so much. Please take a moment to reply, so we can make thoughtful arrangements and welcome you warmly.",
      "rsvp.namePlaceholder":"Your full name","rsvp.phonePlaceholder":"Phone number (optional)","rsvp.messagePlaceholder":"Write a message to the couple...","rsvp.name":"Full name","rsvp.phone":"Phone number","rsvp.optional":"(optional)","rsvp.attend":"Will you be able to attend?","rsvp.yes":"Yes, I'll be there","rsvp.no":"Sorry, I can't attend","rsvp.count":"Number of guests","rsvp.event":"Event attendance","rsvp.message":"Leave us a little wish ♡","rsvp.submit":"Send RSVP",
      "rsvp.guest1":"1 guest","rsvp.guest2":"2 guests","rsvp.guest3":"3 guests","rsvp.guest4":"4 guests","rsvp.guest5":"5 guests",
      "rsvp.bride":"Bride's family — 18/12/2026","rsvp.groom":"Groom's family — 20/12/2026","rsvp.both":"Both days",
      "rsvp.sending":"Sending your RSVP...","rsvp.success":"Thank you! Hai Pham & My Nguyen received your RSVP ❤️","rsvp.updated":"Your RSVP has been updated ❤️","rsvp.sentButton":"✓ RSVP sent","rsvp.updatedButton":"✓ RSVP updated","rsvp.error":"We couldn't send your RSVP. Please try again or contact the bride and groom directly.","rsvp.maxGuestsError":"The number of guests exceeds this invitation's limit.","rsvp.eventError":"Please choose the event you will attend.",
      "footer.thanks":"Thank you for your love, kind wishes and the gift of your time. This new chapter becomes all the more beautiful because we can share it with you. With love, Hai & My ♡","footer.month":"December 2026",
      "album.back":"← Back to invitation","album.title":"Hai Pham & My Nguyen's Album","album.subtitle":"The moments we want to keep and share with you.","album.loading":"Loading album...","album.all":"All","album.empty":"This album does not have photos yet. Please come back soon ♡","album.moments":"moments","album.close":"Close","album.prev":"Previous photo","album.next":"Next photo",
      "album.prewedding":"Pre-Wedding","album.bride":"Bride's Family","album.groom":"Groom's Family"
    },
    ja: {
      "nav.story":"ふたりのストーリー","nav.events":"結婚式の日程","nav.rsvp":"出欠確認",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"それぞれの道を歩んできたふたりが出会い、これから同じ未来へ進むことになりました。大切な節目を、ぜひ皆さまと一緒にお祝いできれば幸いです。","hero.cta":"結婚式の日程を見る",
      "intro.open":"招待状を開く","intro.tap":"あなたへの招待状","intro.hint":"封筒または下のボタンを押して開く","intro.invite":"心よりご招待申し上げます","intro.date":"2026 · 12 · 18 — 2026 · 12 · 20","intro.formalLead":"私たちの大切な日に、ぜひご一緒にお祝いください","intro.eventDate":"2026 · 12 · 18 — 2026 · 12 · 20","intro.eventPlace":"ホーチミン市 · ラックザー","intro.closing":"お越しいただけることを、心より楽しみにしております。",
      "promise.kicker":"ふたりの約束","promise.title":"そして、これからもふたりで。","promise.body1":"これからの毎日が、いつも穏やかとは限りません。それでも、互いの声に耳を傾け、ささやかな喜びを分かち合い、支え合いながら歩んでいくことが、何より大切だと感じています。","promise.body2":"だからこそ私たちは、これからもともに歩むことを選びました。日々の小さな幸せを大切にし、愛情と思いやりを重ねながら、温かな家庭を築いていきます。","promise.signature":"ハイ ♡ ミー","promise.caption":"ひとつの約束 · ふたりの未来","events.monthYear":"2026年12月","events.photoCaption":"ふたつの家族が、ひとつになる日。","events.brideTag":"新婦側のご家族","events.groomTag":"新郎側のご家族","events.selectDay":"新婦側または新郎側の日程を選択","story.title":"ふたつの道から、ひとつの未来へ","story.text":"私たちの愛は、特別な出来事だけでなく、何気ない毎日の中で育まれてきました。小さな気遣いや笑顔、隣にいるだけで感じる安心感。互いの気持ちに耳を傾け、喜びも悩みも分かち合いながら、同じ未来を思い描くようになりました。そして今、ふたりで家族になる日を迎えます。",
      "countdown.title":"幸せの日まで\nあと","countdown.short":"ふたりが家族になる日まで","countdown.month":"12月","countdown.days":"日","countdown.hours":"時間","countdown.minutes":"分","countdown.seconds":"秒",
      "events.title":"結婚式の日程","events.subtitle":"ご家族へのご挨拶から披露宴まで、大切な皆さまと喜びを分かち合えることを楽しみにしています。新婦側・新郎側を選んで、日時と会場をご確認ください。","events.status.label":"表示中",
      "family.bride":"新婦側","family.groom":"新郎側","event.home":"ご自宅","event.reception":"披露宴",
      "event.vuquy":"新婦側の婚礼の儀","event.thanhhon":"結婚の儀","event.reception.title":"披露宴","event.friday":"金曜日 · 18.12.2026","event.sunday":"日曜日 · 20.12.2026","event.friday.short":"金曜日","event.sunday.short":"日曜日",
      "map.open":"地図を開く","map.directions":"ルート案内",
      "gallery.title":"いつまでも大切にしたい瞬間","gallery.subtitle":"一枚の写真に笑顔が残り、また一枚には何気ない日の温かさが宿っています。どの瞬間も、ふたりがこれからも大切にしたい物語の一部です。","gallery.empty":"アルバムを準備中です ♡","gallery.view":"アルバムをすべて見る →",
      "guide.arrival.text":"開始予定時刻の15〜20分前を目安にお越しいただくとスムーズです。",
      "rsvp.title":"私たちの大切な日に、ぜひお越しください","rsvp.subtitle":"皆さまにお越しいただけることが、私たちにとって何よりの喜びです。心を込めてお迎えするため、出欠のご回答にご協力いただけますと幸いです。",
      "rsvp.namePlaceholder":"お名前をご入力ください","rsvp.phonePlaceholder":"電話番号（任意）","rsvp.messagePlaceholder":"新郎新婦へのメッセージをご記入ください...","rsvp.name":"お名前","rsvp.phone":"電話番号","rsvp.optional":"（任意）","rsvp.attend":"ご出席いただけますか？","rsvp.yes":"はい、出席します","rsvp.no":"申し訳ありませんが、欠席します","rsvp.count":"ご参加人数","rsvp.event":"ご出席の日程","rsvp.message":"ふたりへのひとこと ♡","rsvp.submit":"出欠を送信",
      "rsvp.guest1":"1名","rsvp.guest2":"2名","rsvp.guest3":"3名","rsvp.guest4":"4名","rsvp.guest5":"5名",
      "rsvp.bride":"新婦側 — 18/12/2026","rsvp.groom":"新郎側 — 20/12/2026","rsvp.both":"両日",
      "rsvp.sending":"送信しています...","rsvp.success":"ありがとうございます。ご出欠の回答を受け付けました ❤️","rsvp.updated":"RSVPを更新しました ❤️","rsvp.sentButton":"✓ RSVPを送信しました","rsvp.updatedButton":"✓ RSVPを更新しました","rsvp.error":"送信できませんでした。もう一度お試しいただくか、新郎新婦へ直接ご連絡ください。","rsvp.maxGuestsError":"参加人数がこの招待状の上限を超えています。","rsvp.eventError":"参加するイベントを選択してください。",
      "footer.thanks":"温かいお祝いのお気持ちと、大切なお時間をありがとうございます。皆さまに見守っていただけることが、私たちの新しい門出をより特別なものにしてくれます。感謝を込めて、ハイ＆ミー ♡","footer.month":"2026年12月",
      "album.back":"← 招待状へ戻る","album.title":"Hai Pham & My Nguyen のアルバム","album.subtitle":"ふたりで大切に残していきたい瞬間です。","album.loading":"アルバムを読み込み中...","album.all":"すべて","album.empty":"このアルバムにはまだ写真がありません。またぜひご覧ください ♡","album.moments":"枚の思い出","album.close":"閉じる","album.prev":"前の写真","album.next":"次の写真",
      "album.prewedding":"前撮り","album.bride":"新婦側","album.groom":"新郎側"
    }
  };

  const labels = {vi:"VI",en:"EN",ja:"日本語"};
  const supported = ["vi","en","ja"];

  function resolveInitialLanguage() {
    const parts = location.pathname.split("/").filter(Boolean);
    const pathLang = parts[0];
    if (pathLang === "jp" || pathLang === "ja") return "ja";
    if (supported.includes(pathLang)) return pathLang;

    const queryLang = new URLSearchParams(location.search).get("lang");
    if (queryLang === "jp" || queryLang === "ja") return "ja";
    if (supported.includes(queryLang)) return queryLang;

    // Root and non-localized public URLs always default to Vietnamese.
    return "vi";
  }

  function pathParts() {
    return location.pathname.split("/").filter(Boolean);
  }

  function isAlbumPage() {
    return pathParts().includes("album");
  }

  function inviteTokenFromPath() {
    const parts = pathParts();
    const i = parts.indexOf("invite");
    return i >= 0 && parts[i + 1] ? parts[i + 1] : new URLSearchParams(location.search).get("invite");
  }

  function publicCode(lang) {
    return lang === "ja" ? "jp" : lang;
  }

  function routeFor(lang) {
    const code = publicCode(lang);
    if (isAlbumPage()) return `/${code}/album`;
    const token = inviteTokenFromPath();
    return token ? `/${code}/invite/${encodeURIComponent(token)}` : `/${code}`;
  }

  let current = resolveInitialLanguage();
  localStorage.setItem("wedding_language", current);

  function t(key) {
    return dictionaries[current]?.[key] ?? dictionaries.vi[key] ?? key;
  }

  async function loadContentOverrides() {
    const cfg = window.WEDDING_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;
    try {
      const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data, error } = await db.from('site_content').select('key,value_vi,value_en,value_ja');
      if (error) throw error;
      (data || []).forEach(row => {
        if (row.value_vi) dictionaries.vi[row.key] = row.value_vi;
        if (row.value_en) dictionaries.en[row.key] = row.value_en;
        if (row.value_ja) dictionaries.ja[row.key] = row.value_ja;
      });
      apply();
      document.dispatchEvent(new Event('wedding:content-loaded'));
    } catch (error) {
      console.warn('Content overrides unavailable:', error);
    }
  }

  function apply(root=document) {
    document.documentElement.lang = current === "ja" ? "ja" : current;
    root.querySelectorAll("[data-i18n]").forEach(el => {
      const value = t(el.dataset.i18n);
      if (value != null) el.textContent = value;
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(el => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    root.querySelectorAll("[data-lang]").forEach(el => {
      el.classList.toggle("active", el.dataset.lang === current);
      el.setAttribute("aria-pressed", el.dataset.lang === current ? "true" : "false");
    });
    const code = publicCode(current);
    root.querySelectorAll("[data-home-link]").forEach(el => el.setAttribute("href", `/${code}`));
    root.querySelectorAll("[data-album-link]").forEach(el => el.setAttribute("href", `/${code}/album`));
    document.dispatchEvent(new CustomEvent("wedding:language", {detail:{lang:current}}));
  }

  function setLanguage(lang) {
    if (!supported.includes(lang)) return;
    current = lang;
    localStorage.setItem("wedding_language", lang);

    // "/" is the invitation-entry route. While the cover is visible, changing
    // language only localizes the cover; the localized URL is chosen on open.
    const entryCoverActive =
      location.pathname === "/" &&
      document.body.classList.contains("invitation-locked");

    if (!entryCoverActive) {
      const nextPath = routeFor(lang);
      if (location.pathname !== nextPath) {
        history.replaceState(history.state || {}, "", nextPath + location.search + location.hash);
      }
    }

    apply();
  }

  function mount() {
    document.querySelectorAll("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });

    const firstSegment = location.pathname.split("/").filter(Boolean)[0];
    if (firstSegment === "ja") {
      history.replaceState(history.state || {}, "", routeFor("ja") + location.search + location.hash);
    }

    apply();
    loadContentOverrides();
  }

  window.WeddingI18n = {t, apply, setLanguage, publicCode, get language(){return current;}, labels};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();