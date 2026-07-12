# Driver Role Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện role Driver với lifecycle thống nhất, timezone Việt Nam, UI rõ ràng và tracking đúng chuyến.

**Architecture:** Backend tiếp tục là nguồn sự thật cho ownership và transition trạng thái. Frontend dùng một nhóm helper thuần trong `driver-module.tsx` để chuẩn hóa trạng thái, thời điểm lịch và nhãn hiển thị trên tất cả màn Driver.

**Tech Stack:** Spring Boot 4, JdbcTemplate, JUnit 5/Mockito, Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion.

---

### Task 1: Khóa hành vi lifecycle bằng test

**Files:**
- Modify: `backend/src/test/java/com/unibus/api/operations/DriverOperationsServiceTests.java`
- Modify if required: `backend/src/main/java/com/unibus/api/operations/OperationsService.java`

- [ ] Thêm test chuyến `RUNNING` thiếu `departedAt` không được chọn là chuyến đang chạy.
- [ ] Thêm test chuyến `NOT_STARTED` quá 60 phút không xuất hiện trong upcoming overview.
- [ ] Chạy test mới và xác nhận fail đúng hành vi thiếu.
- [ ] Sửa tối thiểu logic overview nếu test chứng minh backend còn sai.
- [ ] Chạy `DriverOperationsServiceTests` và xác nhận pass.

### Task 2: Chuẩn hóa timezone và trạng thái frontend

**Files:**
- Modify: `frontend/src/components/bus/roles/driver-module.tsx`

- [ ] Thêm helper tạo thời điểm lịch với offset `+07:00` từ `serviceDate` và `departureTime`.
- [ ] Thêm helper nhận diện chuyến đang chạy hợp lệ và nhãn ngày/giờ.
- [ ] Thay toàn bộ so sánh thời gian Driver đang dùng timezone trình duyệt bằng helper chung.
- [ ] Dùng ngày Việt Nam làm giá trị mặc định của bộ lọc lịch chạy.

### Task 3: Hoàn thiện Dashboard và chuyến hiện tại

**Files:**
- Modify: `frontend/src/components/bus/roles/driver-module.tsx`

- [ ] Thu gọn hero Dashboard thành card vận hành ưu tiên thông tin.
- [ ] Hiển thị ngày cho mọi chuyến sắp tới và sort theo thời điểm thực.
- [ ] Đổi trạng thái khi xe tới điểm cuối thành `Chờ kết thúc chuyến` và nhấn mạnh CTA kết thúc.
- [ ] Giữ danh sách phân công không lặp chuyến đang được chọn.
- [ ] Giữ tracking theo `tripId` và không thay `JourneyMap` dùng chung.

### Task 4: Hoàn thiện lịch chạy và lịch sử

**Files:**
- Modify: `frontend/src/components/bus/roles/driver-module.tsx`

- [ ] Hiển thị lý do không thể bắt đầu ngay trên nút hoặc status.
- [ ] Hiển thị ngày và giờ đầy đủ ở lịch chạy.
- [ ] Chuyển lịch sử thành timeline dọc gọn, đủ dữ liệu thực tế.
- [ ] Sửa dependency load history để không gọi API lặp sau lần tải đầu.

### Task 5: Validation và visual QA

**Files:**
- Verify only.

- [ ] Chạy `mvn -pl backend -Dtest=DriverOperationsServiceTests test`.
- [ ] Chạy full backend tests.
- [ ] Chạy `npm run lint --prefix frontend`.
- [ ] Chạy `npm run build --prefix frontend` và ghi nhận exit code.
- [ ] Chạy `git diff --check`.
- [ ] Restart frontend production server.
- [ ] Visual test Dashboard, Lịch chạy, Chuyến hiện tại và Lịch sử; kiểm tra console không có error.
