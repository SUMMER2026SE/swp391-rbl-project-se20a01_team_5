INSERT INTO NguoiDung (MaNguoiDung, Email, MatKhau, HoTen, SoDienThoai, VaiTro, TrangThai, NgayTao)
VALUES
  (1, 'driver@test.com', '$2a$10$yNwRPIEDjOw7GDDxWQMvbOaUeu8UIAJ6sYo5zIQVCVAxveyc4PbFK', 'Tai Xe Test', '0900000001', 'TAI_XE', 'ACTIVE', CURRENT_TIMESTAMP),
  (2, 'assistant@test.com', '$2a$10$yNwRPIEDjOw7GDDxWQMvbOaUeu8UIAJ6sYo5zIQVCVAxveyc4PbFK', 'Phu Xe Test', '0900000002', 'PHU_XE', 'ACTIVE', CURRENT_TIMESTAMP),
  (3, 'dispatcher@test.com', '$2a$10$yNwRPIEDjOw7GDDxWQMvbOaUeu8UIAJ6sYo5zIQVCVAxveyc4PbFK', 'Dieu Phoi Test', '0900000003', 'DIEU_PHOI', 'ACTIVE', CURRENT_TIMESTAMP),
  (4, 'student@test.com', '$2a$10$yNwRPIEDjOw7GDDxWQMvbOaUeu8UIAJ6sYo5zIQVCVAxveyc4PbFK', 'Sinh Vien Test', '0900000004', 'SINH_VIEN', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO TaiXe (MaTaiXe, MaNguoiDung, MaGiayPhep, SoNamKinhNghiem, DanhGiaTrungBinh, TrangThaiHoatDong)
VALUES (1, 1, 'GPLX-TEST', 3, 4.50, 'SAN_SANG');

INSERT INTO PhuXe (MaPhuXe, MaNguoiDung, MaNhanVien)
VALUES (1, 2, 'PX-TEST');

INSERT INTO TuyenXe (MaTuyen, TenTuyen, MoTa, KhoangCach, ThoiGianDuKien, TrangThai)
VALUES (1, 'Tuyen Test', 'Tuyen dung de test API', 12.50, 45, 'HOAT_DONG');

INSERT INTO XeBus (MaXe, BienSo, SoChoNgoi, LoaiXe, TrangThai)
VALUES (1, '43B-12345', 45, 'Standard', 'SAN_SANG');

INSERT INTO TramDung (MaTram, TenTram, DiaChi, KinhDo, ViDo)
VALUES
  (1, 'Tram A', 'Cong truong', 108.22000000, 16.07000000),
  (2, 'Tram B', 'Ky tuc xa', 108.23000000, 16.08000000);

INSERT INTO TuyenTram (MaTuyenTram, MaTuyen, MaTram, ThuTu, ThoiGianDuKien)
VALUES
  (1, 1, 1, 1, 0),
  (2, 1, 2, 2, 15);

INSERT INTO LichTrinhXe (MaLichTrinh, MaTuyen, MaXe, MaTaiXe, MaPhuXe, NgayTrongTuan, GioKhoiHanh, GioKetThuc, TrangThai, MaNguoiPhanCong)
VALUES (1, 1, 1, 1, 1, 1, '07:00:00', '08:00:00', 'HOAT_DONG', 3);

INSERT INTO ChuyenXe (MaChuyenXe, MaLichTrinh, MaTuyen, MaXe, MaTaiXe, MaPhuXe, NgayChay, TrangThai, GhiChu)
VALUES (1, 1, 1, 1, 1, 1, CURRENT_DATE, 'CHUA_BAT_DAU', 'Test trip');

INSERT INTO VeThang (MaVeThang, MaSinhVien, MaTuyen, NgayHetHan, MaQR, SoLanQuetHomNay, TrangThai)
VALUES (1, 'SV001', 1, DATEADD('DAY', 30, CURRENT_DATE), 'QR-THANG-TEST', 0, 'HOAT_DONG');

INSERT INTO VeLuot (MaVeLuot, MaSinhVien, MaTuyen, MaTramLen, MaTramXuong, MaQR, NgayHetHan, TrangThai)
VALUES (1, 'SV002', 1, 1, 2, 'QR-LUOT-TEST', DATEADD('DAY', 1, CURRENT_TIMESTAMP), 'CHUA_SU_DUNG');
