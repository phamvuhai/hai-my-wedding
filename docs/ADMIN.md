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

Mở **Admin → Thiết kế website**. Trình chỉnh sửa hiển thị chín khu vực theo đúng hành trình của khách mời:

1. Mở thiệp (nội dung chữ, không có ảnh)
2. Hero (tối đa ba ảnh)
3. Our Story (nút mở Story Builder, có thể chọn ảnh từ thư viện trong form)
4. Countdown (không có ảnh riêng)
5. Wedding Schedule (một ảnh)
6. Our Promise (một ảnh)
7. Our Moments (năm ảnh Album, ảnh thứ nhất là ảnh lớn)
8. RSVP (không có ảnh riêng)
9. Farewell (một ảnh)

Nhấn **Chọn ảnh / Đổi ảnh** ngay trên hình thu nhỏ, tìm kiếm và chọn ảnh từ thư viện đã Publish. Ảnh *Website only* dùng được cho các khu vực khác Gallery; Gallery chỉ nhận ảnh có quyền hiển thị Album. Nút **Dùng ảnh tự động** trả vị trí về mặc định. Các nút PC/Tablet/Mobile đổi tỷ lệ preview minh họa (không thay đổi nội dung thực tế). **Lưu & Publish thiết kế** lưu qua cùng cơ chế V3, không tự động lưu khi chọn ảnh.

Các phần **Tùy chỉnh Hero**, **Thiết lập Album chi tiết**, **Story Builder** là những bảng nâng cao có thể mở rộng. Khi mở thư viện chọn ảnh, có thể chuyển đến tab Album để upload ảnh mới. Các thay đổi chưa Publish được giữ nguyên khi chuyển qua lại giữa các tab, nhưng **không tồn tại sau khi tải lại trình duyệt**.
