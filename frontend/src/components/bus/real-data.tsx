"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { EmptyState } from "@/components/bus/primitives";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function useApiResource<T>(
  loader: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      reload();
    }, 0);
    return () => window.clearTimeout(id);
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export function formatMoney(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function getErrorMessage(error: unknown, fallback = "Thao tác thất bại") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function LoadingPanel({ label = "Đang tải dữ liệu thật..." }: { label?: string }) {
  return (
    <ExpressiveCard variant="elevated" className="p-6">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </ExpressiveCard>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertTriangle className="size-7" />}
      title="Không tải được dữ liệu"
      description={message}
      action={
        onRetry ? (
          <ExpressiveButton variant="filled" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Thử lại
          </ExpressiveButton>
        ) : undefined
      }
    />
  );
}

export function UnavailablePanel({
  title = "Chức năng đang chờ API",
  description = "Giao diện được giữ lại theo prototype, nhưng backend thật cho phần này chưa có trong MVP hiện tại.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={<WifiOff className="size-7" />}
      title={title}
      description={description}
    />
  );
}

export function AsyncBlock<T>({
  resource,
  empty,
  children,
}: {
  resource: { data: T | null; loading: boolean; error: string | null; reload: () => void };
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (resource.loading) return <LoadingPanel />;
  if (resource.error) return <ErrorPanel message={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return empty ?? <UnavailablePanel title="Chưa có dữ liệu" description="Backend trả về dữ liệu rỗng cho màn này." />;
  return <>{children(resource.data)}</>;
}

export function StatusPill({ status }: { status?: string | null }) {
  const value = (status || "UNKNOWN").toUpperCase();
  const tone = useMemo(() => {
    if (["ACTIVE", "VERIFIED", "VALID", "PAID", "COMPLETED", "RESOLVED", "APPROVED", "RUNNING"].includes(value)) {
      return "bg-[#beff50] text-[#14140f] border-[#14140f]/10";
    }
    if (["PENDING", "SUBMITTED", "IN_PROGRESS", "SCHEDULED"].includes(value)) {
      return "bg-[#fff4c2] text-[#5f4700] border-[#5f4700]/10";
    }
    if (["LOCKED", "REJECTED", "INVALID", "EXPIRED", "CANCELLED", "FAILED"].includes(value)) {
      return "bg-[#fee2e2] text-[#991b1b] border-[#991b1b]/10";
    }
    return "bg-surface-container-high text-on-surface-variant border-outline-variant";
  }, [value]);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", tone)}>
      {value}
    </span>
  );
}

export function DataList({
  children,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Khi backend có bản ghi, dữ liệu sẽ xuất hiện tại đây.",
}: {
  children: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const content = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(content) && content.length === 0) {
    return <UnavailablePanel title={emptyTitle} description={emptyDescription} />;
  }
  return <div className="space-y-3">{children}</div>;
}
