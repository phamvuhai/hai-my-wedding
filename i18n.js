(() => {
  const dictionaries = {
    vi: {
      "nav.story":"Câu chuyện","nav.events":"Lịch cưới","nav.rsvp":"Xác nhận",
      "name.groom":"Hải Phạm","name.bride":"Mỹ Nguyễn",
      "hero.note":"Trân trọng kính mời bạn đến chung vui trong ngày hạnh phúc của chúng tôi.","hero.cta":"Xem lịch cưới",
      "intro.open":"MỞ THIỆP","intro.invite":"TRÂN TRỌNG KÍNH MỜI","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026",
      "story.title":"Một hành trình, một lời hẹn","story.text":"Có những cuộc gặp gỡ làm thay đổi cả một hành trình. Sau những ngày đồng hành, chúng tôi chọn bước tiếp cùng nhau bằng một lời hứa giản dị: luôn là gia đình của nhau.",
      "countdown.title":"Đếm ngược\nđến ngày vui","countdown.short":"Còn đến ngày vui","countdown.days":"Ngày","countdown.hours":"Giờ","countdown.minutes":"Phút","countdown.seconds":"Giây",
      "events.title":"Lịch cưới","events.subtitle":"Hai ngày cưới, đầy đủ thời gian, địa điểm và chỉ đường.","events.status.label":"Đang xem",
      "family.bride":"Nhà gái","family.groom":"Nhà trai","event.home":"TƯ GIA","event.reception":"TIỆC CƯỚI",
      "event.vuquy":"Lễ Vu Quy","event.thanhhon":"Lễ Thành Hôn","event.reception.title":"Tiệc cưới","event.friday":"Thứ Sáu · 18.12.2026","event.sunday":"Chủ Nhật · 20.12.2026",
      "map.open":"Mở bản đồ","map.directions":"Chỉ đường",
      "gallery.title":"Khoảnh khắc của chúng tôi","gallery.subtitle":"Những khoảnh khắc Hải Phạm & Mỹ Nguyễn muốn lưu giữ trên hành trình về chung một nhà.","gallery.empty":"Album đang được chuẩn bị ♡","gallery.view":"Xem toàn bộ album →",
      "guide.title":"Trước khi bạn đến","guide.subtitle":"Một vài thông tin nhỏ để bạn có thể tận hưởng ngày vui thật thoải mái.",
      "guide.welcome.title":"Đón khách","guide.welcome.text":"Khách mời vui lòng đến sớm, gửi lời chúc và ổn định chỗ ngồi trước giờ bắt đầu nghi thức. Gia đình sẽ đón tiếp tại khu vực sảnh.",
      "guide.arrival.title":"Thời gian đến","guide.arrival.text":"Bạn nên có mặt trước giờ bắt đầu khoảng 15–20 phút để thuận tiện đón tiếp.",
      "guide.route.title":"Đường đi","guide.route.text":"Bạn có thể mở bản đồ ngay tại từng sự kiện để kiểm tra lộ trình trước khi khởi hành.",
      "schedule.title":"Lịch trình chi tiết","schedule.subtitle":"Bốn mốc thời gian đã xác nhận cho hai ngày cưới của Hải Phạm và Mỹ Nguyễn.","schedule.tbd":"Sẽ cập nhật","schedule.kind.ceremony":"NGHI LỄ","schedule.kind.reception":"TIỆC CƯỚI",
      "travel.title":"Di chuyển thật dễ dàng","travel.subtitle":"Hai thành phố, hai ngày đặc biệt. Hãy chọn khu vực lưu trú thuận tiện với sự kiện bạn tham dự.",
      "travel.hcm.title":"Ngày nhà gái · TP.HCM","travel.hcm.text":"Nếu lưu trú qua đêm, khu vực Bình Thạnh / Bình Lợi Trung sẽ thuận tiện hơn để đến Gold Palace.",
      "travel.rg.title":"Ngày nhà trai · Rạch Giá","travel.rg.text":"Nếu ở lại Rạch Giá, khu vực trung tâm thành phố sẽ giúp bạn thuận tiện di chuyển giữa tư gia và địa điểm tiệc.",
      "travel.rg.home":"Tư gia: đường Chế Lan Viên","travel.while":"Trong lúc ở đây","travel.hcm.do":"Cà phê, ẩm thực địa phương và một vòng dạo phố nếu bạn có thêm thời gian.","travel.rg.do":"Hải sản địa phương, khu trung tâm và không khí miền biển là những lựa chọn dễ trải nghiệm.",
      "faq.title":"Một vài câu hỏi thường gặp","faq.subtitle":"Nếu chưa thấy câu trả lời bạn cần, bạn có thể liên hệ trực tiếp với Hải Phạm và Mỹ Nguyễn.",
      "faq.q1":"Tôi nên đến trước bao lâu?","faq.a1":"Bạn nên có mặt trước giờ bắt đầu khoảng 15–20 phút.",
      "faq.q2":"Trang phục như thế nào là phù hợp?","faq.a2":"Gợi ý trang phục lịch sự, trang nhã. Nếu có dress code cụ thể, Hải Phạm và Mỹ Nguyễn sẽ cập nhật tại đây.",
      "faq.q3":"Tôi có cần tham dự cả hai ngày không?","faq.a3":"Không. Trong RSVP bạn có thể chọn Nhà gái, Nhà trai hoặc cả hai ngày.",
      "faq.q4":"Tôi có thể thay đổi RSVP không?","faq.a4":"Có. Bạn có thể gửi lại RSVP với thông tin mới hoặc liên hệ trực tiếp với Hải Phạm và Mỹ Nguyễn.",
      "faq.q5":"Vì sao một số giờ chưa hiển thị?","faq.a5":"Những mốc giờ chưa được xác nhận sẽ được cập nhật trên website khi có thông tin chính thức.",
      "faq.q6":"Tôi nên kiểm tra đường đi ở đâu?","faq.a6":"Mỗi sự kiện đều có nút mở bản đồ. Bạn nên kiểm tra lộ trình trước khi khởi hành.",
      "wishes.display1":"LỜI CHÚC","wishes.display2":"CHO CHÚNG TÔI","wishes.eyebrow":"MỘT LỜI NHẮN NHỎ","wishes.title":"Gửi lời chúc đến Hải Phạm & Mỹ Nguyễn","wishes.text":"Những lời nhắn bạn gửi qua RSVP sẽ được Hải Phạm & Mỹ Nguyễn trân trọng lưu giữ như một phần ký ức đẹp của ngày đặc biệt này.","wishes.cta":"Viết lời chúc trong RSVP →",
      "rsvp.title":"Bạn sẽ đến chung vui cùng chúng tôi chứ?","rsvp.subtitle":"Phản hồi của bạn giúp chúng tôi chuẩn bị chu đáo hơn cho ngày đặc biệt này.",
      "rsvp.name":"Họ và tên","rsvp.phone":"Số điện thoại","rsvp.optional":"(không bắt buộc)","rsvp.attend":"Bạn có thể tham dự?","rsvp.yes":"Có, tôi sẽ đến","rsvp.no":"Rất tiếc, tôi không thể","rsvp.count":"Số người tham dự","rsvp.event":"Tham dự sự kiện","rsvp.message":"Gửi một lời chúc ♡","rsvp.submit":"Gửi xác nhận",
      "rsvp.guest1":"1 người","rsvp.guest2":"2 người","rsvp.guest3":"3 người","rsvp.guest4":"4 người","rsvp.guest5":"5 người",
      "rsvp.bride":"Nhà gái — 18/12/2026","rsvp.groom":"Nhà trai — 20/12/2026","rsvp.both":"Cả hai ngày",
      "rsvp.sending":"Đang gửi xác nhận...","rsvp.success":"Cảm ơn bạn! Hải Phạm và Mỹ Nguyễn đã nhận được xác nhận ❤️","rsvp.updated":"Đã cập nhật phản hồi của bạn ❤️","rsvp.sentButton":"✓ Đã gửi RSVP","rsvp.updatedButton":"✓ Đã cập nhật RSVP","rsvp.error":"Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.",
      "footer.thanks":"Cảm ơn bạn đã trở thành một phần trong câu chuyện của chúng tôi.","footer.month":"Tháng 12 · 2026",
      "album.back":"← Về thiệp cưới","album.title":"Album của Hải Phạm và Mỹ Nguyễn","album.subtitle":"Những khoảnh khắc chúng tôi muốn lưu lại cùng nhau.","album.loading":"Đang tải album...","album.all":"Tất cả","album.empty":"Album này chưa có ảnh. Hẹn bạn quay lại sớm nhé ♡","album.moments":"khoảnh khắc","album.close":"Đóng","album.prev":"Ảnh trước","album.next":"Ảnh tiếp theo",
      "album.prewedding":"Pre-Wedding","album.bride":"Nhà gái","album.groom":"Nhà trai"
    },
    en: {
      "nav.story":"Our Story","nav.events":"Wedding Events","nav.rsvp":"RSVP",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"We warmly invite you to celebrate this joyful milestone with us.","hero.cta":"View wedding schedule",
      "intro.open":"OPEN INVITATION","intro.invite":"YOU ARE CORDIALLY INVITED","intro.date":"18 · 12 · 2026 — 20 · 12 · 2026",
      "story.title":"One journey, one promise","story.text":"Some encounters change the course of a lifetime. After walking side by side, we chose to continue this journey together with a simple promise: to always be each other’s family.",
      "countdown.title":"Counting down\nto our day","countdown.short":"Until our day","countdown.days":"Days","countdown.hours":"Hours","countdown.minutes":"Minutes","countdown.seconds":"Seconds",
      "events.title":"Wedding Events","events.subtitle":"Both wedding days, with times, venues and directions in one place.","events.status.label":"Viewing",
      "family.bride":"Bride's Family","family.groom":"Groom's Family","event.home":"AT HOME","event.reception":"RECEPTION",
      "event.vuquy":"Bride's Ceremony","event.thanhhon":"Wedding Ceremony","event.reception.title":"Wedding Reception","event.friday":"Friday · 18.12.2026","event.sunday":"Sunday · 20.12.2026",
      "map.open":"Open map","map.directions":"Directions",
      "gallery.title":"Our Moments","gallery.subtitle":"Memories from Hai Pham & My Nguyen’s journey toward becoming one family.","gallery.empty":"Our album is being prepared ♡","gallery.view":"View full album →",
      "guide.title":"Good to know","guide.subtitle":"A few details to help you enjoy the celebration comfortably.",
      "guide.welcome.title":"Guest welcome","guide.welcome.text":"Please arrive a little early, leave your wishes, and be seated before the ceremony begins. Our families will welcome guests at the reception area.",
      "guide.arrival.title":"When to arrive","guide.arrival.text":"We recommend arriving about 15–20 minutes before the scheduled start time.",
      "guide.route.title":"Getting there","guide.route.text":"Open the map from each event and check your route before you leave.",
      "schedule.title":"Detailed schedule","schedule.subtitle":"Four confirmed moments across our two wedding days.","schedule.tbd":"To be updated","schedule.kind.ceremony":"CEREMONY","schedule.kind.reception":"RECEPTION",
      "travel.title":"Travel made easy","travel.subtitle":"Two cities, two special days. Choose a place to stay that works best for the event you are attending.",
      "travel.hcm.title":"Bride's day · Ho Chi Minh City","travel.hcm.text":"If you stay overnight, Bình Thạnh / Bình Lợi Trung is a convenient area for getting to Gold Palace.",
      "travel.rg.title":"Groom's day · Rạch Giá","travel.rg.text":"If you stay in Rạch Giá, the city center is convenient for traveling between the family home and the reception venue.",
      "travel.rg.home":"Family home: Chế Lan Viên Street","travel.while":"While you're here","travel.hcm.do":"Coffee, local food and a relaxed city walk are easy options if you have extra time.","travel.rg.do":"Local seafood, the city center and the coastal atmosphere are easy ways to enjoy Rạch Giá.",
      "faq.title":"You may be wondering","faq.subtitle":"If your question is not answered here, you can contact Hai Pham & My Nguyen directly.",
      "faq.q1":"How early should I arrive?","faq.a1":"We recommend arriving about 15–20 minutes before the scheduled start time.",
      "faq.q2":"What should I wear?","faq.a2":"Smart, elegant attire is a good starting point. If a specific dress code is set, Hai Pham & My Nguyen will update it here.",
      "faq.q3":"Do I need to attend both days?","faq.a3":"No. In the RSVP you can choose the bride's day, the groom's day, or both.",
      "faq.q4":"Can I change my RSVP?","faq.a4":"Yes. Submit the RSVP again with your updated details or contact Hai Pham & My Nguyen directly.",
      "faq.q5":"Why are some times not shown yet?","faq.a5":"Times that have not been confirmed will be updated on the website once they are official.",
      "faq.q6":"Where can I check directions?","faq.a6":"Each event has a map button. We recommend checking your route before leaving.",
      "wishes.display1":"WORDS","wishes.display2":"FOR US","wishes.eyebrow":"A LITTLE NOTE","wishes.title":"A note for Hai Pham & My Nguyen","wishes.text":"Your RSVP message will be treasured by Hai Pham & My Nguyen as a special memory from our wedding day.","wishes.cta":"Leave a message in RSVP →",
      "rsvp.title":"Will you celebrate with us?","rsvp.subtitle":"Your response helps us prepare thoughtfully for our special day.",
      "rsvp.name":"Full name","rsvp.phone":"Phone number","rsvp.optional":"(optional)","rsvp.attend":"Will you be able to attend?","rsvp.yes":"Yes, I'll be there","rsvp.no":"Sorry, I can't attend","rsvp.count":"Number of guests","rsvp.event":"Event attendance","rsvp.message":"Leave us a little wish ♡","rsvp.submit":"Send RSVP",
      "rsvp.guest1":"1 guest","rsvp.guest2":"2 guests","rsvp.guest3":"3 guests","rsvp.guest4":"4 guests","rsvp.guest5":"5 guests",
      "rsvp.bride":"Bride's family — 18/12/2026","rsvp.groom":"Groom's family — 20/12/2026","rsvp.both":"Both days",
      "rsvp.sending":"Sending your RSVP...","rsvp.success":"Thank you! Hai Pham & My Nguyen received your RSVP ❤️","rsvp.updated":"Your RSVP has been updated ❤️","rsvp.sentButton":"✓ RSVP sent","rsvp.updatedButton":"✓ RSVP updated","rsvp.error":"We couldn't send your RSVP. Please try again or contact the bride and groom directly.",
      "footer.thanks":"Thank you for being part of our story.","footer.month":"December 2026",
      "album.back":"← Back to invitation","album.title":"Hai Pham & My Nguyen's Album","album.subtitle":"The moments we want to keep and share with you.","album.loading":"Loading album...","album.all":"All","album.empty":"This album does not have photos yet. Please come back soon ♡","album.moments":"moments","album.close":"Close","album.prev":"Previous photo","album.next":"Next photo",
      "album.prewedding":"Pre-Wedding","album.bride":"Bride's Family","album.groom":"Groom's Family"
    },
    ja: {
      "nav.story":"ふたりのストーリー","nav.events":"結婚式の予定","nav.rsvp":"出欠確認",
      "name.groom":"Hai Pham","name.bride":"My Nguyen",
      "hero.note":"私たちの大切な日に、ぜひ一緒にお祝いください。","hero.cta":"結婚式の予定を見る",
      "intro.open":"招待状を開く","intro.invite":"心よりご招待申し上げます","intro.date":"2026 · 12 · 18 — 2026 · 12 · 20",
      "story.title":"ひとつの旅、ひとつの約束","story.text":"人生の道のりを変える出会いがあります。共に歩んできた日々を経て、私たちはこれからも家族として寄り添い続けることを約束し、新しい一歩を踏み出します。",
      "countdown.title":"幸せの日まで\nあと","countdown.short":"幸せの日まで","countdown.days":"日","countdown.hours":"時間","countdown.minutes":"分","countdown.seconds":"秒",
      "events.title":"結婚式の予定","events.subtitle":"2日間の時間・会場・アクセスをまとめてご案内します。","events.status.label":"表示中",
      "family.bride":"新婦側","family.groom":"新郎側","event.home":"ご自宅","event.reception":"披露宴",
      "event.vuquy":"婚礼の儀","event.thanhhon":"結婚式","event.reception.title":"披露宴","event.friday":"金曜日 · 18.12.2026","event.sunday":"日曜日 · 20.12.2026",
      "map.open":"地図を開く","map.directions":"ルート案内",
      "gallery.title":"ふたりの思い出","gallery.subtitle":"ふたりが家族になるまでの歩みの中で、大切に残してきた思い出です。","gallery.empty":"アルバムを準備中です ♡","gallery.view":"アルバムをすべて見る →",
      "guide.title":"ご来場前に","guide.subtitle":"当日をゆっくり楽しんでいただくための、ちょっとしたご案内です。",
      "guide.welcome.title":"受付・ご案内","guide.welcome.text":"開式前に少し早めにお越しいただき、受付・ご挨拶のうえご着席ください。ご家族が会場入口にてご案内いたします。",
      "guide.arrival.title":"到着時間","guide.arrival.text":"開始予定時刻の15〜20分前を目安にお越しいただくとスムーズです。",
      "guide.route.title":"アクセス","guide.route.text":"各イベントの地図ボタンから、出発前にルートをご確認ください。",
      "schedule.title":"詳しいスケジュール","schedule.subtitle":"2日間の結婚式について、確定した4つの時間をご案内します。","schedule.tbd":"更新予定","schedule.kind.ceremony":"婚礼の儀","schedule.kind.reception":"披露宴",
      "travel.title":"移動と滞在のご案内","travel.subtitle":"2つの街で迎える特別な2日間。ご参加のイベントに合わせて便利な滞在エリアをお選びください。",
      "travel.hcm.title":"新婦側の日 · ホーチミン市","travel.hcm.text":"宿泊される場合は、Gold Palaceへ移動しやすいBình Thạnh / Bình Lợi Trung周辺が便利です。",
      "travel.rg.title":"新郎側の日 · ラックザー","travel.rg.text":"ラックザーに宿泊される場合は、ご自宅と披露宴会場の間を移動しやすい市中心部が便利です。",
      "travel.rg.home":"ご自宅：Chế Lan Viên通り","travel.while":"滞在中の過ごし方","travel.hcm.do":"時間に余裕があれば、カフェやローカルフード、街歩きも楽しめます。","travel.rg.do":"ローカルの海鮮料理、市中心部、海辺の雰囲気などを気軽に楽しめます。",
      "faq.title":"よくあるご質問","faq.subtitle":"こちらにない内容は、Hai Pham & My Nguyen まで直接お気軽にご連絡ください。",
      "faq.q1":"何分前に到着すればよいですか？","faq.a1":"開始予定時刻の15〜20分前を目安にお越しください。",
      "faq.q2":"どのような服装がよいですか？","faq.a2":"きれいめで上品な服装がおすすめです。具体的なドレスコードが決まりましたら、こちらで更新します。",
      "faq.q3":"両日とも参加する必要がありますか？","faq.a3":"いいえ。RSVPで新婦側、新郎側、または両日のいずれかを選択できます。",
      "faq.q4":"RSVPの内容を変更できますか？","faq.a4":"はい。新しい内容で再度RSVPを送信するか、Hai Pham & My Nguyen まで直接ご連絡ください。",
      "faq.q5":"まだ時間が表示されていない予定があるのはなぜですか？","faq.a5":"未確定の時間は、正式に決まり次第このウェブサイトで更新します。",
      "faq.q6":"アクセスはどこで確認できますか？","faq.a6":"各イベントに地図ボタンがあります。出発前にルートをご確認ください。",
      "wishes.display1":"ふたりへの","wishes.display2":"ことば","wishes.eyebrow":"ひとことメッセージ","wishes.title":"ふたりへのメッセージ","wishes.text":"RSVPでお寄せいただいたメッセージは、私たちの大切な思い出として、心を込めて残させていただきます。","wishes.cta":"RSVPでメッセージを送る →",
      "rsvp.title":"私たちの大切な日を、一緒にお祝いしていただけますか？","rsvp.subtitle":"ご出欠をお知らせいただけると、当日の準備に大変助かります。",
      "rsvp.name":"お名前","rsvp.phone":"電話番号","rsvp.optional":"（任意）","rsvp.attend":"ご出席いただけますか？","rsvp.yes":"はい、出席します","rsvp.no":"残念ながら欠席します","rsvp.count":"ご参加人数","rsvp.event":"ご参加のイベント","rsvp.message":"ふたりへのひとこと ♡","rsvp.submit":"出欠を送信",
      "rsvp.guest1":"1名","rsvp.guest2":"2名","rsvp.guest3":"3名","rsvp.guest4":"4名","rsvp.guest5":"5名",
      "rsvp.bride":"新婦側 — 18/12/2026","rsvp.groom":"新郎側 — 20/12/2026","rsvp.both":"両日",
      "rsvp.sending":"送信しています...","rsvp.success":"ありがとうございます！Hai Pham & My Nguyen が出欠回答を受け取りました ❤️","rsvp.updated":"RSVPを更新しました ❤️","rsvp.sentButton":"✓ RSVPを送信しました","rsvp.updatedButton":"✓ RSVPを更新しました","rsvp.error":"送信できませんでした。もう一度お試しいただくか、新郎新婦へ直接ご連絡ください。",
      "footer.thanks":"私たちの物語の一部になってくださり、ありがとうございます。","footer.month":"2026年12月",
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