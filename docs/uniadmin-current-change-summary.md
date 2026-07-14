# Tổng hợp thay đổi UniAdmin hiện tại

Ngày cập nhật: 2026-07-14

## 1. Dashboard UniAdmin

- Gộp trang `Thống kê sử dụng` vào `Tổng quan trường`.
- Xóa menu `Thống kê sử dụng` khỏi sidebar UniAdmin.
- Xóa các quick card trên dashboard:
  - `Danh sách sinh viên`
  - `Nhập danh sách`
  - `Chính sách trợ giá`
- Thêm section `Báo cáo chi tiết` ở cuối dashboard.
- Section `Báo cáo chi tiết` có:
  - filter thời gian `7 ngày qua`, `30 ngày qua`, `Học kỳ này`;
  - KPI tổng lượt dùng, tuyến nổi bật, trung bình mỗi tuần, tuần gần nhất;
  - biểu đồ hiệu suất theo tuyến;
  - bảng so sánh tuyến có tên tuyến đầy đủ;
  - màu tuyến được tách riêng, không dùng một màu xanh cho tất cả.
- Card `Chính sách trợ giá` trên dashboard được chỉnh lại:
  - bỏ donut cũ;
  - hiển thị cấu hình trợ giá hiện tại;
  - đổi icon sang dạng vé phần trăm;
  - bỏ text hạn sử dụng chính sách;
  - sửa lỗi chữ hiển thị dạng `Ch\u...`.

## 2. Sinh viên UniAdmin

- Gộp 2 menu:
  - `Import danh sách SV`
  - `Danh sách sinh viên`
- Thành 1 menu duy nhất: `Sinh viên`.
- Trang `Sinh viên` có 2 tab:
  - `Nhập dữ liệu`
  - `Danh sách sinh viên`
- Tab `Nhập dữ liệu` giữ luồng upload CSV/XLSX, quy tắc nhập và lịch sử nhập.
- Tab `Danh sách sinh viên` giữ search, filter và bảng sinh viên.
- Chuyển 2 nút dùng chung lên header trang:
  - `Tải template nhập`
  - `Xuất danh sách sinh viên`
- Bỏ nút xuất danh sách bị lặp trong khu vực bảng.
- Route cũ `uniadm-import` và `uniadm-roster` vẫn được handle để tránh gãy điều hướng cũ.

## 3. Đối soát và giao dịch

- Gộp 2 menu:
  - `Đối soát tài chính`
  - `Lịch sử giao dịch`
- Thành 1 menu duy nhất: `Đối soát và giao dịch`.
- Giữ route nền là `uniadm-transactions`.
- Route cũ `uniadm-recon` vẫn mở cùng trang mới để tránh lỗi link cũ.
- Trang mới có 2 nhóm KPI:
  - `Trạng thái giao dịch`: tổng giao dịch, đã thanh toán, chờ thanh toán, lỗi / hủy.
  - `Tổng hợp tài chính`: tổng tiền gốc, tổng trợ giá, sinh viên đã trả.
- Bỏ dòng `Sinh viên đã trả` nằm lẻ trong thanh filter cũ để tránh trùng số liệu.
- Filter giao dịch đổi từ 1 ngày sang khoảng ngày:
  - từ ngày;
  - đến ngày;
  - trạng thái;
  - nút refresh.
- Bảng giao dịch chi tiết vẫn giữ các cột nghiệp vụ cũ.

## 4. Chính sách trợ giá UniAdmin

- Màn `Chính sách trợ giá` được đơn giản hóa theo MVP:
  - chỉ còn một cấu hình trợ giá vé tháng cho mỗi trường;
  - không còn flow tạo nhiều chính sách trên UI;
  - không còn danh sách nhiều policy;
  - không còn xóa/nhân bản policy;
  - vẫn giữ trạng thái bật/tắt trợ giá.
- Hỗ trợ cấu hình hiện có theo enum backend:
  - `PERCENTAGE`
  - `FIXED_AMOUNT`
- Fix lỗi hiển thị `50 đ` khi dữ liệu thực chất là phần trăm.
- Khi chỉnh sửa, form hiển thị đúng loại cấu hình hiện tại:
  - phần trăm thì hiển thị `%`;
  - số tiền cố định thì hiển thị VND.
- Backend/API được bổ sung để cập nhật cấu hình trợ giá và giữ dữ liệu cũ.

## 5. Sidebar UniAdmin

- Sidebar UniAdmin được chỉnh lại để nhìn đầy đặn hơn nhưng vẫn vừa màn hình, hạn chế phải scroll.
- Riêng role `university_admin`:
  - sidebar rộng hơn nhẹ;
  - logo/header lớn hơn vừa phải;
  - item menu cao hơn một chút;
  - icon có nền nhẹ;
  - khoảng cách nhóm menu cân đối hơn.
- Không thêm lại các menu đã gộp.

## 6. Import / export sinh viên

- Tách rõ:
  - tải template nhập sinh viên;
  - xuất danh sách sinh viên thật.
- Export danh sách sinh viên chuyển sang XLSX theo mẫu.
- Template import được chuẩn hóa để admin tải về điền và import lại.
- Có fallback import theo luồng cũ nếu backend hiện tại chưa hỗ trợ preview endpoint.
- Sau import có thể xem sinh viên vừa import theo batch.

## 7. API / backend liên quan UniAdmin

- Có thay đổi trong các file backend thuộc package `university` để hỗ trợ:
  - cấu hình trợ giá;
  - export/import danh sách sinh viên;
  - lọc roster theo batch import;
  - dữ liệu đối soát.
- Có thêm migration:
  - `backend/src/main/resources/db/migration/V17__route_university_subsidy_toggle.sql`

## 8. File chính đã sửa

- `frontend/src/components/bus/app-shell.tsx`
- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/prototype-data.tsx`
- `backend/src/main/java/com/unibus/api/university/SubsidyService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityAdminController.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversitySubsidyRepository.java`
- `backend/src/main/resources/db/migration/V17__route_university_subsidy_toggle.sql`

## 9. File khác đang có thay đổi trong worktree

Các file sau cũng đang có thay đổi theo `git status`, cần review riêng trước khi PR nếu không thuộc phạm vi UniAdmin:

- `backend/src/main/java/com/unibus/api/admin/AdminUserController.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceController.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceDtos.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceService.java`
- `frontend/next.config.mjs`
- `frontend/src/components/bus/roles/admin-module.tsx`
- `frontend/src/components/bus/roles/coordinator-module.tsx`

## 10. Test đã chạy gần nhất

- `npm run lint`
  - Kết quả: pass.
  - Còn 6 warning cũ ở module student.
- `npm run build`
  - Kết quả: pass.
- `git diff --check`
  - Kết quả: pass.
  - Chỉ còn warning CRLF trên Windows.

## 11. Lưu ý trước khi PR

- Chưa push code.
- Cần review lại các file ngoài UniAdmin nếu PR chỉ muốn lấy phạm vi UniAdmin.
- Nếu PR lên main, nên test thủ công các màn:
  - Tổng quan trường;
  - Sinh viên tab nhập dữ liệu;
  - Sinh viên tab danh sách;
  - Chính sách trợ giá;
  - Đối soát và giao dịch.

## 12. Cap nhat moi sau review

### 12.1 Import sinh vien

- Sua luong import de khong tu commit ngay sau khi chon file.
- Luong moi:
  - chon file CSV/XLSX;
  - backend preview va confirm truoc;
  - UI hien thi `Ket qua kiem tra file`;
  - chi khi UniAdmin bam `Xac nhan import X sinh vien` thi moi commit sinh vien hop le vao roster.
- Card kiem tra file hien thi:
  - tong so dong;
  - so dong hop le;
  - so dong loi;
  - so sinh vien co the import;
  - bang loi theo dong;
  - bang tung dong sinh vien trong file.
- Sau khi commit thanh cong moi hien thi `Ket qua import` va nut `Xem sinh vien vua import`.
- Bang loi import duoc rut gon noi dung:
  - loi MSSV chi hien thi `MSSV`;
  - loi email chi hien thi `Email`;
  - loi ho ten chi hien thi `Ho ten`;
  - loi nam hoc chi hien thi `Nam hoc`;
  - khong con hien thi chuoi dai kieu `SKIPPED_EXISTING: MSSV da ton tai...` o cot nguyen nhan.
- Tab `Danh sach sinh vien` khong con hien thi badge `0` khi chua tai duoc du lieu hoac chua co sinh vien.
- Badge so sinh vien lay theo du lieu roster hien tai, uu tien du lieu API moi nhat.

### 12.2 Tuyen ap dung tro gia

- Them muc `Tuyen ap dung tro gia` trong man `Chinh sach tro gia`.
- UniAdmin chi thay cac tuyen da duoc Admin he thong gan cho truong dang dang nhap.
- UniAdmin khong co nut them/xoa tuyen trong man nay.
- UniAdmin co the bat/tat `Ap dung tro gia` cho tung tuyen da duoc gan.
- Khi tat tro gia mot tuyen:
  - UI hien thi hop xac nhan;
  - giao dich moi tren tuyen do khong con duoc giam tien;
  - giao dich cu khong bi tinh lai.
- Khi tro gia chung cua truong dang tat:
  - switch tuyen bi khoa;
  - lua chon bat/tat cua tung tuyen van duoc giu lai;
  - khi bat lai tro gia chung, cac tuyen dang bat tiep tuc co hieu luc.
- Neu route hoac assignment tuyen khong active, switch bi khoa va UI hien thi trang thai tam ngung.
- Empty state: `Chua co tuyen nao duoc gan cho truong. Vui long lien he quan tri vien he thong.`
- Backend them cot `route_universities.subsidy_enabled`.
- Backend them API scoped cho UniAdmin:
  - `GET /api/v1/university-admin/route-subsidies`;
  - `PATCH /api/v1/university-admin/route-subsidies/{routeUniversityId}`.
- Backend khong tin `schoolId/universityId` tu frontend cho phan UniAdmin route subsidies; scope lay tu user/session hien tai.
- Logic tinh tro gia trong `SubsidyService.quoteFor(...)` da kiem tra them:
  - tuyen duoc gan cho truong;
  - `route_universities.subsidy_enabled = true`;
  - route dang `ACTIVE`;
  - policy tro gia chung cua truong dang `ACTIVE`;
  - sinh vien da xac minh va thuoc dung truong.

### 12.3 Kiem tra du lieu that voi Duy Tan

- Da kiem tra DB that dang cau hinh qua `DB_URL`.
- Truong Duy Tan hien co:
  - 4 tuyen duoc gan;
  - 4/4 tuyen dang bat `subsidy_enabled`;
  - 1 policy tro gia chung dang active;
  - muc tro gia hien tai la 40%;
  - co sinh vien Duy Tan da verified.
- Cac tuyen Duy Tan hien dang duoc tro gia:
  - tuyen `02`: tro gia 40.000d tren gia 100.000d;
  - tuyen `06`: tro gia 96.000d tren gia 240.000d;
  - tuyen `12`: tro gia 40.000d tren gia 100.000d;
  - tuyen `16`: tro gia 40.000d tren gia 100.000d.
- Neu tat tro gia cua mot tuyen, quote giao dich moi se tra trang thai `ROUTE_SUBSIDY_DISABLED` va `subsidyAmount = 0`.

### 12.4 Test moi da chay

- Backend:
  - `mvn -DskipTests compile`
  - ket qua: pass.
- Frontend:
  - `npm run lint`
  - ket qua: pass, con warning cu o module sinh vien.
  - `npm run build`
  - ket qua: pass.
- `git diff --check`
  - ket qua: pass, chi con warning CRLF tren Windows.

### 12.5 Ghi chu PR

- PR can neu ro co migration moi `V17__route_university_subsidy_toggle.sql`.
- Sau khi deploy/pull code can restart backend de Flyway chay migration.
- Neu demo luong tro gia theo tuyen, can dung tai khoan UniAdmin cua truong da co tuyen duoc gan.
