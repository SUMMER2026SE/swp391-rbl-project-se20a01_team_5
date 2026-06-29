"use client";

/**
 * Prototype Data Adapter
 *
 * Maps real backend DTOs (from @/lib/api/client.ts) to prototype-shaped types
 * (from @/lib/types.ts). This lets the prototype-style UI modules (which
 * import from @/lib/mock-data) keep their original visual structure while
 * reading from real API endpoints.
 *
 * Strategy: each prototype module reads from hooks provided here, which
 * internally call the real API and map DTOs → prototype types.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AdminStatsView,
  AdminUserView,
  ApiError,
  CampusView,
  DomainView,
  DriverDashboardView,
  DriverTripView,
  ExperienceFeedbackCard,
  ExperienceIncidentCard,
  ExperienceLostItemCard,
  ExperienceRouteCard,
  ExperienceStopCard,
  ExperienceTicketCard,
  ExperienceTripCard,
  FeedbackView,
  ImportBatchView,
  NotificationView,
  PaymentTransactionView,
  ReconciliationView,
  RouteUniversityView,
  RosterStudentView,
  StudentDashboardView,
  StudentUniversityView,
  SubsidyPolicyView,
  UniversityAdminView,
  UniversityStatsView,
  UniversityView,
  VerificationView,
  isPaidStatus,
  isRefundedStatus,
  adminApi,
  experienceApi,
  feedbackApi,
  notificationApi,
  operationsApi,
  profileApi,
  studentApi,
  transportApi,
  universityApi,
  type UserProfile,
} from "@/lib/api/client";
import type {
  Bus,
  BusStop,
  Complaint,
  Feedback,
  Incident,
  Invoice,
  LostItem,
  Notification,
  Route,
  Trip,
  User,
} from "@/lib/types";

/* =========================================================================
   Helpers
   ========================================================================= */
export function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

const apiCache = new Map<string, unknown>();

/* =========================================================================
   Generic API hook — same shape as real-data.tsx useApiResource
   but with optional mapper.
   ========================================================================= */
export function useApi<T, R = T>(
  loader: () => Promise<T>,
  mapper?: (data: T) => R,
  deps: unknown[] = [],
  cacheKey?: string
): {
  data: R | null;
  raw: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const cached = cacheKey ? (apiCache.get(cacheKey) as T | undefined) : undefined;
  const [raw, setRaw] = useState<T | null>(cached ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const stableLoader = useCallback(loader, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    if (!raw) setLoading(true);
    setError(null);
    stableLoader()
      .then((d) => {
        if (!cancelled) {
          if (cacheKey) apiCache.set(cacheKey, d);
          setRaw(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stableLoader, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = raw && mapper ? mapper(raw) : ((raw as unknown) as R | null);
  return { data, raw, loading, error, reload };
}

/* =========================================================================
   Mappers: DTO → Prototype Type
   ========================================================================= */

export function mapRoute(r: ExperienceRouteCard): Route {
  return {
    id: String(r.routeId),
    code: r.routeCode || `R-${r.routeId}`,
    name: r.routeName,
    from: r.fromStopName || r.stops?.[0]?.stopName || "—",
    to: r.toStopName || r.stops?.[r.stops.length - 1]?.stopName || "—",
    stops: (r.stops || []).map((s) => String(s.stopId)),
    distanceKm: num(r.distanceKm),
    durationMin: num(r.estimatedMinutes),
    frequencyMin: num(r.frequencyMin),
    fare: num(r.singleFare),
    monthlyPass: num(r.monthlyFare),
    color: r.colorHex || "#14b8a6",
    active: true,
    firstTrip: r.firstTrip || "05:30",
    lastTrip: r.lastTrip || "20:30",
  };
}

export function mapStop(s: ExperienceStopCard): BusStop {
  return {
    id: String(s.stopId),
    name: s.stopName,
    code: s.stopCode || `S-${s.stopId}`,
    address: s.address || "",
    lat: num(s.latitude, 16.07),
    lng: num(s.longitude, 108.15),
    routes: (s.routes || []).map((r) => String(r.routeId)),
    hasShelter: !!s.hasShelter,
  };
}

export function mapTrip(t: ExperienceTripCard): Trip {
  return {
    id: String(t.tripId ?? ""),
    routeId: String(t.routeId ?? ""),
    routeName: t.routeName || undefined,
    routeCode: t.routeCode || undefined,
    busId: String(t.busId ?? ""),
    licensePlate: t.licensePlate || undefined,
    busPlate: t.licensePlate || undefined,
    rawStatus: t.status || undefined,
    driverId: "",
    assistantId: "",
    date: t.serviceDate || "",
    departTime: t.departureTime || "",
    arriveTime: t.endedAt || "",
    status: t.status === "RUNNING" ? "running" : t.status === "COMPLETED" ? "completed" : t.status === "CANCELLED" ? "cancelled" : "scheduled",
    passengerCount: num(t.occupancy),
    revenue: 0,
  };
}

export function mapBus(t: ExperienceTripCard): Bus {
  return {
    id: String(t.busId ?? 0),
    plate: t.licensePlate || "—",
    model: "Xe buýt",
    capacity: num(t.seatCount, 45),
    routeId: String(t.routeId),
    status: t.status === "RUNNING" ? "active" : "idle",
    lat: num(t.latitude, 16.07),
    lng: num(t.longitude, 108.15),
    speed: num(t.speedKmh),
    occupancy: num(t.occupancy),
    etaMin: 0,
  };
}

export function mapNotification(n: NotificationView | ExperienceFeedbackCard extends never ? never : any): Notification {
  if ("title" in n && "content" in n && "read" in n) {
    return {
      id: String(n.notificationId),
      title: n.title,
      body: n.content,
      type: (n.type || "info") as Notification["type"],
      read: !!n.read,
      createdAt: n.createdAt || "",
    };
  }
  return {
    id: String(n.notificationId ?? n.id ?? Math.random()),
    title: n.title || "Thông báo",
    body: n.content || "",
    type: "info",
    read: false,
    createdAt: n.createdAt || "",
  };
}

export function mapFeedback(f: FeedbackView | ExperienceFeedbackCard): Feedback {
  return {
    id: String(f.feedbackId),
    studentName: (f as any).studentName || (f as any).studentCode || "Sinh viên",
    routeCode: (f as any).routeCode || "",
    driverName: undefined,
    rating: num((f as any).rating, 5),
    category: ((f as any).category || "other") as Feedback["category"],
    content: f.content,
    status: f.status === "RESOLVED" ? "resolved" : f.status === "IN_PROGRESS" || f.status === "PROCESSING" ? "processing" : "new",
    response: (f as any).response,
    routeName: (f as any).routeName,
    tripId: (f as any).tripId,
    createdAt: (f as any).createdAt || "",
  };
}

export function mapLostItem(l: ExperienceLostItemCard): LostItem {
  return {
    id: String(l.lostItemReportId),
    studentName: l.reporterName || "Sinh viên",
    routeCode: l.routeCode || "",
    tripDate: "",
    item: l.itemDescription,
    description: l.notes || l.itemDescription,
    status: (l.status?.toLowerCase() as LostItem["status"]) || "reported",
    createdAt: l.reportedAt || "",
  };
}

export function mapIncident(i: ExperienceIncidentCard): Incident {
  return {
    id: String(i.incidentId),
    code: `INC-${i.incidentId}`,
    reporter: "",
    routeCode: i.routeCode || "",
    type: (i.incidentType?.toLowerCase() as Incident["type"]) || "other",
    severity: "medium",
    description: i.description,
    status: i.status === "CLOSED" ? "closed" : i.status === "INVESTIGATING" ? "investigating" : "open",
    createdAt: i.reportedAt || "",
  };
}

export function mapComplaint(c: { complaintId: number; title: string; content: string; status: string; createdAt?: string }): Complaint {
  return {
    id: String(c.complaintId),
    code: `CP-${c.complaintId}`,
    studentName: "Sinh viên",
    subject: c.title,
    category: "Khác",
    priority: "medium",
    status: c.status === "RESOLVED" ? "resolved" : c.status === "REJECTED" ? "rejected" : c.status === "PROCESSING" ? "processing" : "new",
    createdAt: c.createdAt || "",
    description: c.content,
  };
}

export function mapInvoice(p: PaymentTransactionView): Invoice {
  return {
    id: String(p.orderId),
    code: p.referenceNumber || `INV-${p.orderId}`,
    studentId: String(p.studentCode || p.studentName || ""),
    description: `${p.ticketType || "Vé tháng"} • ${p.routeName || ""}`.trim(),
    amount: num(p.orderTotal ?? p.amountIn),
    method: (p.gateway || "cash").toLowerCase() as Invoice["method"],
    status: isPaidStatus(p.paymentStatus) ? "paid" : isRefundedStatus(p.paymentStatus) ? "refunded" : "pending",
    date: p.paidAt || p.transactionDate || p.createdAt || "",
  };
}

export function mapVerification(v: VerificationView): User {
  return {
    id: String(v.userId),
    name: v.fullName,
    email: v.email,
    phone: "",
    avatar: v.fullName.trim().slice(0, 2).toUpperCase(),
    role: "student",
    studentId: v.studentCode,
    status: "active",
    createdAt: v.submittedAt || "",
    universityId: v.universityId ? String(v.universityId) : undefined,
    verificationStatus: (v.status as User["verificationStatus"]) || "PENDING",
  };
}

/* =========================================================================
   Composite hooks — pull all data a module needs.
   ========================================================================= */

/**
 * Student module: PERFORMANCE-OPTIMIZED data layer
 *
 * Strategy:
 * - /students/me/dashboard is the AGGREGATE endpoint — it already returns:
 *   registration, activeTicket, nextTrip, routes[], stops[], notifications[],
 *   history[], stats[], fullName, studentCode, universityName, verificationStatus.
 *   So we only need 1 main call (was 11 before optimization).
 * - Additional endpoints are LAZY-LOADED per-screen via useStudentLazyData().
 * - profile is loaded once (small, shared with app-shell).
 */
export function useStudentPrototypeData() {
  // Primary: aggregate dashboard endpoint (1 call instead of 11)
  const dashboard = useApi(() => experienceApi.studentDashboard(), undefined, [], "student-dashboard");
  // Profile is small and shared with app-shell — keep it
  const profile = useApi(() => profileApi.me(), undefined, [], "student-profile");
  // Passes (tickets+payments) — needed for PaymentScreen + InvoicesScreen
  // Dashboard doesn't return full payments list, so we need this
  const passes = useApi(() => studentApi.tickets(), undefined, [], "student-passes");

  const mapped = (() => {
    if (!dashboard.raw) return null;
    const d = dashboard.raw;
    return {
      user: {
        id: String(profile.raw?.userId ?? 0),
        name: d.fullName,
        email: profile.raw?.email || "",
        phone: profile.raw?.phoneNumber || "",
        avatar: (d.fullName || "").trim().slice(0, 2).toUpperCase() || "SV",
        role: "student" as const,
        studentId: d.studentCode,
        faculty: "",
        class: "",
        status: "active" as const,
        createdAt: "",
        universityId: undefined,
        verificationStatus: (d.verificationStatus as User["verificationStatus"]) || "PENDING",
        authProvider: "email" as const,
      } as User,
      routes: (d.routes || []).map(mapRoute),
      stops: (d.stops || []).map(mapStop),
      trips: (d.nextTrip ? [d.nextTrip] : []).map(mapTrip),
      buses: (d.nextTrip ? [d.nextTrip] : []).map(mapBus),
      bookings: (d.activeTicket
        ? [
            {
              id: String(d.activeTicket!.ticketId),
              studentId: String(profile.raw?.userId ?? 0),
              routeId: String(d.activeTicket!.routeId),
              date: d.activeTicket!.validFrom || "",
              status: "active" as const,
              type: "monthly" as const,
              fare: num(d.activeTicket!.finalFareAmount ?? d.activeTicket!.originalFareAmount),
              createdAt: d.activeTicket.purchasedAt || "",
            },
          ]
        : []),
      invoices: (passes.raw?.payments || []).map((p: any) => mapInvoice(p as PaymentTransactionView)),
      // Use dashboard's notifications/history (already aggregated) — no separate API needed
      notifications: (d.notifications || []).map(mapNotification),
      feedback: [],
      lostItems: [],
      tripsHistory: (d.history || []).map((h: any) => ({
        id: String(h.travelHistoryId),
        tripId: h.tripId,
        routeId: String(h.routeId ?? ""),
        routeName: h.routeName,
        routeCode: h.routeCode,
        boardingStopName: h.boardingStopName || d.registration?.boardingStopName || d.activeTicket?.boardingStopName,
        alightingStopName: h.alightingStopName || d.registration?.alightingStopName || d.activeTicket?.alightingStopName,
        boardedAt: h.boardedAt,
        alightedAt: h.alightedAt,
        serviceDate: h.serviceDate,
        busId: "0",
        driverId: "",
        date: h.serviceDate || "",
        departTime: h.boardedAt || "",
        arriveTime: h.alightedAt || "",
        status: "completed" as const,
        passengerCount: 0,
        revenue: 0,
      })),
      stats: d.stats,
      nextTrip: d.nextTrip ? mapTrip(d.nextTrip) : null,
      activeTicket: d.activeTicket,
      registration: d.registration,
      suggestions: [],
      university: {
        universityName: d.universityName,
        studentCode: d.studentCode,
        studentVerificationStatus: d.verificationStatus,
      } as any,
      dashboard,
      passes,
      history: { raw: null } as any,
      feedbackRaw: { raw: null } as any,
      lostItemsRaw: { raw: null } as any,
      notificationsRaw: { raw: null } as any,
      profileRaw: profile,
      registrationRaw: { raw: d.registration } as any,
      suggestionsRaw: { raw: null } as any,
      universityRaw: { raw: null } as any,
      stopsRaw: { raw: null } as any,
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading,
    error: dashboard.error,
    reload: () => {
      dashboard.reload();
      profile.reload();
      passes.reload();
    },
  };
}

/**
 * Student LAZY data hooks — call these INSIDE specific screens, not on module mount.
 * This prevents 11 API calls on dashboard load.
 */
export function useStudentFeedback() {
  return useApi(() => feedbackApi.mine(), undefined, []);
}
export function useStudentLostItems() {
  return useApi(() => experienceApi.studentLostItems(), undefined, []);
}
export function useStudentSuggestions() {
  return useApi(() => experienceApi.studentRouteSuggestions(), undefined, []);
}

/** Driver module: dashboard + trips + feedback */
export function useDriverPrototypeData() {
  const dashboard = useApi(() => experienceApi.driverDashboard(), undefined, []);
  const trips = useApi(() => operationsApi.driverTrips(), undefined, []);
  const feedback = useApi(() => experienceApi.driverFeedback(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, [], "driver-profile");

  const mapped = (() => {
    if (!dashboard.raw) return null;
    const d = dashboard.raw;
    return {
      user: {
        id: String(profile.raw?.userId ?? 0),
        name: d.fullName,
        email: profile.raw?.email || "",
        phone: profile.raw?.phoneNumber || "",
        avatar: (d.fullName || "").trim().slice(0, 2).toUpperCase() || "TX",
        role: "driver" as const,
        licenseNo: "",
        employeeId: "",
        status: "active" as const,
        createdAt: "",
      } as User,
      trips: (trips.raw || []).map((t: DriverTripView) => ({
        id: String(t.tripId),
        routeId: String(t.routeId),
        busId: String(t.busId ?? 0),
        driverId: "",
        assistantId: "",
        date: t.serviceDate || "",
        departTime: t.departureTime || "",
        arriveTime: t.endedAt || "",
        status: t.status === "RUNNING" ? "running" : t.status === "COMPLETED" ? "completed" : t.status === "CANCELLED" ? "cancelled" : "scheduled",
        passengerCount: 0,
        revenue: 0,
        stops: t.stops,
        conductorName: t.conductorName,
        conductorPhone: t.conductorPhone,
        licensePlate: t.licensePlate,
      })),
      activeTrip: d.activeTrip ? mapTrip(d.activeTrip) : null,
      feedback: (feedback.raw || []).map(mapFeedback),
      stats: d.stats,
      notifications: (notifications.raw || []).map(mapNotification),
      dashboard,
      tripsRaw: trips,
      feedbackRaw: feedback,
      notificationsRaw: notifications,
      profileRaw: profile,
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading,
    error: dashboard.error,
    reload: () => {
      dashboard.reload();
      trips.reload();
      feedback.reload();
      notifications.reload();
      profile.reload();
    },
  };
}

/** Assistant (conductor) module: dashboard + tickets + incidents + lost items */
export function useAssistantPrototypeData() {
  const dashboard = useApi(() => experienceApi.assistantDashboard(), undefined, []);
  const trips = useApi(() => operationsApi.conductorTrips(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, [], "assistant-profile");

  const mapped = (() => {
    if (!dashboard.raw) return null;
    const d = dashboard.raw;
    return {
      user: {
        id: String(profile.raw?.userId ?? 0),
        name: d.fullName,
        email: profile.raw?.email || "",
        phone: profile.raw?.phoneNumber || "",
        avatar: (d.fullName || "").trim().slice(0, 2).toUpperCase() || "PX",
        role: "assistant" as const,
        employeeId: "",
        status: "active" as const,
        createdAt: "",
      } as User,
      trips: (d.trips || []).map(mapTrip),
      activeTrip: d.activeTrip ? mapTrip(d.activeTrip) : null,
      tickets: d.tickets || [],
      incidents: (d.incidents || []).map(mapIncident),
      lostItems: (d.lostItems || []).map(mapLostItem),
      stats: d.stats,
      notifications: (notifications.raw || []).map(mapNotification),
      conductorTrips: trips.raw || [],
      dashboard,
      tripsRaw: trips,
      notificationsRaw: notifications,
      profileRaw: profile,
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading,
    error: dashboard.error,
    reload: () => {
      dashboard.reload();
      trips.reload();
      notifications.reload();
      profile.reload();
    },
  };
}

/** Coordinator module: dashboard + fleet + feedback + schedule */
export function useCoordinatorPrototypeData() {
  const dashboard = useApi(() => experienceApi.coordinatorDashboard(), undefined, []);

  const mapped = (() => {
    if (!dashboard.raw) return null;
    const d = dashboard.raw;
    return {
      user: {
        id: "0",
        name: "Điều phối viên",
        email: "",
        phone: "",
        avatar: "ĐP",
        role: "coordinator" as const,
        employeeId: "",
        status: "active" as const,
        createdAt: "",
      } as User,
      routes: (d.routes || []).map(mapRoute),
      stops: (d.stops || []).map(mapStop),
      fleet: (d.liveFleet || []).map((v) => ({
        ...mapBus(v as any),
        tripId: String(v.tripId),
        routeCode: "",
        driverName: v.driverName,
        conductorName: v.conductorName,
      })),
      feedback: (d.feedback || []).map(mapFeedback),
      stats: d.stats,
      schedule: null,
      notifications: [],
      dashboard,
      fleetRaw: { raw: d.liveFleet || [], loading: false, error: null, reload: dashboard.reload },
      scheduleRaw: { raw: null, loading: false, error: null, reload: dashboard.reload },
      feedbackRaw: { raw: d.feedback || [], loading: false, error: null, reload: dashboard.reload },
      notificationsRaw: { raw: [], loading: false, error: null, reload: dashboard.reload },
      profileRaw: { raw: null, loading: false, error: null, reload: dashboard.reload },
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading,
    error: dashboard.error,
    reload: dashboard.reload,
  };
}

/**
 * Admin module: PERFORMANCE-OPTIMIZED data layer
 *
 * Strategy:
 * - /admin/stats is the AGGREGATE endpoint — it already returns:
 *   stats[], routeMetrics[], complaints[], violations[], fares[].
 *   So DashboardScreen only needs 1 main call + profile + audits (for activity feed).
 * - Other endpoints (users, verifications, universities, etc.) are LAZY-LOADED
 *   per-screen via useAdminLazy* hooks below.
 */
export function useAdminPrototypeData() {
  // Primary: aggregate admin stats endpoint (returns stats+routeMetrics+complaints+violations+fares)
  const stats = useApi(() => experienceApi.adminStats(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, [], "admin-profile");
  // Audits are needed for the activity feed on Dashboard
  const audits = useApi(() => adminApi.auditLogs(), undefined, []);

  const mapped = (() => {
    if (!stats.raw) return null;
    const s = stats.raw;
    return {
      user: {
        id: String(profile.raw?.userId ?? 0),
        name: profile.raw?.fullName || "Quản trị viên",
        email: profile.raw?.email || "",
        phone: profile.raw?.phoneNumber || "",
        avatar: "HT",
        role: "admin" as const,
        employeeId: "",
        status: "active" as const,
        createdAt: "",
      } as User,
      stats: s.stats,
      routeMetrics: s.routeMetrics,
      complaints: (s.complaints || []).map(mapComplaint),
      violations: s.violations,
      fares: s.fares,
      users: [],
      verifications: [],
      universities: [],
      notifications: [],
      audits: audits.raw || [],
      payments: [],
      routeUnis: [],
      subsidies: [],
      uniAdmins: [],
      statsRaw: stats,
      usersRaw: { raw: null } as any,
      verificationsRaw: { raw: null } as any,
      universitiesRaw: { raw: null } as any,
      complaintsRaw: { raw: null } as any,
      violationsRaw: { raw: null } as any,
      faresRaw: { raw: null } as any,
      notificationsRaw: { raw: null } as any,
      profileRaw: profile,
      auditsRaw: audits,
      paymentsRaw: { raw: null } as any,
      routeUnisRaw: { raw: null } as any,
      subsidiesRaw: { raw: null } as any,
      uniAdminsRaw: { raw: null } as any,
    };
  })();

  return {
    data: mapped,
    loading: stats.loading,
    error: stats.error,
    reload: () => {
      stats.reload();
      profile.reload();
      audits.reload();
    },
  };
}

/**
 * Admin LAZY data hooks — call these INSIDE specific screens.
 * Prevents 14 API calls on dashboard load.
 */
export function useAdminUsers(params?: { role?: string; status?: string; search?: string }) {
  return useApi(() => adminApi.users(params), undefined, [params?.role, params?.status, params?.search]);
}
export function useAdminVerifications(status?: string) {
  return useApi(() => adminApi.verifications(status), undefined, [status]);
}
export function useAdminUniversities(params?: { keyword?: string; status?: string }) {
  return useApi(() => adminApi.universities(params), undefined, [params?.keyword, params?.status]);
}
export function useAdminNotifications() {
  return useApi(() => notificationApi.mine(), undefined, []);
}
export function useAdminPayments(params?: { universityId?: number }) {
  return useApi(() => adminApi.paymentTransactions(params), undefined, [params?.universityId]);
}
export function useAdminRouteUnis(universityId?: number) {
  return useApi(() => adminApi.routeUniversities(universityId), undefined, [universityId]);
}
export function useAdminSubsidies(universityId?: number) {
  return useApi(() => adminApi.subsidyPolicies(universityId), undefined, [universityId]);
}
export function useAdminUniAdmins(universityId?: number) {
  return useApi(() => adminApi.universityAdmins(universityId), undefined, [universityId]);
}

/**
 * University Admin module: PERFORMANCE-OPTIMIZED data layer
 *
 * Strategy:
 * - Dashboard only needs: profile (university info), stats, payments, subsidyPolicies.
 *   That's 4 calls (was 11).
 * - Other endpoints (campuses, domains, roster, importBatches, reconciliation)
 *   are LAZY-LOADED per-screen via useUniAdminLazy* hooks below.
 */
export function useUniversityAdminPrototypeData() {
  // Primary: profile (university info), stats (dashboard charts), payments (recent), subsidies (chart)
  const profile = useApi(() => universityApi.profile(), undefined, []);
  const stats = useApi(() => universityApi.stats(), undefined, []);
  const payments = useApi(() => universityApi.paymentTransactions(), undefined, []);
  const subsidyPolicies = useApi(() => universityApi.subsidyPolicies(), undefined, []);

  const mapped = (() => {
    if (!profile.raw) return null;
    return {
      user: {
        id: String(0),
        name: profile.raw.fullName,
        email: profile.raw.email,
        phone: profile.raw.phoneNumber || "",
        avatar: (profile.raw.fullName || "").trim().slice(0, 2).toUpperCase() || "UNI",
        role: "university_admin" as const,
        employeeId: profile.raw.title,
        status: "active" as const,
        createdAt: profile.raw.assignedAt || "",
        universityId: String(profile.raw.universityId),
      } as User,
      universityAdmin: profile.raw,
      campuses: [],
      domains: [],
      roster: [],
      importBatches: [],
      subsidyPolicies: subsidyPolicies.raw || [],
      stats: stats.raw,
      reconciliation: null,
      payments: payments.raw || [],
      notifications: [],
      profileRaw: profile,
      campusesRaw: { raw: null } as any,
      domainsRaw: { raw: null } as any,
      rosterRaw: { raw: null } as any,
      importBatchesRaw: { raw: null } as any,
      subsidyPoliciesRaw: subsidyPolicies,
      statsRaw: stats,
      reconciliationRaw: { raw: null } as any,
      paymentsRaw: payments,
      notificationsRaw: { raw: null } as any,
      userProfileRaw: { raw: null } as any,
    };
  })();

  return {
    data: mapped,
    loading: profile.loading,
    error: profile.error,
    reload: () => {
      profile.reload();
      stats.reload();
      payments.reload();
      subsidyPolicies.reload();
    },
  };
}

/**
 * University Admin LAZY data hooks — call these INSIDE specific screens.
 */
export function useUniAdminCampuses() {
  return useApi(() => universityApi.campuses(), undefined, []);
}
export function useUniAdminDomains() {
  return useApi(() => universityApi.domains(), undefined, []);
}
export function useUniAdminRoster(params?: { keyword?: string; status?: string }) {
  return useApi(() => universityApi.roster(params), undefined, [params?.keyword, params?.status]);
}
export function useUniAdminImportBatches() {
  return useApi(() => universityApi.importBatches(), undefined, []);
}
export function useUniAdminReconciliation(params?: { from?: string; to?: string }) {
  return useApi(() => universityApi.reconciliation(params), undefined, [params?.from, params?.to]);
}
export function useUniAdminNotifications() {
  return useApi(() => notificationApi.mine(), undefined, []);
}

/* =========================================================================
   Loading / Error placeholders — keep prototype visual
   ========================================================================= */
export function LoadingBlock({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
      <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="mt-4 text-sm font-medium text-on-surface-variant">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-error/30 bg-error-container/30 px-6 py-16 text-center">
      <p className="text-sm font-bold text-error">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

