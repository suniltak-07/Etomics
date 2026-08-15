import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <div
          className="bg-brand-green mb-3 h-1 w-10 rounded-full"
          aria-hidden
        />
        <h1 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-brand-muted mt-2.5 text-[0.95rem] leading-relaxed sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
