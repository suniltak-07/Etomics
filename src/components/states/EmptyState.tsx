import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "When there is data to show, it will appear in this space.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-brand-green-muted text-brand-green flex size-12 items-center justify-center rounded-full">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
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
