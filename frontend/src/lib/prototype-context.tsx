"use client";

/**
 * Prototype Context
 *
 * Provides prototype-shaped data to all prototype-style UI modules.
 * The data is loaded once per role via the appropriate hook from
 * @/lib/prototype-data, then provided to the entire role module subtree.
 *
 * This lets us keep the prototype modules' original code structure
 * (which uses top-level imports from @/lib/mock-data) by replacing
 * those imports with `const ctx = usePrototypeCtx();` calls.
 */

import { createContext, useContext, type ReactNode } from "react";
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

export interface PrototypeData {
  user: User;
  users: User[];
  routes: Route[];
  stops: BusStop[];
  buses: Bus[];
  trips: Trip[];
  bookings: any[];
  invoices: Invoice[];
  notifications: Notification[];
  feedbackList: Feedback[];
  lostItems: LostItem[];
  complaints: Complaint[];
  incidents: Incident[];
  aiSuggestions: Route[];
  universities: any[];
  currentUser: User;
  routeUniversities: any[];
  subsidyPolicies: any[];
  chatbotSeed: { role: "user" | "bot"; text: string; time: string }[];
  // helpers
  routeById: (id: string) => Route | undefined;
  stopById: (id: string) => BusStop | undefined;
  busById: (id: string) => Bus | undefined;
  userById: (id: string) => User | undefined;
  universityById: (id: string) => any | undefined;
  calcSubsidy: (originalFare: number, universityId: string) => { original: number; subsidy: number; final: number };
  formatVND: (n: number) => string;
  // raw backend handles (for actions: purchase, register, scan, etc.)
  raw: any;
}

const emptyUser: User = {
  id: "",
  name: "Đang tải...",
  email: "",
  phone: "",
  avatar: "?",
  role: "student",
  status: "active",
  createdAt: "",
};

const noop = () => undefined;

const EMPTY: PrototypeData = {
  user: emptyUser,
  users: [],
  routes: [],
  stops: [],
  buses: [],
  trips: [],
  bookings: [],
  invoices: [],
  notifications: [],
  feedbackList: [],
  lostItems: [],
  complaints: [],
  incidents: [],
  aiSuggestions: [],
  universities: [],
  currentUser: emptyUser,
  routeUniversities: [],
  subsidyPolicies: [],
  chatbotSeed: [],
  routeById: () => undefined,
  stopById: () => undefined,
  busById: () => undefined,
  userById: () => undefined,
  universityById: () => undefined,
  calcSubsidy: (o) => ({ original: o, subsidy: 0, final: o }),
  formatVND: (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n),
  raw: null,
};

const PrototypeCtx = createContext<PrototypeData>(EMPTY);

export function PrototypeProvider({
  value,
  children,
}: {
  value: PrototypeData;
  children: ReactNode;
}) {
  return <PrototypeCtx.Provider value={value}>{children}</PrototypeCtx.Provider>;
}

export function usePrototypeCtx(): PrototypeData {
  return useContext(PrototypeCtx);
}

/* Convenience accessor: returns the full ctx */
export function usePrototypeData(): PrototypeData {
  return useContext(PrototypeCtx);
}
