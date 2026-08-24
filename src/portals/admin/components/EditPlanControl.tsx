"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import {
  CANT_EDIT_ACTIVE_PLAN,
  isActivePlan,
} from "@/features/plans/plan-lock";

export function EditPlanControl({
  planId,
  status,
  appearance = "button",
}: {
  planId: string;
  status?: string | null;
  appearance?: "button" | "link";
}) {
  const locked = isActivePlan(status);
  const href = `/admin/plans/${planId}/edit`;

  if (appearance === "link") {
    if (locked) {
      return (
        <HoverTooltip label={CANT_EDIT_ACTIVE_PLAN}>
          <span className="text-brand-muted cursor-not-allowed text-xs font-medium">
            Edit
          </span>
        </HoverTooltip>
      );
    }

    return (
      <Link
        href={href}
        className="text-brand-navy text-xs font-medium hover:underline"
      >
        Edit
      </Link>
    );
  }

  if (locked) {
    return (
      <HoverTooltip label={CANT_EDIT_ACTIVE_PLAN}>
        <span className="inline-flex cursor-not-allowed">
          <Button size="sm" disabled className="pointer-events-none">
            Edit
          </Button>
        </span>
      </HoverTooltip>
    );
  }

  return (
    <Link href={href}>
      <Button size="sm">Edit</Button>
    </Link>
  );
}
