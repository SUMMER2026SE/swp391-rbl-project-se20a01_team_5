# Audit chức năng import sinh viên UniAdmin

Ngày audit: 2026-07-12

Phạm vi: module UniAdmin quản lý danh sách sinh viên, import roster, template import, lịch sử import và các API/scope liên quan.

Lưu ý trạng thái workspace khi audit: branch `TanPhu` đang có thay đổi chưa commit ở các file UniAdmin import/template từ lượt trước. Báo cáo này mô tả code hiện tại trong working tree, không revert và không sửa nghiệp vụ.

## 1. Hiện trạng nền tảng

### Frontend

- Framework: Next.js 16.2.6, React 19.2.4, TypeScript.
- UI chính của UniAdmin: `frontend/src/components/bus/roles/university-admin-module.tsx`.
- Data hooks: `frontend/src/lib/prototype-data.tsx`.
- API client: `frontend/src/lib/api/client.ts`.
- Toast/notification: `sonner`.
- Không thấy test frontend riêng cho module UniAdmin; repo frontend chỉ có script `npm run lint`, `npm run build`.

### Backend

- Framework: Spring Boot 4.0.6, Java 21.
- Security: Spring Security JWT, method security enabled.
- ORM/database access:
  - Có dependency Spring Data JPA và entity `Student`.
  - Module UniAdmin import/roster chủ yếu dùng `JdbcTemplate` trong `UniversityManagementRepository`.
- Database: PostgreSQL theo Flyway migrations; test dùng H2 trong integration test.
- XLSX parser/generator: Apache POI `poi-ooxml`.
- Error convention:
  - API thường trả `ApiResponse<T>(success, message, data)`.
  - `ApiException` được map qua `GlobalExceptionHandler`.
  - Auth/permission lỗi qua Spring Security trả JSON `ApiResponse`.

### Module/backend files liên quan

- `backend/src/main/java/com/unibus/api/university/UniversityAdminController.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java`
- `backend/src/main/java/com/unibus/api/user/model/Student.java`
- `backend/src/main/resources/db/migration/V8__university_subsidy_foundation.sql`
- `backend/src/main/resources/db/migration/V9__university_linkage_mvp.sql`
- `backend/src/main/resources/db/migration/V10__align_university_linkage_schema.sql`
- `backend/src/test/java/com/unibus/api/university/UniversityManagementServiceTests.java`

## 2. Flow hiện tại

### Import sinh viên

1. Frontend màn `ImportScreen` cho admin chọn file `.csv,.xlsx`.
2. `onFile` gọi `universityApi.importRoster(file)`.
3. API client gửi `FormData` field `file` tới `POST /api/v1/university-admin/roster/import`.
4. `UniversityAdminController.importRoster` lấy `universityId` bằng `service.requireUniversityAdmin(currentUser).universityId()`.
5. `UniversityManagementService.importRoster` tạo batch trong `university_import_batches`.
6. Service đọc file bằng:
   - CSV: `readCsv`.
   - XLSX: `readXlsx`.
7. Parser tạo danh sách `RosterRow`.
8. Service validate từng dòng:
   - email bắt buộc và có `@`.
   - studentCode bắt buộc.
   - fullName bắt buộc.
   - domain email phải thuộc `university_domains` active của trường.
   - MSSV không trùng trong file và không trùng với email khác trong cùng trường.
   - status normalize theo enum.
9. Dòng hợp lệ được upsert vào `university_student_rosters` theo `(university_id, email)`.
10. Dòng lỗi được ghi vào `university_import_errors`.
11. Batch được complete với `totalRows/successRows/errorRows/status`.
12. Audit log action `ROSTER_IMPORT` được ghi.
13. Frontend hiển thị toast và reload import history + dashboard data.

### Danh sách sinh viên

1. `RosterScreen` dùng `useUniAdminRoster({ keyword, status })`.
2. Hook gọi `GET /api/v1/university-admin/roster`.
3. Backend scope theo `university_admins.user_id -> university_id`.
4. Repository query `university_student_rosters` theo `university_id`, keyword, status.
5. Query hiện có `LIMIT 200`.
6. Frontend tiếp tục filter local và render tối đa `filtered.slice(0, 100)`.

### Tải template

Trạng thái working tree hiện tại đã có API:

1. Frontend nút tải template gọi `universityApi.rosterTemplate()`.
2. API client dùng `apiFetch.blob("/university-admin/roster/template")`.
3. Backend `GET /api/v1/university-admin/roster/template`.
4. Controller scope theo `requireUniversityAdmin`.
5. Service tạo XLSX bằng Apache POI:
   - Sheet `Import`.
   - Sheet `Huong dan`.
   - Sheet `Danh muc`.
6. Nếu tải XLSX lỗi, frontend fallback tự tạo CSV header-only.

Vấn đề còn thấy: toast fallback ở frontend đang bị mojibake.

## 3. API liên quan

### `GET /api/v1/university-admin/roster`

- Request: query optional `keyword`, `status`.
- Response: `ApiResponse<List<RosterStudentView>>`.
- Permission: `@PreAuthorize("hasRole('UNIVERSITY_ADMIN')")` trên controller.
- Scope dữ liệu: backend lấy `universityId` từ `university_admins` theo user hiện tại.
- Vấn đề:
  - Repository limit 200.
  - Frontend render thêm slice 100.
  - Chưa có pagination chuẩn.
  - Không có filter campus/faculty/academicYear.
  - Chưa thấy campus scope cho UniAdmin.

### `POST /api/v1/university-admin/roster/import`

- Request: multipart `file`.
- Response: `ApiResponse<ImportBatchView>`.
- Permission: role `UNIVERSITY_ADMIN`.
- Scope dữ liệu: backend lấy `universityId` từ current user, không nhận schoolId từ frontend.
- Transaction: service method `@Transactional`.
- Audit: có `ROSTER_IMPORT`.
- Vấn đề:
  - Import ghi database ngay, chưa có preview/confirm.
  - Partial import: dòng đúng vẫn được ghi dù dòng khác lỗi.
  - Parser CSV tự viết, chưa dùng thư viện CSV.
  - Không có endpoint trả chi tiết lỗi theo batch riêng; history list hiện không load error details.
  - Frontend chỉ show error detail cho batch vừa import nếu response có errors.

### `GET /api/v1/university-admin/roster/import`

- Request: none.
- Response: `ApiResponse<List<ImportBatchView>>`.
- Permission: role `UNIVERSITY_ADMIN`.
- Scope dữ liệu: `universityId` current user.
- Vấn đề:
  - Repository `LIMIT 50`.
  - `findImportBatches` map errors là `List.of()`, nên lịch sử cũ không có chi tiết lỗi.

### `GET /api/v1/university-admin/roster/template`

- Request: none.
- Response hiện tại: `byte[]` XLSX, content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Permission: role `UNIVERSITY_ADMIN`.
- Scope dữ liệu: `universityId` current user; template lấy domain/campus theo trường để đưa vào sheet danh mục.
- Vấn đề:
  - Endpoint đang là thay đổi chưa commit trong working tree.
  - Frontend `requestBlob` chưa kiểm tra content-type/blob rỗng/JSON error 200.
  - Fallback toast đang mojibake.
  - Chưa có endpoint CSV template chính thức từ backend; CSV fallback do frontend tự tạo.

### Export danh sách sinh viên

- Chưa thấy API export danh sách sinh viên thật trong module UniAdmin.
- Chưa thấy nút export riêng ở `RosterScreen` hoặc `ImportScreen`.
- Hiện CSV fallback chỉ là template header-only, không phải dữ liệu sinh viên thật.

## 4. Data model

### `university_student_rosters`

Nguồn schema: `V9__university_linkage_mvp.sql`, align ở `V10__align_university_linkage_schema.sql`.

- `roster_id BIGINT`
- `university_id INTEGER NOT NULL`
- `email VARCHAR(100) NOT NULL`
- `student_code VARCHAR(20) NOT NULL`
- `full_name VARCHAR(100) NOT NULL`
- `faculty VARCHAR(100)`
- `academic_year INTEGER`
- `status VARCHAR(20) DEFAULT 'ACTIVE'`
- `matched_user_id INTEGER`
- `imported_batch_id BIGINT`
- `created_at`, `updated_at`
- Unique:
  - `(university_id, email)`
  - `(university_id, student_code)`
- Status check ở migration: `ACTIVE`, `INACTIVE`, `GRADUATED`, `SUSPENDED`.
- Không thấy `campus_id` trong roster table.
- Không thấy soft delete column trong roster table.

### `students`

Entity: `backend/src/main/java/com/unibus/api/user/model/Student.java`.

- `studentCode` là `String`, primary key, column `student_code VARCHAR(20)`.
- `user` one-to-one tới `users`.
- `university` là tên trường dạng string.
- `universityId` là FK logic tới `universities`.
- `faculty` là string.
- `academicYear` là integer.
- `dateOfBirth`.
- Không thấy `campus_id` trong entity.

### University/campus/domain/admin

- `universities`: trường.
- `campuses`: thuộc `university_id`, có `code`, `name`, `address`, `latitude`, `longitude`, `status`.
- `university_domains`: thuộc `university_id`, unique domain toàn hệ thống, status `ACTIVE/INACTIVE/SUSPENDED`, có `verified_at`.
- `university_admins`: map `user_id` với `university_id`, status active/inactive/suspended.
- Không thấy bảng hoặc field giới hạn UniAdmin theo campus.

### academicYear

- Trong roster và student đều là `academic_year INTEGER`.
- Code UI đang gọi là `academicYear`.
- Không thấy migration/comment định nghĩa rõ là năm nhập học hay khóa học; nghiệp vụ hiện đang dùng như năm nhập học/academic year.

## 5. Role, permission và tenant scope

- Controller UniAdmin có `@PreAuthorize("hasRole('UNIVERSITY_ADMIN')")`.
- Mọi endpoint UniAdmin đọc `CurrentUser`.
- `requireUniversityAdmin(currentUser)` tra bảng `university_admins` theo `user_id`, yêu cầu `ua.status = 'ACTIVE'` và `users.status = 'ACTIVE'`.
- API import/list/template không nhận `schoolId/universityId` từ frontend, nên tránh được IDOR theo trường ở các endpoint này.
- Chưa thấy campus-level scope cho UniAdmin. Nếu nghiệp vụ cần admin theo cơ sở, cần bổ sung model/scope rõ trước khi enforce.

## 6. Lỗi và rủi ro tìm thấy

### Critical

- Chưa có API/nút export danh sách sinh viên thật. Người dùng có thể nhầm template CSV/fallback với export dữ liệu.
- Chưa có mô hình campus-limited UniAdmin trong schema hiện tại. Nếu có yêu cầu admin chỉ được xem một cơ sở, hiện chưa enforce được.

### High

- Import ghi database ngay, chưa có preview/confirm. File sai một phần vẫn ghi các dòng hợp lệ.
- Lịch sử import không tải lại chi tiết lỗi cho batch cũ vì `findImportBatches` truyền `List.of()`.
- `requestBlob` frontend không kiểm tra content-type, blob rỗng, hoặc trường hợp backend trả JSON lỗi với status 200; có thể tải nhầm JSON thành file.
- Toast fallback template đang bị mojibake trong source frontend.
- Danh sách roster backend limit 200 và frontend slice 100, không phù hợp nếu cần export/toàn bộ dữ liệu hoặc kiểm tra đầy đủ.

### Medium

- Parser CSV tự viết, cần thêm coverage cho quote/newline/escape phức tạp hoặc thay bằng thư viện CSV.
- Template và import dùng header kỹ thuật (`studentCode`, `academicYear`) đúng backend nhưng chưa thân thiện với admin.
- Frontend có nhiều text mojibake trong màn import/roster do encoding file/source đã bị lỗi trước đó.
- Không có frontend tests/E2E cho import/template.
- Error backend vẫn là tiếng Anh, frontend map một số lỗi nhưng chưa đầy đủ.

### Low

- File input accept đã bỏ `.xls` trong working tree, nhưng cần kiểm tra lại sau khi chốt thay đổi.
- Import batch giới hạn 1000 dòng là hợp lý cho import, nhưng cần ghi rõ không áp dụng cho export.
- Template XLSX hiện dùng sheet name không dấu để tránh encoding/rủi ro Excel; có thể cải thiện UX sau.

## 7. Kiểm tra các điểm đặc biệt

- IDOR/lọt dữ liệu giữa trường: các API import/list/template hiện lấy scope từ backend, không tin frontend schoolId.
- Dùng schoolId frontend: không thấy ở API UniAdmin roster/import.
- Import preview: chưa có.
- N+1 query: import mỗi dòng gọi kiểm tra trùng MSSV và upsert riêng; với 1000 dòng vẫn chấp nhận được nhưng chưa tối ưu batch.
- Transaction: import service có `@Transactional`; partial import theo dòng là nghiệp vụ hiện tại, nhưng nếu exception giữa chừng transaction rollback toàn bộ.
- Double submit: frontend có `uploading` state nhưng click vùng upload vẫn có thể mở file picker; input change một file một lần. Nút template có loading state trong working tree.
- Mất số 0 đầu MSSV: CSV đọc string; XLSX dùng `DataFormatter`, nhưng nếu Excel lưu số đã mất zero thì backend không khôi phục được. Template XLSX nên format cột studentCode là Text.
- UTF-8 BOM: CSV fallback có BOM; parser strip BOM header.
- Toast encoding: có chuỗi mojibake hard-coded ở frontend.
- Template/export dùng chung: hiện chưa có export; cần tách rõ ở đợt sau.
- Parser hiểu dòng ghi chú là sinh viên: working tree hiện có logic bỏ dòng comment một cột bắt đầu `#`; code cũ có nguy cơ.
- Import chỉ xử lý pagination: không liên quan import; roster list có limit/slice.
- Silent skip dòng lỗi: không skip im lặng; có ghi `university_import_errors`, nhưng lịch sử cũ không hiển thị chi tiết.

## 8. Test hiện có

- Backend integration test chính: `UniversityManagementServiceTests`.
- Đã có test import hợp lệ + row errors.
- Working tree hiện có thêm test cho:
  - bỏ comment row legacy;
  - duplicate email;
  - invalid status;
  - reject changed headers.
- Chưa thấy authorization test riêng cho controller UniAdmin import/export.
- Chưa thấy frontend unit/E2E test cho import.
- Chưa thấy test XLSX parser/template download.
- Chưa thấy test export vì chưa có export API.

## 9. Nguyên nhân vấn đề đã quan sát

- Toast mojibake nằm ở frontend source, trong `ImportScreen.downloadTemplate`, không phải response backend.
- Chuỗi đã bị lưu sai encoding trong source; không phải frontend decode response nhiều lần.
- CSV hiện tại trong fallback là template, không phải export dữ liệu.
- Chưa có API export danh sách sinh viên thật.
- Scope theo trường đã có qua `university_admins`, nhưng scope theo cơ sở chưa có model để enforce.

## 10. Kế hoạch triển khai đề xuất cho các đợt sau

### Đợt 1: Fix encoding và tách UX template/export

File dự kiến:

- `frontend/src/components/bus/roles/university-admin-module.tsx`
- `frontend/src/lib/api/client.ts`

Nội dung:

- Sửa toàn bộ text mojibake trong import/roster.
- Đổi nút template thành `Tải template nhập`.
- Không dùng toast fallback gây nhầm lẫn.
- Thêm helper download blob an toàn: kiểm tra content-type, blob size, JSON error.

### Đợt 2: Backend export danh sách sinh viên CSV

File dự kiến:

- `backend/src/main/java/com/unibus/api/university/UniversityAdminController.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementService.java`
- `backend/src/main/java/com/unibus/api/university/UniversityManagementRepository.java`
- `backend/src/main/java/com/unibus/api/university/UniversityDtos.java` nếu cần DTO export row.
- `backend/src/test/java/com/unibus/api/university/UniversityManagementServiceTests.java`

Nội dung:

- Thêm endpoint scoped: `GET /api/v1/university-admin/roster/export?format=csv`.
- Backend tự lấy `universityId` từ current user.
- Export CSV UTF-8 BOM, `Content-Type: text/csv; charset=utf-8`.
- Header tối thiểu: `studentCode,fullName,email,faculty,academicYear,status,statusLabel`.
- Không dùng limit 200/list UI cho export.
- Audit action `ROSTER_EXPORT`.
- Test tenant scope và CSV escaping.

### Đợt 3: Import preview và validation UX

File dự kiến:

- `UniversityAdminController.java`
- `UniversityManagementService.java`
- `UniversityManagementRepository.java`
- `university-admin-module.tsx`
- tests liên quan.

Nội dung:

- Thêm endpoint preview hoặc mode validate-only.
- Frontend hiển thị preview số dòng đúng/lỗi trước khi ghi DB.
- Cho phép tải file lỗi hoặc xem chi tiết lỗi theo batch.

### Đợt 4: Pagination/filter chuẩn cho danh sách sinh viên

File dự kiến:

- API client + hooks.
- Controller/service/repository roster.
- UI roster.

Nội dung:

- Backend pagination có total.
- Filter thêm faculty/academicYear nếu nghiệp vụ cần.
- Export theo filter hiện tại nếu đã có filter chuẩn.

### Đợt 5: Campus-level scope nếu nghiệp vụ yêu cầu

File dự kiến:

- Migration thêm bảng/field scope UniAdmin theo campus.
- Service scope resolver.
- Repository list/import/export.
- Authorization tests.

Nội dung:

- Không triển khai trước khi có schema rõ.
- Không tin campusId từ frontend.
- Enforce mọi query roster/import/export theo scope resolver backend.

## 11. Rủi ro ảnh hưởng

- Module roster đang stable, nên các thay đổi tiếp theo nên giữ endpoint import hiện tại để backward compatibility.
- Export không nên tái sử dụng query `findRoster` hiện tại vì có `LIMIT 200`.
- Nếu thêm campus scope khi schema chưa có sẽ dễ tạo logic giả; cần quyết định model trước.
- Sửa encoding trong file TSX có thể tạo diff lớn nếu toàn file đang mojibake; nên giới hạn vào màn import/roster ở đợt đầu.

## 12. Lệnh đã dùng trong đợt audit

- `rg` để tìm import/roster/API/schema/test.
- `Get-Content` đọc các file liên quan.

Không chạy formatter/linter/test trong đợt này vì yêu cầu là audit-only và không sửa code nghiệp vụ.
