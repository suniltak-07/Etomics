"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

function emptySubscribe() {
  return () => {};
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Close when backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Extra class for the scrollable body. */
  bodyClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  closeOnBackdrop = true,
  bodyClassName,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Focus the dialog only when it first opens — not on every parent re-render
    if (!wasOpenRef.current) {
      panelRef.current?.focus({ preventScroll: true });
      wasOpenRef.current = true;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="bg-brand-navy/45 absolute inset-0 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={closeOnBackdrop ? () => onCloseRef.current() : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "border-brand-border bg-brand-surface relative z-10 flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-xl outline-none sm:rounded-2xl",
          className,
        )}
      >
        <div className="border-brand-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2
                id={titleId}
                className="font-display text-brand-ink text-lg font-semibold"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className="text-brand-muted mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Close dialog"
            className="shrink-0 px-2"
            onClick={() => onCloseRef.current()}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ModalFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-brand-border mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4",
        className,
      )}
      {...props}
    />
  );
}
