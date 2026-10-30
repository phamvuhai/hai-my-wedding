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

Mở `/admin` → **Thiết kế V3** (đây là editor đang dùng trên trang public).

- **Hero**: chọn tối đa ba ảnh đã Publish và chỉnh điểm lấy nét desktop/mobile.
- **Ảnh lịch cưới / Our Promise / Farewell**: chọn riêng từng ảnh.
- **Album trang chủ**: chọn tối đa năm ảnh có thứ tự, ảnh 01 là ảnh nổi bật. Không chọn thì hệ thống tự chọn từ những ảnh có `show_on_homepage`. Các ảnh còn lại vẫn nằm trong Album chi tiết.
- **Story Builder**: Split/Letter chọn một ảnh; Filmstrip chọn một ảnh chính và tùy chọn hai ảnh phụ. Ba ảnh không được trùng nhau.
- Bấm **Publish toàn bộ thiết kế V3** để lưu. Chỉ thay đổi trong form không làm thay đổi public.

Tab **Collage V2 (cũ)** chỉ giữ để đối chiếu, không kết nối vào public hiện tại. Các ô chọn ảnh dùng ảnh từ Album đã được Publish.

## Mời riêng theo URL

Mở **Khách mời** → **Tạo khách mời**. Chọn ngôn ngữ, số người, sự kiện và lưu để tạo URL cá nhân hóa; có thể copy URL ở danh sách khách. Mỗi token chỉ thuộc một bản ghi mời. Thay đổi thông tin khách vẫn giữ nguyên URL; tắt link sẽ làm token không còn hợp lệ.

Định dạng link: `/vi/invite/{token}`, `/en/invite/{token}`, `/jp/invite/{token}`.

Không dùng link riêng làm link công khai vì người có link có thể xem dữ liệu lời mời và cập nhật RSVP.
