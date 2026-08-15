import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  title = "Loading",
  description = "Please wait a moment…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <Loader2
        className="text-brand-green size-8 animate-spin"
        aria-hidden="true"
      />
      <div>
        <p className="text-brand-ink font-medium">{title}</p>
        {description ? (
          <p className="text-brand-muted mt-1 text-sm">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
