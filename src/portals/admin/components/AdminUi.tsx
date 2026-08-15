"use client";

import type { ReactNode } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  SUCCESS: "success",
  COMPLETED: "success",
  DELIVERED: "success",
  INACTIVE: "muted",
  DRAFT: "muted",
  ARCHIVED: "muted",
  PENDING: "warning",
  PROCESSING: "warning",
  PAUSED: "warning",
  EXPIRED: "warning",
  WARNING: "warning",
  CANCELLED: "danger",
  FAILED: "danger",
  REFUNDED: "info",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANTS[status] ?? "default";
  return (
    <Badge variant={variant} className={className}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-brand-navy text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-brand-muted mt-0.5 text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border-brand-border bg-brand-surface rounded-lg border px-4 py-3">
      <p className="text-brand-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-brand-navy mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-brand-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
