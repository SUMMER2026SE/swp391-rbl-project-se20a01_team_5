# Hướng dẫn Cấu hình TestSprite cho UniBus

Bạn hãy sao chép toàn bộ các thiết lập dưới đây và điền vào các ô tương ứng trên giao diện của **TestSprite Web Portal** để có được kết quả test hoàn hảo nhất:

## 1. Upload PRD
Hãy tải lên file `docs/TESTSPRITE_PRD.md` (hoặc copy nội dung) vào mục Upload PRD của TestSprite. Điều này giúp TestSprite tự động tạo ra Bản đồ Tính năng (Feature Map) đầy đủ cho cả 6 vai trò của hệ thống UniBus.

## 2. Cấu hình Tài khoản (Auto-Auth & Credentials)
Cung cấp các Test Accounts sau vào bảng Credentials của TestSprite:
- **Tên:** Conductor Demo | **Email:** `conductor.demo@unibus.local` | **Mật khẩu:** Password123!
- **Tên:** Driver Demo | **Email:** `driver.demo@unibus.local` | **Mật khẩu:** Password123!
- **Tên:** Dispatcher Demo | **Email:** `dispatcher.demo@unibus.local` | **Mật khẩu:** Password123!
- **Tên:** Admin Demo | **Email:** `admin.verify@unibus.local` | **Mật khẩu:** Password123!
- **Tên:** Student Demo | **Email:** `student.verified@unibus.local` | **Mật khẩu:** Password123!
*Lưu ý: TestSprite sẽ dùng các tài khoản này tự động Login và sinh Token cho mỗi lần chạy test.*

## 3. Natural-language Hints (Copy paste vào ô Hints/Instructions của TestSprite)

Hãy dán đoạn text sau vào mục **Hints / Instructions** của TestSprite:

> **Project Context:** This is "UniBus", a university bus management system with complex UI modules for different roles (Student, Conductor, Driver, Admin).
> 
> **Focus Areas for UI Testing:**
> 1. **Visual Testing for AI Suggestions:** Strictly verify the "AI Gợi ý tuyến xe" screen for Students. Ensure the newly applied purple hero card, the Top 1/2/3 rank badges, and the 5-star match scores are visually rendered correctly without CSS breakage.
> 2. **Role-based Routing:** Ensure that logging in as `conductor.demo@unibus.local` correctly redirects to the Conductor module, and NO "adm-ctx" or broken UI routes occur.
> 3. **QR Scanner Fallback:** Verify that the QR scanner screen in the Conductor module handles "Camera permissions denied" gracefully.
> 
> **Focus Areas for API Testing:**
> 1. Focus on `POST /api/v1/students/me/route-suggestions`. Verify that passing `freeTime`, `destinationStopId`, and `preferences` returns a 200 OK with an array of sorted routes. If POST returns 405, expect it to gracefully fallback to GET.
> 2. Do NOT run destructive tests (like deleting core Routes or Stops) as they might break the live demo data.

---

## 💡 Lưu ý cho Sếp:
- Phần **Mật khẩu** của các tài khoản Demo: Do hệ thống chúng ta mã hóa bằng BCrypt nên sếp xem mật khẩu gốc thường dùng khi sếp code là gì (123456 hoặc password) thì điền vào cho TestSprite nhé.
- Về phần UI Testing, TestSprite có **Auto-Heal**, nên nếu sau này team giao diện (UI team) có sửa đổi tên class hoặc thay đổi ID, TestSprite sẽ tự động tìm lại nút bấm mà không đánh fail bài test vô cớ.
