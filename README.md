# Hải & Mỹ Wedding Website

Website thiệp cưới tĩnh + RSVP Supabase, deploy tốt trên Vercel.

## Chạy local
Mở `index.html` bằng trình duyệt hoặc dùng bất kỳ static server nào.

## Kết nối Supabase
1. Tạo Supabase project.
2. Chạy toàn bộ file `supabase.sql` trong SQL Editor.
3. Vào Project Settings → API, lấy Project URL và anon public key.
4. Điền vào `config.js`.

## Deploy Vercel
Upload repository này lên GitHub rồi import vào Vercel, hoặc deploy trực tiếp bằng Vercel CLI.
Framework preset: Other / Static.

## Domain riêng
Trong Vercel: Project → Settings → Domains → Add Domain.
Sau đó cập nhật DNS theo hướng dẫn Vercel.

## Thay ảnh cưới
Hiện 4 ô gallery dùng gradient placeholder. Có thể thay bằng ảnh thật bằng CSS `background-image: url(...)` hoặc đổi thành thẻ `<img>`.
