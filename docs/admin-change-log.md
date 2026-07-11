# Ghi chú thay đổi Admin/UniAdmin

Ngày cập nhật: 2026-07-11

## 1. Tổng quan

Tài liệu này ghi lại các thay đổi đã thực hiện cho phần Admin sau các đợt rà soát nghiệp vụ.

Mục tiêu chính:

- Làm rõ Admin hệ thống và Admin trường.
- Bỏ các mục UI chưa có nghiệp vụ rõ.
- Không hiển thị dữ liệu mock/debug như dữ liệu thật.
- Đồng bộ Admin với API/backend thật.
- Sửa báo cáo, export, giao dịch, audit log và gán tuyến cho trường.
- Làm rõ phần giá vé/trợ giá theo đúng vai trò.

## 2. Phân vai nghiệp vụ

### ADMIN

Admin hệ thống dùng các API `/api/v1/admin/*`.

Phạm vi:

- Xem báo cáo toàn hệ thống.
- Quản lý trường đối tác.
- Gán tuyến cho trường.
- Quản lý tài khoản và phân quyền.
- Xác minh sinh viên.
- Xem lịch sử giao dịch.
- Xem nhật ký hoạt động.
- Quản lý/giám sát giá vé.

### UNIVERSITY_ADMIN

Admin trường dùng các API `/api/v1/university-admin/*`.

Phạm vi:

- Quản lý thông tin trường/campus/domain.
- Import roster sinh viên.
- Xem thống kê trường mình.
- Cấu hình chính sách trợ giá cho trường mình.
- Xem giao dịch/đối soát theo trường.
- Gửi thông báo trường nếu nghiệp vụ này được dùng.

Kết luận nghiệp vụ:

- Admin hệ thống gán tuyến cho trường.
- Admin trường cấu hình trợ giá cho trường mình.
- Vì vậy label Admin hệ thống đã đổi từ `Giá vé & trợ giá` thành `Giá vé`.
- Mục `Chính sách trợ giá` vẫn thuộc UniAdmin.

## 3. Sidebar/menu Admin

Đã chỉnh:

- Bỏ mục `Thông báo` khỏi sidebar Admin hệ thống.
- Đổi `Bảng điều khiển`/dashboard Admin theo hướng báo cáo/tổng quan.
- Đổi `Audit log` thành `Nhật ký hoạt động`.
- Đổi `Activity` thành `Hoạt động gần đây`.
- Đổi `Transaction` thành `Lịch sử giao dịch`/`Giao dịch & hóa đơn`.
- Đổi `Assign route` thành `Gán tuyến cho trường`.
- Đổi `Giá vé & trợ giá` thành `Giá vé` trong Admin hệ thống.

Lý do bỏ `Thông báo` khỏi Admin:

- Chưa có nghiệp vụ Admin hệ thống rõ.
- Tránh demo một tab trống/mock/link chết.
- Backend notification không bị xóa.
- UniAdmin vẫn có mục gửi thông báo trường nếu module đó dùng.

File liên quan:

- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/admin-module.tsx`

## 4. UI Admin và layout

Đã chỉnh:

- Bám layout Admin hiện tại, không redesign lớn.
- Tạo primitive dùng chung cho Admin console.
- Tinh chỉnh shell/sidebar để Admin gọn và rõ hơn.
- Tránh nested card không cần thiết.
- Giữ các màn trong cùng module Admin.

File liên quan:

- `frontend/src/components/bus/app-shell.tsx`
- `frontend/src/components/bus/admin-console-primitives.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/bus/roles/admin-module.tsx`

## 5. Bỏ text OCR/mock/debug

Đã chỉnh:

- Không để text debug/OCR thô lộ trực tiếp như dữ liệu nghiệp vụ.
- Đổi các label gây hiểu nhầm:
  - `Lệch OCR` -> `Cần đối chiếu`
  - `OCR: ...` -> `Thông tin từ ảnh thẻ: ...`
  - `Xem raw OCR` -> `Xem nội dung trích xuất từ ảnh thẻ`
  - `Duyệt` -> `Xác minh`
- Khi chưa có dữ liệu thật thì dùng empty state.

Empty state đã dùng:

- `Chưa có dữ liệu`
- `Chưa có hoạt động gần đây`
- `Không có giao dịch trong khoảng thời gian này`
- `Chưa có sinh viên chờ xác minh`
- `Chưa có báo cáo phù hợp với bộ lọc`

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`

## 6. Báo cáo Admin

Đã chỉnh:

- Thêm filter thời gian cho báo cáo:
  - Hôm nay
  - 7 ngày gần nhất
  - Tháng hiện tại
  - Custom range
- Frontend truyền ngày xuống API.
- Backend `/admin/stats` nhận `from` và `to`.
- Doanh thu/trips series được tính theo khoảng ngày.
- UI có trạng thái loading/error/empty state.

Export báo cáo:

- Nút `Xuất báo cáo` đã có handler.
- Xuất CSV từ dữ liệu báo cáo đang hiển thị.
- Tên file dạng `admin-report-YYYY-MM-DD-to-YYYY-MM-DD.csv`.
- Export áp dụng filter thời gian hiện tại.
- Có toast thành công/thất bại.
- Sau khi export, frontend gọi API audit để ghi log `ADMIN_REPORT_EXPORT`.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/lib/api/client.ts`
- `backend/src/main/java/com/unibus/api/experience/ExperienceController.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceService.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- `backend/src/main/java/com/unibus/api/university/AdminUniversityController.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`

## 7. Gán tuyến cho trường

Nghiệp vụ xác định:

- Database dùng bảng trung gian `route_universities`.
- Một trường có thể có nhiều tuyến.
- Một tuyến có thể gán cho nhiều trường.
- Gán tuyến không sửa trực tiếp bảng `universities` hoặc `routes`.

Đã chỉnh:

- UI chọn trường từ API thật.
- UI chọn nhiều tuyến active.
- Danh sách tuyến lấy từ API quản trị tuyến `/coordinator/routes`, không dùng public `/routes`.
- Các tuyến đã active với trường đang chọn sẽ bị ẩn khỏi danh sách chọn để tránh gán trùng.
- Lưu bằng API thật `/admin/route-universities`.
- Sau khi lưu thành công:
  - Toast thành công.
  - Reset lựa chọn tuyến.
  - Reload danh sách liên kết.
  - Reload context liên quan.

Backend đã bổ sung validate:

- Trường tồn tại.
- Tuyến tồn tại.
- Campus nếu có phải thuộc đúng trường.
- Cặp trường-tuyến active không được trùng.

Audit:

- Khi gán tuyến thành công ghi `ROUTE_UNIVERSITY_CREATE`.
- UI label hiển thị là `Gán tuyến cho trường`.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/lib/api/client.ts`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`

## 8. Quản lý trường

Đã chỉnh/làm rõ:

- Admin hệ thống xem danh sách trường qua API thật.
- Tạo/sửa trường có audit log:
  - `UNIVERSITY_CREATE`
  - `UNIVERSITY_UPDATE`
- Label audit:
  - `UNIVERSITY_CREATE` -> `Trường mới được thêm`
  - `UNIVERSITY_UPDATE` -> cập nhật dữ liệu/trường

Ghi chú:

- Trường liên kết với tuyến qua `route_universities`.
- Trường liên kết với sinh viên qua `students.university_id`, `student_verifications.university_id`, roster/domain.
- Trường liên kết giao dịch qua sinh viên/order/payment.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`

## 9. Xác minh sinh viên

Nghiệp vụ xác định:

- Người xác minh sinh viên hiện tại là Admin hệ thống (`ADMIN`).
- Backend yêu cầu role Admin cho controller xác minh.
- Admin trường không xử lý flow xác minh trong code hiện tại.

Đã chỉnh:

- Chuẩn hóa status:
  - `PENDING_REVIEW` -> `Chờ xác minh`
  - `VERIFIED` -> `Đã xác minh`
  - `REJECTED` -> `Từ chối`
  - `RESUBMISSION_REQUIRED` -> `Cần bổ sung thông tin`
- Nút `Duyệt` đổi thành `Xác minh`.
- Mô tả UI làm rõ Admin hệ thống xử lý.
- Khi approve/reject/resubmit ghi audit:
  - `STUDENT_VERIFICATION_APPROVE`
  - `STUDENT_VERIFICATION_REJECTED`
  - `STUDENT_VERIFICATION_RESUBMISSION_REQUIRED`

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `backend/src/main/java/com/unibus/api/student/StudentVerificationService.java`

## 10. Lịch sử giao dịch

Đã chỉnh:

- Màn `Giao dịch & hóa đơn` dùng API thật.
- Làm rõ dữ liệu là order/payment transaction thật.
- Chuẩn hóa các cột:
  - Mã giao dịch
  - Người thanh toán
  - Trường
  - Loại/chặng
  - Số tiền
  - Trạng thái
  - Thời gian

Chuẩn hóa trạng thái:

- `paid` -> `Đã thanh toán`
- `success` -> `Thành công`
- `completed` -> `Hoàn tất`
- `pending` -> `Đang chờ`
- `unpaid` -> `Chưa thanh toán`
- `failed` -> `Thất bại`
- `cancelled`/`canceled` -> `Đã hủy`
- `refunded` -> `Đã hoàn tiền`

Nghiệp vụ `Chưa thanh toán`:

- Chỉ hiện nếu DB/API có `pending` hoặc `unpaid` thật.
- Không hardcode trạng thái giả.

Filter đã thêm:

- Tìm kiếm theo mã, sinh viên, tuyến.
- Lọc theo trường.
- Lọc theo trạng thái.
- Lọc từ ngày/đến ngày.
- Nút xóa lọc.
- Số liệu thống kê tính theo kết quả đang lọc.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/lib/api/client.ts`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`

## 11. Audit log / Nhật ký hoạt động

Nghiệp vụ xác định:

- Audit log là nhật ký hành động nghiệp vụ/quản trị quan trọng.
- Không phải access log.
- Không ghi login/logout/xem trang/refresh/GPS.

Những hành động nên giữ:

- Tạo/sửa trường.
- Tạo admin trường.
- Gán tuyến cho trường.
- Xác minh/từ chối/yêu cầu bổ sung hồ sơ sinh viên.
- Import roster.
- Thêm/cập nhật domain trường.
- Thêm campus.
- Tạo chính sách trợ giá.
- Gửi thông báo trường.
- Xuất báo cáo.

Đã chỉnh:

- Hiển thị label tiếng Việt cho các action.
- `ROUTE_UNIVERSITY_CREATE` -> `Gán tuyến cho trường`.
- `UNIVERSITY_CREATE` -> `Trường mới được thêm`.
- `UNIVERSITY_NOTIFICATION_SEND` -> `Gửi thông báo trường`.
- `UNIVERSITY_ADMIN_CREATE` -> `Tạo admin trường`.
- `DOMAIN_CREATE` -> `Thêm domain trường`.
- `DOMAIN_STATUS_UPDATE` -> `Cập nhật trạng thái domain`.
- `CAMPUS_CREATE` -> `Thêm cơ sở trường`.
- `ROSTER_IMPORT` -> `Import danh sách sinh viên`.
- `SUBSIDY_POLICY_CREATE` -> `Tạo chính sách trợ giá`.

Đã ẩn mặc định các action tự động/hệ thống không cần demo:

- `GOOGLE_ROSTER_AUTO_LINK`
- `DOMAIN_AUTO_LINK`

Đã bỏ ghi mới `GOOGLE_ROSTER_AUTO_LINK` ở backend.

Filter đã thêm:

- Tìm kiếm theo người thực hiện, hành động, ghi chú.
- Lọc theo trường.
- Lọc theo hoạt động.
- Lọc theo kết quả.
- Lọc từ ngày/đến ngày.
- Nút xóa lọc.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`
- `backend/src/main/java/com/unibus/api/student/StudentVerificationService.java`

## 12. Hoạt động gần đây

Đã chỉnh:

- Không dùng mock activity.
- Lấy từ audit log thật nếu có.
- Nếu không có dữ liệu thì hiển thị `Chưa có hoạt động gần đây`.
- Label hoạt động được map sang tiếng Việt dễ hiểu.

File liên quan:

- `frontend/src/components/bus/roles/admin-module.tsx`

## 13. Giá vé và trợ giá

Đã làm rõ:

- Admin hệ thống quản lý/giám sát giá vé.
- Admin trường quản lý chính sách trợ giá của trường mình.

Đã chỉnh:

- Admin sidebar: `Giá vé & trợ giá` -> `Giá vé`.
- UniAdmin vẫn giữ `Chính sách trợ giá`.

Nghiệp vụ trợ giá:

- Gán tuyến cho trường chỉ xác định tuyến thuộc phạm vi trường.
- Trợ giá chỉ áp dụng nếu trường có chính sách trợ giá active.
- Sinh viên phải thuộc trường đó và mua vé/tuyến thuộc phạm vi trường.

File liên quan:

- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/components/bus/roles/university-admin-module.tsx`

## 14. UniAdmin liên quan Admin

Đã làm rõ:

- UniAdmin là role riêng.
- UniAdmin không gán tuyến.
- UniAdmin nên xem tuyến được Admin hệ thống gán cho trường mình.
- UniAdmin xử lý chính sách trợ giá cho trường mình.

Ghi chú:

- Nếu cần demo rõ hơn, nên dùng account UniAdmin để trình bày phần trợ giá.
- Nếu cần phase sau, có thể thêm view chỉ đọc `Tuyến được gán cho trường` trong UniAdmin.

File liên quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/lib/api/client.ts`

## 15. Đồng bộ dữ liệu và DB thật

Đã kiểm tra:

- Backend phải chạy với DB RDS để có dữ liệu thật.
- Nếu chạy nhầm local Postgres thì Admin sẽ thiếu trường, giao dịch, audit, doanh thu.

Thông tin đã xác nhận khi chạy đúng RDS:

- Có dữ liệu trường.
- Có route links.
- Có giao dịch.
- Có audit log.
- Có doanh thu.

Cấu hình backend dùng biến môi trường:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SPRING_PROFILES_ACTIVE=local`

Lưu ý:

- Nếu chạy backend bằng IntelliJ, Run Configuration có thể override env và làm backend nối nhầm DB local.
- Khi demo, kiểm bằng `netstat` hoặc log backend để chắc JDBC URL đang trỏ RDS.

## 16. Các file đã sửa chính

Frontend:

- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/components/bus/app-shell.tsx`
- `frontend/src/components/bus/admin-console-primitives.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/lib/api/client.ts`

Backend:

- `backend/src/main/java/com/unibus/api/experience/ExperienceController.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceService.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- `backend/src/main/java/com/unibus/api/student/StudentVerificationService.java`
- `backend/src/main/java/com/unibus/api/university/AdminUniversityController.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`

Docs/config liên quan:

- `docs/uniadmin-change-plan.md`
- `docs/uniadmin-ui-combined.md`
- `frontend/INTEGRATION.md`
- `.gitignore`

## 17. Test đã chạy

Frontend:

```powershell
npm.cmd run lint
npm.cmd run build
```

Kết quả:

- Build pass.
- Lint pass.
- Còn một số warning cũ ở `student-module.tsx`, không liên quan Admin.

Backend:

```powershell
mvn -DskipTests compile
```

Kết quả:

- Compile pass.

## 18. Cách demo đề xuất

### Demo 1: Sidebar Admin

- Mở Admin.
- Chỉ menu đã gọn.
- Nói: đã bỏ `Thông báo`, đổi `Giá vé & trợ giá` thành `Giá vé`.

### Demo 2: Báo cáo

- Chọn Hôm nay/7 ngày/tháng/custom.
- Quan sát số liệu thay đổi.
- Bấm `Xuất báo cáo`.
- Vào audit log kiểm tra `Xuất báo cáo`.

### Demo 3: Gán tuyến cho trường

- Vào `Trường đối tác` -> `Tuyến được gán`.
- Chọn trường.
- Tick tuyến chưa gán.
- Bấm lưu.
- Refresh để chứng minh dữ liệu lưu DB.

### Demo 4: Giao dịch

- Vào `Giao dịch & hóa đơn`.
- Dùng filter theo trường/trạng thái/ngày/search.
- Giải thích `Chưa thanh toán` chỉ hiện nếu có dữ liệu pending/unpaid thật.

### Demo 5: Xác minh sinh viên

- Vào `Xác minh sinh viên`.
- Demo trạng thái chờ xác minh/đã xác minh/từ chối/cần bổ sung.
- Giải thích Admin hệ thống là người xác minh.

### Demo 6: Nhật ký hoạt động

- Vào `Nhật ký hoạt động`.
- Dùng filter theo trường/action/kết quả/ngày.
- Giải thích audit log chỉ ghi hành động quản trị quan trọng.
- Không ghi login/xem trang/GPS.

### Demo 7: UniAdmin trợ giá

- Login UniAdmin.
- Vào `Chính sách trợ giá`.
- Giải thích UniAdmin cấu hình trợ giá cho trường mình.
- Admin hệ thống chỉ gán tuyến và quản lý tổng thể.

## 19. Còn tồn tại / phase sau

Nên làm sau demo:

- Thêm phân trang backend cho giao dịch/audit nếu dữ liệu lớn.
- Thêm filter backend cho giao dịch/audit thay vì chỉ filter frontend.
- Thêm view chỉ đọc `Tuyến được gán` cho UniAdmin nếu cần demo mạch hơn.
- Thêm chi tiết giao dịch khi click một dòng.
- Thêm export Excel/backend file export.
- Thêm audit log filter nâng cao theo người thực hiện/role.
- Xóa hoặc migrate dữ liệu audit log cũ trong DB demo nếu muốn sạch hoàn toàn.


## 20. Bo sung chi tiet dot sua UniAdmin truoc PR main

Ngay cap nhat: 2026-07-11 21:38 +07:00

Pham vi dot nay:

- Tap trung role `university_admin` / UniAdmin.
- Khong thay doi nghiep vu Admin he thong ngoai cac phan da co tu truoc trong changelog.
- Khong sua database schema.
- Uu tien dung API/backend that va du lieu DB that.
- Khong redesign lon, chi chuan hoa UI/label/flow de demo ro hon.

### 20.1. Menu va pham vi UniAdmin

Da chuan hoa menu UniAdmin:

- `Trang thai sinh vien` -> `Danh sach sinh vien`.
- `Thong tin truong & campus` -> `Thong tin truong & co so`.
- `Gui thong bao truong` -> `Gui thong bao cho sinh vien`.
- `Bao cao doi soat` -> `Doi soat tai chinh`.
- Menu `Thong bao` rieng trong sidebar UniAdmin khong dung de tranh nham voi man gui thong bao.

Nhom menu hien tai:

- Tong quan.
- Quan ly truong.
- Sinh vien.
- Tai chinh & doi soat.
- Truyen thong.
- Tai khoan.

File lien quan:

- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/university-admin-module.tsx`

### 20.2. Danh sach sinh vien / MSSV

Da sua:

- Bang DSSV hien thi ro cot MSSV.
- Neu MSSV null/rong thi hien thi `Chua co MSSV`.
- Search DSSV tim duoc theo MSSV, ho ten, email.
- Map trang thai sinh vien sang tieng Viet:
  - `ACTIVE` -> `Dang hoc`
  - `INACTIVE` -> `Ngung hoc`
  - `GRADUATED` -> `Da tot nghiep`
  - `SUSPENDED` -> `Bi dinh chi`

Da web test:

- Search `DTU202032312` tra dung sinh vien `Khanh Trung`.
- Search `student.day@unibus.local` tra dung sinh vien tuong ung.
- Search `Phan Gia Linh` tra dung sinh vien tuong ung.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`

### 20.3. Import danh sach sinh vien va template

Da sua:

- Them nut `Tai template mau`.
- Template tai xuong la CSV: `uniadmin-roster-template.csv`.
- Template co header khop backend import:
  - `email`
  - `studentCode`
  - `fullName`
  - `faculty`
  - `academicYear`
  - `status`
- Template co dong vi du va ghi chu:
  - MSSV bat buoc.
  - Khong trung MSSV trong cung file.
  - Email nen thuoc domain truong.
  - Khong doi ten header.
  - MSSV co so 0 dau nen nhap dang text.
- Import co loading khi upload.
- Sau import thanh cong reload lich su import va context UniAdmin lien quan.
- Neu backend tra loi import, UI tom tat dong loi de doc.
- Map mot so loi backend sang tieng Viet:
  - `Student code is required` -> `MSSV bat buoc`
  - `MSSV is duplicated in this import file` -> `MSSV bi trung trong file import`
  - `MSSV already exists for another student in this university` -> `MSSV da ton tai cho sinh vien khac trong truong`
  - `Email domain does not belong to this university` -> `Email khong thuoc domain dang hoat dong cua truong`

Da web test:

- Nut template hien thi.
- File CSV da tai thanh cong vao `Downloads`.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`

### 20.4. Thong tin truong & co so

Da sua:

- Dung label `co so` thay cho `campus` trong UI nguoi dung.
- Hien thi ten co so, ma co so neu co, dia chi neu co, trang thai neu co.
- Map trang thai:
  - `ACTIVE` -> `Dang hoat dong`
  - `INACTIVE` -> `Ngung hoat dong`
  - `SUSPENDED` -> `Tam khoa`
- Empty state: `Chua co co so`.
- Da bo rule frontend tu an co so co ma/ten chua `demo/test`, vi rule nay lam DB co 1 co so nhung UI hien `Co so (0)`.

Da web test:

- Truoc khi sua rule loc: man hien thi `Co so (0)` du dashboard/thong ke co 1 co so.
- Sau khi sua: man hien thi `Co so (1)`.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`

### 20.5. Domain email

Nghiep vu lam ro:

- Domain email dung de lien ket/xac dinh sinh vien thuoc truong qua email.
- Sinh vien dung email thuoc domain nay se duoc lien ket voi truong.

Da sua UI/validate:

- Mo ta ro: `Sinh vien dung email thuoc domain nay se duoc lien ket voi truong.`
- Hien thi domain dang `@duytan.edu.vn`.
- Khi them domain: trim khoang trang, normalize `@duytan.edu.vn` thanh `duytan.edu.vn`, khong cho rong/khoang trang/http/https/path/email day du, validate phai co dau cham.
- Neu backend bao trung thi hien thi `Domain nay da ton tai`.
- Map trang thai:
  - `ACTIVE` -> `Dang hoat dong`
  - `INACTIVE` -> `Ngung hoat dong`
  - `PENDING` -> `Cho duyet`
  - `SUSPENDED` -> `Tam khoa`

Da web test:

- Nhap `abc@duytan.edu.vn` hien thi loi: `Khong nhap email day du, chi nhap domain nhu duytan.edu.vn`.

Ghi chu du lieu demo can don truoc PR/demo:

- DB hien con domain test/demo: `@demo.unibus.local`.
- DB hien con domain typo: `@duytan.edu.vn.vvn`.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/lib/api/client.ts`

### 20.6. Chinh sach tro gia

Da sua enum tro gia:

- Frontend dung enum backend: `PERCENTAGE`, `FIXED_AMOUNT`.
- Khong dung enum cu: `PERCENT`, `FIXED`.

Da sua form/payload:

- Payload tao policy hien tai gom `policyName`, `subsidyType`, `value`, `maxAmount`.
- `maxAmount` chi gui khi loai la `PERCENTAGE` va nguoi dung nhap gia tri.
- Neu chon `PERCENTAGE`: label la `Phan tram tro gia`, co input `So tien toi da (VND, tuy chon)`, validate khong vuot qua 100%.
- Neu chon `FIXED_AMOUNT`: label la `So tien tro gia`, khong hien input so tien toi da.
- Button chinh: `Them chinh sach`.
- Co loading khi luu, toast thanh cong/that bai ro, sau khi them thanh cong reload context.
- Empty state: `Chua co chinh sach tro gia`.

Da sua hien thi:

- `PERCENTAGE` hien thi dang `%`.
- `FIXED_AMOUNT` hien thi dang VND.
- Map trang thai: `ACTIVE` -> `Dang ap dung`, `INACTIVE` -> `Tam ngung`, `EXPIRED` -> `Het hieu luc`, `DRAFT` -> `Nhap`.

Ghi chu nghiep vu:

- `So tien toi da` khong phai so tien giam co dinh.
- Voi chinh sach theo phan tram, day la muc tran giam gia. Vi du 50% nhung toi da 90.000d thi he thong khong giam qua 90.000d.
- Voi chinh sach so tien co dinh thi `value` chinh la so tien giam.

Ghi chu du lieu demo can don truoc PR/demo:

- DB hien con policy test/demo nhu `dddd`, `Demo tro gia 50% den 31/08/2026`, `UI QA Khanh student subsidy 25%`.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/lib/api/client.ts`

### 20.7. Doi soat tai chinh

Nghiep vu lam ro:

- `Doi soat tai chinh` la man tong hop theo ky.
- Dung de tong hop giao dich theo khoang ngay, doi chieu tien goc, tien truong tro gia, so tien sinh vien da tra.
- Khong phai man xem tung giao dich chi tiet.

Da sua:

- Label `Bao cao doi soat` -> `Doi soat tai chinh`.
- Goi API that `/university-admin/reconciliation`.
- Khi loc ngay truyen params `from` va `to`.
- Khi doi ngay, du lieu reload.
- Co loading state, error state, empty state `Chua co du lieu doi soat trong khoang thoi gian nay`.
- Bo phan bang chi tiet giao dich khoi man doi soat de tranh trung voi `Lich su giao dich`.
- Bo text ky thuat/debug/legacy/fallback khoi UI doi soat.

Da web test:

- Chon khoang ngay lam KPI doi soat thay doi.
- Man hien thi tong tien goc, tong tro gia, sinh vien da tra.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/lib/prototype-data.tsx`
- `frontend/src/lib/api/client.ts`

### 20.8. Lich su giao dich UniAdmin

Nghiep vu lam ro:

- `Lich su giao dich` la man xem tung giao dich/order chi tiet.
- Khac voi `Doi soat tai chinh`, man nay khong phai bao cao tong hop theo ky.

Da sua:

- Cot bang ro hon: Sinh vien/MSSV, Loai don/ve, Ky ve, Chang/Tuyen, Gia goc, Tro gia, Sinh vien tra, Trang thai, Ngay giao dich.
- So tien can phai.
- Status map tieng Viet:
  - `PAID` -> `Da thanh toan`
  - `SUCCESS` / `COMPLETED` -> `Thanh cong`
  - `PENDING` / `UNPAID` -> `Cho thanh toan`
  - `FAILED` -> `That bai`
  - `CANCELLED` / `CANCELED` -> `Da huy`
  - `REFUNDED` -> `Da hoan tien`
- Them KPI: Tong giao dich, Da thanh toan, Cho thanh toan, Loi/Huy, Sinh vien da tra.
- Them filter trang thai va ngay giao dich.
- Da sua loi date input nhan gia tri nhung bang khong loc bang cach bat ca `onChange` va `onInput`.

Da web test:

- Chon ngay `2026-07-10` chi con giao dich ngay `10 thg 7, 2026`.
- Khong con lan giao dich ngay `3 thg 7, 2026` sau khi loc.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`

### 20.9. Gui thong bao cho sinh vien

Nghiep vu lam ro:

- Day la chuc nang truong gui thong bao den sinh vien thuoc truong.
- Khong phai notification center ca nhan.

Da sua:

- Title/menu: `Gui thong bao cho sinh vien`.
- Mo ta: `Truong gui thong bao den sinh vien thuoc danh sach cua truong.`
- Form label: `Tieu de`, `Noi dung`.
- Button: `Gui thong bao`.
- Co loading khi gui, thanh cong clear form, toast ro.
- Khong dung mock data.
- Phan lich su da gui giu lai dang session-only: neu chua gui trong phien hien tai, hien thi `Chua co lich su thong bao da gui`.

File lien quan:

- `frontend/src/components/bus/roles/university-admin-module.tsx`

### 20.10. API/backend UniAdmin lien quan

Cac API UniAdmin duoc frontend dung trong dot nay:

- `GET /api/v1/university-admin/profile`
- `GET /api/v1/university-admin/stats`
- `GET /api/v1/university-admin/campuses`
- `GET /api/v1/university-admin/domains`
- `POST /api/v1/university-admin/domains`
- `GET /api/v1/university-admin/roster`
- `POST /api/v1/university-admin/roster/import`
- `GET /api/v1/university-admin/roster/import-batches`
- `GET /api/v1/university-admin/subsidy-policies`
- `POST /api/v1/university-admin/subsidy-policies`
- `GET /api/v1/university-admin/reconciliation`
- `GET /api/v1/university-admin/payment-transactions`
- `POST /api/v1/university-admin/notifications`

Backend da co validate/import MSSV:

- Trim MSSV.
- MSSV bat buoc.
- Check trung MSSV trong cung file import.
- Check MSSV da ton tai cho sinh vien khac trong cung truong.
- Check email thuoc domain truong.
- Khong doi schema DB.

File lien quan:

- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java`
- `frontend/src/lib/api/client.ts`

### 20.11. Web test UniAdmin da chay

Thong tin test:

- URL local: `http://localhost:3000`
- Account: `uniadmin.demo@unibus.local`
- Browser: local browser tab qua Codex Browser.
- Backend/frontend dang chay local, du lieu lay tu DB that theo cau hinh backend.

Cac man da test:

- Login UniAdmin.
- Dashboard UniAdmin.
- Sidebar/menu.
- Danh sach sinh vien.
- Import danh sach sinh vien.
- Thong tin truong & co so.
- Domain email.
- Chinh sach tro gia.
- Doi soat tai chinh.
- Lich su giao dich.
- Thong ke su dung.
- Gui thong bao cho sinh vien.
- Ho so ca nhan doc nhanh.

Ket qua web test:

- Login thanh cong.
- Browser console khong co error/warn sau vong test cuoi.
- `Co so (1)` hien thi dung sau khi bo filter an campus `demo/test`.
- DSSV search dung theo MSSV/email/ho ten.
- Template import tai duoc.
- Domain validate input sai dung.
- Doi soat doi ngay co reload/tinh lai KPI.
- Lich su giao dich loc ngay dung sau fix nho.

### 20.12. Command test da chay

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Ket qua:

- `npm run lint`: pass.
- `npm run build`: pass.
- Con 5 warning cu o `frontend/src/components/bus/roles/student-module.tsx`, khong lien quan UniAdmin/Admin.

Backend:

```powershell
mvn -DskipTests compile
```

Ket qua da ghi o phan truoc:

- Compile pass.

### 20.13. Du lieu DB can don truoc demo/PR review

Day la van de du lieu, khong phai loi code:

- Domain demo/test: `@demo.unibus.local`, `@duytan.edu.vn.vvn`.
- Chinh sach tro gia demo/test: `dddd`, `Demo tro gia 50% den 31/08/2026`, `UI QA Khanh student subsidy 25%`.
- Sinh vien/giao dich demo: MSSV dang `SV-DEMO-*`, email dang `student.*@unibus.local`.

Khuyen nghi:

- Neu PR len main chi review code thi co the giu DB hien tai.
- Neu demo voi hoi dong thi nen don du lieu DB RDS hoac seed lai data sach cho truong `Truong Dai hoc Duy Tan`.
- Khong nen tiep tuc che du lieu demo bang filter frontend, vi co the lam lech so lieu nhu loi `Co so (0)`.

### 20.14. Tom tat PR de xuat

Tieu de PR goi y:

```text
Chuan hoa Admin/UniAdmin dashboard, UniAdmin roster/import/subsidy/reconciliation flows
```

Mo ta PR goi y:

- Chuan hoa menu/label Admin va UniAdmin.
- Lam ro phan quyen Admin he thong va Admin truong.
- Sua UniAdmin DSSV/MSSV/search/import/template.
- Chuan hoa domain email va co so.
- Dong bo enum tro gia `PERCENTAGE`/`FIXED_AMOUNT`.
- Tach ro `Doi soat tai chinh` va `Lich su giao dich`.
- Sua filter ngay giao dich UniAdmin.
- Cleanup text mock/debug/technical khong phu hop demo.
- Ket noi cac man lien quan voi API that.
- Bo sung test/build verification.
