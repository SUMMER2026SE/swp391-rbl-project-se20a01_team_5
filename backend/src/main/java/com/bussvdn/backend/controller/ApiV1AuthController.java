package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.AuthDtos.LoginRequest;
import com.bussvdn.backend.dto.AuthDtos.LoginResponse;
import com.bussvdn.backend.service.AuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class ApiV1AuthController {
    private final AuthService authService;

    public ApiV1AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public FrontendLoginResponse login(@RequestBody FrontendLoginRequest request) {
        String loginName = firstNonBlank(request.email(), request.username());
        String frontendRole = firstNonBlank(request.userRole(), firstNonBlank(request.vaiTro(), detectRole(loginName)));
        String backendRole = toBackendRole(frontendRole);

        if (loginName != null && loginName.contains("@")) {
            LoginResponse user = authService.login(new LoginRequest(
                    loginName,
                    firstNonBlank(request.matKhau(), request.password()),
                    backendRole));
            return toFrontendResponse(user, toFrontendRole(user.vaiTro()));
        }

        Map<String, Object> user = Map.of(
                "username", loginName == null ? "demo" : loginName,
                "vaiTro", backendRole,
                "userRole", frontendRole);
        return new FrontendLoginResponse("demo-token", frontendRole, redirectPath(frontendRole), user);
    }

    private FrontendLoginResponse toFrontendResponse(LoginResponse user, String frontendRole) {
        return new FrontendLoginResponse(
                "session-" + user.maNguoiDung(),
                frontendRole,
                redirectPath(frontendRole),
                user);
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private String detectRole(String value) {
        String normalized = value == null ? "" : value.toLowerCase();
        if (normalized.contains("admin")) {
            return "ADMIN";
        }
        if (normalized.contains("phuxe") || normalized.contains("assistant")) {
            return "ASSISTANT";
        }
        if (normalized.contains("taixe") || normalized.contains("driver")) {
            return "DRIVER";
        }
        if (normalized.contains("dieuphoi") || normalized.contains("coordinator")) {
            return "COORDINATOR";
        }
        return "STUDENT";
    }

    private String toBackendRole(String role) {
        return switch ((role == null ? "" : role).toUpperCase()) {
            case "ADMIN" -> "QUAN_TRI";
            case "ASSISTANT", "PHU_XE" -> "PHU_XE";
            case "DRIVER", "TAI_XE" -> "TAI_XE";
            case "COORDINATOR", "DIEU_PHOI" -> "DIEU_PHOI";
            default -> "SINH_VIEN";
        };
    }

    private String toFrontendRole(String role) {
        return switch ((role == null ? "" : role).toUpperCase()) {
            case "QUAN_TRI" -> "ADMIN";
            case "PHU_XE" -> "ASSISTANT";
            case "TAI_XE" -> "DRIVER";
            case "DIEU_PHOI" -> "COORDINATOR";
            default -> "STUDENT";
        };
    }

    private String redirectPath(String role) {
        return switch ((role == null ? "" : role).toUpperCase()) {
            case "ADMIN" -> "/admin";
            case "ASSISTANT" -> "/assistant";
            case "DRIVER" -> "/driver";
            case "COORDINATOR" -> "/coordinator";
            default -> "/student";
        };
    }

    public record FrontendLoginRequest(
            String username,
            String password,
            String email,
            String matKhau,
            String vaiTro,
            String userRole
    ) {}

    public record FrontendLoginResponse(
            String accessToken,
            String userRole,
            String redirectPath,
            Object user
    ) {}
}
