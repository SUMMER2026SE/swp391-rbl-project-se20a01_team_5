# UniBus Database Recovery

Bộ này phục hồi database mới khi RDS cũ không còn truy cập được.

## Thứ tự

1. Tạo PostgreSQL database rỗng.
2. Chạy `V6BaseSchema.sql`.
3. Khởi động backend một lần với `DB_FLYWAY_BASELINE_VERSION=6` để Flyway chạy V7–V16.
4. Chạy `OfficialUniversityMasterData.sql`.
5. Chạy `OfficialDanangTransportData.sql`.
6. Chạy `NormalizeRecoveredTransportData.sql`.
7. Chạy `AuditRecoveredTransportData.sql`; tất cả dòng phải `PASS`.
8. Chạy `database/RunDemoData.ps1 -Mode Seed` rồi `-Mode Audit`.
9. Tạo snapshot RDS trước khi mở hệ thống cho team.

## Nội dung phục hồi

- Base schema là snapshot sau migration V6.
- 25 tuyến BUSMAP Đà Nẵng.
- 1.165 liên kết tuyến–trạm, gồm tọa độ, hướng, thứ tự và `path_points`.
- Chuẩn hóa `BUSMAP-DN-48659` thành `Đại học Việt Hàn`.
- Baseline demo DTU, UTE, VKU và FPT được tạo bởi script hiện tại, không nằm trong seed BUSMAP thô.

Không chạy `OfficialDanangTransportData.sql` trước V14/V15 vì file cần các cột external source và unique index mới.
