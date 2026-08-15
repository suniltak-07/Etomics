import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ForbiddenState({
  title = "Access denied",
  description = "You do not have permission to view this content.",
  icon,
  action,
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-brand-navy/10 text-brand-navy flex size-12 items-center justify-center rounded-full">
        {icon ?? <ShieldOff className="size-6" aria-hidden="true" />}
      </div>
      <div>
        <p className="text-brand-ink font-medium">{title}</p>
        {description ? (
          <p className="text-brand-muted mt-1 max-w-sm text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
