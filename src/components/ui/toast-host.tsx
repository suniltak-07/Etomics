"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast, type ToastVariant } from "@/store/slices/uiSlice";

const variantClasses: Record<ToastVariant, string> = {
  default: "border-brand-border bg-brand-surface text-brand-ink",
  success: "border-brand-success/30 bg-white text-brand-success",
  warning: "border-brand-warning/30 bg-white text-brand-warning",
  danger: "border-brand-danger/30 bg-white text-brand-danger",
};

export function ToastHost() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dispatch(removeToast(toast.id)), 4200),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
            variantClasses[toast.variant ?? "default"],
          )}
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description ? (
              <p className="mt-0.5 text-sm opacity-80">{toast.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
            onClick={() => dispatch(removeToast(toast.id))}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
