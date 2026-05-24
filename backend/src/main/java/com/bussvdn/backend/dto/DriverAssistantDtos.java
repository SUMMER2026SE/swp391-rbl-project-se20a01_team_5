package com.bussvdn.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public final class DriverAssistantDtos {
    private DriverAssistantDtos() {}

    public record ScheduleResponse(
            Integer maLichTrinh,
            Integer ngayTrongTuan,
            LocalTime gioKhoiHanh,
            LocalTime gioKetThuc,
            String trangThai,
            Integer maTuyen,
            String tenTuyen,
            Integer maXe,
            String bienSo,
            Integer maPhuXe,
            String tenPhuXe
    ) {}

    public record TripResponse(
            Integer maChuyenXe,
            LocalDate ngayChay,
            LocalDateTime gioKhoiHanh,
            LocalDateTime gioKetThuc,
            String trangThai,
            Integer maTuyen,
            String tenTuyen,
            Integer maXe,
            String bienSo,
            Integer maTaiXe,
            String tenTaiXe,
            Integer maPhuXe,
            String tenPhuXe
    ) {}

    public record GpsRequest(
            @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal kinhDo,
            @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal viDo,
            @DecimalMin("0.0") BigDecimal tocDo,
            String ghiChu
    ) {}

    public record RouteStopResponse(
            Integer maTram,
            String tenTram,
            String diaChi,
            BigDecimal kinhDo,
            BigDecimal viDo,
            Integer thuTu,
            Integer thoiGianDuKien
    ) {}

    public record ContactResponse(
            String vaiTro,
            Integer maNguoiDung,
            String hoTen,
            String soDienThoai
    ) {}

    public record MessageRequest(
            @NotNull Integer maNguoiGui,
            @NotNull Integer maNguoiNhan,
            Integer maChuyenXe,
            @NotBlank String noiDung
    ) {}

    public record MessageResponse(Long maTinNhan, String status) {}

    public record ScanTicketRequest(
            @NotBlank String maQr,
            @NotNull Integer maChuyenXe,
            Integer maTramLen,
            Integer maTramXuong
    ) {}

    public record ScanTicketResponse(
            boolean hopLe,
            String loaiVe,
            String maSinhVien,
            Integer maTuyen,
            String trangThai,
            String message
    ) {}

    public record LostItemRequest(
            @NotNull Integer maNguoiBao,
            Integer maChuyenXe,
            @NotBlank String moTaMonDo,
            String ghiChu
    ) {}

    public record CreatedIdResponse(Integer id, String status) {}

    public record IncidentRequest(
            @NotNull Integer maChuyenXe,
            @NotBlank String loaiSuCo,
            @NotBlank String moTa
    ) {}
}
