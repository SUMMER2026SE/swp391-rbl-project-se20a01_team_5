"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

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


const normalizedStatus = (status?: string | null) => status?.trim().toLowerCase() ?? "";

export const isPaidStatus = (status?: string | null) => normalizedStatus(status) === "paid";
export const isUnpaidStatus = (status?: string | null) => normalizedStatus(status) === "unpaid";
export const isCancelledStatus = (status?: string | null) => normalizedStatus(status) === "cancelled";
export const isRefundedStatus = (status?: string | null) => normalizedStatus(status) === "refunded";

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

async function requestBlob(path: string, retry = true): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return requestBlob(path, false);
    clearTokens();
  }

  if (!res.ok) {
    const payload = await readPayload(res);
    throw new ApiError(
      res.status,
      payload?.message || payload?.error || res.statusText || "Request failed",
      payload?.data
    );
  }
  return res.blob();
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
  blob: (path: string) => requestBlob(path),
};

export interface TokenPair {
  tokenType?: string;
  accessToken: string;
  refreshToken: string;
  role?: BackendRole;
  studentVerificationStatus?: string;
  universityId?: number;
  universityName?: string;
  universityLinkStatus?: string;
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
  stopCode?: string;
  stopName: string;
  address?: string;
  longitude?: number | string;
  latitude?: number | string;
  hasShelter?: boolean;
  routes?: { routeId: number; routeName: string; routeCode?: string; colorHex?: string }[];
}

export interface RouteSuggestionDTO {
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  distanceKm?: number | string;
  estimatedMinutes?: number;
  frequencyMin?: number;
  singleFare?: number;
  monthlyFare?: number;
  firstTrip?: string;
  lastTrip?: string;
  universityLinked?: boolean;
  stops?: {
    stopId: number;
    stopCode?: string;
    stopName: string;
    stopOrder: number;
    minutesFromPreviousStop?: number;
    longitude?: number | string;
    latitude?: number | string;
    hasShelter?: boolean;
  }[];
}

export interface RouteDirectionDTO {
  direction: number;
  stopCount: number;
  firstStopName?: string;
  lastStopName?: string;
}

export interface RouteLookupDTO {
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  distanceKm?: number | string;
  estimatedMinutes?: number;
  frequencyMin?: number;
  singleFare?: number | string;
  monthlyFare?: number | string;
  firstTrip?: string;
  lastTrip?: string;
  stopCount?: number;
  directions?: number[];
  universityLinked?: boolean;
  interregional?: boolean;
  externalSource?: string;
}

export interface EtaDTO {
  tripId?: number;
  busId?: number;
  stopId?: number;
  estimatedArrivalAt?: string;
  actualArrivalAt?: string;
  updatedAt?: string;
  // UX refactor extensions — backend may return these for richer journey UX.
  // Marked optional so existing callers don't break if backend omits them.
  busPlate?: string;
  driverName?: string;
  occupancy?: number;
  capacity?: number;
  speedKmh?: number;
}

export interface CoordinateDTO {
  latitude?: number | string;
  longitude?: number | string;
}

export interface PlaceSuggestionDTO {
  id: string;
  type: "STOP" | "ADDRESS" | string;
  label: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  stopId?: number;
  distanceMeters?: number;
  routes?: { routeId: number; routeName: string; routeCode?: string; colorHex?: string }[];
}

export interface JourneyPlacePointDTO {
  placeId?: string;
  stopId?: number;
  label?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export interface JourneySearchRequestDTO {
  origin: JourneyPlacePointDTO;
  destination: JourneyPlacePointDTO;
  maxBusLegs?: number;
  departAt?: string;
}

export interface JourneyStopDTO {
  stopId: number;
  stopName: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  stopOrder?: number;
  stationDirection?: number;
  etaMinutes?: number;
  transfer?: boolean;
}

export interface JourneyLegDTO {
  legId: string;
  mode: "WALK" | "BUS" | string;
  routeId?: number;
  routeCode?: string;
  routeName?: string;
  colorHex?: string;
  fromStopId?: number;
  fromStopName?: string;
  toStopId?: number;
  toStopName?: string;
  stopCount?: number;
  durationMinutes?: number;
  waitMinutes?: number;
  distanceKm?: number | string;
  fare?: number | string;
  nextDepartureAt?: string;
  estimatedArrivalAt?: string;
  stops?: JourneyStopDTO[];
  shape?: CoordinateDTO[];
  universityLinked?: boolean;
}

export interface JourneyOptionDTO {
  optionId: string;
  summary: {
    totalMinutes: number;
    walkMinutes?: number;
    waitMinutes?: number;
    walkMeters?: number | string;
    busDistanceKm?: number | string;
    transferCount: number;
    singleFare?: number | string;
    monthlyFare?: number | string;
    firstEtaText?: string;
    confidence?: string;
  };
  legs: JourneyLegDTO[];
  routeBadges?: { routeId: number; routeName: string; routeCode?: string; colorHex?: string }[];
  primaryAction?: {
    type: string;
    label: string;
    enabled: boolean;
    reason?: string;
    routeId?: number;
    boardingStopId?: number;
    alightingStopId?: number;
    subsidyEligible?: boolean;
    universityLinked?: boolean;
    fullPriceAllowed?: boolean;
    availabilityStatus?: string;
    availabilityMessage?: string;
  };
  secondaryActions?: {
    type: string;
    label: string;
    enabled: boolean;
    reason?: string;
    routeId?: number;
    boardingStopId?: number;
    alightingStopId?: number;
  }[];
  polylines?: { legId: string; mode: string; colorHex?: string; points: CoordinateDTO[] }[];
  stops?: JourneyStopDTO[];
}

export interface JourneyTrackingSnapshotDTO {
  journeyId: string;
  updatedAt?: string;
  routeId?: number;
  routeCode?: string;
  routeName?: string;
  boardingStopId?: number;
  alightingStopId?: number;
  simulated?: boolean;
  vehicles?: {
    vehicleId: string;
    plateNumber?: string;
    routeId?: number;
    routeCode?: string;
    latitude?: number | string;
    longitude?: number | string;
    speedKmh?: number | string;
    occupancy?: number;
    capacity?: number;
    nextStopId?: number;
    nextStopName?: string;
    etaMinutes?: number;
    distanceMeters?: number;
  }[];
  stopEtas?: {
    stopId: number;
    stopName: string;
    routeId?: number;
    routeCode?: string;
    estimatedArrivalAt?: string;
    minutesAway?: number;
  }[];
  stops?: {
    stopId: number;
    stopName: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
    stopOrder?: number;
    boarding?: boolean;
    alighting?: boolean;
  }[];
  polylines?: { legId: string; mode: string; colorHex?: string; points: CoordinateDTO[] }[];
}

export interface RouteMapPreviewDTO {
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  distanceKm?: number | string;
  estimatedMinutes?: number;
  frequencyMin?: number;
  singleFare?: number | string;
  monthlyFare?: number | string;
  firstTrip?: string;
  lastTrip?: string;
  universityLinked?: boolean;
  interregional?: boolean;
  externalSource?: string;
  direction: number;
  directions?: RouteDirectionDTO[];
  stops?: JourneyStopDTO[];
  polylines?: { legId: string; mode: string; colorHex?: string; points: CoordinateDTO[] }[];
}

export const transportApi = {
  stops: () => apiFetch.get<StopDTO[]>("/stops"),
  routes: () => apiFetch.get<RouteLookupDTO[]>("/routes"),
  routePreview: (routeId: number | string, direction?: number) =>
    apiFetch.get<RouteMapPreviewDTO>(`/routes/${routeId}/preview`, { direction }),
  searchPlaces: (q: string, lat?: number, lng?: number, limit = 8) =>
    apiFetch.get<PlaceSuggestionDTO[]>("/places/search", { q, lat, lng, limit }),
  reversePlace: (lat: number, lng: number) =>
    apiFetch.get<{ label: string; address?: string; latitude?: number | string; longitude?: number | string; nearestStopId?: number; nearestStopName?: string; distanceMeters?: number }>("/places/reverse", { lat, lng }),
  searchJourneys: (data: JourneySearchRequestDTO) =>
    apiFetch.post<JourneyOptionDTO[]>("/journeys/search", data),
  trackJourney: (journeyId: string) =>
    apiFetch.get<JourneyTrackingSnapshotDTO>(`/tracking/journeys/${encodeURIComponent(journeyId)}`),
  trackRoute: (routeId: number | string, params?: { boardingStopId?: number | string; alightingStopId?: number | string }) =>
    apiFetch.get<JourneyTrackingSnapshotDTO>(`/tracking/routes/${encodeURIComponent(String(routeId))}`, {
      boardingStopId: params?.boardingStopId,
      alightingStopId: params?.alightingStopId,
    }),
  searchRoutes: (boardingStopId: number | string, alightingStopId: number | string) =>
    apiFetch.get<RouteSuggestionDTO[]>("/routes/search", { boardingStopId, alightingStopId }),
  route: (routeId: number | string) => apiFetch.get<RouteSuggestionDTO>(`/routes/${routeId}`),
  eta: (routeId: number | string, stopId: number | string) =>
    apiFetch.get<EtaDTO[]>(`/routes/${routeId}/stops/${stopId}/eta`),
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


export interface SingleTripTicketView {
  ticketId: number;
  routeId: number;
  routeName: string;
  boardingStopId?: number;
  boardingStopName?: string;
  alightingStopId?: number;
  alightingStopName?: string;
  originalFareAmount?: number;
  subsidyAmount?: number;
  finalFareAmount?: number;
  qrCode?: string;
  status: string;
  purchasedAt?: string;
  expiresAt?: string;
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
  verificationId?: number;
  userId: number;
  email: string;
  fullName: string;
  status: string;
  university?: string;
  universityId?: number;
  studentCode?: string;
  cardImageUrl?: string;
  ocrFullName?: string;
  ocrStudentCode?: string;
  ocrUniversity?: string;
  ocrRawText?: string;
  ocrConfidenceScore?: number;
  rejectionReason?: string;
  reviewerUserId?: number;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface StudentUniversityView {
  universityId?: number;
  universityName?: string;
  shortName?: string;
  studentCode?: string;
  rosterStatus?: string;
  linkStatus?: string;
  domainHint?: string;
  studentVerificationStatus?: string;
}

export const studentApi = {
  profile: () => apiFetch.get<StudentProfile>("/students/me/profile"),
  university: () => apiFetch.get<StudentUniversityView>("/students/me/university"),
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
  registrations: () => apiFetch.get<RegistrationDTO[]>("/students/me/route-registrations"),
  registerRoute: (data: { routeId: number; boardingStopId: number; alightingStopId: number; effectiveDate?: string }) =>
    apiFetch.post<RegistrationDTO>("/students/me/route-registrations", data),
  updateRegistration: (registrationId: number, data: { routeId: number; boardingStopId: number; alightingStopId: number; effectiveDate?: string }) =>
    apiFetch.put<RegistrationDTO>(`/students/me/route-registrations/${registrationId}`, data),
  cancelRegistration: (registrationId: number, reason?: string) =>
    apiFetch.delete<void>(`/students/me/route-registrations/${registrationId}`, reason ? { reason } : undefined),
  tickets: () => apiFetch.get<PassesDashboard>("/students/me/tickets"),
  purchaseMonthlyPass: (method = "E_WALLET", routeId?: number) =>
    apiFetch.post<TicketView>("/students/me/tickets/monthly-pass", { method, routeId }),
  purchaseJourneyMonthlyPass: (data: {
    originLabel: string;
    destinationLabel: string;
    method?: string;
    legs: { routeId: number; boardingStopId?: number; alightingStopId?: number; legOrder?: number }[];
  }) =>
    apiFetch.post<{
      journeyOrderId: number;
      originLabel: string;
      destinationLabel: string;
      totalAmount: number | string;
      subsidyAmount: number | string;
      finalAmount: number | string;
      qrCode: string;
      status: string;
      purchasedAt?: string;
      items?: {
        itemId: number;
        monthlyPassId: number;
        routeId: number;
        routeName: string;
        legOrder: number;
        boardingStopId?: number;
        boardingStopName?: string;
        alightingStopId?: number;
        alightingStopName?: string;
        originalAmount?: number | string;
        subsidyAmount?: number | string;
        finalAmount?: number | string;
      }[];
    }>("/students/me/tickets/journey-monthly-pass", data),
  singleTripTickets: () => apiFetch.get<SingleTripTicketView[]>("/students/me/tickets/single-trip"),
  ticketQuote: (routeId: number | string, ticketType = "MONTHLY") =>
    apiFetch.get<PassesDashboard["monthlyPassQuote"]>("/students/me/tickets/quote", { routeId, ticketType }),
  payments: () => apiFetch.get<PaymentView[]>("/students/me/payments"),
  createSePayOrder: (ticketType: string, routeId?: number) =>
    apiFetch.post<{ orderId: number; routeId?: number; routeName?: string; qrUrl: string; amount: number; description: string; bankCode: string; accountNo: string; accountName: string }>("/students/me/payments/sepay/order", { ticketType, routeId }),
  getSePayOrderStatus: (orderId: number) => apiFetch.get<{ orderId: number; ticketType: string; routeId?: number; total: number; amount?: number; description?: string; qrUrl?: string; bankCode?: string; accountNo?: string; accountName?: string; status: string; paid: boolean; paidAt?: string }>(`/students/me/payments/sepay/order/${orderId}/status`),
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

type CountResponse = number | { count?: number | string };

function normalizeCount(value: CountResponse | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value?.count === "number") return value.count;
  if (typeof value?.count === "string") return Number(value.count) || 0;
  return 0;
}

export const notificationApi = {
  mine: () => apiFetch.get<NotificationView[]>("/notifications/me"),
  unreadCount: async () => normalizeCount(await apiFetch.get<CountResponse>("/notifications/me/unread-count")),
  markRead: (notificationId: number) => apiFetch.post<void>(`/notifications/${notificationId}/read`),
  create: (data: { title: string; content: string; target?: string }) => apiFetch.post<NotificationView>("/notifications", data),
  createCoordinator: (data: { title: string; content: string; target?: string }) => apiFetch.post<NotificationView>("/coordinator/notifications", data),
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

export const coordinatorFeedbackApi = {
  all: (status?: string) => apiFetch.get<FeedbackView[]>("/coordinator/feedback", { status }),
  resolve: (feedbackId: number, response?: string) =>
    apiFetch.patch<FeedbackView>(`/coordinator/feedback/${feedbackId}/resolve`, { response }),
};

export interface ExperienceStopCard {
  stopId: number;
  stopCode?: string;
  stopName: string;
  address?: string;
  longitude?: number | string;
  latitude?: number | string;
  hasShelter?: boolean;
  routes?: { routeId: number; routeCode?: string; routeName: string; colorHex?: string }[];
}

export interface ExperienceRouteCard {
  routeId: number;
  routeCode?: string;
  routeName: string;
  fromStopName?: string;
  toStopName?: string;
  distanceKm?: number | string;
  estimatedMinutes?: number;
  frequencyMin?: number;
  singleFare?: number;
  monthlyFare?: number;
  colorHex?: string;
  firstTrip?: string;
  lastTrip?: string;
  universityLinked?: boolean;
  stops?: ExperienceStopCard[];
}

export interface AiAction {
  type: string;
  label: string;
  routeId?: number;
  boardingStopId?: number;
  alightingStopId?: number;
}

export interface AiSource {
  type: string;
  label: string;
  detail?: string;
}

export interface AiTraceEvent {
  type: "tool.started" | "tool.completed" | string;
  tool?: string;
  label: string;
  detail?: string;
  status?: string;
  elapsedMs?: number;
}

export interface AiProviderStatus {
  provider?: string;
  modelId?: string;
  status?: string;
  errorCode?: string;
  message?: string;
}

export interface AiRouteSuggestionCard {
  routeId: number;
  routeCode?: string;
  routeName: string;
  score?: number;
  confidence?: number;
  reasons?: string[];
  stops?: {
    stopId: number;
    stopCode?: string;
    stopName: string;
    stopOrder: number;
    minutesFromPreviousStop?: number;
  }[];
  nextDepartures?: string[];
  singleFare?: number;
  monthlyFare?: number;
  subsidyAmount?: number;
  finalFare?: number;
  actions?: AiAction[];
}

export interface AiChatResponse {
  message: string;
  mode: "FAST_REPLY" | "TOOL_ASSISTED" | "ZAI" | "BEDROCK" | "PROVIDER_UNAVAILABLE" | "FALLBACK" | string;
  advisoryType: string;
  routeSuggestions?: AiRouteSuggestionCard[];
  actions?: AiAction[];
  sources?: AiSource[];
  sessionId?: string;
  traceEvents?: AiTraceEvent[];
  providerStatus?: AiProviderStatus;
}

export interface AiChatStreamEvent {
  type: string;
  message?: string;
  delta?: string;
  mode?: AiChatResponse["mode"];
  advisoryType?: string;
  routeSuggestions?: AiRouteSuggestionCard[];
  actions?: AiAction[];
  sources?: AiSource[];
  traceEvents?: AiTraceEvent[];
  providerStatus?: AiProviderStatus;
  sessionId?: string;
}

export interface ExperienceRegistrationCard {
  registrationId: number;
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  boardingStopName?: string;
  alightingStopName?: string;
  effectiveDate?: string;
  status?: string;
}

export interface ExperienceTicketCard {
  ticketId: number;
  ticketType: string;
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  boardingStopName?: string;
  alightingStopName?: string;
  originalFareAmount?: number;
  subsidyAmount?: number;
  finalFareAmount?: number;
  qrCode?: string;
  validFrom?: string;
  expiresOn?: string;
  expiresAt?: string;
  purchasedAt?: string;
  status: string;
}

export interface ExperienceTripCard {
  tripId: number;
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  busId?: number;
  licensePlate?: string;
  seatCount?: number;
  occupancy?: number;
  driverName?: string;
  conductorName?: string;
  serviceDate?: string;
  departureTime?: string;
  departedAt?: string;
  endedAt?: string;
  status: string;
  longitude?: number | string;
  latitude?: number | string;
  speedKmh?: number | string;
}

export interface ExperienceNotificationCard {
  notificationId: number;
  title: string;
  content: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

export interface ExperienceHistoryCard {
  travelHistoryId: number;
  tripId: number;
  routeCode?: string;
  routeName: string;
  boardingStopName?: string;
  alightingStopName?: string;
  boardedAt?: string;
  alightedAt?: string;
}

export interface ExperienceFeedbackCard {
  feedbackId: number;
  studentName?: string;
  routeCode?: string;
  routeName?: string;
  tripId?: number;
  rating?: number;
  category?: string;
  content: string;
  status: string;
  response?: string;
  createdAt?: string;
}

export interface ExperienceLostItemCard {
  lostItemReportId: number;
  reporterName?: string;
  tripId?: number;
  routeCode?: string;
  routeName?: string;
  itemDescription: string;
  status: string;
  notes?: string;
  reportedAt?: string;
}

export interface ExperienceSupportTicketCard {
  supportTicketId: number;
  title: string;
  content: string;
  supportType: string;
  status: string;
  response?: string;
  createdAt?: string;
  handledAt?: string;
}

export interface ExperienceIncidentCard {
  incidentId: number;
  tripId: number;
  routeCode?: string;
  routeName?: string;
  incidentType: string;
  description: string;
  status: string;
  resolution?: string;
  reportedAt?: string;
}

export interface ExperienceDashboardStat {
  label: string;
  value: number | string;
  unit?: string;
  tone?: string;
}

export interface StudentDashboardView {
  fullName: string;
  studentCode?: string;
  universityName?: string;
  verificationStatus?: string;
  registration?: ExperienceRegistrationCard | null;
  activeTicket?: ExperienceTicketCard | null;
  nextTrip?: ExperienceTripCard | null;
  routes: ExperienceRouteCard[];
  stops: ExperienceStopCard[];
  notifications: ExperienceNotificationCard[];
  history: ExperienceHistoryCard[];
  stats: ExperienceDashboardStat[];
}

export interface DriverDashboardView {
  fullName: string;
  trips: ExperienceTripCard[];
  activeTrip?: ExperienceTripCard | null;
  feedback: ExperienceFeedbackCard[];
  stats: ExperienceDashboardStat[];
}

export interface AssistantDashboardView {
  fullName: string;
  trips: ExperienceTripCard[];
  activeTrip?: ExperienceTripCard | null;
  tickets: ExperienceTicketCard[];
  incidents: ExperienceIncidentCard[];
  lostItems: ExperienceLostItemCard[];
  stats: ExperienceDashboardStat[];
}

export interface CoordinatorDashboardView {
  liveFleet: ExperienceTripCard[];
  routes: ExperienceRouteCard[];
  stops: ExperienceStopCard[];
  feedback: ExperienceFeedbackCard[];
  stats: ExperienceDashboardStat[];
}

export interface AdminStatsView {
  stats: ExperienceDashboardStat[];
  routeMetrics: { routeCode?: string; routeName: string; colorHex?: string; trips: number; revenue: number }[];
  complaints: { complaintId: number; title: string; content: string; status: string; createdAt?: string }[];
  violations: { violationReportId: number; reporterName?: string; reportedName?: string; content: string; status: string; submittedAt?: string }[];
  fares: { fareId: number; routeId: number; routeCode?: string; routeName: string; fareType: string; amount: number; effectiveFrom?: string; effectiveUntil?: string; notes?: string }[];
  revenueSeries: { day: string; date: string; revenue: number }[];
  tripsSeries: { day: string; date: string; trips: number }[];
  roleDistribution: { role: string; value: number }[];
}

export interface CoordinatorUniversityMetric {
  universityId: number;
  universityName: string;
  shortName?: string;
  colorHex?: string;
  routeCount: number;
  fleetCount: number;
  driverCount: number;
  studentCount: number;
  tripsToday: number;
}

export interface CoordinatorUniversityRouteMetric {
  routeId: number;
  routeCode?: string;
  routeName: string;
  colorHex?: string;
  registeredStudents: number;
  activeMonthlyPasses: number;
  tripsToday: number;
  runningTrips: number;
  assignedBuses: number;
  assignedDrivers: number;
  assignedConductors: number;
}

type AssistantChatPayload = {
  message: string;
  context?: {
    boardingStopId?: number;
    alightingStopId?: number;
    preferredDepartureTime?: string;
    preferences?: string[];
    conversationHistory?: {
      role: "user" | "assistant";
      content: string;
    }[];
  };
};

function parseSseChunk(chunk: string): AiChatStreamEvent | null {
  const lines = chunk.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (!dataLines.length) return null;
  try {
    const parsed = JSON.parse(dataLines.join("\n")) as AiChatStreamEvent;
    return { ...parsed, type: parsed.type || eventName };
  } catch {
    return { type: eventName, delta: dataLines.join("\n") };
  }
}

async function streamAssistantChat(
  data: AssistantChatPayload,
  onEvent: (event: AiChatStreamEvent) => void,
  signal?: AbortSignal
) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/students/me/assistant-chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok || !res.body) {
    const payload = await readPayload(res);
    throw new ApiError(
      res.status,
      payload?.message || payload?.error || res.statusText || "AI stream failed",
      payload?.data
    );
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let match = buffer.match(/\r?\n\r?\n/);
    while (match?.index != null) {
      const raw = buffer.slice(0, match.index).trim();
      buffer = buffer.slice(match.index + match[0].length);
      const event = raw ? parseSseChunk(raw) : null;
      if (event) onEvent(event);
      match = buffer.match(/\r?\n\r?\n/);
    }
  }
  const tail = buffer.trim();
  const event = tail ? parseSseChunk(tail) : null;
  if (event) onEvent(event);
}

export const experienceApi = {
  studentDashboard: () => apiFetch.get<StudentDashboardView>("/students/me/dashboard"),
  studentRouteSuggestions: () => apiFetch.get<ExperienceRouteCard[]>("/students/me/route-suggestions"),
  postRouteSuggestions: (data: {
    boardingStopId?: number;
    alightingStopId?: number;
    preferredDepartureTime?: string;
    preferences?: string[];
    naturalLanguageQuery?: string;
  }) => apiFetch.post<AiRouteSuggestionCard[]>("/students/me/route-suggestions", data),
  studentLostItems: () => apiFetch.get<ExperienceLostItemCard[]>("/students/me/lost-items"),
  createStudentLostItem: (data: { itemDescription: string; tripId?: number }) =>
    apiFetch.post<ExperienceLostItemCard>("/students/me/lost-items", data),
  studentSupportTickets: () => apiFetch.get<ExperienceSupportTicketCard[]>("/students/me/support-tickets"),
  createStudentSupportTicket: (data: { title: string; content: string; supportType?: string }) =>
    apiFetch.post<ExperienceSupportTicketCard>("/students/me/support-tickets", data),
  studentAssistantChat: () => apiFetch.get<{ chatHistoryId: number; role: string; content: string; sentAt?: string }[]>("/students/me/assistant-chat"),
  sendAssistantChat: (data: AssistantChatPayload) => apiFetch.post<AiChatResponse>("/students/me/assistant-chat", data),
  streamAssistantChat,
  driverDashboard: () => apiFetch.get<DriverDashboardView>("/driver/dashboard"),
  driverFeedback: () => apiFetch.get<ExperienceFeedbackCard[]>("/driver/feedback"),
  assistantDashboard: () => apiFetch.get<AssistantDashboardView>("/conductor/dashboard"),
  incidents: () => apiFetch.get<ExperienceIncidentCard[]>("/conductor/incidents"),
  createIncident: (data: { tripId: number; incidentType: string; description: string }) =>
    apiFetch.post<ExperienceIncidentCard>("/conductor/incidents", data),
  assistantLostItems: () => apiFetch.get<ExperienceLostItemCard[]>("/conductor/lost-items"),
  updateAssistantLostItem: (lostItemId: number, data: { status: string; notes?: string }) =>
    apiFetch.put<ExperienceLostItemCard>(`/conductor/lost-items/${lostItemId}`, data),
  coordinatorDashboard: () => apiFetch.get<CoordinatorDashboardView>("/coordinator/dashboard"),
  coordinatorByUniversity: () => apiFetch.get<CoordinatorUniversityMetric[]>("/coordinator/by-university"),
  coordinatorUniversityRoutes: (universityId: number) => apiFetch.get<CoordinatorUniversityRouteMetric[]>(`/coordinator/by-university/${universityId}/routes`),
  coordinatorFeedback: (status?: string) => apiFetch.get<ExperienceFeedbackCard[]>("/coordinator/feedback", { status }),
  adminStats: (days = 7) => apiFetch.get<AdminStatsView>("/admin/stats", { days }),
  fares: () => apiFetch.get<AdminStatsView["fares"]>("/admin/fares"),
  updateFare: (fareId: number, data: { amount: number; notes?: string }) =>
    apiFetch.put<AdminStatsView["fares"][number]>(`/admin/fares/${fareId}`, data),
  complaints: (status?: string) => apiFetch.get<AdminStatsView["complaints"]>("/admin/complaints", { status }),
  violations: (status?: string) => apiFetch.get<AdminStatsView["violations"]>("/admin/violations", { status }),
};

export interface ContactThreadCard {
  peerUserId: number;
  peerName: string;
  peerRole: string;
  lastMessageBody: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface InternalMessageCard {
  messageId: number;
  senderUserId: number;
  senderName: string;
  recipientUserId: number;
  recipientName: string;
  body: string;
  sentAt: string;
  readAt?: string | null;
}

export interface SendInternalMessageRequest {
  recipientUserId: number;
  body: string;
}

export const messagingApi = {
  getThreads: () => apiFetch.get<ContactThreadCard[]>("/me/messages/threads"),
  getConversation: (peerUserId: number) => apiFetch.get<InternalMessageCard[]>(`/me/messages/${peerUserId}`),
  sendMessage: (data: SendInternalMessageRequest) => apiFetch.post<{ messageId: number }>("/me/messages", data),
  markAsRead: (peerUserId: number) => apiFetch.post<void>(`/me/messages/${peerUserId}/read`),
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

export interface RouteOption {
  routeId: number;
  routeName: string;
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
    driverStaffId?: number;
    driverName?: string;
    conductorStaffId?: number;
    conductorName?: string;
    weekdayNumber?: number;
    departureTime?: string;
    time?: string;
    status?: string;
  }[];
  drivers: { staffId: number; userId: number; fullName: string; role: string; status: string }[];
  conductors: { staffId: number; userId: number; fullName: string; role: string; status: string }[];
  buses: { busId: number; licensePlate: string; seatCount?: number; busType?: string; status: string }[];
  routes: RouteOption[];
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
  occupancy?: number;
  locationUpdatedAt?: string;
}

export interface DriverContactView {
  type: "COORDINATOR" | "EMERGENCY";
  name: string;
  role: string;
  phone: string;
  email?: string;
}

export const operationsApi = {
  driverTrips: (date?: string) => apiFetch.get<DriverTripView[]>("/driver/trips", { date }),
  driverContacts: () => apiFetch.get<DriverContactView[]>("/driver/contacts"),
  startTrip: (tripId: number) => apiFetch.post<DriverTripView>(`/driver/trips/${tripId}/start`),
  endTrip: (tripId: number) => apiFetch.post<DriverTripView>(`/driver/trips/${tripId}/end`),
  updateLocation: (tripId: number, data: { longitude: number; latitude: number; speedKmh?: number; occupancy?: number }) =>
    apiFetch.post<void>(`/driver/trips/${tripId}/location`, data),
  conductorTrips: (date?: string) => apiFetch.get<DriverTripView[]>("/conductor/trips", { date }),
  conductorTickets: (tripId: number) => apiFetch.get<ConductorTicketView[]>("/conductor/tickets", { tripId }),
  scanTicket: (tripId: number, qrCode: string) => apiFetch.post<TicketScanResult>("/conductor/tickets/scan", { tripId, qrCode }),
  scheduleDashboard: (date?: string) => apiFetch.get<ScheduleDashboard>("/operations/schedules", { date }),
  saveSchedules: (data: { serviceDate: string; shifts: any[] }) => apiFetch.post<ScheduleDashboard>("/operations/schedules", data),
  deleteSchedule: (scheduleId: number, date?: string) => apiFetch.delete<void>(`/operations/schedules/${scheduleId}`, date ? { date } : undefined),
  liveFleet: (date?: string) => apiFetch.get<LiveFleetVehicle[]>("/coordinator/fleet/live", { date }),
};

export interface RouteListItem {
  id: number;
  routeName: string;
  description: string;
  estimatedMinutes: number;
  status: string;
}

export interface RouteStopDto {
  id: number;
  stopId: number;
  stopName: string;
  stopOrder: number;
  minutesFromPreviousStop: number;
}

export const coordinatorRoutesApi = {
  getRoutes: () => apiFetch.get<RouteListItem[]>("/coordinator/routes"),
  createRoute: (data: { routeName: string; description: string; estimatedMinutes: number }) =>
    apiFetch.post<RouteListItem>("/coordinator/routes", data),
  updateRoute: (routeId: number, data: { routeName: string; description: string; estimatedMinutes: number }) =>
    apiFetch.put<RouteListItem>(`/coordinator/routes/${routeId}`, data),
  getRouteStops: (routeId: number) => apiFetch.get<RouteStopDto[]>(`/coordinator/routes/${routeId}/stops`),
  addStop: (routeId: number, data: { stopId?: number; stopName: string; address?: string; longitude?: number; latitude?: number; stopOrder: number; minutesFromPreviousStop: number }) =>
    apiFetch.post<RouteStopDto>(`/coordinator/routes/${routeId}/stops`, data),
  updateStop: (routeId: number, stopId: number, data: { id: number; stopId?: number; stopName: string; stopOrder: number; minutesFromPreviousStop: number }) =>
    apiFetch.put<RouteStopDto>(`/coordinator/routes/${routeId}/stops/${stopId}`, data),
  deleteStop: (routeId: number, stopId: number) => apiFetch.delete<void>(`/coordinator/routes/${routeId}/stops/${stopId}`),
  deleteRoute: (routeId: number) => apiFetch.delete<void>(`/coordinator/routes/${routeId}`),
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

export interface UniversityView {
  universityId: number;
  code: string;
  name: string;
  shortName?: string;
  contactEmail?: string;
  status: string;
  campusCount: number;
  domainCount: number;
  rosterCount: number;
  createdAt?: string;
}

export interface CampusView {
  campusId: number;
  universityId: number;
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: string;
}

export interface DomainView {
  domainId: number;
  universityId: number;
  domain: string;
  status: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface UniversityAdminView {
  universityAdminId: number;
  universityId: number;
  universityName: string;
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  title?: string;
  status: string;
  assignedAt?: string;
}

export interface RosterStudentView {
  rosterId: number;
  universityId: number;
  email: string;
  studentCode: string;
  fullName: string;
  faculty?: string;
  academicYear?: number;
  status: string;
  matchedUserId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportErrorView {
  importErrorId: number;
  importBatchId: number;
  rowNumber: number;
  fieldName?: string;
  rawValue?: string;
  errorMessage: string;
}

export interface ImportBatchView {
  importBatchId: number;
  universityId: number;
  fileName: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  status: string;
  createdAt?: string;
  completedAt?: string;
  errors?: ImportErrorView[];
}

export interface RouteUniversityView {
  routeUniversityId: number;
  routeId: number;
  routeName: string;
  universityId: number;
  universityName: string;
  campusId?: number;
  campusName?: string;
  activeFrom?: string;
  activeUntil?: string;
  status: string;
}

export interface SubsidyPolicyView {
  subsidyPolicyId: number;
  universityId: number;
  universityName?: string;
  campusId?: number;
  campusName?: string;
  policyName: string;
  subsidyType: string;
  value: number;
  maxAmount?: number;
  activeFrom?: string;
  activeUntil?: string;
  status: string;
}

export interface UniversityStatsView {
  universityId: number;
  universityName: string;
  activeRosterStudents: number;
  matchedStudents: number;
  activeDomains: number;
  activeCampuses: number;
  activeRoutes: number;
  activeSubsidyPolicies: number;
  totalSubsidyAmount: number;
  monthlyPasses: number;
  passesByRoute: {
    routeId: number;
    routeCode?: string;
    routeName: string;
    colorHex?: string;
    passes: number;
  }[];
  tripsSeries: { day: string; date: string; trips: number }[];
  subsidyDistribution: {
    policyName: string;
    subsidyType: string;
    value: number;
    colorHex: string;
  }[];
}

export interface PaymentTransactionView {
  orderId: number;
  transactionId?: number;
  sepayTransactionId?: number;
  studentCode?: string;
  studentName?: string;
  universityId?: number;
  universityName?: string;
  ticketType?: string;
  orderMode?: string;
  ticketPeriod?: string;
  originLabel?: string;
  destinationLabel?: string;
  legsJson?: string;
  legsCount?: number;
  routeId?: number;
  routeName?: string;
  orderTotal?: number;
  originalAmount?: number;
  subsidyAmount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  gateway?: string;
  amountIn?: number;
  amountOut?: number;
  transactionContent?: string;
  referenceNumber?: string;
  transactionDate?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface ReconciliationView {
  universityId: number;
  universityName: string;
  totalOriginalAmount: number;
  totalSubsidyAmount: number;
  totalFinalAmount: number;
  totalOrders: number;
  journeyOrders: number;
  dayTickets: number;
  monthlyPasses: number;
  from?: string;
  to?: string;
}

export interface AuditLogView {
  auditLogId: number;
  performedByUserId: number;
  performerName?: string;
  universityId?: number;
  universityName?: string;
  action: string;
  affectedTable?: string;
  affectedRecordId?: string;
  result?: string;
  requestId?: string;
  notes?: string;
  performedAt?: string;
}

export const adminApi = {
  users: async (params?: { role?: string; status?: string; search?: string }) => {
    const res = await apiFetch.get<{ items: AdminUserView[] }>("/admin/users", { role: params?.role, status: params?.status, keyword: params?.search });
    return res.items || [];
  },
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
  universities: (params?: { keyword?: string; status?: string }) =>
    apiFetch.get<UniversityView[]>("/admin/universities", params),
  createUniversity: (data: { code: string; name: string; shortName?: string; contactEmail?: string; status?: string }) =>
    apiFetch.post<UniversityView>("/admin/universities", data),
  campuses: (universityId: number) => apiFetch.get<CampusView[]>(`/admin/universities/${universityId}/campuses`),
  createCampus: (universityId: number, data: { code: string; name: string; address?: string; latitude?: number; longitude?: number; status?: string }) =>
    apiFetch.post<CampusView>(`/admin/universities/${universityId}/campuses`, data),
  domains: (universityId: number) => apiFetch.get<DomainView[]>(`/admin/universities/${universityId}/domains`),
  createDomain: (universityId: number, data: { domain: string; status?: string }) =>
    apiFetch.post<DomainView>(`/admin/universities/${universityId}/domains`, data),
  universityAdmins: (universityId?: number) => apiFetch.get<UniversityAdminView[]>("/admin/university-admins", { universityId }),
  createUniversityAdmin: (data: { universityId: number; fullName: string; email: string; password: string; phoneNumber?: string; title?: string }) =>
    apiFetch.post<UniversityAdminView>("/admin/university-admins", data),
  routeUniversities: (universityId?: number) => apiFetch.get<RouteUniversityView[]>("/admin/route-universities", { universityId }),
  createRouteUniversity: (data: { routeId: number; universityId: number; campusId?: number; activeFrom?: string; activeUntil?: string; status?: string }) =>
    apiFetch.post<RouteUniversityView>("/admin/route-universities", data),
  subsidyPolicies: (universityId?: number) => apiFetch.get<SubsidyPolicyView[]>("/admin/subsidy-policies", { universityId }),
  createSubsidyPolicy: (data: { universityId: number; campusId?: number; policyName: string; subsidyType: string; value: number; maxAmount?: number; activeFrom?: string; activeUntil?: string; status?: string }) =>
    apiFetch.post<SubsidyPolicyView>("/admin/subsidy-policies", data),
  auditLogs: (params?: { universityId?: number; action?: string }) => apiFetch.get<AuditLogView[]>("/admin/audit-logs", params),
  paymentTransactions: (params?: { universityId?: number }) => apiFetch.get<PaymentTransactionView[]>("/admin/payment-transactions", params),
};

export const universityApi = {
  daNang: () => apiFetch.get<string[]>("/universities/da-nang"),
  profile: () => apiFetch.get<UniversityAdminView>("/university-admin/profile"),
  campuses: () => apiFetch.get<CampusView[]>("/university-admin/campuses"),
  createCampus: (data: { code: string; name: string; address?: string; latitude?: number; longitude?: number; status?: string }) =>
    apiFetch.post<CampusView>("/university-admin/campuses", data),
  domains: () => apiFetch.get<DomainView[]>("/university-admin/domains"),
  createDomain: (data: { domain: string; status?: string }) => apiFetch.post<DomainView>("/university-admin/domains", data),
  roster: (params?: { keyword?: string; status?: string }) => apiFetch.get<RosterStudentView[]>("/university-admin/roster", params),
  importRoster: (file: File) => {
    const form = new FormData();
    form.set("file", file);
    return apiFetch.form<ImportBatchView>("/university-admin/roster/import", form);
  },
  importBatches: () => apiFetch.get<ImportBatchView[]>("/university-admin/roster/import"),
  subsidyPolicies: () => apiFetch.get<SubsidyPolicyView[]>("/university-admin/subsidy-policies"),
  createSubsidyPolicy: (data: { campusId?: number; policyName: string; subsidyType: string; value: number; maxAmount?: number; activeFrom?: string; activeUntil?: string; status?: string }) =>
    apiFetch.post<SubsidyPolicyView>("/university-admin/subsidy-policies", data),
  stats: () => apiFetch.get<UniversityStatsView>("/university-admin/stats"),
  reconciliation: (params?: { from?: string; to?: string }) => apiFetch.get<ReconciliationView>("/university-admin/reconciliation", params),
  paymentTransactions: () => apiFetch.get<PaymentTransactionView[]>("/university-admin/payment-transactions"),
  notify: (data: { title: string; content: string }) => apiFetch.post<number>("/university-admin/notifications", data),
};

export interface DispatchMessageView {
  messageId: number;
  senderUserId: number;
  senderName: string;
  recipientUserId: number;
  recipientName: string;
  tripId?: number;
  content: string;
  read: boolean;
  sentAt?: string;
}

export interface DispatcherContact {
  dispatcherUserId: number;
  dispatcherName: string;
  phoneNumber?: string;
  department?: string;
  activeTripId?: number;
  messages: DispatchMessageView[];
}

export const driverDispatchApi = {
  contact: () => apiFetch.get<DispatcherContact>("/driver/dispatch/contact"),
  sendMessage: (data: { tripId?: number; content: string }) =>
    apiFetch.post<DispatchMessageView>("/driver/dispatch/messages", data),
  reportIncident: (data: { tripId: number; incidentType: string; description: string }) =>
    apiFetch.post<DispatchMessageView>("/driver/dispatch/incidents", data),
};

export interface ContactPersonView {
  userId: number;
  name: string;
  role: string;
  phoneNumber?: string;
  primary: boolean;
}

export interface InternalMessageView {
  messageId: number;
  senderUserId: number;
  senderName: string;
  recipientUserId: number;
  recipientName: string;
  tripId?: number;
  content: string;
  read: boolean;
  sentAt?: string;
}

export interface ConductorContactView {
  activeTripId?: number;
  routeName?: string;
  driverName?: string;
  driverPhone?: string;
  contacts: ContactPersonView[];
  messages: InternalMessageView[];
}

export interface ConductorSupportResult {
  type: string;
  reportId: number;
  message: string;
  notificationMessage?: InternalMessageView;
}

export const conductorApi = {
  contact: () => apiFetch.get<ConductorContactView>("/conductor/contact"),
  sendMessage: (data: { tripId?: number; recipientType: string; content: string }) =>
    apiFetch.post<InternalMessageView>("/conductor/messages", data),
  submitSupport: (data: { tripId: number; reportType: string; passengerName?: string; location?: string; description: string }) =>
    apiFetch.post<ConductorSupportResult>("/conductor/support", data),
};

export const api = {
  auth: authApi,
  profile: profileApi,
  transport: transportApi,
  student: studentApi,
  experience: experienceApi,
  notifications: notificationApi,
  feedback: feedbackApi,
  operations: operationsApi,
  admin: adminApi,
  universities: universityApi,
  messaging: messagingApi,
  driverDispatch: driverDispatchApi,
  conductor: conductorApi,
};

