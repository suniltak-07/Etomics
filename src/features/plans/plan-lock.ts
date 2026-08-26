import { PlanStatus } from "@/types/enums";

export const CANT_EDIT_ACTIVE_PLAN = "You can't edit an active plan";

export function isActivePlan(status?: string | null): boolean {
  return status === PlanStatus.ACTIVE;
}
