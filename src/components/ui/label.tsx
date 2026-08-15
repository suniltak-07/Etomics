"use client";

import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-brand-ink text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);

Label.displayName = "Label";
