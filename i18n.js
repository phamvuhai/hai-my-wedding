(() => {
  const dictionaries = {
    vi: {
      "nav.story":"Câu chuyện","nav.events":"Lịch cưới","nav.rsvp":"Xác nhận",
      "hero.note":"Trân trọng kính mời bạn đến chung vui trong ngày hạnh phúc của chúng tôi.","hero.cta":"Xem lịch cưới",
      "story.title":"Một hành trình, một lời hẹn","story.text":"Có những cuộc gặp gỡ làm thay đổi cả một hành trình. Sau những ngày đồng hành, chúng tôi chọn bước tiếp cùng nhau bằng một lời hứa giản dị: luôn là gia đình của nhau.",
      "countdown.title":"Đếm ngược đến ngày vui","countdown.days":"Ngày","countdown.hours":"Giờ","countdown.minutes":"Phút","countdown.seconds":"Giây",
      "events.title":"Lịch cưới","events.subtitle":"Hai ngày đặc biệt, cùng một niềm vui.",
      "family.bride":"Nhà gái","family.groom":"Nhà trai","event.home":"TƯ GIA","event.reception":"TIỆC CƯỚI",
      "event.vuquy":"Lễ Vu Quy","event.thanhhon":"Lễ Thành Hôn","event.friday":"Thứ Sáu · 18.12.2026","event.sunday":"Chủ Nhật · 20.12.2026",
      "map.open":"Mở bản đồ","map.directions":"Chỉ đường",
      "gallery.title":"Khoảnh khắc của chúng tôi","gallery.subtitle":"Những hình ảnh được Hải & Mỹ lưu lại trong hành trình về chung một nhà.","gallery.empty":"Album đang được chuẩn bị ♡","gallery.view":"Xem toàn bộ album →",
      "rsvp.title":"Bạn sẽ đến chung vui cùng chúng tôi chứ?","rsvp.subtitle":"Phản hồi của bạn giúp chúng tôi chuẩn bị chu đáo hơn cho ngày đặc biệt này.",
      "rsvp.name":"Họ và tên","rsvp.phone":"Số điện thoại","rsvp.optional":"(không bắt buộc)","rsvp.attend":"Bạn có thể tham dự?","rsvp.yes":"Có, tôi sẽ đến","rsvp.no":"Rất tiếc, tôi không thể","rsvp.count":"Số người tham dự","rsvp.event":"Tham dự sự kiện","rsvp.message":"Lời nhắn cho Hải & Mỹ","rsvp.submit":"Gửi xác nhận",
      "rsvp.guest1":"1 người","rsvp.guest2":"2 người","rsvp.guest3":"3 người","rsvp.guest4":"4 người","rsvp.guest5":"5 người",
      "rsvp.bride":"Nhà gái — 18/12/2026","rsvp.groom":"Nhà trai — 20/12/2026","rsvp.both":"Cả hai ngày",
      "rsvp.sending":"Đang gửi xác nhận...","rsvp.success":"Cảm ơn bạn! Hải & Mỹ đã nhận được xác nhận ❤️","rsvp.error":"Chưa gửi được xác nhận. Vui lòng thử lại hoặc liên hệ trực tiếp với cô dâu/chú rể.",
      "footer.thanks":"Thank you for being part of our story.","footer.month":"December 2026",
      "album.back":"← Về thiệp cưới","album.title":"Album của Hải & Mỹ","album.subtitle":"Những khoảnh khắc chúng tôi muốn lưu lại cùng nhau.","album.loading":"Đang tải album...","album.all":"Tất cả","album.empty":"Album này chưa có ảnh. Hẹn bạn quay lại sớm nhé ♡","album.moments":"khoảnh khắc","album.close":"Đóng","album.prev":"Ảnh trước","album.next":"Ảnh tiếp theo",
      "album.prewedding":"Pre-Wedding","album.bride":"Nhà gái","album.groom":"Nhà trai"
    },
    en: {
      "nav.story":"Our Story","nav.events":"Wedding Events","nav.rsvp":"RSVP",
      "hero.note":"We warmly invite you to celebrate this joyful milestone with us.","hero.cta":"View wedding schedule",
      "story.title":"One journey, one promise","story.text":"Some encounters change the course of a lifetime. After walking side by side, we chose to continue this journey together with a simple promise: to always be each other’s family.",
      "countdown.title":"Counting down to our day","countdown.days":"Days","countdown.hours":"Hours","countdown.minutes":"Minutes","countdown.seconds":"Seconds",
      "events.title":"Wedding Events","events.subtitle":"Two special days, one shared joy.",
      "family.bride":"Bride's Family","family.groom":"Groom's Family","event.home":"AT HOME","event.reception":"RECEPTION",
      "event.vuquy":"Bride's Ceremony","event.thanhhon":"Wedding Ceremony","event.friday":"Friday · 18.12.2026","event.sunday":"Sunday · 20.12.2026",
      "map.open":"Open map","map.directions":"Directions",
      "gallery.title":"Our Moments","gallery.subtitle":"Memories Hải & Mỹ are keeping from the journey toward becoming one family.","gallery.empty":"Our album is being prepared ♡","gallery.view":"View full album →",
      "rsvp.title":"Will you celebrate with us?","rsvp.subtitle":"Your response helps us prepare thoughtfully for our special day.",
      "rsvp.name":"Full name","rsvp.phone":"Phone number","rsvp.optional":"(optional)","rsvp.attend":"Will you be able to attend?","rsvp.yes":"Yes, I'll be there","rsvp.no":"Sorry, I can't attend","rsvp.count":"Number of guests","rsvp.event":"Event attendance","rsvp.message":"Message for Hải & Mỹ","rsvp.submit":"Send RSVP",
      "rsvp.guest1":"1 guest","rsvp.guest2":"2 guests","rsvp.guest3":"3 guests","rsvp.guest4":"4 guests","rsvp.guest5":"5 guests",
      "rsvp.bride":"Bride's family — 18/12/2026","rsvp.groom":"Groom's family — 20/12/2026","rsvp.both":"Both days",
      "rsvp.sending":"Sending your RSVP...","rsvp.success":"Thank you! Hải & Mỹ received your RSVP ❤️","rsvp.error":"We couldn't send your RSVP. Please try again or contact the bride and groom directly.",
      "footer.thanks":"Thank you for being part of our story.","footer.month":"December 2026",
      "album.back":"← Back to invitation","album.title":"Hải & Mỹ's Album","album.subtitle":"The moments we want to keep and share with you.","album.loading":"Loading album...","album.all":"All","album.empty":"This album does not have photos yet. Please come back soon ♡","album.moments":"moments","album.close":"Close","album.prev":"Previous photo","album.next":"Next photo",
      "album.prewedding":"Pre-Wedding","album.bride":"Bride's Family","album.groom":"Groom's Family"
    },
    ja: {
      "nav.story":"ふたりのストーリー","nav.events":"結婚式の予定","nav.rsvp":"出欠確認",
      "hero.note":"私たちの大切な日に、ぜひ一緒にお祝いください。","hero.cta":"結婚式の予定を見る",
      "story.title":"ひとつの旅、ひとつの約束","story.text":"人生の道のりを変える出会いがあります。共に歩んできた日々を経て、私たちはこれからも家族として寄り添い続けることを約束し、新しい一歩を踏み出します。",
      "countdown.title":"幸せの日まであと","countdown.days":"日","countdown.hours":"時間","countdown.minutes":"分","countdown.seconds":"秒",
      "events.title":"結婚式の予定","events.subtitle":"特別な2日間、ひとつの喜びを皆さまと。",
      "family.bride":"新婦側","family.groom":"新郎側","event.home":"ご自宅","event.reception":"披露宴",
      "event.vuquy":"新婦側婚礼式","event.thanhhon":"結婚式","event.friday":"金曜日 · 18.12.2026","event.sunday":"日曜日 · 20.12.2026",
      "map.open":"地図を開く","map.directions":"ルート案内",
      "gallery.title":"ふたりの思い出","gallery.subtitle":"家族になるまでの道のりで、Hải & Mỹ が大切に残してきた思い出です。","gallery.empty":"アルバムを準備中です ♡","gallery.view":"アルバムをすべて見る →",
      "rsvp.title":"私たちと一緒にお祝いしていただけますか？","rsvp.subtitle":"ご出欠をお知らせいただけると、当日の準備に大変助かります。",
      "rsvp.name":"お名前","rsvp.phone":"電話番号","rsvp.optional":"（任意）","rsvp.attend":"ご出席いただけますか？","rsvp.yes":"はい、出席します","rsvp.no":"残念ながら欠席します","rsvp.count":"ご参加人数","rsvp.event":"ご参加のイベント","rsvp.message":"Hải & Mỹ へのメッセージ","rsvp.submit":"出欠を送信",
      "rsvp.guest1":"1名","rsvp.guest2":"2名","rsvp.guest3":"3名","rsvp.guest4":"4名","rsvp.guest5":"5名",
      "rsvp.bride":"新婦側 — 18/12/2026","rsvp.groom":"新郎側 — 20/12/2026","rsvp.both":"両日",
      "rsvp.sending":"送信しています...","rsvp.success":"ありがとうございます！Hải & Mỹ が出欠回答を受け取りました ❤️","rsvp.error":"送信できませんでした。もう一度お試しいただくか、新郎新婦へ直接ご連絡ください。",
      "footer.thanks":"私たちの物語の一部になってくださり、ありがとうございます。","footer.month":"2026年12月",
      "album.back":"← 招待状へ戻る","album.title":"Hải & Mỹ のアルバム","album.subtitle":"ふたりで大切に残していきたい瞬間です。","album.loading":"アルバムを読み込み中...","album.all":"すべて","album.empty":"このアルバムにはまだ写真がありません。またぜひご覧ください ♡","album.moments":"枚の思い出","album.close":"閉じる","album.prev":"前の写真","album.next":"次の写真",
      "album.prewedding":"前撮り","album.bride":"新婦側","album.groom":"新郎側"
    }
  };

  const labels = {vi:"VI",en:"EN",ja:"日本語"};
  const supported = ["vi","en","ja"];
  const stored = localStorage.getItem("wedding_language");
  let current = supported.includes(stored) ? stored : "vi";

  function t(key) {
    return dictionaries[current]?.[key] ?? dictionaries.vi[key] ?? key;
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
    document.dispatchEvent(new CustomEvent("wedding:language", {detail:{lang:current}}));
  }

  function setLanguage(lang) {
    if (!supported.includes(lang)) return;
    current = lang;
    localStorage.setItem("wedding_language", lang);
    apply();
  }

  function mount() {
    document.querySelectorAll("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });
    apply();
  }

  window.WeddingI18n = {t, apply, setLanguage, get language(){return current;}, labels};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();