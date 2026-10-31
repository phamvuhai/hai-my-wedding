(() => {
  const dictionaries = {
    vi: {
      "nav.story":"Câu chuyện","nav.events":"Lịch cưới","nav.rsvp":"Xác nhận",
      "name.groom":"Hải Phạm","name.bride":"Mỹ Nguyễn",
      "hero.note":"Giữa bao cuộc gặp gỡ, thật may mắn khi chúng mình tìm thấy nhau. Và từ hôm nay, hạnh phúc là biết rằng mọi chặng đường phía trước đều có nhau.","hero.cta":"Xem lịch cưới",
      "intro.open":"MỞ THIỆP","intro.tap":"Một lời mời dành cho bạn","intro.hint":"Nhấn vào phong bì hoặc nút bên dưới để mở","intro.invite":"TRÂN TRỌNG KÍNH MỜI","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026","intro.formalLead":"Đến chung vui cùng chúng tôi trong ngày hạnh phúc","intro.eventDate":"18 — 20 · 12 · 2026","intro.eventPlace":"TP. HỒ CHÍ MINH · RẠCH GIÁ","intro.closing":"Sự hiện diện của bạn là niềm vui của chúng tôi.",
      "promise.kicker":"LỜI HẸN CỦA CHÚNG MÌNH","promise.title":"Và rồi, mình chọn một đời có nhau.","promise.body1":"Chúng mình không mong cuộc sống lúc nào cũng êm đềm. Chỉ mong giữa những bộn bề, vẫn có một người để kể chuyện mỗi ngày, cùng lắng nghe, cùng sẻ chia và thấy lòng bình yên khi trở về.","promise.body2":"Từ hôm nay, Hải và Mỹ cùng vun đắp một mái nhà: nơi những niềm vui nhỏ được nâng niu, những ngày khó khăn có người bên cạnh và tình yêu được giữ gìn bằng sự dịu dàng, thấu hiểu.","promise.signature":"Hải ♡ Mỹ","promise.caption":"MỘT LỜI HẸN · MỘT MÁI NHÀ","events.cityBride":"TP. Hồ Chí Minh","events.cityGroom":"Rạch Giá, An Giang","events.monthYear":"THÁNG 12 · 2026","events.photoCaption":"Hai gia đình, một niềm hạnh phúc.","events.brideTag":"GIA ĐÌNH NHÀ GÁI","events.groomTag":"GIA ĐÌNH NHÀ TRAI","events.selectDay":"Chọn lịch cưới nhà gái hoặc nhà trai","story.title":"Từ những điều bình dị, đến một đời có nhau","story.text":"Tình yêu của chúng mình không bắt đầu bằng những điều lớn lao. Đó là những lời hỏi han, những tiếng cười và những câu chuyện chẳng muốn dừng lại. Qua từng ngày, Hải và Mỹ học cách lắng nghe, sẻ chia và cùng mơ về một mái nhà. Để rồi nhận ra: điều quý giá nhất không phải là tìm được một người hoàn hảo, mà là tìm được người khiến mình muốn cùng đi hết những năm tháng phía trước.",
      "countdown.title":"Đếm ngược\nđến ngày vui","countdown.short":"Ngày mình về chung một nhà","countdown.month":"THÁNG 12","countdown.days":"Ngày","countdown.hours":"Giờ","countdown.minutes":"Phút","countdown.seconds":"Giây",
      "events.title":"Lịch cưới","events.subtitle":"Từ lễ gia tiên ấm áp đến tiệc mừng cùng những người thương, từng khoảnh khắc sẽ đẹp hơn khi có bạn ở bên. Chọn Nhà gái hoặc Nhà trai để xem thời gian, địa điểm và chỉ đường.","events.status.label":"Đang xem",
      "family.bride":"Nhà gái","family.groom":"Nhà trai","event.home":"TƯ GIA","event.reception":"TIỆC CƯỚI",
      "event.vuquy":"Lễ Vu Quy","event.thanhhon":"Lễ Thành Hôn","event.reception.title":"Tiệc cưới","event.friday":"Thứ Sáu · 18.12.2026","event.sunday":"Chủ Nhật · 20.12.2026","event.friday.short":"Thứ Sáu","event.sunday.short":"Chủ Nhật",
      "map.open":"Mở bản đồ","map.directions":"Chỉ đường",
      "gallery.title":"Những điều mình muốn giữ mãi","gallery.subtitle":"Không phải bức ảnh nào cũng thật hoàn hảo. Nhưng mỗi khoảnh khắc đều giữ lại một ánh nhìn, một nụ cười và những ngày chúng mình đã thương nhau bằng tất cả sự chân thành.","gallery.empty":"Album đang được chuẩn bị ♡","gallery.view":"Xem toàn bộ album →",
      "guide.arrival.text":"Bạn nên có mặt trước giờ bắt đầu khoảng 15–20 phút để thuận tiện đón tiếp.",
      "rsvp.title":"Hẹn gặp bạn trong ngày vui nhé?","rsvp.subtitle":"Chúng mình rất mong được gặp bạn trong ngày vui. Hãy dành một chút thời gian xác nhận tham dự để Hải và Mỹ có thể đón tiếp bạn thật chu đáo nhé!",
      "rsvp.namePlaceholder":"Nguyễn Văn A","rsvp.phonePlaceholder":"09xx xxx xxx","rsvp.messagePlaceholder":"Gửi một lời chúc đến cô dâu chú rể...","rsvp.name":"Họ và tên","rsvp.phone":"Số điện thoại","rsvp.optional":"(không bắt buộc)","rsvp.attend":"Bạn có thể tham dự?","rsvp.yes":"Có, tôi sẽ đến","rsvp.no":"Rất tiếc, tôi không thể","rsvp.count":"Số người tham dự","rsvp.event":"Tham dự sự kiện","rsvp.message":"Gửi một lời chúc ♡","rsvp.submit":"Gửi xác nhận",
      "rsvp.guest1":"1 người","rsvp.guest2":"2 người","rsvp.guest3":"3 người","rsvp.guest4":"4 người","rsvp.guest5":"5 người",
      "rsvp.bride":"Nhà gái — 18/12/2026","rsvp.groom":"Nhà trai — 20/12/2026","rsvp.both":"Cả hai ngày",
      "rsvp.sending":"Đang gửi xác nhận...","rsvp.success":"Cảm ơn bạn! Hải Phạm và Mỹ Nguyễn đã nhận được xác nhận ❤️","rsvp.updated":"Đã cập nhật phản hồi của bạn ❤️","rsvp.sentButton":"✓ Đã gửi RSVP","rsvp.updatedButton":"✓ Đã cập nhật RSVP","rsvp.error":"Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.","rsvp.maxGuestsError":"Số người tham dự vượt quá giới hạn của thiệp mời.","rsvp.eventError":"Vui lòng chọn sự kiện bạn sẽ tham dự.",
      "footer.thanks":"Khép lại một trang thiệp, mở ra một hành trình mới. Cảm ơn bạn đã dành thời gian, những lời chúc và tình thương cho Hải và Mỹ. Thật hạnh phúc khi những ngày đáng nhớ này có bạn ở bên. Thương mến, Hải & Mỹ ♡","footer.month":"Tháng 12 · 2026",
      "album.back":"← Về thiệp cưới","album.title":"Album của Hải Phạm và Mỹ Nguyễn","album.subtitle":"Những khoảnh khắc chúng tôi muốn lưu lại cùng nhau.","album.loading":"Đang tải album...","album.all":"Tất cả","album.empty":"Album này chưa có ảnh. Hẹn bạn quay lại sớm nhé ♡","album.moments":"khoảnh khắc","album.close":"Đóng","album.prev":"Ảnh trước","album.next":"Ảnh tiếp theo",
      "album.prewedding":"Pre-Wedding","album.bride":"Nhà gái","album.groom":"Nhà trai"
    },
    en: {
      "nav.story":"Our Story","nav.events":"Wedding Events","nav.rsvp":"RSVP",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"Of all the people we could have met, how lucky we are to have found each other. From this day on, our greatest joy is knowing we will walk every road together.","hero.cta":"View wedding schedule",
      "intro.open":"OPEN INVITATION","intro.tap":"A little invitation for you","intro.hint":"Click the envelope or button below to open","intro.invite":"YOU ARE CORDIALLY INVITED","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026","intro.formalLead":"Join us in celebrating our special day","intro.eventDate":"DECEMBER 18–20, 2026","intro.eventPlace":"HO CHI MINH CITY · RACH GIA","intro.closing":"Your presence would mean so much to us.",
      "promise.kicker":"OUR PROMISE","promise.title":"And so, we choose a lifetime together.","promise.body1":"We don't expect every day to be easy. We simply hope that, amid life's busy moments, we will always have someone to listen, to share the little things with, and to come home to.","promise.body2":"From today onward, Hai and My will build a home together — one that treasures small joys, offers comfort on difficult days, and grows stronger through tenderness and understanding.","promise.signature":"Hai ♡ My","promise.caption":"ONE PROMISE · ONE HOME","events.cityBride":"Ho Chi Minh City","events.cityGroom":"Rach Gia, An Giang","events.monthYear":"DECEMBER · 2026","events.photoCaption":"Two families, one beautiful celebration.","events.brideTag":"BRIDE'S FAMILY","events.groomTag":"GROOM'S FAMILY","events.selectDay":"Choose the bride's or groom's wedding schedule","story.title":"From the little things to a lifetime together","story.text":"Our love wasn't built on grand gestures. It grew through small kindnesses, shared laughter, and conversations we wished would never end. With time, Hai and My learned to listen, to care, and to dream of a home together. We came to realize that love isn't about finding someone perfect, but finding someone you want beside you through all the years ahead.",
      "countdown.title":"Counting down\nto our day","countdown.short":"Until we say “I do”","countdown.month":"DECEMBER","countdown.days":"Days","countdown.hours":"Hours","countdown.minutes":"Minutes","countdown.seconds":"Seconds",
      "events.title":"Wedding Events","events.subtitle":"From our intimate family ceremonies to the celebrations with everyone we love, each moment will be sweeter with you there. Choose the bride's or groom's family for times, venues, and directions.","events.status.label":"Viewing",
      "family.bride":"Bride's Family","family.groom":"Groom's Family","event.home":"AT HOME","event.reception":"RECEPTION",
      "event.vuquy":"Bride's Ceremony","event.thanhhon":"Wedding Ceremony","event.reception.title":"Wedding Reception","event.friday":"Friday · 18.12.2026","event.sunday":"Sunday · 20.12.2026","event.friday.short":"Friday","event.sunday.short":"Sunday",
      "map.open":"Open map","map.directions":"Directions",
      "gallery.title":"The moments we hold dear","gallery.subtitle":"Not every photograph needs to be perfect. Each one holds a smile, a familiar glance, and an ordinary day we never want to forget. These are the moments that tell our story.","gallery.empty":"Our album is being prepared ♡","gallery.view":"View full album →",
      "guide.arrival.text":"We recommend arriving about 15–20 minutes before the scheduled start time.",
      "rsvp.title":"Will you celebrate with us?","rsvp.subtitle":"We would love to see you on our special day. Please take a moment to RSVP so that Hai and My can prepare a warm welcome for you.",
      "rsvp.namePlaceholder":"Your full name","rsvp.phonePlaceholder":"Phone number (optional)","rsvp.messagePlaceholder":"Write a message to the couple...","rsvp.name":"Full name","rsvp.phone":"Phone number","rsvp.optional":"(optional)","rsvp.attend":"Will you be able to attend?","rsvp.yes":"Yes, I'll be there","rsvp.no":"Sorry, I can't attend","rsvp.count":"Number of guests","rsvp.event":"Event attendance","rsvp.message":"Leave us a little wish ♡","rsvp.submit":"Send RSVP",
      "rsvp.guest1":"1 guest","rsvp.guest2":"2 guests","rsvp.guest3":"3 guests","rsvp.guest4":"4 guests","rsvp.guest5":"5 guests",
      "rsvp.bride":"Bride's family — 18/12/2026","rsvp.groom":"Groom's family — 20/12/2026","rsvp.both":"Both days",
      "rsvp.sending":"Sending your RSVP...","rsvp.success":"Thank you! Hai Pham & My Nguyen received your RSVP ❤️","rsvp.updated":"Your RSVP has been updated ❤️","rsvp.sentButton":"✓ RSVP sent","rsvp.updatedButton":"✓ RSVP updated","rsvp.error":"We couldn't send your RSVP. Please try again or contact the bride and groom directly.","rsvp.maxGuestsError":"The number of guests exceeds this invitation's limit.","rsvp.eventError":"Please choose the event you will attend.",
      "footer.thanks":"One invitation closes; a new chapter begins. Thank you for sharing your time, kindness, and heartfelt wishes with us. It means so much to have you beside us as we begin this life together. With love, Hai & My ♡","footer.month":"December 2026",
      "album.back":"← Back to invitation","album.title":"Hai Pham & My Nguyen's Album","album.subtitle":"The moments we want to keep and share with you.","album.loading":"Loading album...","album.all":"All","album.empty":"This album does not have photos yet. Please come back soon ♡","album.moments":"moments","album.close":"Close","album.prev":"Previous photo","album.next":"Next photo",
      "album.prewedding":"Pre-Wedding","album.bride":"Bride's Family","album.groom":"Groom's Family"
    },
    ja: {
      "nav.story":"ふたりのストーリー","nav.events":"結婚式の日程","nav.rsvp":"出欠確認",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"たくさんの出会いの中で、私たちはお互いに巡り会いました。これからの何気ない毎日を、ふたりで歩んでいけることが何よりの幸せです。","hero.cta":"結婚式の日程を見る",
      "intro.open":"招待状を開く","intro.tap":"あなたへの招待状","intro.hint":"封筒または下のボタンを押して開く","intro.invite":"心よりご招待申し上げます","intro.date":"2026年12月18日（金）〜20日（日）","intro.formalLead":"私たちの大切な日に、ぜひご一緒にお祝いください","intro.eventDate":"2026年12月18日（金）〜20日（日）","intro.eventPlace":"ホーチミン市 · ラックザー","intro.closing":"お越しいただけることを、心より楽しみにしております。",
      "promise.kicker":"ふたりの約束","promise.title":"そして、これからの人生も一緒に。","promise.body1":"これからの日々が、いつも穏やかとは限りません。それでも、忙しい毎日の中で言葉を交わし、喜びも悩みも分かち合い、帰る場所でほっとできるふたりでありたいと思います。","promise.body2":"今日から私たちは、ささやかな幸せを大切にし、難しい時には支え合いながら、思いやりと優しさに満ちた家庭を築いていきます。","promise.signature":"ハイ ♡ ミー","promise.caption":"ひとつの約束 · ふたりの未来","events.cityBride":"ホーチミン市","events.cityGroom":"ラックザー・アンザン省","events.monthYear":"2026年12月","events.photoCaption":"ふたつの家族が、ひとつになる日。","events.brideTag":"新婦側のご家族","events.groomTag":"新郎側のご家族","events.selectDay":"新婦側または新郎側の日程を選択","story.title":"何気ない日々から、これからの人生へ","story.text":"私たちの愛は、大きな出来事ではなく、日々の小さな思いやりの中で育まれてきました。何気ない会話や笑顔、そばにいるだけでほっとできる時間。お互いを思いやり、同じ未来を描くうちに、完璧な人を探すのではなく、この人とこれからの人生を歩んでいきたいと思うようになりました。",
      "countdown.title":"幸せの日まで\nあと","countdown.short":"ふたりが家族になる日まで","countdown.month":"12月","countdown.days":"日","countdown.hours":"時間","countdown.minutes":"分","countdown.seconds":"秒",
      "events.title":"結婚式の日程","events.subtitle":"家族と過ごす温かな儀式から、皆さまと喜びを分かち合う披露宴まで。一つひとつの瞬間を、大切な方々とともに迎えられたら幸いです。日程・会場・アクセスは新婦側／新郎側からご確認ください。","events.status.label":"表示中",
      "family.bride":"新婦側","family.groom":"新郎側","event.home":"ご自宅","event.reception":"披露宴",
      "event.vuquy":"婚礼の儀","event.thanhhon":"結婚の儀","event.reception.title":"披露宴","event.friday":"2026年12月18日（金）","event.sunday":"2026年12月20日（日）","event.friday.short":"金曜日","event.sunday.short":"日曜日",
      "map.open":"地図を開く","map.directions":"ルート案内",
      "gallery.title":"いつまでも大切にしたい瞬間","gallery.subtitle":"写真に残るのは、笑顔やまなざし、何気ない日のぬくもり。どれも私たちにとって、いつまでも大切にしたい思い出です。","gallery.empty":"アルバムを準備中です ♡","gallery.view":"アルバムをすべて見る →",
      "guide.arrival.text":"開始予定時刻の15〜20分前を目安にお越しいただくとスムーズです。",
      "rsvp.title":"私たちの大切な日に、ぜひお越しください","rsvp.subtitle":"皆さまと一緒にこの日を迎えられることを、心より楽しみにしております。おもてなしの準備のため、出欠をお知らせいただけますと幸いです。",
      "rsvp.namePlaceholder":"お名前をご入力ください","rsvp.phonePlaceholder":"電話番号（任意）","rsvp.messagePlaceholder":"新郎新婦へのメッセージをご記入ください...","rsvp.name":"お名前","rsvp.phone":"電話番号","rsvp.optional":"（任意）","rsvp.attend":"ご出席いただけますか？","rsvp.yes":"はい、出席します","rsvp.no":"申し訳ありませんが、欠席します","rsvp.count":"ご参加人数","rsvp.event":"ご出席の日程","rsvp.message":"ふたりへのひとこと ♡","rsvp.submit":"出欠を送信",
      "rsvp.guest1":"1名","rsvp.guest2":"2名","rsvp.guest3":"3名","rsvp.guest4":"4名","rsvp.guest5":"5名",
      "rsvp.bride":"新婦側 — 2026年12月18日（金）","rsvp.groom":"新郎側 — 2026年12月20日（日）","rsvp.both":"両日",
      "rsvp.sending":"送信しています...","rsvp.success":"ありがとうございます。ご出欠の回答を受け付けました ❤️","rsvp.updated":"RSVPを更新しました ❤️","rsvp.sentButton":"✓ RSVPを送信しました","rsvp.updatedButton":"✓ RSVPを更新しました","rsvp.error":"送信できませんでした。もう一度お試しいただくか、新郎新婦へ直接ご連絡ください。","rsvp.maxGuestsError":"参加人数がこの招待状の上限を超えています。","rsvp.eventError":"参加するイベントを選択してください。",
      "footer.thanks":"この招待状の先に、ふたりの新しい日々が始まります。大切なお時間と温かいお祝いの言葉をありがとうございます。皆さまに見守っていただけることを、心から幸せに思います。感謝を込めて、ハイ＆ミー ♡","footer.month":"2026年12月",
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