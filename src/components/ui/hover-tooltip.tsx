"use client";

import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export function HoverTooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [rect, setRect] = useState<DOMRect | null>(null);

  function show(target: HTMLElement) {
    setRect(target.getBoundingClientRect());
  }

  return (
    <span
      className={cn("inline-flex", className)}
      aria-describedby={rect ? id : undefined}
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={() => setRect(null)}
      onFocus={(event) => show(event.currentTarget)}
      onBlur={() => setRect(null)}
    >
      {children}
      {rect && label
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className="bg-brand-navy pointer-events-none fixed z-[80] max-w-xs rounded-md px-2.5 py-1.5 text-center text-xs font-medium text-white shadow-lg"
              style={{
                top: Math.max(8, rect.top - 8),
                left: rect.left + rect.width / 2,
                transform: "translate(-50%, -100%)",
              }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
