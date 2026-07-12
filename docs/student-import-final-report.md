# UNIADMIN Student Import Final Report

Ngày lập: 2026-07-12  
Phạm vi: UniAdmin / `university_admin` / import danh sách sinh viên

## 1. Kiến trúc flow cuối cùng

Flow import hiện tại được tách thành các bước rõ ràng:

1. Admin tải template nhập sinh viên hoặc export danh sách sinh viên hiện có.
2. Admin chọn file CSV/XLSX.
3. Frontend gọi API preview để backend parse, normalize và validate.
4. Backend trả preview token, thống kê và lỗi từng dòng; chưa ghi database.
5. Frontend hiển thị preview, lỗi, chế độ xử lý và nút xác nhận.
6. Admin xác nhận import với mode `ADD_NEW_ONLY`.
7. Backend commit dựa trên preview token đã lưu, không nhận lại danh sách sinh viên từ frontend.
8. Backend tạo import batch, batch insert sinh viên mới, ghi lỗi/bỏ qua, audit và đánh dấu token đã dùng.
9. Frontend hiển thị kết quả batch, cho xem sinh viên vừa import và tải report CSV.

## 2. API

Các API UniAdmin liên quan:

- `GET /api/v1/university-admin/roster/template`
  - Tải template XLSX nhập sinh viên.
  - Không chứa sinh viên thật.

- `GET /api/v1/university-admin/roster/export?format=csv&keyword=&status=`
  - Xuất danh sách sinh viên thật trong scope trường admin.
  - CSV có UTF-8 BOM.

- `GET /api/v1/university-admin/roster?keyword=&status=&importBatchId=`
  - Lấy danh sách sinh viên.
  - Nếu có `importBatchId`, backend kiểm tra batch thuộc trường hiện tại rồi lọc theo `imported_batch_id`.

- `POST /api/v1/university-admin/roster/import/preview`
  - Multipart file.
  - Parse/normalize/validate, không ghi DB.
  - Trả `previewToken`, thống kê, preview rows và lỗi.

- `GET /api/v1/university-admin/roster/import/preview/{previewToken}`
  - Lấy lại preview theo token.
  - Token phải thuộc user + trường hiện tại và chưa hết hạn.

- `POST /api/v1/university-admin/roster/import/confirm`
  - Tính lại kế hoạch xác nhận import từ `previewToken`.
  - Mode hiện hỗ trợ: `ADD_NEW_ONLY`.
  - Không ghi DB.

- `POST /api/v1/university-admin/roster/import/commit`
  - Commit import thật từ `previewToken`.
  - Không nhận danh sách sinh viên từ frontend.
  - Token chỉ commit một lần; request lặp trả lại batch đã xử lý.

- `GET /api/v1/university-admin/roster/import`
  - Lịch sử batch import của trường hiện tại.

- `GET /api/v1/university-admin/roster/import/{importBatchId}`
  - Chi tiết batch, có tenant guard.

- `GET /api/v1/university-admin/roster/import/{importBatchId}/report`
  - Tải report CSV theo batch, có tenant guard.

## 3. Data model

Bảng chính đang dùng:

- `university_student_rosters`
  - `university_id`
  - `email`
  - `student_code`
  - `full_name`
  - `faculty`
  - `academic_year`
  - `status`
  - `matched_user_id`
  - `imported_batch_id`

- `university_import_batches`
  - `import_batch_id`
  - `university_id`
  - `file_name`
  - `total_rows`
  - `success_rows`
  - `error_rows`
  - `status`
  - `imported_by_user_id`
  - `created_at`
  - `completed_at`

- `university_import_errors`
  - `import_error_id`
  - `import_batch_id`
  - `row_number`
  - `field_name`
  - `raw_value`
  - `error_message`

Unique constraint hiện có:

- `(university_id, email)`
- `(university_id, student_code)`

## 4. Permission và scope

- Scope trường lấy từ `service.requireUniversityAdmin(currentUser).universityId()`.
- Frontend không gửi `schoolId/universityId` để backend tin và ghi dữ liệu.
- Preview token gắn với:
  - user id
  - university id
  - expiry time
  - parse result
  - committed batch id nếu đã commit
- API batch detail/report/filter roster đều kiểm tra batch thuộc university hiện tại.
- Student trường khác không được import/export/xem qua endpoint UniAdmin hiện tại nếu backend scope hoạt động đúng.

## 5. Template

Template XLSX:

- 3 sheet:
  - `Danh sách sinh viên`
  - `Hướng dẫn`
  - `Danh mục`
- Sheet import không chứa sinh viên thật.
- Cột MSSV định dạng Text.
- Có freeze header, autofilter, comment header, dropdown status và danh mục nếu dữ liệu đủ nhỏ.
- Danh mục lấy theo trường admin hiện tại.

CSV fallback:

- Chỉ header.
- Có UTF-8 BOM.
- Không có dòng demo hoặc dòng ghi chú cuối.

## 6. Parser

Parser đã tách logic:

1. Parse file.
2. Normalize.
3. Validate nghiệp vụ.

Đã xử lý:

- CSV UTF-8 BOM / không BOM.
- XLSX.
- Tiếng Việt.
- Dấu phẩy, dấu quote, newline trong cell CSV.
- Header trim.
- Header thiếu/trùng/sai.
- Sheet import không tồn tại.
- Dòng trống.
- Dòng ghi chú legacy bắt đầu bằng `#` nếu toàn bộ dòng là comment.
- MSSV dạng string, giữ số 0 đầu.
- Email lowercase.
- Giá trị `2024.0`.
- Formula/CSV injection pattern.

## 7. Preview

Preview trả:

- Tổng dòng.
- Dòng hợp lệ.
- Dòng lỗi.
- Dòng trùng.
- Dòng tạo mới.
- Dòng đã tồn tại.
- Dòng bị bỏ qua.
- Preview rows.
- Errors.
- Structural errors.
- Preview token.

Validation chính:

- `studentCode`: bắt buộc, trim, max length, duplicate trong file, kiểm tra tồn tại DB.
- `fullName`: bắt buộc, max length.
- `email`: bắt buộc, format, lowercase, duplicate trong file, exact active domain matching, duplicate DB.
- `academicYear`: 4 chữ số, không đổi `24` thành `2024`.
- `status`: enum thật `ACTIVE/INACTIVE/GRADUATED/SUSPENDED`.

Giới hạn hiện tại:

- `faculty` hiện là text trong roster, chưa có bảng/quan hệ faculty chuẩn để validate `FACULTY_NOT_FOUND` thật.
- Roster import hiện chưa có field campus, nên chưa validate campus trong import.

## 8. Import

Mode hiện hỗ trợ:

- `ADD_NEW_ONLY`
  - Tạo sinh viên hoàn toàn mới.
  - Sinh viên có `studentCode` đã tồn tại bị bỏ qua.
  - Không update/upsert sinh viên hiện có.

Commit:

- Dùng `previewToken`.
- Revalidate trước commit.
- Batch insert whitelist field.
- Không mass assign object từ file.
- Token chỉ commit một lần.
- Double submit trả batch đã commit, không insert trùng.
- Nếu DB duplicate race condition xảy ra khi insert, trả conflict để admin preview lại.
- Transaction rollback nếu exception xảy ra trong commit.

## 9. History

Lịch sử import hiển thị:

- Thời gian.
- Tên file.
- Người thực hiện nếu có.
- Mode `ADD_NEW_ONLY`.
- Tổng dòng.
- Thành công.
- Lỗi/bỏ qua.
- Trạng thái.

Chi tiết batch:

- API detail có tenant guard.
- Report CSV có tenant guard.
- Danh sách sinh viên vừa import lọc backend qua `imported_batch_id`.

## 10. Export

Hai nghiệp vụ đã tách:

- Template nhập sinh viên:
  - Dùng để nhập dữ liệu mới.
  - Không có sinh viên thật.

- Export danh sách sinh viên:
  - Chứa sinh viên thật trong scope trường.
  - CSV UTF-8 BOM.
  - Có escape CSV.
  - MSSV dùng dạng Excel text để giữ số 0 đầu.

## 11. Test đã chạy

Đã chạy trong workspace hiện tại:

```bash
cd frontend
npm run lint
npm run build
```

Kết quả:

- `npm run lint`: pass, còn 3 warning cũ ngoài UniAdmin:
  - `frontend/src/components/bus/roles/student-module.tsx`
  - `frontend/src/components/bus/student/journey-planner-desktop.tsx`
- `npm run build`: pass.
- `git diff --check`: pass, chỉ có warning CRLF trên Windows.

Backend test:

```powershell
if (Test-Path .\mvnw.cmd) { .\mvnw.cmd test } elseif (Get-Command mvn -ErrorAction SilentlyContinue) { mvn test } else { 'Maven is not available and mvnw.cmd is missing' }
```

Kết quả:

- Không chạy được backend test vì máy hiện tại không có Maven và repo không có `mvnw.cmd`.

## 12. Kết quả nghiệm thu

Đã kiểm bằng build/lint/static review:

- Frontend compile/type check pass.
- Import API client compile pass.
- UniAdmin import UI compile pass.
- Roster filter theo `importBatchId` compile pass.
- Download report API client compile pass.

Chưa thể xác nhận tự động trong môi trường hiện tại:

- Unit/integration backend test.
- E2E browser test với backend + DB thật.
- Test tenant isolation bằng hai tài khoản trường khác nhau.
- Test rollback transaction bằng lỗi DB cưỡng bức.
- Đo query count thực tế.
- Đo memory thực tế.

## 13. Known limitations

- Chưa có Maven wrapper nên backend test chưa chạy được trong máy này.
- Report CSV hiện tạo từ dữ liệu batch và lỗi đã lưu; do không lưu file gốc đầy đủ, report không thể tái tạo toàn bộ dòng gốc cho các dòng thành công.
- `mode`, `skippedRows`, `idempotencyKey` chưa có cột riêng trong DB; đang suy ra hoặc audit bằng notes.
- Preview token hiện lưu in-memory trong service. Nếu backend restart trước commit, admin cần upload/preview lại.
- `UPDATE_EXISTING` chưa bật vì chưa có permission/whitelist update field rõ ràng.
- Chưa validate campus/faculty catalog thật vì roster model hiện chưa có campus field và faculty đang là text.

## 14. Hướng dẫn test thủ công

### Flow 1: XLSX hợp lệ

1. Đăng nhập UniAdmin.
2. Vào `Nhập danh sách sinh viên`.
3. Tải template XLSX.
4. Nhập sinh viên mới hợp lệ.
5. Upload file.
6. Kiểm tra preview.
7. Xác nhận import.
8. Kiểm tra result card.
9. Bấm `Xem sinh viên vừa import`.
10. Xác nhận danh sách đã lọc theo batch.

### Flow 2: CSV BOM / tiếng Việt / số 0 đầu

1. Tạo CSV UTF-8 BOM.
2. MSSV ví dụ `001234`.
3. Họ tên tiếng Việt có dấu.
4. Upload, preview, commit.
5. Export roster và kiểm tra MSSV không mất số 0.

### Flow 3: Lỗi domain

1. Upload file có email domain không active của trường.
2. Preview phải báo đúng row và field `email`.
3. Tải report sau batch nếu đã commit các dòng hợp lệ.
4. Sửa domain rồi upload lại.
5. Import thành công.

### Flow 4: Duplicate và existing

1. File có MSSV trùng trong file.
2. File có MSSV đã tồn tại DB.
3. Preview phải báo duplicate trong file.
4. MSSV đã tồn tại phải là `SKIP_EXISTING` trong mode `ADD_NEW_ONLY`.
5. Commit không update dữ liệu cũ.

### Flow 5: Tenant isolation

1. Dùng admin trường A.
2. Thử truy cập batch/report/importBatchId của trường B.
3. API phải trả 403 hoặc 404 tùy convention.
4. Export của trường A không có sinh viên trường B.

### Flow 6: Double submit/retry/refresh

1. Preview file hợp lệ.
2. Double click nút xác nhận.
3. Retry request commit cùng token.
4. Kiểm tra chỉ có một batch/số sinh viên không trùng.
5. Refresh sau import không tự commit lại.

### Flow 7: Rollback

1. Tạo tình huống DB lỗi khi insert batch.
2. Commit.
3. Kiểm tra transaction rollback, không có một phần sinh viên bị ghi dở.

### Flow 8: Toast tiếng Việt

1. Gây lỗi template/download/preview/commit.
2. Toast phải là tiếng Việt đúng, không mojibake.

### Flow 9: Template vs export

1. Tải template: không có sinh viên thật.
2. Export roster: có sinh viên thật trong trường.
3. Không nhầm hai nút/chức năng.

## 15. Hướng dẫn rollback

Nếu deployment lỗi:

1. Rollback commit frontend/backend về bản trước PR.
2. Nếu chỉ lỗi frontend import UI:
   - Tạm ẩn menu `Nhập danh sách sinh viên` hoặc rollback riêng `university-admin-module.tsx`.
3. Nếu lỗi backend import commit:
   - Tắt endpoint commit ở routing/security hoặc rollback service/controller.
   - Không cần rollback database nếu chưa thêm migration mới cho đợt này.
4. Nếu phát hiện batch import sai:
   - Dùng `imported_batch_id` để xác định sinh viên được tạo bởi batch.
   - Xóa/disable có kiểm soát theo batch sau khi backup.
5. Sau rollback:
   - Chạy lại `npm run lint`.
   - Chạy lại `npm run build`.
   - Chạy backend test ở môi trường có Maven.

