"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: ReactNode;
}

export function Tabs({
  items,
  value,
  onValueChange,
  className,
  children,
}: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="border-brand-border flex gap-1 border-b"
      >
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`tab-panel-${item.id}`}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-brand-green text-brand-green"
                  : "text-brand-muted hover:text-brand-ink border-transparent",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
              onClick={() => onValueChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {children ? (
        <div
          role="tabpanel"
          id={`tab-panel-${value}`}
          aria-labelledby={`tab-${value}`}
          className="pt-4"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
