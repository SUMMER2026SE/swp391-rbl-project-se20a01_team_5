package com.unibus.api.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.admin.AdminUserDtos.CreateStaffUserRequest;
import com.unibus.api.admin.AdminUserDtos.UpdateUserStatusRequest;
import com.unibus.api.admin.AdminUserDtos.UserView;
import com.unibus.api.common.ApiException;
import com.unibus.api.notification.EmailService;

@Service
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AdminUserService(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<UserView> list(String keyword, String role, String status) {
        return adminUserRepository.findUsers(keyword, role, status);
    }

    @Transactional(readOnly = true)
    public AdminUserDtos.PageResponse<UserView> listPaged(String keyword, String role, String status, int page, int size) {
        List<UserView> items = adminUserRepository.findUsers(keyword, role, status, page, size);
        long total = adminUserRepository.countUsers(keyword, role, status);
        return new AdminUserDtos.PageResponse<>(items, page, size, total);
    }

    @Transactional(readOnly = true)
    public UserView get(Integer userId) {
        return adminUserRepository.findUser(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional
    public UserView updateStatus(Integer userId, UpdateUserStatusRequest request) {
        UserView previous = get(userId);
        UserView updated = adminUserRepository.updateStatus(userId, request.status(), request.lockReason());
        // REQ-ADM-001 AC2: Email thông báo gửi đến người dùng khi lock/unlock.
        if ("LOCKED".equals(request.status())) {
            emailService.sendAccountLockNotice(updated.email(), updated.fullName(), request.lockReason());
        } else if ("ACTIVE".equals(request.status()) && "LOCKED".equalsIgnoreCase(previous.status())) {
            emailService.sendAccountUnlockNotice(updated.email(), updated.fullName());
        }
        return updated;
    }

    @Transactional
    public UserView create(CreateStaffUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (adminUserRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        String role = request.role() == null ? "DRIVER" : request.role();
        String employeeCode = blankToNull(request.employeeCode());
        String licenseNumber = blankToNull(request.licenseNumber());
        if ("DRIVER".equals(role) && licenseNumber == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Driver requires license number");
        }
        if (("CONDUCTOR".equals(role) || "DISPATCHER".equals(role)) && employeeCode == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Staff requires employee code");
        }
        return adminUserRepository.createUser(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                blankToNull(request.phoneNumber()),
                role,
                employeeCode,
                licenseNumber);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
