// Type definitions for the Bus Management System

export type Role =
  | "student"
  | "driver"
  | "assistant"
  | "coordinator"
  | "admin"
  | "university_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: Role;
  studentId?: string;
  faculty?: string;
  class?: string;
  licenseNo?: string; // for driver
  employeeId?: string; // for staff
  status: "active" | "locked";
  createdAt: string;
  // University linkage
  universityId?: string;
  verificationStatus?: "VERIFIED" | "PENDING" | "REJECTED";
  authProvider?: "google" | "email";
}

// ============ UNIVERSITY LINKAGE ============
export interface University {
  id: string;
  code: string;
  name: string;
  shortName: string;
  contactEmail: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  logo: string; // initials
  logoUrl?: string; // real logo image URL
  color: string;
  campuses: Campus[];
  domains: string[];
  studentCount: number;
  routeCount: number;
  subsidyActive: boolean;
}

export interface Campus {
  id: string;
  universityId: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "active" | "inactive";
}

export interface UniversityDomain {
  id: string;
  universityId: string;
  domain: string;
  status: "active" | "locked";
  addedAt: string;
}

export interface StudentRosterEntry {
  id: string;
  universityId: string;
  studentCode: string;
  fullName: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "SUSPENDED";
  importedAt: string;
}

export interface ImportBatch {
  id: string;
  universityId: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  status: "processing" | "completed" | "failed";
  importedAt: string;
}

export interface SubsidyPolicy {
  id: string;
  universityId: string;
  name: string;
  type: "percent" | "fixed";
  value: number; // percent (0-100) or fixed VND
  maxAmount?: number;
  activeFrom: string;
  activeUntil: string;
  status: "active" | "expired" | "draft";
}

export interface RouteUniversity {
  routeId: string;
  universityId: string;
  campusId?: string;
  activeFrom: string;
  status: "active" | "inactive";
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: Role;
  action: string;
  target: string;
  university?: string;
  result: "success" | "failure";
  timestamp: string;
  ip: string;
}

export interface UniversityStats {
  universityId: string;
  activeStudents: number;
  monthlyPasses: number;
  topRoute: string;
  totalSubsidy: number;
  tripsThisMonth: number;
}

export interface BusStop {
  id: string;
  name: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  routes: string[]; // route ids
  hasShelter: boolean;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  from: string;
  to: string;
  stops: string[]; // stop ids in order
  distanceKm: number;
  durationMin: number;
  frequencyMin: number;
  fare: number;
  monthlyPass: number;
  color: string;
  active: boolean;
  firstTrip: string;
  lastTrip: string;
}

export interface Bus {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  driverId?: string;
  assistantId?: string;
  routeId?: string;
  status: "active" | "idle" | "maintenance";
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
  currentStopIndex?: number;
  nextStopId?: string;
  etaMin: number;
}

export interface Trip {
  id: string;
  routeId: string;
  routeName?: string;
  routeCode?: string;
  busId: string;
  licensePlate?: string;
  busPlate?: string;
  rawStatus?: string;
  driverId: string;
  assistantId?: string;
  date: string;
  departTime: string;
  arriveTime: string;
  status: "scheduled" | "running" | "completed" | "cancelled";
  passengerCount: number;
  revenue: number;
}

export interface Booking {
  id: string;
  studentId: string;
  routeId: string;
  date: string;
  status: "active" | "cancelled" | "completed";
  type: "single" | "monthly";
  fare: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  code: string;
  studentId: string;
  description: string;
  amount: number;
  method: "momo" | "vnpay" | "cash";
  status: "paid" | "pending" | "refunded";
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "danger";
  read: boolean;
  createdAt: string;
  icon?: string;
}

export interface Feedback {
  id: string;
  studentName: string;
  routeCode: string;
  driverName?: string;
  rating: number;
  category: "service" | "driver" | "vehicle" | "punctuality" | "other";
  content: string;
  status: "new" | "processing" | "resolved";
  response?: string;
  routeName?: string;
  tripId?: number;
  createdAt: string;
}

export interface LostItem {
  id: string;
  studentName: string;
  routeCode: string;
  tripDate: string;
  item: string;
  description: string;
  status: "reported" | "found" | "returned" | "closed";
  createdAt: string;
}

export interface Complaint {
  id: string;
  code: string;
  studentName: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "new" | "processing" | "resolved" | "rejected";
  createdAt: string;
  description: string;
}

export interface Incident {
  id: string;
  code: string;
  reporter: string;
  routeCode: string;
  type: "delay" | "breakdown" | "accident" | "behavior" | "other";
  severity: "low" | "medium" | "high";
  description: string;
  status: "open" | "investigating" | "closed";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
}

export interface ScheduleSlot {
  id: string;
  driverId: string;
  driverName: string;
  busId: string;
  busPlate: string;
  routeId: string;
  routeCode: string;
  shift: "morning" | "afternoon" | "evening";
  startTime: string;
  endTime: string;
  date: string;
}

export interface Stats {
  label: string;
  value: string | number;
  delta?: number;
  trend?: "up" | "down" | "flat";
}

