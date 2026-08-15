"use client";

import { cn } from "@/lib/utils/cn";

export interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
} as const;

export function Spinner({
  className,
  size = "md",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        className={cn(
          "border-brand-green-muted border-t-brand-green animate-spin rounded-full",
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
