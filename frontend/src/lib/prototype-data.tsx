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

/* =========================================================================
   Generic API hook — same shape as real-data.tsx useApiResource
   but with optional mapper.
   ========================================================================= */
export function useApi<T, R = T>(
  loader: () => Promise<T>,
  mapper?: (data: T) => R,
  deps: unknown[] = []
): {
  data: R | null;
  raw: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [raw, setRaw] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const stableLoader = useCallback(loader, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    stableLoader()
      .then((d) => {
        if (!cancelled) {
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
  }, [stableLoader, tick]);

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
    id: String(t.tripId),
    routeId: String(t.routeId),
    busId: String(t.busId ?? 0),
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
    status: p.paymentStatus === "PAID" ? "paid" : p.paymentStatus === "REFUNDED" ? "refunded" : "pending",
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

/** Student module: full prototype data set from /students/me/dashboard + others */
export function useStudentPrototypeData() {
  const dashboard = useApi(
    () => experienceApi.studentDashboard(),
    undefined,
    []
  );
  const registration = useApi(() => studentApi.currentRegistration(), undefined, []);
  const passes = useApi(() => studentApi.tickets(), undefined, []);
  const history = useApi(() => studentApi.travelHistory(0, 50), undefined, []);
  const feedback = useApi(() => feedbackApi.mine(), undefined, []);
  const lostItems = useApi(() => experienceApi.studentLostItems(), undefined, []);
  const suggestions = useApi(() => experienceApi.studentRouteSuggestions(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, []);
  const university = useApi(() => studentApi.university(), undefined, []);
  const stops = useApi(() => transportApi.stops(), undefined, []);

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
              createdAt: (d.activeTicket as any).purchasedAt || "",
            },
          ]
        : []),
      invoices: (passes.raw?.payments || []).map((p: any) => mapInvoice(p as PaymentTransactionView)),
      notifications: (notifications.raw || []).map(mapNotification),
      feedback: (feedback.raw || []).map(mapFeedback),
      lostItems: (lostItems.raw || []).map(mapLostItem),
      tripsHistory: (history.raw || []).map((h: any) => ({
        id: String(h.travelHistoryId),
        routeId: String(h.routeId),
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
      registration: registration.raw,
      suggestions: (suggestions.raw || []).map(mapRoute),
      university: university.raw,
      dashboard,
      passes,
      history,
      feedbackRaw: feedback,
      lostItemsRaw: lostItems,
      notificationsRaw: notifications,
      profileRaw: profile,
      registrationRaw: registration,
      suggestionsRaw: suggestions,
      universityRaw: university,
      stopsRaw: stops,
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading || registration.loading || !mapped,
    error: dashboard.error || registration.error,
    reload: () => {
      dashboard.reload();
      registration.reload();
      passes.reload();
      history.reload();
      feedback.reload();
      lostItems.reload();
      suggestions.reload();
      notifications.reload();
      profile.reload();
      university.reload();
      stops.reload();
    },
  };
}

/** Driver module: dashboard + trips + feedback */
export function useDriverPrototypeData() {
  const dashboard = useApi(() => experienceApi.driverDashboard(), undefined, []);
  const trips = useApi(() => operationsApi.driverTrips(), undefined, []);
  const feedback = useApi(() => experienceApi.driverFeedback(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, []);

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
    loading: dashboard.loading || !mapped,
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
  const profile = useApi(() => profileApi.me(), undefined, []);

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
    loading: dashboard.loading || !mapped,
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
  const fleet = useApi(() => operationsApi.liveFleet(), undefined, []);
  const schedule = useApi(() => operationsApi.scheduleDashboard(), undefined, []);
  const feedback = useApi(() => experienceApi.coordinatorFeedback(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, []);

  const mapped = (() => {
    if (!dashboard.raw) return null;
    const d = dashboard.raw;
    return {
      user: {
        id: String(profile.raw?.userId ?? 0),
        name: profile.raw?.fullName || "Điều phối viên",
        email: profile.raw?.email || "",
        phone: profile.raw?.phoneNumber || "",
        avatar: (profile.raw?.fullName || "").trim().slice(0, 2).toUpperCase() || "ĐP",
        role: "coordinator" as const,
        employeeId: "",
        status: "active" as const,
        createdAt: "",
      } as User,
      routes: (d.routes || []).map(mapRoute),
      stops: (d.stops || []).map(mapStop),
      fleet: (fleet.raw || []).map((v) => ({
        ...mapBus(v as any),
        tripId: String(v.tripId),
        routeCode: "",
        driverName: v.driverName,
        conductorName: v.conductorName,
        locationUpdatedAt: v.locationUpdatedAt,
      })),
      feedback: (feedback.raw || []).map(mapFeedback),
      stats: d.stats,
      schedule: schedule.raw,
      notifications: (notifications.raw || []).map(mapNotification),
      dashboard,
      fleetRaw: fleet,
      scheduleRaw: schedule,
      feedbackRaw: feedback,
      notificationsRaw: notifications,
      profileRaw: profile,
    };
  })();

  return {
    data: mapped,
    loading: dashboard.loading || !mapped,
    error: dashboard.error,
    reload: () => {
      dashboard.reload();
      fleet.reload();
      schedule.reload();
      feedback.reload();
      notifications.reload();
      profile.reload();
    },
  };
}

/** Admin module: stats + users + verifications + universities + complaints + violations + fares */
export function useAdminPrototypeData() {
  const stats = useApi(() => experienceApi.adminStats(), undefined, []);
  const users = useApi(() => adminApi.users(), undefined, []);
  const verifications = useApi(() => adminApi.verifications(), undefined, []);
  const universities = useApi(() => adminApi.universities(), undefined, []);
  const complaints = useApi(() => experienceApi.complaints(), undefined, []);
  const violations = useApi(() => experienceApi.violations(), undefined, []);
  const fares = useApi(() => experienceApi.fares(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const profile = useApi(() => profileApi.me(), undefined, []);
  const audits = useApi(() => adminApi.auditLogs(), undefined, []);
  const payments = useApi(() => adminApi.paymentTransactions(), undefined, []);
  const routeUnis = useApi(() => adminApi.routeUniversities(), undefined, []);
  const subsidies = useApi(() => adminApi.subsidyPolicies(), undefined, []);
  const uniAdmins = useApi(() => adminApi.universityAdmins(), undefined, []);

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
      users: users.raw || [],
      verifications: verifications.raw || [],
      universities: universities.raw || [],
      notifications: (notifications.raw || []).map(mapNotification),
      audits: audits.raw || [],
      payments: payments.raw || [],
      routeUnis: routeUnis.raw || [],
      subsidies: subsidies.raw || [],
      uniAdmins: uniAdmins.raw || [],
      statsRaw: stats,
      usersRaw: users,
      verificationsRaw: verifications,
      universitiesRaw: universities,
      complaintsRaw: complaints,
      violationsRaw: violations,
      faresRaw: fares,
      notificationsRaw: notifications,
      profileRaw: profile,
      auditsRaw: audits,
      paymentsRaw: payments,
      routeUnisRaw: routeUnis,
      subsidiesRaw: subsidies,
      uniAdminsRaw: uniAdmins,
    };
  })();

  return {
    data: mapped,
    loading: stats.loading || !mapped,
    error: stats.error,
    reload: () => {
      stats.reload();
      users.reload();
      verifications.reload();
      universities.reload();
      complaints.reload();
      violations.reload();
      fares.reload();
      notifications.reload();
      profile.reload();
      audits.reload();
      payments.reload();
      routeUnis.reload();
      subsidies.reload();
      uniAdmins.reload();
    },
  };
}

/** University Admin module: profile + campuses + domains + roster + subsidy + stats + reconciliation */
export function useUniversityAdminPrototypeData() {
  const profile = useApi(() => universityApi.profile(), undefined, []);
  const campuses = useApi(() => universityApi.campuses(), undefined, []);
  const domains = useApi(() => universityApi.domains(), undefined, []);
  const roster = useApi(() => universityApi.roster(), undefined, []);
  const importBatches = useApi(() => universityApi.importBatches(), undefined, []);
  const subsidyPolicies = useApi(() => universityApi.subsidyPolicies(), undefined, []);
  const stats = useApi(() => universityApi.stats(), undefined, []);
  const reconciliation = useApi(() => universityApi.reconciliation(), undefined, []);
  const payments = useApi(() => universityApi.paymentTransactions(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const userProfile = useApi(() => profileApi.me(), undefined, []);

  const mapped = (() => {
    if (!profile.raw) return null;
    return {
      user: {
        id: String(userProfile.raw?.userId ?? 0),
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
      campuses: campuses.raw || [],
      domains: domains.raw || [],
      roster: roster.raw || [],
      importBatches: importBatches.raw || [],
      subsidyPolicies: subsidyPolicies.raw || [],
      stats: stats.raw,
      reconciliation: reconciliation.raw,
      payments: payments.raw || [],
      notifications: (notifications.raw || []).map(mapNotification),
      profileRaw: profile,
      campusesRaw: campuses,
      domainsRaw: domains,
      rosterRaw: roster,
      importBatchesRaw: importBatches,
      subsidyPoliciesRaw: subsidyPolicies,
      statsRaw: stats,
      reconciliationRaw: reconciliation,
      paymentsRaw: payments,
      notificationsRaw: notifications,
      userProfileRaw: userProfile,
    };
  })();

  return {
    data: mapped,
    loading: profile.loading || !mapped,
    error: profile.error,
    reload: () => {
      profile.reload();
      campuses.reload();
      domains.reload();
      roster.reload();
      importBatches.reload();
      subsidyPolicies.reload();
      stats.reload();
      reconciliation.reload();
      payments.reload();
      notifications.reload();
      userProfile.reload();
    },
  };
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
