-- ================================================================
-- DATABASE: BusSVDN
-- Phiên bản: 2.1 (Bổ sung vé lượt)
-- Mô tả: Hệ thống xe bus sinh viên đại học
-- Tổng bảng: 33 | FK: ~60 | Index: 24
-- ================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BusSVDN')
BEGIN
    CREATE DATABASE BusSVDN;
END
GO

USE BusSVDN;
GO

-- ================================================================
-- PHẦN 1: BẢNG NGƯỜI DÙNG VÀ TÁC NHÂN
-- ================================================================

-- ---------------------------------------------------------------
-- 1.1 Bảng NguoiDung - Bảng cha cho tất cả tác nhân
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NguoiDung')
BEGIN
    CREATE TABLE NguoiDung (
        MaNguoiDung     INT IDENTITY(1,1)   NOT NULL,
        Email           NVARCHAR(100)       NOT NULL,
        MatKhau         NVARCHAR(255)       NOT NULL,   -- bcrypt hash
        HoTen           NVARCHAR(100)       NOT NULL,
        SoDienThoai     NVARCHAR(15)        NULL,
        DiaChi          NVARCHAR(255)       NULL,
        Avatar          NVARCHAR(500)       NULL,
        VaiTro          NVARCHAR(20)        NOT NULL
                        CHECK (VaiTro IN ('SINH_VIEN','TAI_XE','PHU_XE','DIEU_PHOI','QUAN_TRI')),
        TrangThai       NVARCHAR(10)        NOT NULL DEFAULT 'ACTIVE'
                        CHECK (TrangThai IN ('ACTIVE','LOCKED')),
        LyDoKhoa        NVARCHAR(500)       NULL,       -- Lý do khi bị LOCKED
        NgayTao         DATETIME2           NOT NULL DEFAULT GETDATE(),
        NgayCapNhat     DATETIME2           NULL,

        CONSTRAINT PK_NguoiDung PRIMARY KEY (MaNguoiDung),
        CONSTRAINT UQ_NguoiDung_Email UNIQUE (Email)
    );
END
GO

-- ---------------------------------------------------------------
-- 1.2 Bảng SinhVien - Thông tin riêng sinh viên
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SinhVien')
BEGIN
    CREATE TABLE SinhVien (
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        MaNguoiDung     INT                 NOT NULL,
        Truong          NVARCHAR(150)       NOT NULL,
        Khoa            NVARCHAR(100)       NULL,
        NamHoc          INT                 NULL,
        NgaySinh        DATE                NULL,

        CONSTRAINT PK_SinhVien PRIMARY KEY (MaSinhVien),
        CONSTRAINT UQ_SinhVien_NguoiDung UNIQUE (MaNguoiDung),
        CONSTRAINT FK_SinhVien_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------
-- 1.3 Bảng TaiXe - Thông tin tài xế
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaiXe')
BEGIN
    CREATE TABLE TaiXe (
        MaTaiXe             INT IDENTITY(1,1)   NOT NULL,
        MaNguoiDung         INT                 NOT NULL,
        MaGiayPhep          NVARCHAR(50)        NOT NULL,
        SoNamKinhNghiem     INT                 NULL DEFAULT 0,
        DanhGiaTrungBinh    DECIMAL(3,2)        NULL DEFAULT 0.00,
        TrangThaiHoatDong   NVARCHAR(20)        NOT NULL DEFAULT 'SAN_SANG'
                            CHECK (TrangThaiHoatDong IN ('SAN_SANG','DANG_CHAY','NGHI_PHEP')),

        CONSTRAINT PK_TaiXe PRIMARY KEY (MaTaiXe),
        CONSTRAINT UQ_TaiXe_NguoiDung UNIQUE (MaNguoiDung),
        CONSTRAINT UQ_TaiXe_GiayPhep UNIQUE (MaGiayPhep),
        CONSTRAINT FK_TaiXe_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------
-- 1.4 Bảng PhuXe - Thông tin phụ xe
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PhuXe')
BEGIN
    CREATE TABLE PhuXe (
        MaPhuXe         INT IDENTITY(1,1)   NOT NULL,
        MaNguoiDung     INT                 NOT NULL,
        MaNhanVien      NVARCHAR(20)        NOT NULL,

        CONSTRAINT PK_PhuXe PRIMARY KEY (MaPhuXe),
        CONSTRAINT UQ_PhuXe_NguoiDung UNIQUE (MaNguoiDung),
        CONSTRAINT UQ_PhuXe_MaNhanVien UNIQUE (MaNhanVien),
        CONSTRAINT FK_PhuXe_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------
-- 1.5 Bảng NhanVienDieuPhoi - Nhân viên điều phối
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NhanVienDieuPhoi')
BEGIN
    CREATE TABLE NhanVienDieuPhoi (
        MaDieuPhoi      INT IDENTITY(1,1)   NOT NULL,
        MaNguoiDung     INT                 NOT NULL,
        MaNhanVien      NVARCHAR(20)        NOT NULL,
        BoPhan          NVARCHAR(100)       NULL,

        CONSTRAINT PK_NhanVienDieuPhoi PRIMARY KEY (MaDieuPhoi),
        CONSTRAINT UQ_DieuPhoi_NguoiDung UNIQUE (MaNguoiDung),
        CONSTRAINT UQ_DieuPhoi_MaNhanVien UNIQUE (MaNhanVien),
        CONSTRAINT FK_DieuPhoi_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------
-- 1.6 [MỚI] Bảng PhienDangNhap - Quản lý session / đăng xuất
-- Use case: Đăng xuất, phát hiện đăng nhập bất thường
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PhienDangNhap')
BEGIN
    CREATE TABLE PhienDangNhap (
        MaPhien             BIGINT IDENTITY(1,1) NOT NULL,
        MaNguoiDung         INT                  NOT NULL,
        TokenHash           NVARCHAR(255)        NOT NULL,  -- Hash của refresh token
        ThietBi             NVARCHAR(200)        NULL,      -- "Android 14 / Samsung S24"
        DiaChiIP            NVARCHAR(45)         NULL,      -- IPv4 hoặc IPv6
        ThoiGianDangNhap    DATETIME2            NOT NULL DEFAULT GETDATE(),
        ThoiGianHetHan      DATETIME2            NOT NULL,
        ThoiGianDangXuat    DATETIME2            NULL,
        IsActive            BIT                  NOT NULL DEFAULT 1,

        CONSTRAINT PK_PhienDangNhap PRIMARY KEY (MaPhien),
        CONSTRAINT FK_Phien_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO


-- ================================================================
-- PHẦN 2: TUYẾN XE, TRẠM DỪNG, XE BUS
-- ================================================================

-- ---------------------------------------------------------------
-- 2.1 Bảng TuyenXe - Tuyến xe bus
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TuyenXe')
BEGIN
    CREATE TABLE TuyenXe (
        MaTuyen         INT IDENTITY(1,1)   NOT NULL,
        TenTuyen        NVARCHAR(150)       NOT NULL,
        MoTa            NVARCHAR(500)       NULL,
        KhoangCach      DECIMAL(10,2)       NULL,      -- km
        ThoiGianDuKien  INT                 NULL,      -- phút
        IsVong          BIT                 NOT NULL DEFAULT 0, -- [MỚI] Tuyến vòng
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'HOAT_DONG'
                        CHECK (TrangThai IN ('HOAT_DONG','TAM_DUNG','HUY')),
        NgayTao         DATETIME2           NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_TuyenXe PRIMARY KEY (MaTuyen)
    );
END
GO

-- ---------------------------------------------------------------
-- 2.2 Bảng TramDung - Trạm dừng
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TramDung')
BEGIN
    CREATE TABLE TramDung (
        MaTram          INT IDENTITY(1,1)   NOT NULL,
        TenTram         NVARCHAR(150)       NOT NULL,
        DiaChi          NVARCHAR(255)       NULL,
        KinhDo          DECIMAL(11,8)       NULL,      -- Longitude
        ViDo            DECIMAL(10,8)       NULL,      -- Latitude
        MoTa            NVARCHAR(500)       NULL,
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'HOAT_DONG'
                        CHECK (TrangThai IN ('HOAT_DONG','TAM_DUNG','HUY')),
        NgayTao         DATETIME2           NOT NULL DEFAULT GETDATE(),
        MaNguoiTao      INT                 NULL,      -- [MỚI] FK → NguoiDung (điều phối tạo)

        CONSTRAINT PK_TramDung PRIMARY KEY (MaTram),
        CONSTRAINT FK_TramDung_NguoiTao FOREIGN KEY (MaNguoiTao)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 2.3 Bảng TuyenTram - Quan hệ Tuyến xe <-> Trạm dừng (N-N)
-- LƯU Ý: Bỏ UQ(MaTuyen, MaTram) để hỗ trợ tuyến vòng (circular route)
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TuyenTram')
BEGIN
    CREATE TABLE TuyenTram (
        MaTuyenTram     INT IDENTITY(1,1)   NOT NULL,
        MaTuyen         INT                 NOT NULL,
        MaTram          INT                 NOT NULL,
        ThuTu           INT                 NOT NULL,  -- Thứ tự trạm trên tuyến
        ThoiGianDuKien  INT                 NULL,      -- Phút từ trạm trước

        CONSTRAINT PK_TuyenTram PRIMARY KEY (MaTuyenTram),
        -- ĐÃ BỎ: UNIQUE(MaTuyen, MaTram) — tuyến vòng có thể qua 1 trạm 2 lần
        CONSTRAINT UQ_TuyenTram_ThuTu UNIQUE (MaTuyen, ThuTu),
        CONSTRAINT FK_TuyenTram_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen) ON DELETE CASCADE,
        CONSTRAINT FK_TuyenTram_TramDung FOREIGN KEY (MaTram)
            REFERENCES TramDung(MaTram) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------
-- 2.4 Bảng XeBus - Xe bus
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'XeBus')
BEGIN
    CREATE TABLE XeBus (
        MaXe            INT IDENTITY(1,1)   NOT NULL,
        BienSo          NVARCHAR(15)        NOT NULL,
        SoChoNgoi       INT                 NOT NULL,
        LoaiXe          NVARCHAR(50)        NULL,
        NamSanXuat      INT                 NULL,
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'SAN_SANG'
                        CHECK (TrangThai IN ('SAN_SANG','DANG_CHAY','BAO_TRI')),

        CONSTRAINT PK_XeBus PRIMARY KEY (MaXe),
        CONSTRAINT UQ_XeBus_BienSo UNIQUE (BienSo)
    );
END
GO


-- ================================================================
-- PHẦN 3: LỊCH TRÌNH, CHUYẾN XE, PHÂN CÔNG
-- ================================================================

-- ---------------------------------------------------------------
-- 3.1 Bảng LichTrinhXe - Lịch trình chạy xe hàng tuần
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LichTrinhXe')
BEGIN
    CREATE TABLE LichTrinhXe (
        MaLichTrinh     INT IDENTITY(1,1)   NOT NULL,
        MaTuyen         INT                 NOT NULL,
        MaXe            INT                 NOT NULL,
        MaTaiXe         INT                 NOT NULL,
        MaPhuXe         INT                 NULL,
        NgayTrongTuan   INT                 NOT NULL CHECK (NgayTrongTuan BETWEEN 1 AND 7),
                                            -- 1=Thứ 2, 7=Chủ nhật
        GioKhoiHanh     TIME                NOT NULL,
        GioKetThuc      TIME                NULL,
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'HOAT_DONG'
                        CHECK (TrangThai IN ('HOAT_DONG','TAM_DUNG','HUY')),
        MaNguoiPhanCong INT                 NULL,   -- [MỚI] FK → NguoiDung (điều phối)
        NgayPhanCong    DATETIME2           NULL,   -- [MỚI] Thời điểm phân công

        CONSTRAINT PK_LichTrinhXe PRIMARY KEY (MaLichTrinh),
        CONSTRAINT FK_LichTrinh_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen),
        CONSTRAINT FK_LichTrinh_XeBus FOREIGN KEY (MaXe)
            REFERENCES XeBus(MaXe),
        CONSTRAINT FK_LichTrinh_TaiXe FOREIGN KEY (MaTaiXe)
            REFERENCES TaiXe(MaTaiXe),
        CONSTRAINT FK_LichTrinh_PhuXe FOREIGN KEY (MaPhuXe)
            REFERENCES PhuXe(MaPhuXe),
        CONSTRAINT FK_LichTrinh_NguoiPhanCong FOREIGN KEY (MaNguoiPhanCong)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 3.2 Bảng ChuyenXe - Chuyến xe thực tế
-- [SỬA] Thêm FK MaLichTrinh để trace lịch trình gốc
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChuyenXe')
BEGIN
    CREATE TABLE ChuyenXe (
        MaChuyenXe      INT IDENTITY(1,1)   NOT NULL,
        MaLichTrinh     INT                 NULL,   -- [MỚI] NULL = chuyến phát sinh ngoài lịch
        MaTuyen         INT                 NOT NULL,
        MaXe            INT                 NOT NULL,
        MaTaiXe         INT                 NOT NULL,
        MaPhuXe         INT                 NULL,
        NgayChay        DATE                NOT NULL,
        GioKhoiHanh     DATETIME2           NULL,
        GioKetThuc      DATETIME2           NULL,
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_BAT_DAU'
                        CHECK (TrangThai IN ('CHUA_BAT_DAU','DANG_CHAY','HOAN_THANH','HUY')),
        GhiChu          NVARCHAR(500)       NULL,

        CONSTRAINT PK_ChuyenXe PRIMARY KEY (MaChuyenXe),
        CONSTRAINT FK_ChuyenXe_LichTrinh FOREIGN KEY (MaLichTrinh)
            REFERENCES LichTrinhXe(MaLichTrinh),
        CONSTRAINT FK_ChuyenXe_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen),
        CONSTRAINT FK_ChuyenXe_XeBus FOREIGN KEY (MaXe)
            REFERENCES XeBus(MaXe),
        CONSTRAINT FK_ChuyenXe_TaiXe FOREIGN KEY (MaTaiXe)
            REFERENCES TaiXe(MaTaiXe),
        CONSTRAINT FK_ChuyenXe_PhuXe FOREIGN KEY (MaPhuXe)
            REFERENCES PhuXe(MaPhuXe)
    );
END
GO

-- ---------------------------------------------------------------
-- 3.3 [MỚI] Bảng DuKienDenTram - ETA cache theo từng trạm
-- Use case: Sinh viên xem thời gian xe đến trạm
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DuKienDenTram')
BEGIN
    CREATE TABLE DuKienDenTram (
        MaDuKien            BIGINT IDENTITY(1,1) NOT NULL,
        MaChuyenXe          INT                  NOT NULL,
        MaTram              INT                  NOT NULL,
        ThoiGianDuKienDen   DATETIME2            NOT NULL,  -- ETA tính bởi backend
        ThoiGianThucTeDen   DATETIME2            NULL,      -- Cập nhật khi xe thực sự đến
        CapNhatLuc          DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_DuKienDenTram PRIMARY KEY (MaDuKien),
        CONSTRAINT UQ_DuKien_Chuyen_Tram UNIQUE (MaChuyenXe, MaTram),
        CONSTRAINT FK_DuKien_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe) ON DELETE CASCADE,
        CONSTRAINT FK_DuKien_TramDung FOREIGN KEY (MaTram)
            REFERENCES TramDung(MaTram)
    );
END
GO


-- ================================================================
-- PHẦN 4: ĐĂNG KÝ, LỊCH SỬ, VÉ THÁNG
-- ================================================================

-- ---------------------------------------------------------------
-- 4.1 Bảng DangKyTuyen - Sinh viên đăng ký tuyến xe
-- [SỬA] Thêm MaDangKyCu, LyDoHuy, NgayHieuLuc
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DangKyTuyen')
BEGIN
    CREATE TABLE DangKyTuyen (
        MaDangKy        INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        MaTuyen         INT                 NOT NULL,
        MaTramLen       INT                 NULL,
        MaTramXuong     INT                 NULL,
        NgayDangKy      DATETIME2           NOT NULL DEFAULT GETDATE(),
        NgayHieuLuc     DATE                NULL,       -- [MỚI] Hiệu lực từ ngày
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'DANG_CHO'
                        CHECK (TrangThai IN ('DANG_CHO','DA_DUYET','HUY')),
        MaDangKyCu      INT                 NULL,       -- [MỚI] FK → DangKyTuyen (khi đổi tuyến)
        LyDoHuy         NVARCHAR(500)       NULL,       -- [MỚI] Lý do khi hủy
        MaNguoiDuyet    INT                 NULL,       -- [MỚI] FK → NguoiDung (điều phối duyệt)
        NgayDuyet       DATETIME2           NULL,       -- [MỚI]

        CONSTRAINT PK_DangKyTuyen PRIMARY KEY (MaDangKy),
        CONSTRAINT FK_DangKy_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_DangKy_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen),
        CONSTRAINT FK_DangKy_TramLen FOREIGN KEY (MaTramLen)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_DangKy_TramXuong FOREIGN KEY (MaTramXuong)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_DangKy_DangKyCu FOREIGN KEY (MaDangKyCu)
            REFERENCES DangKyTuyen(MaDangKy),
        CONSTRAINT FK_DangKy_NguoiDuyet FOREIGN KEY (MaNguoiDuyet)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 4.2 Bảng LichSuChuyenDi - Lịch sử chuyến đi của sinh viên
-- [SỬA] Thêm MaDangKy, PhuongThucXacNhan, MaPhuXeXacNhan
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LichSuChuyenDi')
BEGIN
    CREATE TABLE LichSuChuyenDi (
        MaLichSu            INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien          NVARCHAR(20)        NOT NULL,
        MaChuyenXe          INT                 NOT NULL,
        MaDangKy            INT                 NULL,   -- [MỚI] FK → DangKyTuyen
        MaTramLen           INT                 NULL,
        MaTramXuong         INT                 NULL,
        ThoiGianLen         DATETIME2           NULL,
        ThoiGianXuong       DATETIME2           NULL,
        PhuongThucXacNhan   NVARCHAR(20)        NULL    -- [MỚI]
                            CHECK (PhuongThucXacNhan IN ('QUET_QR','THU_CONG','HE_THONG')),
        MaPhuXeXacNhan      INT                 NULL,   -- [MỚI] FK → PhuXe

        CONSTRAINT PK_LichSuChuyenDi PRIMARY KEY (MaLichSu),
        CONSTRAINT FK_LichSu_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_LichSu_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe),
        CONSTRAINT FK_LichSu_DangKy FOREIGN KEY (MaDangKy)
            REFERENCES DangKyTuyen(MaDangKy),
        CONSTRAINT FK_LichSu_TramLen FOREIGN KEY (MaTramLen)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_LichSu_TramXuong FOREIGN KEY (MaTramXuong)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_LichSu_PhuXeXacNhan FOREIGN KEY (MaPhuXeXacNhan)
            REFERENCES PhuXe(MaPhuXe)
    );
END
GO

-- ---------------------------------------------------------------
-- 4.3 Bảng VeThang - Vé tháng của sinh viên
-- [SỬA] Bổ sung metadata xác thực QR cho phụ xe
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VeThang')
BEGIN
    CREATE TABLE VeThang (
        MaVeThang           INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien          NVARCHAR(20)        NOT NULL,
        MaTuyen             INT                 NOT NULL,
        ThangHieuLuc        INT                 NOT NULL CHECK (ThangHieuLuc BETWEEN 1 AND 12),
        NamHieuLuc          INT                 NOT NULL,
        NgayHieuLucTu       DATE                NOT NULL,   -- [MỚI] Ngày bắt đầu (thường ngày 1)
        NgayMua             DATETIME2           NOT NULL DEFAULT GETDATE(),
        NgayHetHan          DATE                NOT NULL,
        GiaVe               DECIMAL(12,0)       NOT NULL,
        MaQR                NVARCHAR(255)       NULL,       -- Chuỗi mã hóa để tạo QR code
        LanQuetCuoi         DATETIME2           NULL,       -- [MỚI] Timestamp quét gần nhất
        SoLanQuetHomNay     INT                 NOT NULL DEFAULT 0, -- [MỚI] Reset mỗi ngày
        TrangThai           NVARCHAR(20)        NOT NULL DEFAULT 'HOAT_DONG'
                            CHECK (TrangThai IN ('HOAT_DONG','HET_HAN','HUY')),

        CONSTRAINT PK_VeThang PRIMARY KEY (MaVeThang),
        CONSTRAINT FK_VeThang_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_VeThang_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen)
    );
END
GO


-- ---------------------------------------------------------------
-- 4.4 [MỚI] Bảng VeLuot - Vé lượt của sinh viên
-- Use case: Sinh viên mua vé lượt, phụ xe quét QR vé lượt
-- Khác VeThang: vé lượt dùng 1 lần cho 1 chuyến cụ thể,
--               hết hiệu lực cuối ngày mua
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VeLuot')
BEGIN
    CREATE TABLE VeLuot (
        MaVeLuot        INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        MaTuyen         INT                 NOT NULL,
        MaTramLen       INT                 NULL,       -- Trạm lên xe
        MaTramXuong     INT                 NULL,       -- Trạm xuống xe
        MaChuyenXe      INT                 NULL,       -- Chuyến xe đã sử dụng (cập nhật sau khi quét)
        GiaVe           DECIMAL(12,0)       NOT NULL,
        MaQR            NVARCHAR(255)       NULL,       -- Chuỗi mã hóa để tạo QR code
        NgayMua         DATETIME2           NOT NULL DEFAULT GETDATE(),
        NgayHetHan      DATETIME2           NOT NULL,   -- Thường là cuối ngày mua (23:59:59)
        LanQuetCuoi     DATETIME2           NULL,       -- Timestamp khi phụ xe quét
        MaPhuXeQuet     INT                 NULL,       -- FK → PhuXe (ai đã quét)
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_SU_DUNG'
                        CHECK (TrangThai IN ('CHUA_SU_DUNG','DA_SU_DUNG','HET_HAN','HUY')),

        CONSTRAINT PK_VeLuot PRIMARY KEY (MaVeLuot),
        CONSTRAINT FK_VeLuot_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_VeLuot_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen),
        CONSTRAINT FK_VeLuot_TramLen FOREIGN KEY (MaTramLen)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_VeLuot_TramXuong FOREIGN KEY (MaTramXuong)
            REFERENCES TramDung(MaTram),
        CONSTRAINT FK_VeLuot_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe),
        CONSTRAINT FK_VeLuot_PhuXeQuet FOREIGN KEY (MaPhuXeQuet)
            REFERENCES PhuXe(MaPhuXe)
    );
END
GO


-- ================================================================
-- PHẦN 5: THANH TOÁN VÀ HÓA ĐƠN
-- ================================================================

-- ---------------------------------------------------------------
-- 5.1 Bảng ThanhToan - Thanh toán phí dịch vụ
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ThanhToan')
BEGIN
    CREATE TABLE ThanhToan (
        MaThanhToan     INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        SoTien          DECIMAL(12,0)       NOT NULL,
        PhuongThuc      NVARCHAR(20)        NOT NULL
                        CHECK (PhuongThuc IN ('TIEN_MAT','CHUYEN_KHOAN','VI_DIEN_TU','THE')),
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHO_THANH_TOAN'
                        CHECK (TrangThai IN ('CHO_THANH_TOAN','DA_THANH_TOAN','THAT_BAI','HOAN_TIEN')),
        MaGiaoDich      NVARCHAR(100)       NULL,
        NgayThanhToan   DATETIME2           NOT NULL DEFAULT GETDATE(),
        MaVeThang       INT                 NULL,   -- Link khi mua vé tháng
        MaVeLuot        INT                 NULL,   -- [MỚI] Link khi mua vé lượt
        GhiChu          NVARCHAR(500)       NULL,

        CONSTRAINT PK_ThanhToan PRIMARY KEY (MaThanhToan),
        -- Đảm bảo 1 giao dịch chỉ thuộc về 1 loại vé (hoặc không thuộc loại nào)
        CONSTRAINT CK_ThanhToan_LoaiVe CHECK (
            NOT (MaVeThang IS NOT NULL AND MaVeLuot IS NOT NULL)
        ),
        CONSTRAINT FK_ThanhToan_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_ThanhToan_VeThang FOREIGN KEY (MaVeThang)
            REFERENCES VeThang(MaVeThang),
        CONSTRAINT FK_ThanhToan_VeLuot FOREIGN KEY (MaVeLuot)
            REFERENCES VeLuot(MaVeLuot)
    );
END
GO

-- ---------------------------------------------------------------
-- 5.2 Bảng HoaDon - Hóa đơn thanh toán
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HoaDon')
BEGIN
    CREATE TABLE HoaDon (
        MaHoaDon        INT IDENTITY(1,1)   NOT NULL,
        MaThanhToan     INT                 NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        NoiDung         NVARCHAR(500)       NOT NULL,
        SoTien          DECIMAL(12,0)       NOT NULL,
        NgayXuatHoaDon  DATETIME2           NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_HoaDon PRIMARY KEY (MaHoaDon),
        CONSTRAINT UQ_HoaDon_ThanhToan UNIQUE (MaThanhToan),
        CONSTRAINT FK_HoaDon_ThanhToan FOREIGN KEY (MaThanhToan)
            REFERENCES ThanhToan(MaThanhToan),
        CONSTRAINT FK_HoaDon_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien)
    );
END
GO


-- ================================================================
-- PHẦN 6: GIÁ VÉ
-- ================================================================

-- ---------------------------------------------------------------
-- 6.1 Bảng GiaVe - Bảng giá vé theo tuyến
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GiaVe')
BEGIN
    CREATE TABLE GiaVe (
        MaGiaVe         INT IDENTITY(1,1)   NOT NULL,
        MaTuyen         INT                 NOT NULL,
        LoaiVe          NVARCHAR(10)        NOT NULL
                        CHECK (LoaiVe IN ('LUOT','THANG')),
        Gia             DECIMAL(12,0)       NOT NULL,
        NgayApDung      DATE                NOT NULL,
        NgayKetThuc     DATE                NULL,
        MaNguoiDieuChinh INT               NULL,   -- [MỚI] FK → NguoiDung (admin điều chỉnh)
        GhiChu          NVARCHAR(500)       NULL,   -- [MỚI] Lý do điều chỉnh giá

        CONSTRAINT PK_GiaVe PRIMARY KEY (MaGiaVe),
        CONSTRAINT FK_GiaVe_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen),
        CONSTRAINT FK_GiaVe_NguoiDieuChinh FOREIGN KEY (MaNguoiDieuChinh)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO


-- ================================================================
-- PHẦN 7: PHẢN HỒI, ĐÁNH GIÁ, KHIẾU NẠI
-- ================================================================

-- ---------------------------------------------------------------
-- 7.1 Bảng PhanHoi - Phản hồi về chuyến xe
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PhanHoi')
BEGIN
    CREATE TABLE PhanHoi (
        MaPhanHoi       INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        MaChuyenXe      INT                 NOT NULL,
        NoiDung         NVARCHAR(1000)      NOT NULL,
        DanhGiaSao      INT                 NULL CHECK (DanhGiaSao BETWEEN 1 AND 5),
        NgayGui         DATETIME2           NOT NULL DEFAULT GETDATE(),
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_XU_LY'
                        CHECK (TrangThai IN ('CHUA_XU_LY','DANG_XU_LY','DA_XU_LY')),
        PhanHoiXuLy     NVARCHAR(1000)      NULL,
        MaNguoiXuLy     INT                 NULL,

        CONSTRAINT PK_PhanHoi PRIMARY KEY (MaPhanHoi),
        CONSTRAINT FK_PhanHoi_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_PhanHoi_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe),
        CONSTRAINT FK_PhanHoi_NguoiXuLy FOREIGN KEY (MaNguoiXuLy)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 7.2 Bảng DanhGiaTaiXe - Sinh viên đánh giá tài xế
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DanhGiaTaiXe')
BEGIN
    CREATE TABLE DanhGiaTaiXe (
        MaDanhGia       INT IDENTITY(1,1)   NOT NULL,
        MaSinhVien      NVARCHAR(20)        NOT NULL,
        MaTaiXe         INT                 NOT NULL,
        MaChuyenXe      INT                 NULL,
        SoSao           INT                 NOT NULL CHECK (SoSao BETWEEN 1 AND 5),
        NhanXet         NVARCHAR(1000)      NULL,
        NgayDanhGia     DATETIME2           NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_DanhGiaTaiXe PRIMARY KEY (MaDanhGia),
        -- Mỗi sinh viên chỉ đánh giá 1 lần / chuyến
        CONSTRAINT UQ_DanhGia_SV_Chuyen UNIQUE (MaSinhVien, MaChuyenXe),
        CONSTRAINT FK_DanhGia_SinhVien FOREIGN KEY (MaSinhVien)
            REFERENCES SinhVien(MaSinhVien),
        CONSTRAINT FK_DanhGia_TaiXe FOREIGN KEY (MaTaiXe)
            REFERENCES TaiXe(MaTaiXe),
        CONSTRAINT FK_DanhGia_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe)
    );
END
GO

-- ---------------------------------------------------------------
-- 7.3 Bảng KhieuNai - Khiếu nại từ người dùng
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KhieuNai')
BEGIN
    CREATE TABLE KhieuNai (
        MaKhieuNai      INT IDENTITY(1,1)   NOT NULL,
        MaNguoiGui      INT                 NOT NULL,
        TieuDe          NVARCHAR(200)       NOT NULL,
        NoiDung         NVARCHAR(2000)      NOT NULL,
        NgayGui         DATETIME2           NOT NULL DEFAULT GETDATE(),
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_XU_LY'
                        CHECK (TrangThai IN ('CHUA_XU_LY','DANG_XU_LY','DA_XU_LY','TU_CHOI')),
        PhanHoiXuLy     NVARCHAR(2000)      NULL,
        MaNguoiXuLy     INT                 NULL,
        NgayXuLy        DATETIME2           NULL,

        CONSTRAINT PK_KhieuNai PRIMARY KEY (MaKhieuNai),
        CONSTRAINT FK_KhieuNai_NguoiGui FOREIGN KEY (MaNguoiGui)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_KhieuNai_NguoiXuLy FOREIGN KEY (MaNguoiXuLy)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 7.4 Bảng BaoCaoViPham - Báo cáo vi phạm
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BaoCaoViPham')
BEGIN
    CREATE TABLE BaoCaoViPham (
        MaBaoCao            INT IDENTITY(1,1)   NOT NULL,
        MaNguoiBaoCao       INT                 NOT NULL,
        MaDoiTuongViPham    INT                 NOT NULL,
        NoiDung             NVARCHAR(2000)      NOT NULL,
        NgayBaoCao          DATETIME2           NOT NULL DEFAULT GETDATE(),
        TrangThai           NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_XU_LY'
                            CHECK (TrangThai IN ('CHUA_XU_LY','DANG_XU_LY','DA_XU_LY')),
        KetQuaXuLy          NVARCHAR(2000)      NULL,

        CONSTRAINT PK_BaoCaoViPham PRIMARY KEY (MaBaoCao),
        CONSTRAINT FK_BaoCao_NguoiBaoCao FOREIGN KEY (MaNguoiBaoCao)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_BaoCao_DoiTuong FOREIGN KEY (MaDoiTuongViPham)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 7.5 [MỚI] Bảng PhieuHoTro - Yêu cầu hỗ trợ kỹ thuật
-- Use case: "Gửi yêu cầu hỗ trợ đến admin" (chức năng chung tất cả vai trò)
-- Tách biệt với KhieuNai (pháp lý) — đây là ticket support kỹ thuật
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PhieuHoTro')
BEGIN
    CREATE TABLE PhieuHoTro (
        MaPhieu         INT IDENTITY(1,1)   NOT NULL,
        MaNguoiGui      INT                 NOT NULL,
        LoaiHoTro       NVARCHAR(30)        NOT NULL
                        CHECK (LoaiHoTro IN ('TAI_KHOAN','THANH_TOAN','KY_THUAT','VE_THANG','KHAC')),
        TieuDe          NVARCHAR(200)       NOT NULL,
        NoiDung         NVARCHAR(2000)      NOT NULL,
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'MOI'
                        CHECK (TrangThai IN ('MOI','DANG_XU_LY','DA_GIAI_QUYET','DONG')),
        PhanHoiXuLy     NVARCHAR(2000)      NULL,
        MaNguoiXuLy     INT                 NULL,   -- FK → NguoiDung (Admin xử lý)
        NgayTao         DATETIME2           NOT NULL DEFAULT GETDATE(),
        NgayCapNhat     DATETIME2           NULL,

        CONSTRAINT PK_PhieuHoTro PRIMARY KEY (MaPhieu),
        CONSTRAINT FK_PhieuHoTro_NguoiGui FOREIGN KEY (MaNguoiGui)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_PhieuHoTro_NguoiXuLy FOREIGN KEY (MaNguoiXuLy)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO


-- ================================================================
-- PHẦN 8: BÁO MẤT ĐỒ, SỰ CỐ
-- ================================================================

-- ---------------------------------------------------------------
-- 8.1 Bảng BaoMatDo - Báo mất đồ trên xe
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BaoMatDo')
BEGIN
    CREATE TABLE BaoMatDo (
        MaBaoMatDo      INT IDENTITY(1,1)   NOT NULL,
        MaNguoiBao      INT                 NOT NULL,
        MaChuyenXe      INT                 NULL,
        MoTaMonDo       NVARCHAR(500)       NOT NULL,
        NgayBao         DATETIME2           NOT NULL DEFAULT GETDATE(),
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'CHUA_TIM_THAY'
                        CHECK (TrangThai IN ('CHUA_TIM_THAY','DANG_TIM','DA_TIM_THAY','KHONG_TIM_THAY')),
        GhiChu          NVARCHAR(500)       NULL,
        MaNguoiHoTro    INT                 NULL,   -- Phụ xe hỗ trợ

        CONSTRAINT PK_BaoMatDo PRIMARY KEY (MaBaoMatDo),
        CONSTRAINT FK_BaoMatDo_NguoiBao FOREIGN KEY (MaNguoiBao)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_BaoMatDo_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe),
        CONSTRAINT FK_BaoMatDo_NguoiHoTro FOREIGN KEY (MaNguoiHoTro)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 8.2 Bảng SuCo - Báo cáo sự cố trên chuyến xe (Phụ xe báo)
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SuCo')
BEGIN
    CREATE TABLE SuCo (
        MaSuCo          INT IDENTITY(1,1)   NOT NULL,
        MaPhuXe         INT                 NOT NULL,
        MaChuyenXe      INT                 NOT NULL,
        LoaiSuCo        NVARCHAR(20)        NOT NULL
                        CHECK (LoaiSuCo IN ('QUA_TAI','KHAN_CAP','KY_THUAT','KHAC')),
        MoTa            NVARCHAR(2000)      NOT NULL,
        NgayBaoCao      DATETIME2           NOT NULL DEFAULT GETDATE(),
        TrangThai       NVARCHAR(20)        NOT NULL DEFAULT 'MOI'
                        CHECK (TrangThai IN ('MOI','DANG_XU_LY','DA_XU_LY')),
        KetQuaXuLy      NVARCHAR(1000)      NULL,
        MaNguoiXuLy     INT                 NULL,   -- [MỚI] FK → NguoiDung (điều phối xử lý)

        CONSTRAINT PK_SuCo PRIMARY KEY (MaSuCo),
        CONSTRAINT FK_SuCo_PhuXe FOREIGN KEY (MaPhuXe)
            REFERENCES PhuXe(MaPhuXe),
        CONSTRAINT FK_SuCo_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe),
        CONSTRAINT FK_SuCo_NguoiXuLy FOREIGN KEY (MaNguoiXuLy)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO


-- ================================================================
-- PHẦN 9: THÔNG BÁO VÀ VỊ TRÍ XE
-- ================================================================

-- ---------------------------------------------------------------
-- 9.1 Bảng ThongBao - Thông báo hệ thống (one-way broadcast)
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ThongBao')
BEGIN
    CREATE TABLE ThongBao (
        MaThongBao      INT IDENTITY(1,1)   NOT NULL,
        MaNguoiNhan     INT                 NULL,   -- NULL = gửi cho tất cả
        MaNguoiGui      INT                 NOT NULL,
        TieuDe          NVARCHAR(200)       NOT NULL,
        NoiDung         NVARCHAR(2000)      NOT NULL,
        LoaiThongBao    NVARCHAR(20)        NOT NULL DEFAULT 'HE_THONG'
                        CHECK (LoaiThongBao IN ('HE_THONG','CHUYEN_XE','THANH_TOAN','KHIEU_NAI','CANH_BAO')),
        DaDoc           BIT                 NOT NULL DEFAULT 0,
        NgayGui         DATETIME2           NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_ThongBao PRIMARY KEY (MaThongBao),
        CONSTRAINT FK_ThongBao_NguoiNhan FOREIGN KEY (MaNguoiNhan)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_ThongBao_NguoiGui FOREIGN KEY (MaNguoiGui)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ---------------------------------------------------------------
-- 9.2 [MỚI] Bảng TinNhanNoiBo - Nhắn tin 2 chiều nội bộ
-- Use case: Tài xế liên hệ điều phối viên, Phụ xe liên hệ tài xế
-- Khác ThongBao: đây là 2-way chat, có thread theo chuyến xe
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TinNhanNoiBo')
BEGIN
    CREATE TABLE TinNhanNoiBo (
        MaTinNhan       BIGINT IDENTITY(1,1) NOT NULL,
        MaNguoiGui      INT                  NOT NULL,
        MaNguoiNhan     INT                  NOT NULL,
        MaChuyenXe      INT                  NULL,   -- Context: thuộc chuyến xe nào
        NoiDung         NVARCHAR(2000)       NOT NULL,
        DaDoc           BIT                  NOT NULL DEFAULT 0,
        NgayGui         DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_TinNhanNoiBo PRIMARY KEY (MaTinNhan),
        CONSTRAINT FK_TinNhan_NguoiGui FOREIGN KEY (MaNguoiGui)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_TinNhan_NguoiNhan FOREIGN KEY (MaNguoiNhan)
            REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_TinNhan_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe)
    );
END
GO

-- ---------------------------------------------------------------
-- 9.3 Bảng ViTriXe - Theo dõi vị trí xe theo thời gian thực
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ViTriXe')
BEGIN
    CREATE TABLE ViTriXe (
        MaViTri             BIGINT IDENTITY(1,1) NOT NULL,
        MaXe                INT                  NOT NULL,
        MaChuyenXe          INT                  NULL,   -- [MỚI] Liên kết chuyến xe đang chạy
        KinhDo              DECIMAL(11,8)        NOT NULL,
        ViDo                DECIMAL(10,8)        NOT NULL,
        TocDo               DECIMAL(5,2)         NULL,   -- km/h
        ThoiGianCapNhat     DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_ViTriXe PRIMARY KEY (MaViTri),
        CONSTRAINT FK_ViTriXe_XeBus FOREIGN KEY (MaXe)
            REFERENCES XeBus(MaXe),
        CONSTRAINT FK_ViTriXe_ChuyenXe FOREIGN KEY (MaChuyenXe)
            REFERENCES ChuyenXe(MaChuyenXe)
    );
END
GO


-- ================================================================
-- PHẦN 10: AI CHATBOT
-- ================================================================

-- ---------------------------------------------------------------
-- 10.1 [MỚI] Bảng LichSuChatAI - Lịch sử tương tác chatbot
-- Use case: AI gợi ý tuyến xe, chatbot tra cứu tuyến và giá vé
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LichSuChatAI')
BEGIN
    CREATE TABLE LichSuChatAI (
        MaLichSu        BIGINT IDENTITY(1,1) NOT NULL,
        MaNguoiDung     INT                  NOT NULL,
        MaPhienChat     UNIQUEIDENTIFIER     NOT NULL DEFAULT NEWID(), -- Nhóm tin theo session
        VaiTro          NVARCHAR(10)         NOT NULL
                        CHECK (VaiTro IN ('USER','AI')),
        NoiDung         NVARCHAR(MAX)        NOT NULL,
        LoaiTuVan       NVARCHAR(20)         NULL
                        CHECK (LoaiTuVan IN ('GOI_Y_TUYEN','TRA_CUU_GIA','TRA_CUU_LICH','KHAC')),
        NgayGui         DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_LichSuChatAI PRIMARY KEY (MaLichSu),
        CONSTRAINT FK_ChatAI_NguoiDung FOREIGN KEY (MaNguoiDung)
            REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
    );
END
GO


-- ================================================================
-- PHẦN 11: THỐNG KÊ VÀ AUDIT
-- ================================================================

-- ---------------------------------------------------------------
-- 11.1 [MỚI] Bảng ThongKeNgay - Snapshot thống kê hàng ngày
-- Use case: Admin xem thống kê doanh thu, số lượng SV, tài xế
-- Tránh query nặng trực tiếp lên dữ liệu gốc
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ThongKeNgay')
BEGIN
    CREATE TABLE ThongKeNgay (
        MaThongKe           INT IDENTITY(1,1)   NOT NULL,
        Ngay                DATE                NOT NULL,
        MaTuyen             INT                 NULL,   -- NULL = tổng hợp toàn hệ thống
        SoChuyenHoanThanh   INT                 NOT NULL DEFAULT 0,
        SoChuyenHuy         INT                 NOT NULL DEFAULT 0,
        SoSinhVienDiLai     INT                 NOT NULL DEFAULT 0,
        SoLuotQuetQR        INT                 NOT NULL DEFAULT 0,
        DoanhThu            DECIMAL(15,0)       NOT NULL DEFAULT 0,
        SoVeThangBan        INT                 NOT NULL DEFAULT 0,
        NgayTao             DATETIME2           NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_ThongKeNgay PRIMARY KEY (MaThongKe),
        CONSTRAINT UQ_ThongKe_Ngay_Tuyen UNIQUE (Ngay, MaTuyen),
        CONSTRAINT FK_ThongKe_TuyenXe FOREIGN KEY (MaTuyen)
            REFERENCES TuyenXe(MaTuyen)
    );
END
GO

-- ---------------------------------------------------------------
-- 11.2 [MỚI] Bảng NhatKyHoatDong - Audit trail mọi thay đổi quan trọng
-- Use case: Track khi admin khóa TK, điều chỉnh giá vé, xóa trạm dừng
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NhatKyHoatDong')
BEGIN
    CREATE TABLE NhatKyHoatDong (
        MaNhatKy        BIGINT IDENTITY(1,1) NOT NULL,
        MaNguoiThucHien INT                  NOT NULL,
        HanhDong        NVARCHAR(50)         NOT NULL,
                        -- VD: 'KHOA_TK', 'MO_TK', 'SUA_GIA_VE',
                        --     'XOA_TRAM', 'DUYET_DANG_KY', 'HUY_VE_THANG'
        BangAffected    NVARCHAR(50)         NULL,   -- Tên bảng bị tác động
        MaBanGhi        NVARCHAR(50)         NULL,   -- PK của bản ghi bị tác động
        GiaTriCu        NVARCHAR(MAX)        NULL,   -- JSON snapshot trước khi sửa
        GiaTriMoi       NVARCHAR(MAX)        NULL,   -- JSON snapshot sau khi sửa
        DiaChiIP        NVARCHAR(45)         NULL,
        GhiChu          NVARCHAR(500)        NULL,
        NgayThucHien    DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_NhatKyHoatDong PRIMARY KEY (MaNhatKy),
        CONSTRAINT FK_NhatKy_NguoiThucHien FOREIGN KEY (MaNguoiThucHien)
            REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO


-- ================================================================
-- PHẦN 12: INDEX TĂNG HIỆU NĂNG TRUY VẤN
-- ================================================================

-- --- NguoiDung ---
CREATE NONCLUSTERED INDEX IX_NguoiDung_VaiTro
    ON NguoiDung(VaiTro);
CREATE NONCLUSTERED INDEX IX_NguoiDung_TrangThai
    ON NguoiDung(TrangThai);

-- --- PhienDangNhap ---
CREATE NONCLUSTERED INDEX IX_Phien_NguoiDung_Active
    ON PhienDangNhap(MaNguoiDung, IsActive)
    INCLUDE (ThoiGianHetHan, TokenHash);

-- --- ChuyenXe ---
CREATE NONCLUSTERED INDEX IX_ChuyenXe_NgayChay
    ON ChuyenXe(NgayChay);
CREATE NONCLUSTERED INDEX IX_ChuyenXe_TrangThai
    ON ChuyenXe(TrangThai);
CREATE NONCLUSTERED INDEX IX_ChuyenXe_TaiXe
    ON ChuyenXe(MaTaiXe, NgayChay);
CREATE NONCLUSTERED INDEX IX_ChuyenXe_MaTuyen_TrangThai
    ON ChuyenXe(MaTuyen, TrangThai)
    INCLUDE (MaXe, NgayChay);

-- --- LichSuChuyenDi ---
CREATE NONCLUSTERED INDEX IX_LichSu_SinhVien
    ON LichSuChuyenDi(MaSinhVien);

-- --- VeThang ---
CREATE NONCLUSTERED INDEX IX_VeThang_SinhVien
    ON VeThang(MaSinhVien, ThangHieuLuc, NamHieuLuc);
-- Index phục vụ quét QR: tìm vé còn hiệu lực nhanh
CREATE NONCLUSTERED INDEX IX_VeThang_TrangThai_HetHan
    ON VeThang(TrangThai, NgayHetHan)
    INCLUDE (MaSinhVien, MaTuyen, MaQR, LanQuetCuoi);

-- --- VeLuot ---
CREATE NONCLUSTERED INDEX IX_VeLuot_SinhVien
    ON VeLuot(MaSinhVien, NgayMua DESC);
-- Index phục vụ quét QR vé lượt
CREATE NONCLUSTERED INDEX IX_VeLuot_TrangThai_HetHan
    ON VeLuot(TrangThai, NgayHetHan)
    INCLUDE (MaSinhVien, MaTuyen, MaQR);

-- --- ThanhToan ---
CREATE NONCLUSTERED INDEX IX_ThanhToan_SinhVien
    ON ThanhToan(MaSinhVien);
CREATE NONCLUSTERED INDEX IX_ThanhToan_TrangThai
    ON ThanhToan(TrangThai);

-- --- ThongBao ---
CREATE NONCLUSTERED INDEX IX_ThongBao_NguoiNhan
    ON ThongBao(MaNguoiNhan, DaDoc);

-- --- TinNhanNoiBo ---
CREATE NONCLUSTERED INDEX IX_TinNhan_NguoiNhan_DaDoc
    ON TinNhanNoiBo(MaNguoiNhan, DaDoc)
    INCLUDE (NgayGui, MaNguoiGui);

-- --- ViTriXe (real-time tracking) ---
CREATE NONCLUSTERED INDEX IX_ViTriXe_MaXe_ThoiGian
    ON ViTriXe(MaXe, ThoiGianCapNhat DESC);

-- --- DanhGiaTaiXe ---
CREATE NONCLUSTERED INDEX IX_DanhGia_TaiXe
    ON DanhGiaTaiXe(MaTaiXe);

-- --- PhanHoi ---
CREATE NONCLUSTERED INDEX IX_PhanHoi_TrangThai
    ON PhanHoi(TrangThai);

-- --- KhieuNai ---
CREATE NONCLUSTERED INDEX IX_KhieuNai_TrangThai
    ON KhieuNai(TrangThai);

-- --- DuKienDenTram (ETA lookup) ---
CREATE NONCLUSTERED INDEX IX_DuKien_Chuyen_Tram
    ON DuKienDenTram(MaChuyenXe, MaTram)
    INCLUDE (ThoiGianDuKienDen);

-- --- NhatKyHoatDong ---
CREATE NONCLUSTERED INDEX IX_NhatKy_NguoiThucHien
    ON NhatKyHoatDong(MaNguoiThucHien, NgayThucHien DESC);
CREATE NONCLUSTERED INDEX IX_NhatKy_HanhDong
    ON NhatKyHoatDong(HanhDong, NgayThucHien DESC);

-- --- LichSuChatAI ---
CREATE NONCLUSTERED INDEX IX_ChatAI_NguoiDung
    ON LichSuChatAI(MaNguoiDung, NgayGui DESC);

-- --- ThongKeNgay ---
CREATE NONCLUSTERED INDEX IX_ThongKe_Ngay
    ON ThongKeNgay(Ngay DESC, MaTuyen);

GO

-- ================================================================
PRINT N'';
PRINT N'=== TẠO DATABASE BusSVDN v2.1 THÀNH CÔNG ===';
PRINT N'';
PRINT N'THỐNG KÊ:';
PRINT N'  Tổng số bảng  : 33';
PRINT N'  Tổng FK       : ~60';
PRINT N'  Tổng Index    : 24';
PRINT N'';
PRINT N'BẢNG MỚI BỔ SUNG (v2.1):';
PRINT N'  + VeLuot          — Vé lượt (mua từng chuyến, QR 1 lần dùng)';
PRINT N'';
PRINT N'SỬA ĐỔI (v2.1):';
PRINT N'  ~ ThanhToan       — Thêm MaVeLuot + CHECK không link 2 loại vé cùng lúc';
PRINT N'';
PRINT N'BẢNG MỚI BỔ SUNG (v2.0):';
PRINT N'  + PhienDangNhap   — Quản lý session / đăng xuất';
PRINT N'  + DuKienDenTram   — ETA xe đến từng trạm';
PRINT N'  + PhieuHoTro      — Yêu cầu hỗ trợ kỹ thuật';
PRINT N'  + TinNhanNoiBo    — Nhắn tin 2 chiều nội bộ';
PRINT N'  + LichSuChatAI    — Lịch sử tương tác AI/chatbot';
PRINT N'  + ThongKeNgay     — Snapshot thống kê hàng ngày';
PRINT N'  + NhatKyHoatDong  — Audit trail';
PRINT N'';
PRINT N'CÁC SỬA ĐỔI TRÊN BẢNG CŨ (v2.0):';
PRINT N'  ~ NguoiDung       — Thêm LyDoKhoa';
PRINT N'  ~ TuyenXe         — Thêm IsVong (hỗ trợ circular route)';
PRINT N'  ~ TramDung        — Thêm MaNguoiTao';
PRINT N'  ~ TuyenTram       — Bỏ UQ(MaTuyen,MaTram) — tuyến vòng OK';
PRINT N'  ~ LichTrinhXe     — Thêm MaNguoiPhanCong, NgayPhanCong';
PRINT N'  ~ ChuyenXe        — Thêm FK → LichTrinhXe';
PRINT N'  ~ DangKyTuyen     — Thêm NgayHieuLuc, MaDangKyCu, LyDoHuy';
PRINT N'  ~ LichSuChuyenDi  — Thêm MaDangKy, PhuongThucXacNhan, MaPhuXeXacNhan';
PRINT N'  ~ VeThang         — Thêm NgayHieuLucTu, LanQuetCuoi, SoLanQuetHomNay';
PRINT N'  ~ GiaVe           — Thêm MaNguoiDieuChinh, GhiChu';
PRINT N'  ~ SuCo            — Thêm MaNguoiXuLy';
PRINT N'  ~ DanhGiaTaiXe    — Thêm UQ(MaSinhVien, MaChuyenXe)';
PRINT N'  ~ ViTriXe         — Thêm FK → ChuyenXe';
GO
