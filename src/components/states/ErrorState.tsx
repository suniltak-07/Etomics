import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again.",
  icon,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-brand-danger/10 text-brand-danger flex size-12 items-center justify-center rounded-full">
        {icon ?? <AlertTriangle className="size-6" aria-hidden="true" />}
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
