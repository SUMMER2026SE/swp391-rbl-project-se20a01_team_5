"use client";

export const API_BASE = "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";
const STUDENT_VERIFICATION_STATUS_KEY = "student_verification_status";

type QueryValue = string | number | boolean | null | undefined;

export type BackendRole =
  | "STUDENT"
  | "DRIVER"
  | "CONDUCTOR"
  | "DISPATCHER"
  | "ADMIN"
  | "UNIVERSITY_ADMIN";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("unibus_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("unibus_refresh_token");
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ROLE_KEY);
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

function buildQuery(params?: Record<string, QueryValue>) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function readPayload(res: Response) {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, options, false);
    clearTokens();
  }

  const payload = await readPayload(res);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.message || payload?.error || res.statusText || "Request failed",
      payload?.data
    );
  }

  return (payload?.data ?? payload) as T;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const data = await request<TokenPair>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }, false);
      setTokens(data.accessToken, data.refreshToken, data.role, data.studentVerificationStatus);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export const apiFetch = {
  get: <T>(path: string, query?: Record<string, QueryValue>) => request<T>(`${path}${buildQuery(query)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body === undefined ? undefined : JSON.stringify(body) }),
  form: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
};

export interface TokenPair {
  tokenType?: string;
  accessToken: string;
  refreshToken: string;
  role?: BackendRole;
  studentVerificationStatus?: string;
}

export const authApi = {
  registerOtp: (email: string) => apiFetch.post<void>("/auth/register/otp", { email }),
  register: (data: { name: string; email: string; password: string; otp: string }) =>
    apiFetch.post("/auth/register", {
      email: data.email,
      otp: data.otp,
      password: data.password,
      fullName: data.name,
    }),
  login: (email: string, password: string) =>
    apiFetch.post<TokenPair>("/auth/login", { email, password, device: "web" }),
  googleLogin: (payload: { idToken?: string; accessToken?: string }) =>
    apiFetch.post<TokenPair>("/auth/oauth/google", { ...payload, device: "web" }),
  refresh: (refreshToken: string) => apiFetch.post<TokenPair>("/auth/refresh", { refreshToken }),
  logout: () => apiFetch.post<void>("/auth/logout"),
  forgotPasswordOtp: (email: string) => apiFetch.post<void>("/auth/forgot-password/otp", { email }),
  forgotPasswordReset: (data: { email: string; otp: string; newPassword: string }) =>
    apiFetch.post<void>("/auth/forgot-password/reset", data),
};

export interface UserProfile {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role: BackendRole;
  status: string;
  studentVerificationStatus?: string;
  hasPassword: boolean;
}

export const profileApi = {
  me: () => apiFetch.get<UserProfile>("/users/me/profile"),
  update: (data: Partial<Pick<UserProfile, "email" | "fullName" | "phoneNumber" | "address" | "avatarUrl">>) =>
    apiFetch.patch<UserProfile>("/users/me/profile", data),
  changePassword: (data: { currentPassword?: string; newPassword: string; confirmPassword: string }) =>
    apiFetch.patch<void>("/users/me/password", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.set("avatar", file);
    return apiFetch.form<UserProfile>("/users/me/avatar", form);
  },
};

export interface StopDTO {
  stopId: number;
  stopName: string;
  address?: string;
  longitude?: number | string;
  latitude?: number | string;
  routes?: { routeId: number; routeName: string }[];
}

export interface RouteSuggestionDTO {
  routeId: number;
  routeName: string;
  distanceKm?: number | string;
  estimatedMinutes?: number;
  stops?: { stopId: number; stopName: string; stopOrder: number; minutesFromPreviousStop?: number }[];
}

export interface EtaDTO {
  tripId?: number;
  busId?: number;
  stopId?: number;
  estimatedArrivalAt?: string;
  actualArrivalAt?: string;
  updatedAt?: string;
}

export const transportApi = {
  stops: () => apiFetch.get<StopDTO[]>("/stops"),
  searchRoutes: (boardingStopId: number | string, alightingStopId: number | string) =>
    apiFetch.get<RouteSuggestionDTO[]>("/routes/search", { boardingStopId, alightingStopId }),
  route: (routeId: number | string) => apiFetch.get<RouteSuggestionDTO>(`/routes/${routeId}`),
  eta: (routeId: number | string, stopId: number | string) =>
    apiFetch.get<EtaDTO>(`/routes/${routeId}/stops/${stopId}/eta`),
};

export interface StudentProfile extends UserProfile {
  studentCode?: string;
  university?: string;
  universityId?: number;
  faculty?: string;
  academicYear?: number;
  dateOfBirth?: string;
}

export interface RegistrationDTO {
  registrationId: number;
  routeId: number;
  routeName: string;
  boardingStopId: number;
  boardingStopName: string;
  alightingStopId: number;
  alightingStopName: string;
  effectiveDate?: string;
  status: string;
  registeredAt?: string;
}

export interface TicketView {
  ticketId: number;
  ticketType: string;
  routeId: number;
  routeName: string;
  boardingStopName?: string;
  alightingStopName?: string;
  effectiveMonth?: number;
  effectiveYear?: number;
  validFrom?: string;
  expiresAt?: string;
  fareAmount?: number;
  originalFareAmount?: number;
  subsidyAmount?: number;
  finalFareAmount?: number;
  qrCode?: string;
  status: string;
  purchasedAt?: string;
}

export interface PaymentView {
  paymentId: number;
  ticketId?: number;
  amount?: number;
  originalAmount?: number;
  subsidyAmount?: number;
  finalAmount?: number;
  method?: string;
  status?: string;
  transactionCode?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  createdAt?: string;
}

export interface PassesDashboard {
  tickets: TicketView[];
  payments: PaymentView[];
  monthlyPassQuote?: {
    routeId: number;
    routeName: string;
    baseAmount?: number;
    originalFareAmount?: number;
    subsidyAmount?: number;
    payableAmount?: number;
    finalFareAmount?: number;
    subsidyStatus?: string;
  } | null;
}

export interface TravelHistoryView {
  travelHistoryId: number;
  tripId: number;
  routeId: number;
  routeName: string;
  serviceDate?: string;
  boardedAt?: string;
  alightedAt?: string;
  boardingStopName?: string;
  alightingStopName?: string;
}

export interface VerificationView {
  verificationId: number;
  userId: number;
  email: string;
  fullName: string;
  status: string;
  university?: string;
  universityId?: number;
  studentCode?: string;
  cardImageUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export const studentApi = {
  profile: () => apiFetch.get<StudentProfile>("/students/me/profile"),
  updateProfile: (data: Partial<StudentProfile>) => apiFetch.patch<StudentProfile>("/students/me/profile", data),
  verification: () => apiFetch.get<VerificationView>("/students/me/verification"),
  submitVerification: (data: { university: string; studentCode: string; cardImage: File }) => {
    const form = new FormData();
    form.set("university", data.university);
    form.set("studentCode", data.studentCode);
    form.set("cardImage", data.cardImage);
    return apiFetch.form<VerificationView>("/students/me/verification", form);
  },
  currentRegistration: () => apiFetch.get<RegistrationDTO>("/students/me/route-registrations/current"),
  registerRoute: (data: { routeId: number; boardingStopId: number; alightingStopId: number; effectiveDate?: string }) =>
    apiFetch.post<RegistrationDTO>("/students/me/route-registrations", data),
  updateRegistration: (registrationId: number, data: { routeId: number; boardingStopId: number; alightingStopId: number; effectiveDate?: string }) =>
    apiFetch.put<RegistrationDTO>(`/students/me/route-registrations/${registrationId}`, data),
  cancelRegistration: (registrationId: number, reason?: string) =>
    apiFetch.delete<void>(`/students/me/route-registrations/${registrationId}`, reason ? { reason } : undefined),
  tickets: () => apiFetch.get<PassesDashboard>("/students/me/tickets"),
  purchaseMonthlyPass: (method = "E_WALLET") =>
    apiFetch.post<TicketView>("/students/me/tickets/monthly-pass", { method }),
  payments: () => apiFetch.get<PaymentView[]>("/students/me/payments"),
  travelHistory: (page = 0, size = 20) => apiFetch.get<TravelHistoryView[]>("/students/me/travel-history", { page, size }),
};

export interface NotificationView {
  notificationId: number;
  title: string;
  content: string;
  target?: string;
  routeId?: number;
  senderName?: string;
  read: boolean;
  createdAt?: string;
}

export const notificationApi = {
  mine: () => apiFetch.get<NotificationView[]>("/notifications/me"),
  unreadCount: () => apiFetch.get<number>("/notifications/me/unread-count"),
  markRead: (notificationId: number) => apiFetch.post<void>(`/notifications/${notificationId}/read`),
  create: (data: { title: string; content: string; target?: string }) => apiFetch.post<NotificationView>("/notifications", data),
};

export interface FeedbackView {
  feedbackId: number;
  studentCode?: string;
  studentName?: string;
  tripId?: number;
  routeId?: number;
  routeName?: string;
  rating?: number;
  category?: string;
  content: string;
  status: string;
  response?: string;
  handlerName?: string;
  handledAt?: string;
  createdAt?: string;
}

export const feedbackApi = {
  mine: () => apiFetch.get<FeedbackView[]>("/students/me/feedback"),
  create: (data: { tripId?: number; routeId?: number; rating?: number; category?: string; content: string }) =>
    apiFetch.post<FeedbackView>("/students/me/feedback", data),
  all: (status?: string) => apiFetch.get<FeedbackView[]>("/feedback", { status }),
  resolve: (feedbackId: number, response?: string) =>
    apiFetch.patch<FeedbackView>(`/feedback/${feedbackId}/resolve`, { response }),
};

export interface TripStopView {
  routeStopId?: number;
  stopId: number;
  stopName: string;
  stopOrder: number;
  minutesFromPreviousStop?: number;
}

export interface DriverTripView {
  scheduleId?: number;
  tripId: number;
  routeId: number;
  routeName: string;
  busId?: number;
  licensePlate?: string;
  conductorName?: string;
  conductorPhone?: string;
  driverName?: string;
  driverPhone?: string;
  serviceDate?: string;
  departureTime?: string;
  departedAt?: string;
  endedAt?: string;
  status: string;
  stops?: TripStopView[];
}

export interface ConductorTicketView {
  ticketKind: string;
  ticketId: number;
  qrCode: string;
  studentCode?: string;
  studentName?: string;
  routeId?: number;
  routeName?: string;
  boardingStopName?: string;
  alightingStopName?: string;
  status: string;
  validFrom?: string;
  expiresAt?: string;
  lastScannedAt?: string;
}

export interface TicketScanResult {
  valid: boolean;
  message: string;
  ticket?: ConductorTicketView;
  travelHistoryId?: number;
}

export interface ScheduleDashboard {
  serviceDate: string;
  shifts: {
    scheduleId?: number;
    tripId?: number;
    routeId?: number;
    routeName?: string;
    busId?: number;
    licensePlate?: string;
    driverName?: string;
    conductorName?: string;
    weekdayNumber?: number;
    departureTime?: string;
    time?: string;
    status?: string;
  }[];
  drivers: { staffId: number; userId: number; fullName: string; role: string; status: string }[];
  conductors: { staffId: number; userId: number; fullName: string; role: string; status: string }[];
  buses: { busId: number; licensePlate: string; seatCount?: number; busType?: string; status: string }[];
  routes: { routeId: number; routeName: string }[];
}

export interface LiveFleetVehicle {
  tripId: number;
  routeId: number;
  routeName: string;
  busId?: number;
  licensePlate?: string;
  driverName?: string;
  conductorName?: string;
  serviceDate?: string;
  departureTime?: string;
  status: string;
  longitude?: number;
  latitude?: number;
  speedKmh?: number;
  locationUpdatedAt?: string;
}

export const operationsApi = {
  driverTrips: (date?: string) => apiFetch.get<DriverTripView[]>("/driver/trips", { date }),
  startTrip: (tripId: number) => apiFetch.post<DriverTripView>(`/driver/trips/${tripId}/start`),
  endTrip: (tripId: number) => apiFetch.post<DriverTripView>(`/driver/trips/${tripId}/end`),
  updateLocation: (tripId: number, data: { longitude: number; latitude: number; speedKmh?: number }) =>
    apiFetch.post<void>(`/driver/trips/${tripId}/location`, data),
  conductorTrips: (date?: string) => apiFetch.get<DriverTripView[]>("/conductor/trips", { date }),
  conductorTickets: (tripId: number) => apiFetch.get<ConductorTicketView[]>("/conductor/tickets", { tripId }),
  scanTicket: (tripId: number, qrCode: string) => apiFetch.post<TicketScanResult>("/conductor/tickets/scan", { tripId, qrCode }),
  scheduleDashboard: (date?: string) => apiFetch.get<ScheduleDashboard>("/coordinator/schedules", { date }),
  liveFleet: (date?: string) => apiFetch.get<LiveFleetVehicle[]>("/coordinator/fleet/live", { date }),
};

export interface AdminUserView {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  status: string;
  lockReason?: string;
  staffCode?: string;
  licenseNumber?: string;
  createdAt?: string;
}

export const adminApi = {
  users: (params?: { role?: string; status?: string; search?: string }) => apiFetch.get<AdminUserView[]>("/admin/users", params),
  user: (userId: number) => apiFetch.get<AdminUserView>(`/admin/users/${userId}`),
  updateUserStatus: (userId: number, data: { status: "ACTIVE" | "LOCKED"; lockReason?: string }) =>
    apiFetch.put<AdminUserView>(`/admin/users/${userId}/status`, data),
  createStaff: (data: {
    fullName: string;
    email: string;
    password: string;
    role: "DRIVER" | "CONDUCTOR" | "DISPATCHER" | "ADMIN";
    employeeCode?: string;
    licenseNumber?: string;
    phoneNumber?: string;
  }) => apiFetch.post<AdminUserView>("/admin/users", data),
  verifications: (status?: string) => apiFetch.get<VerificationView[]>("/admin/student-verifications", { status }),
  approveVerification: (verificationId: number, reason?: string) =>
    apiFetch.post<VerificationView>(`/admin/student-verifications/${verificationId}/approve`, { reason }),
  rejectVerification: (verificationId: number, reason?: string) =>
    apiFetch.post<VerificationView>(`/admin/student-verifications/${verificationId}/reject`, { reason }),
  requestResubmission: (verificationId: number, reason?: string) =>
    apiFetch.post<VerificationView>(`/admin/student-verifications/${verificationId}/request-resubmission`, { reason }),
};

export const universityApi = {
  daNang: () => apiFetch.get<string[]>("/universities/da-nang"),
};

export const api = {
  auth: authApi,
  profile: profileApi,
  transport: transportApi,
  student: studentApi,
  notifications: notificationApi,
  feedback: feedbackApi,
  operations: operationsApi,
  admin: adminApi,
  universities: universityApi,
};
