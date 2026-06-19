/**
 * API Client — UniBus Backend Integration
 *
 * Base URL: /api/v1 (proxy to Spring Boot backend)
 * Auth: JWT Bearer token (stored in localStorage/cookie)
 *
 * Usage:
 *   import { api, studentApi } from "@/lib/api/client";
 *   const stops = await studentApi.getStops();
 */

export const API_BASE = "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";
const STUDENT_VERIFICATION_STATUS_KEY = "student_verification_status";

// ===== Token Management =====

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("unibus_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("unibus_refresh_token");
}

export function setTokens(access: string, refresh: string, role?: string, studentVerificationStatus?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  localStorage.setItem("unibus_access_token", access);
  localStorage.setItem("unibus_refresh_token", refresh);
  if (role) localStorage.setItem(USER_ROLE_KEY, role);
  if (studentVerificationStatus) {
    localStorage.setItem(STUDENT_VERIFICATION_STATUS_KEY, studentVerificationStatus);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(STUDENT_VERIFICATION_STATUS_KEY);
  localStorage.removeItem("unibus_access_token");
  localStorage.removeItem("unibus_refresh_token");
}

// ===== Core Fetch Wrapper =====

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Try refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options);
    }
    clearTokens();
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message || error.error || "Request failed");
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ===== Token Refresh =====

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const payload = await res.json();
      const data = payload?.data ?? payload;
      setTokens(data.accessToken, data.refreshToken, data.role, data.studentVerificationStatus);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ===== Auth API =====

export const authApi = {
  registerOtp: (email: string) =>
    apiFetch("/auth/register/otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  register: (data: { name: string; email: string; password: string; otp: string }) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        otp: data.otp,
        password: data.password,
        fullName: data.name,
      }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; role?: string; studentVerificationStatus?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch("/auth/logout", { method: "POST" }),

  forgotPasswordOtp: (email: string) =>
    apiFetch("/auth/forgot-password/otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPasswordReset: (data: { email: string; otp: string; newPassword: string }) =>
    apiFetch("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===== Student Profile API =====

export const studentApi = {
  getProfile: () =>
    apiFetch<{ id: string; name: string; email: string; phone: string; avatarUrl: string }>("/students/me/profile"),

  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) =>
    apiFetch("/students/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Stops
  getStops: () =>
    apiFetch<StopDTO[]>("/stops"),

  // Routes
  searchRoutes: (boardingStopId: string, alightingStopId: string) =>
    apiFetch<RouteDTO[]>(`/routes/search?boardingStopId=${boardingStopId}&alightingStopId=${alightingStopId}`),

  getEta: (routeId: string, stopId: string) =>
    apiFetch<{ etaMinutes: number; tripId: string }>(`/routes/${routeId}/stops/${stopId}/eta`),

  // Route Registration
  registerRoute: (data: { routeId: string; boardingStopId: string; alightingStopId: string }) =>
    apiFetch("/students/me/route-registrations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCurrentRegistration: () =>
    apiFetch<{ id: string; routeId: string; boardingStopId: string; alightingStopId: string; status: string }>("/students/me/route-registrations/current"),

  updateRegistration: (id: string, data: { routeId?: string; boardingStopId?: string; alightingStopId?: string }) =>
    apiFetch(`/students/me/route-registrations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  cancelRegistration: (id: string) =>
    apiFetch(`/students/me/route-registrations/${id}`, { method: "DELETE" }),

  // Tickets & Payment
  getTickets: () =>
    apiFetch<TicketDashboardDTO>("/students/me/tickets"),

  purchaseMonthlyPass: (data: { routeId: string; month: string }) =>
    apiFetch<{ monthlyPass: MonthlyPassDTO; payment: PaymentDTO; invoice: InvoiceDTO; qrCode: string }>("/students/me/tickets/monthly-pass", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPayments: () =>
    apiFetch<PaymentDTO[]>("/students/me/payments"),

  // Travel History
  getTravelHistory: (page = 0, size = 20) =>
    apiFetch<{ content: TravelHistoryDTO[]; totalElements: number }>(`/students/me/travel-history?page=${page}&size=${size}`),
};

// ===== Conductor API =====

export const conductorApi = {
  getTickets: (tripId: string) =>
    apiFetch(`/conductor/tickets?tripId=${tripId}`),

  scanTicket: (data: { qrCode: string; tripId: string }) =>
    apiFetch("/conductor/tickets/scan", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===== DTO Types (matching backend entities) =====

export interface StopDTO {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  hasShelter: boolean;
  routes: { id: string; code: string; name: string; color: string }[];
}

export interface RouteDTO {
  id: string;
  code: string;
  name: string;
  fromStop: string;
  toStop: string;
  stops: { id: string; name: string; code: string; order: number }[];
  fare: number;
  monthlyPassPrice: number;
  frequencyMinutes: number;
  color: string;
  active: boolean;
  firstTrip: string;
  lastTrip: string;
}

export interface TicketDashboardDTO {
  currentRegistration: {
    id: string;
    routeId: string;
    routeCode: string;
    routeName: string;
    boardingStop: string;
    alightingStop: string;
    status: string;
  } | null;
  activeMonthlyPass: MonthlyPassDTO | null;
  recentPayments: PaymentDTO[];
  recentInvoices: InvoiceDTO[];
}

export interface MonthlyPassDTO {
  id: string;
  routeId: string;
  routeCode: string;
  month: string;
  qrCode: string;
  originalAmount: number;
  subsidyAmount: number;
  finalAmount: number;
  status: string;
  validFrom: string;
  validUntil: string;
}

export interface PaymentDTO {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

export interface InvoiceDTO {
  id: string;
  invoiceCode: string;
  originalAmount: number;
  subsidyAmount: number;
  finalAmount: number;
  description: string;
  status: string;
  createdAt: string;
}

export interface TravelHistoryDTO {
  id: string;
  tripDate: string;
  routeCode: string;
  routeName: string;
  departTime: string;
  arriveTime: string;
  fare: number;
  status: string;
}

// ===== Export default =====

export const api = {
  auth: authApi,
  student: studentApi,
  conductor: conductorApi,
};
