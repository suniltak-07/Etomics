import { Leaf } from "lucide-react";
import { WELLNESS_COPY } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export function WellnessNotice({
  className,
  tone = "sand",
}: {
  className?: string;
  tone?: "sand" | "navy" | "surface";
}) {
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
        tone === "navy" && "border-white/15 bg-white/8 text-white/85",
        tone === "sand" &&
          "border-brand-green/20 bg-brand-green-muted/40 text-brand-navy",
        tone === "surface" &&
          "border-brand-border bg-brand-surface text-brand-muted",
        className,
      )}
    >
      <Leaf className="text-brand-green mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{WELLNESS_COPY}</p>
    </aside>
  );
}
