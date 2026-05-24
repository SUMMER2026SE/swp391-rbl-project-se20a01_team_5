package com.bussvdn.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String matKhau,
            @NotBlank String vaiTro
    ) {}

    public record LoginResponse(
            Integer maNguoiDung,
            String hoTen,
            String email,
            String vaiTro,
            Integer maTaiXe,
            Integer maPhuXe
    ) {}
}
