"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ExpressiveCard } from "@/components/m3/primitives";

/* M3 Expressive shared primitives — perk-style (bold, no pale containers) */

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8 min-w-0",
        className
      )}
    >
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl bg-[#14140f] text-[#beff50] elev-1">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface text-balance leading-[1.05]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-on-surface-variant text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </motion.div>
  );
}

// Bold accent map — NO pale containers. Each accent = a bold color block.
const accentMap: Record<string, { bg: string; fg: string }> = {
  primary: { bg: "#14140f", fg: "#beff50" },      // dark + lime icon
  tertiary: { bg: "#ff8c5f", fg: "#14140f" },     // coral + dark icon
  secondary: { bg: "#144fcc", fg: "#beff50" },    // blue + lime icon
  error: { bg: "#dc2626", fg: "#ffffff" },
  success: { bg: "#16a34a", fg: "#ffffff" },
  warning: { bg: "#f59e0b", fg: "#14140f" },
};

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
  trend?: "up" | "down" | "flat";
  accent?: "primary" | "tertiary" | "secondary" | "error" | "success" | "warning";
}) {
  const a = accentMap[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl elev-2 p-4 sm:p-5 h-full min-w-0"
      style={{ backgroundColor: a.bg, color: a.fg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide truncate">{label}</p>
          <p className="mt-1 max-w-full break-words text-xl font-bold leading-tight tabular-nums sm:text-2xl 2xl:text-3xl [overflow-wrap:anywhere]">
            {value}
          </p>
          {hint && (
            <p
              className={cn(
                "mt-1.5 text-[11px] font-bold",
                trend === "up" && "opacity-90",
                trend === "down" && "opacity-90",
                (!trend || trend === "flat") && "opacity-70"
              )}
            >
              {hint}
            </p>
          )}
        </div>
        <div
          className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: a.fg, color: a.bg }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export function Section({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 min-w-0", className)}>
      {(title || actions) && (
        <div className="flex items-end justify-between gap-3 min-w-0">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 sm:py-16 text-center min-w-0">
      <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-[#14140f] text-[#beff50] elev-1">
        {icon}
      </div>
      <p className="mt-4 text-base font-bold text-on-surface">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { ExpressiveCard };
