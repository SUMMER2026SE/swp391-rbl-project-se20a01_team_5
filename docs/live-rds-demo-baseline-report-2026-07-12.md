# Báo cáo baseline demo live RDS — 12/07/2026

## Kết luận

Baseline demo đã được áp dụng trực tiếp lên live RDS bằng runner chuẩn:

1. Chạy `Seed`.
2. Chạy `Audit`.
3. Chạy `Reset` để đưa database về baseline chính thức.
4. Chạy `Audit` lần cuối.

Không có thay đổi schema, không có Flyway migration và không có DDL mới.

## Kết quả xác minh

Snapshot read-only lúc `2026-07-12 14:47:06` theo giờ Việt Nam:

- Audit: `65/65 PASS`.
- Warning: `0`.
- Failure: `0`.
- MSSV chứa chữ `DEMO`: `0`.
- Seed và Reset có cùng phần thân logic.
- Audit kiểm tra riêng việc sinh viên UTE/VKU/FPT không bị đăng ký nhầm tuyến của trường khác.

## Mật độ dữ liệu hiện tại

| Trường | Roster | University admin active |
|---|---:|---:|
| DTU | 17 | 2 |
| UTE | 15 | 2 |
| VKU | 15 | 2 |
| FPT Đà Nẵng | 15 | 2 |

MSSV account chính:

- DTU: `27211200001`, `27212100002`, `27211200003`, `27217100004`, `27212100005`, `27217200006`.
- UTE: `2411505001` đến `2411505004`.
- VKU: `24ITB001` đến `24ITB004`.
- FPT: `DE210001` đến `DE210004`.

Route registration chính:

- DTU: tuyến `12`, account full-price dùng tuyến `02`.
- UTE: tuyến `11`.
- VKU: tuyến `02`.
- FPT: tuyến `N1`.

## Kiểm tra giao diện đã thực hiện

- Sinh viên DTU đăng nhập và thấy vé, tuyến, chi phí, thông báo.
- University admin DTU, UTE, VKU và FPT đều thấy dashboard, sinh viên, tuyến, chính sách và giao dịch.
- Sinh viên FPT sau fix chỉ còn đúng một registration tuyến `N1`.
- Dashboard điều phối, tài xế và phụ xe tải được dữ liệu.
- Browser test đã được đóng hoàn toàn sau khi kiểm tra.

## Lưu ý môi trường dùng chung

Live RDS đang được nhiều người hoặc tiến trình cùng sử dụng. Ngay sau Reset, DTU có 16 roster rows và có 2 schedule rows cho ngày hiện tại; tại snapshot `14:47:06`, các con số đã thành 17 roster rows và 19 schedule rows. Audit vẫn `65/65 PASS`, nhưng số lượng có thể tiếp tục thay đổi nếu thành viên khác thao tác.

Vì vậy, trước buổi demo nên chạy lại:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

## File nguồn

- `database/SeedDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/AuditDemoDataUntilAugust.sql`
- `database/RunDemoData.ps1`
- `docs/demo-practice-checklist.md`
- `docs/external-agent-full-qa-runbook.md`
