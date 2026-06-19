# UniBus — FE → BE Integration Guide

Tài liệu này hướng dẫn cách kết nối frontend mock UI với backend Spring Boot.

## Cấu trúc hiện tại (Mock)

```
src/lib/
├── types.ts              # Domain types (User, Route, Bus, University...)
├── mock-data.ts          # All mock data (Đà Nẵng real locations)
└── api/
    └── client.ts         # API client (fetch wrapper + DTO types)
```

## Cấu trúc backend (từ README)

```
backend/
├── src/main/java/.../
│   ├── controller/       # REST endpoints (/api/v1/...)
│   ├── service/          # Business logic
│   ├── repository/       # JPA repositories
│   └── dto/              # Request/Response DTOs
└── requests/             # .http test files
```

## API Endpoints Mapping

### Auth

| FE Screen | BE Endpoint | Method | Mock Function |
|---|---|---|---|
| Login | `/auth/login` | POST | `authApi.login(email, password)` |
| Register | `/auth/register` | POST | `authApi.register({name, email, password, otp})` |
| Register OTP | `/auth/register/otp` | POST | `authApi.registerOtp(email)` |
| Forgot Password | `/auth/forgot-password/otp` | POST | `authApi.forgotPasswordOtp(email)` |
| Reset Password | `/auth/forgot-password/reset` | POST | `authApi.forgotPasswordReset({email, otp, newPassword})` |
| Logout | `/auth/logout` | POST | `authApi.logout()` |
| Refresh | `/auth/refresh` | POST | Auto (in `apiFetch`) |

### Student

| FE Screen | BE Endpoint | Method | Mock Function |
|---|---|---|---|
| Profile | `/students/me/profile` | GET/PATCH | `studentApi.getProfile()` / `updateProfile()` |
| Trạm dừng | `/stops` | GET | `studentApi.getStops()` |
| Tìm tuyến | `/routes/search?boardingStopId=&alightingStopId=` | GET | `studentApi.searchRoutes()` |
| ETA | `/routes/{routeId}/stops/{stopId}/eta` | GET | `studentApi.getEta()` |
| Đăng ký tuyến | `/students/me/route-registrations` | POST | `studentApi.registerRoute()` |
| Tuyến hiện tại | `/students/me/route-registrations/current` | GET | `studentApi.getCurrentRegistration()` |
| Đổi tuyến | `/students/me/route-registrations/{id}` | PUT | `studentApi.updateRegistration()` |
| Hủy tuyến | `/students/me/route-registrations/{id}` | DELETE | `studentApi.cancelRegistration()` |
| Vé & Thanh toán | `/students/me/tickets` | GET | `studentApi.getTickets()` |
| Mua vé tháng | `/students/me/tickets/monthly-pass` | POST | `studentApi.purchaseMonthlyPass()` |
| Lịch sử thanh toán | `/students/me/payments` | GET | `studentApi.getPayments()` |
| Lịch sử chuyến | `/students/me/travel-history?page=0&size=20` | GET | `studentApi.getTravelHistory()` |

### Conductor (Phụ xe)

| FE Screen | BE Endpoint | Method | Mock Function |
|---|---|---|---|
| Danh sách vé | `/conductor/tickets?tripId=` | GET | `conductorApi.getTickets()` |
| Quét QR | `/conductor/tickets/scan` | POST | `conductorApi.scanTicket()` |

## Migration Steps

### Bước 1: Setup API proxy

Thêm vào `next.config.ts`:
```ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};
```

### Bước 2: Thay mock data bằng API calls

Mỗi screen trong `student-module.tsx` hiện dùng mock data trực tiếp:
```ts
// BEFORE (mock)
import { busStops, routes } from "@/lib/mock-data";
const stops = busStops;
```

Thay bằng API call (dùng TanStack Query):
```ts
// AFTER (API)
import { studentApi } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

const { data: stops, isLoading } = useQuery({
  queryKey: ["stops"],
  queryFn: studentApi.getStops,
});
```

### Bước 3: Auth flow

1. Login form → `authApi.login()` → setTokens → redirect to dashboard
2. Register form → `authApi.registerOtp()` → user nhập OTP → `authApi.register()`
3. Token refresh tự động trong `apiFetch` khi 401
4. Logout → `authApi.logout()` → clearTokens → redirect to login

### Bước 4: Map DTO types

Backend trả DTOs khác mock types. Map trong API call hoặc component:

```ts
// Backend StopDTO → FE BusStop
function mapStop(dto: StopDTO): BusStop {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    address: dto.address,
    lat: dto.latitude,
    lng: dto.longitude,
    hasShelter: dto.hasShelter,
    routes: dto.routes.map(r => r.id),
  };
}
```

### Bước 5: Business Rules (từ README)

- Monthly pass khóa route: không cho đổi tuyến khi pass active
- `boardingStopId` / `alightingStopId` = default stops (có thể đổi trong cùng route)
- Subsidy: tính từ `subsidy_policies`, lưu original/subsidy/final trên monthly_pass + invoice
- Student verified → chỉ thấy routes linked qua `route_universities`
- Payment = internal DB confirmation (không MoMo/VNPay gateway thật)

### Bước 6: Screens cần tạo/thêm

Backend chưa có endpoints cho:
- Driver dashboard (chưa có `/drivers/me/*`)
- Coordinator dashboard (chưa có `/coordinators/*`)
- Admin dashboard (chưa có `/admin/*`)
- University admin (README nói "future scope")
- AI suggestion (không có endpoint)
- Chatbot (không có endpoint)
- Real-time tracking (cần WebSocket hoặc polling)
- QR generation (backend trả `qrCode` string trong monthly pass response)

→ Các role khác (driver/coordinator/admin/uni-admin) giữ mock cho đến khi backend có endpoint.

## File Mapping

| FE File | Mapping |
|---|---|
| `src/lib/api/client.ts` | API client + DTO types |
| `src/lib/types.ts` | FE domain types (giữ, map từ DTO) |
| `src/lib/mock-data.ts` | Mock data (xóa dần khi API sẵn sàng) |
| `src/components/bus/auth-screens.tsx` | Login/Register/Forgot → `authApi` |
| `src/components/bus/roles/student-module.tsx` | Student screens → `studentApi` |
| `src/components/bus/roles/assistant-module.tsx` | Conductor screens → `conductorApi` |
| `src/components/bus/app-shell.tsx` | Auth guard (check token, redirect) |
