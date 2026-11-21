# Admin

Admin entry:

`/admin`

## RSVP

The RSVP table supports:
- Search
- Attendance filter
- Event filter
- Source filter
- CSV export
- Edit modal

Source badges:
- **Được mời** → invite link
- **Khách tự nhập** → public website
- **Admin nhập** → admin-created response

Admin may edit:
- Guest name
- Phone
- Attendance
- Guest count
- Event
- Message

System metadata such as RSVP ID and invite ID are not edited from the modal.

When attendance is changed to `no`, guest count is stored as `0`.

## Guest invites

Guest management includes:
- Create/edit invite
- Personalized display name
- Companion
- Side/group
- Preferred language
- Event
- Max guest count
- Enable/disable link
- Mark sent
- Open tracking
- CSV import/export

## Security

### Quên mật khẩu Admin / Password recovery

- Từ `/admin/login/`, chọn **Quên mật khẩu?**; chỉ email quản trị được phép yêu cầu.
- Supabase `resetPasswordForEmail` sử dụng `redirectTo` là `https://hai-my-wedding-gamma.vercel.app/admin/reset-password/` trên production.
- Email phải chứa liên kết xác thực `{{ .ConfirmationURL }}` trong mẫu **Reset Password**; **không** liên kết tới `{{ .SiteURL }}` (trang thiệp cưới).
- Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs** phải có chính xác `https://hai-my-wedding-gamma.vercel.app/admin/reset-password/` (nên thêm cả biến thể không có dấu `/` cuối). Đây là cấu hình Supabase, không nằm trong Git và không tự đổi theo deploy.
- Trang `/admin/reset-password/` xác thực mã recovery (implicit token, PKCE code hoặc OTP hash) và email Admin trước khi hiển thị form tạo mật khẩu mới; truy cập trực tiếp hoặc dùng mã hết hạn chỉ hiển thị lỗi.
- Đổi mật khẩu thành công → sign out → `/admin/login/?reset=success` để đăng nhập lại bằng mật khẩu mới. Các link cũ gửi đến `/admin/login/` được chuyển tiếp sang trang recovery chuyên dụng, giữ nguyên token.
- Nếu Supabase vì cấu hình sai chuyển callback về trang thiệp cưới kèm token recovery, script đầu trang sẽ chuyển ngay tới `/admin/reset-password/`. Tuy nhiên **không thể** sửa email được tạo bằng `{{ .SiteURL }}` thuần (không chứa token) ở frontend; phải thay template trong dashboard.


Admin writes are limited by Supabase authenticated policies to the configured admin account.

## Thiết kế V11 — ảnh theo vị trí

Mở `/admin` → **Thiết kế website** (editor hiện tại, dùng cấu hình V3).

- **Hero**: chọn tối đa ba ảnh đã Publish và chỉnh điểm lấy nét desktop/mobile.
- **Ảnh lịch cưới / Our Promise / Farewell**: chọn riêng từng ảnh.
- **Album trang chủ**: chọn tối đa năm ảnh có thứ tự, ảnh 01 là ảnh nổi bật. Không chọn thì hệ thống tự chọn từ những ảnh có `show_on_homepage`. Các ảnh còn lại vẫn nằm trong Album chi tiết.
- **Story Builder**: Split/Letter chọn một ảnh; Filmstrip chọn một ảnh chính và tùy chọn hai ảnh phụ. Ba ảnh không được trùng nhau.
- Bấm **Publish toàn bộ thiết kế V3** để lưu. Chỉ thay đổi trong form không làm thay đổi public.

**Collage V2 đã được gỡ khỏi Admin** vì không được trang public sử dụng. Dữ liệu cấu hình cũ, nếu có, vẫn được giữ trong Supabase để có thể đối chiếu hoặc phục hồi.

## Mời riêng theo URL

Mở **Khách mời** → **Tạo khách mời**. Chọn ngôn ngữ, số người, sự kiện và lưu để tạo URL cá nhân hóa; có thể copy URL ở danh sách khách. Mỗi token chỉ thuộc một bản ghi mời. Thay đổi thông tin khách vẫn giữ nguyên URL; tắt link sẽ làm token không còn hợp lệ.

Định dạng link: `/vi/invite/{token}`, `/en/invite/{token}`, `/jp/invite/{token}`.

Không dùng link riêng làm link công khai vì người có link có thể xem dữ liệu lời mời và cập nhật RSVP.

## Visual Editor V14 — chọn ảnh theo thứ tự hiển thị

Mở **Admin → Thiết kế website**. Trình chỉnh sửa hiển thị mười khu vực theo đúng hành trình của khách mời:

1. Mở thiệp (nội dung chữ, không có ảnh)
2. Hero (tối đa ba ảnh)
3. Our Story (nút mở Story Builder, có thể chọn ảnh từ thư viện trong form)
4. Countdown (không có ảnh riêng)
5. Wedding Schedule (một ảnh)
6. Our Promise (một ảnh)
7. Our Moments (năm ảnh Album, ảnh thứ nhất là ảnh lớn)
8. RSVP (không có ảnh riêng)
9. Thông tin mừng cưới (tài khoản và QR của Nhà trai/Nhà gái)
10. Farewell (một ảnh)

Nhấn **Chọn ảnh / Đổi ảnh** ngay trên hình thu nhỏ, tìm kiếm và chọn ảnh từ thư viện đã Publish. Ảnh *Website only* dùng được cho các khu vực khác Gallery; Gallery chỉ nhận ảnh có quyền hiển thị Album. Nút **Dùng ảnh tự động** trả vị trí về mặc định. Các nút PC/Tablet/Mobile đổi tỷ lệ preview minh họa (không thay đổi nội dung thực tế). **Lưu & Publish thiết kế** lưu qua cùng cơ chế V3, không tự động lưu khi chọn ảnh.

Các phần **Tùy chỉnh Hero**, **Thiết lập Album chi tiết**, **Story Builder** là những bảng nâng cao có thể mở rộng. Khi mở thư viện chọn ảnh, có thể chuyển đến tab Album để upload ảnh mới. Các thay đổi chưa Publish được giữ nguyên khi chuyển qua lại giữa các tab, nhưng **không tồn tại sau khi tải lại trình duyệt**.

## Kiểm tra hình ảnh và khối Quote (2026-10-31)

**Thiết kế website** hiện theo thứ tự **12 khu vực**, gồm cả hai khối chữ có trong Story Builder:
- **05 · Lời nhắn sau Countdown**: nội dung ở vị trí `promise` / **Sau Countdown**.
- **10 · Lời nhắn sau RSVP**: nội dung ở vị trí `rsvp` / **Sau RSVP**.

Hai phần này mặc định sử dụng bố cục **Quote (chỉ chữ)**; không phải lỗi thiếu hình ảnh. Có thể chọn **Sửa nội dung / thay thành ảnh** để mở Story Builder, sửa nội dung VI/EN/JA, chuyển sang bố cục ảnh hoặc ẩn khối và **Publish thiết kế**.

Thanh **Kiểm tra cấu hình** trong Visual Editor báo khi (1) không có ảnh đã Publish, (2) Footer chọn cùng ID ảnh với lịch cưới, hoặc (3) QR Nhà gái đang tắt trong Admin. Một vị trí đặt **Tự động** không bị coi là ảnh hỏng; website có thể sử dụng ảnh dự phòng từ thư viện. Thay đổi chọn ảnh/Story cần **Lưu & Publish thiết kế**; thông tin ngân hàng dùng nút **Lưu & Công bố** riêng.

Các quote công khai luôn hiển thị chữ ngay cả trước khi hiệu ứng cuộn chạy để trang chụp full-page không giống khung ảnh trống. Không thay đổi dữ liệu `v3_design` và `wedding_gifts_v1` hiện có.

## Mừng cưới — tài khoản Nhà trai & Nhà gái (V16)

Vào **Admin → Thiết kế website → 09 · Thông tin mừng cưới**. Phần này xuất hiện trực tiếp **sau RSVP và trước lời cảm ơn/Footer**. Nhà trai luôn đứng trước Nhà gái.

- **Hiển thị section**: bật/tắt toàn bộ. **Ai có thể xem**: công khai toàn thiệp, hoặc chỉ URL mời riêng.
- **Nhà trai**: mặc định TPBank, PHAM VU HAI, 04480062888. QR mặc định dựng từ đúng dữ liệu VietQR đã cung cấp, không kết nối với dịch vụ sinh QR bên ngoài.
- **Nhà gái**: chưa có tài khoản và QR; giữ chế độ chưa công bố, hiển thị thông báo đang cập nhật. Điền đủ ngân hàng, tên chủ tài khoản và số tài khoản, sau đó upload QR để công bố.
- **Upload QR**: PNG/JPEG/WebP dưới 3 MB, lưu trong bucket `wedding-gallery` dưới tiền tố `wedding-gifts/`, không đưa vào Album cưới.
- **Lưu & Công bố**: nút lưu riêng cho thông tin mừng cưới; không yêu cầu Publish thiết kế V3 hoặc deploy lại.
- Nếu thay số tài khoản Nhà trai, phải upload QR mới. Trước khi thông báo cho khách, luôn thử quét QR và xác nhận tên/số tài khoản tại ứng dụng ngân hàng.

Các URL mời riêng, Album, RSVP không bị thay đổi. Thông tin số tài khoản và QR khi bật công khai có thể được bất kỳ khách truy cập nào xem và chia sẻ.

## Album V17 — Bulk Import, Photo Ordering and Bulk Management (2026-11-21)

In **Admin → Album**, the three modes are:

- **Thêm 1 ảnh**: existing single-image editor, with zoom/crop, focus and multilingual metadata.
- **Import hàng loạt**: drop/select JPG, PNG and WebP files; review preview cards; reorder images with drag and drop or up/down controls; select destination Album; optionally Publish. Default is Draft, visible in Album only after Publish, and not selected for Homepage or Hero.
- **Sắp xếp thứ tự**: select an Album, drag (desktop) or use arrow controls (touch/keyboard); choose **Lưu thứ tự** to persist all positions atomically. **Hoàn tác** reloads saved ordering. Publication status, Featured and Hero remain unchanged.

During Bulk Upload, two images are processed concurrently and uploaded to `wedding-originals` / `wedding-gallery` with UUID-based immutable paths, using existing WebP size and dimension limits. Each successful image is inserted into `gallery_images`. Failed uploads are cleaned from Storage where possible and may be retried individually in the queue. Avoid refreshing before the batch finishes.

The Library section supports multi-select and **Publish, Unpublish, Show in Album, Website only, Move to Album** and **Delete Draft** actions. Bulk delete is restricted to unpublished images not flagged as Hero, Featured, Homepage or Cover. Verify all references before single-image deletion. Move and reorder use two `SECURITY INVOKER` Postgres RPC functions, subject to existing RLS policies.

The public **Album** now orders by `sort_order ASC`, then `created_at DESC` and `id ASC`, independently of Featured. The **Homepage** remains curated separately using the existing Visual Editor's five selected images and is not affected by Album drag ordering.

**Verification checklist**: run `node tools/check-asset-refs.mjs`; GitHub WebKit workflow runs `node tools/audit-album-bulk.mjs` with a mocked Supabase client; test with a real Admin account on Preview before promoting to production. No production images are created by automated smoke tests.


## V20 — Adaptive Image Loading / Supabase Free (2026-11-21)

The gallery uses **pre-generated public WebP variants** because this Supabase organization is on the Free tier, where server-side Storage Image Transformations cannot be assumed available. The original public image and private master are always retained.

- Database: \`public.gallery_images.image_variants jsonb NOT NULL DEFAULT '{}'\`, keyed by intrinsic widths \`480\`, \`960\`, and \`1440\`. Entries contain actual immutable \`wedding-gallery\` Storage paths; they are not guessed.
- New bulk and individual uploads generate the three sizes (when smaller than the full original), after the main public file is uploaded. A variant failure logs a warning and preserves the full-size public image as a fallback.
- Existing images: **Admin → Album → Ảnh nhẹ cho điện thoại & mạng chậm → Tối ưu ảnh cũ**. This is deliberately an explicit action because downloading and re-encoding the current gallery consumes Storage, network, and browser processing. The tool works one image at a time; it reports errors and supports Stop/Resume. It never changes album membership, order, Hero, Featured, or Publish state.
- Gallery rendering: \`srcset\` and \`sizes\` choose an appropriate size by layout/DPR. When the browser supports Network Information or Save Data, the candidate range is capped for slower connections; Safari without those APIs falls back to responsive \`srcset\` alone. Hero remains eager/high priority; offscreen gallery and Story images load lazily; Lightbox requests larger images.
- To keep backward compatibility, any record without variants continues using its existing \`image_path\` and yields no \`srcset\`. A file path is emitted in \`srcset\` **only after** a successful Storage upload and database save.
- Bulk and single-image deletion include all variant paths; editing an image cleans old variants when the new public image replaces it.
- Native responsive rendering does not measure internet speed or force a fixed resolution on Safari. Do not promise exact download byte savings without testing image data.

### Regression checklist

1. Upload an image larger than 1600px. Verify \`image_variants\` is populated with 480/960/1440 paths.
2. Refresh Admin and verify all images remain visible, and Hero/RSVP/navigation remain unaffected.
3. Run \`tools/audit-adaptive-images.mjs\` in WebKit CI, covering actual WebP generation, \`srcset\` selection, network caps and legacy fallback.
4. Confirm lazy loading and Hero priority using Network tab, iPhone/Android and desktop viewport sizes.
5. During legacy backfill, inspect available Supabase Free Storage usage. Existing public images currently consume material space; avoid backfilling everything if storage is near your plan limit.


## V21 — Progressive Gallery + non-circular Lightbox (2026-11-21)

**Public Album** is staged rather than downloading 48 full-resolution images at once:

- Album initially renders **10 cards**, appending another 10 when the bottom sentinel approaches the scroll viewport. Filter changes reset the list without changing the stored \`sort_order\`.
- Each card begins as a colored skeleton with **no image URL**. An IntersectionObserver attached to the scrolling Album overlay starts at most three small requests concurrently near the viewport.
- Preview is **320px** when available, otherwise existing **480px**. After the card stays on screen for ~1.25s, one visible card at a time can be upgraded to the 960px WebP, using a short crossfade; Save Data / 2G / 3G skip the upgrade. Unseen cards do not request the next resolution.
- In the Album grid, \`srcset\` never includes the full public original. Full resolution is requested **only on Photo Lightbox open**, with the cached thumbnail shown while HD loads. Background thumbnail requests pause while a Lightbox is open. A failed HD request reveals a retry button.
- Lightbox Previous/Next, arrow keys and swipe navigation **stop at the first and last photo**, rather than wrapping. Both endpoint buttons are disabled and marked \`aria-disabled\`.
- Failed thumbnails try a second existing variant, then show a readable placeholder; users can still tap the card to open its original. Images and Gallery state work without an external animation library.
- Existing photos already have 480/960 variants. New Admin uploads generate **320/480/960/1440px** copies where supported. To add 320px previews to earlier uploads, use **Admin → Album → Tối ưu ảnh cũ**; this reuses the 480px copy to avoid downloading original full files, preserves all earlier variant paths and is resumable.
- Test \`node tools/audit-v21-gallery.mjs\` in WebKit (offline only) plus all prior Safari, UI and asset integrity suites before promoting a Production commit. Keep RSVP, Hero, personalized invitations, and animations untouched.


## V22 — Progressive TOP photos (2026-11-21)

The public TOP page (Hero and the five curated Our Moments tiles) now uses the same uploaded WebP variants as Album without a new storage provider or database migration.

- **Hero:** Preload/decode a small 320/480px preview before revealing the Hero. On non-Save-Data connections, promote to at most a 960px (3G/low bandwidth) or 1440px (other connections) variant only after the preview has loaded. If the preview took over 1.8s, skip the automatic upgrade (important for Safari, which has no Network Information API).
- **Hero slideshow:** Only the visible slide gets a URL; other slides do not fetch hidden images during initial render. Its decorative four crops share the same preview and eventual higher-quality URL, not four separate originals. Later slides are loaded when selected.
- **TOP Our Moments:** Cards start with no URL, fetch a 320/480px preview only near the viewport, and optionally upgrade to 960px if the preview loads promptly. Browsers with Save Data/2G do not automatically upgrade.
- **Other TOP/story photos:** Native responsive candidates are limited to real stored WebP variants, not the original master when variants exist.
- **Album/Lightbox unchanged:** Album List stays thumbnail-first; the original is only requested after a Photo Lightbox click. Navigation never wraps from first to last.
- **Legacy uploads:** If an image has no `image_variants`, the original remains the only available source. To benefit from progressive TOP loading, generate variants using **Admin → Album → Tối ưu ảnh cũ**. Avoid bulk backfill near the storage limit.

Verification: the existing WebKit CI `node tools/audit-adaptive-images.mjs` now checks TOP preview URLs and upgrade caps. Confirm the Hero and the five TOP cards on mobile (including slow network and Save Data), then verify Album/RSVP/Admin smoke and deployment status.
