package com.bussvdn.backend.service;

import com.bussvdn.backend.dto.AuthDtos.LoginRequest;
import com.bussvdn.backend.dto.AuthDtos.LoginResponse;
import com.bussvdn.backend.entity.NguoiDung;
import com.bussvdn.backend.entity.PhuXe;
import com.bussvdn.backend.entity.TaiXe;
import com.bussvdn.backend.exception.ApiException;
import com.bussvdn.backend.repository.NguoiDungRepository;
import com.bussvdn.backend.repository.PhuXeRepository;
import com.bussvdn.backend.repository.TaiXeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final NguoiDungRepository nguoiDungRepository;
    private final TaiXeRepository taiXeRepository;
    private final PhuXeRepository phuXeRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            NguoiDungRepository nguoiDungRepository,
            TaiXeRepository taiXeRepository,
            PhuXeRepository phuXeRepository,
            PasswordEncoder passwordEncoder) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.taiXeRepository = taiXeRepository;
        this.phuXeRepository = phuXeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        NguoiDung user = nguoiDungRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email or password invalid"));
        if (!"ACTIVE".equals(user.getTrangThai())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account locked");
        }
        if (!user.getVaiTro().equals(request.vaiTro())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Role not allowed for this account");
        }
        if (!passwordEncoder.matches(request.matKhau(), user.getMatKhau())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email or password invalid");
        }

        Integer maTaiXe = null;
        Integer maPhuXe = null;
        if ("TAI_XE".equals(user.getVaiTro())) {
            TaiXe taiXe = taiXeRepository.findByNguoiDungMaNguoiDung(user.getMaNguoiDung())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver profile not found"));
            maTaiXe = taiXe.getMaTaiXe();
        }
        if ("PHU_XE".equals(user.getVaiTro())) {
            PhuXe phuXe = phuXeRepository.findByNguoiDungMaNguoiDung(user.getMaNguoiDung())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assistant profile not found"));
            maPhuXe = phuXe.getMaPhuXe();
        }

        return new LoginResponse(
                user.getMaNguoiDung(),
                user.getHoTen(),
                user.getEmail(),
                user.getVaiTro(),
                maTaiXe,
                maPhuXe);
    }
}
