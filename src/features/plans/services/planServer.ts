import { getDb } from "@/mocks/seed";
import type { Plan } from "@/types/entities";
import { PlanStatus } from "@/types/enums";

function sortByDisplayOrder(a: Plan, b: Plan) {
  return a.displayOrder - b.displayOrder;
}

export function getActivePlans(): Plan[] {
  const db = getDb();
  return db.plans
    .filter((plan) => plan.status === PlanStatus.ACTIVE)
    .sort(sortByDisplayOrder);
}

export function getFeaturedPlans(): Plan[] {
  return getActivePlans().filter((plan) => plan.isFeatured);
}

export function getPlanBySlug(slug: string): Plan | undefined {
  const normalized = slug.trim().toLowerCase();
  return getDb().plans.find((plan) => plan.slug.toLowerCase() === normalized);
}

export function getPlanById(id: string): Plan | undefined {
  return getDb().plans.find((plan) => plan.id === id);
}
