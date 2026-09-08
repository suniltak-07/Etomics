import type { Plan } from "@/types/entities";
import { fetchActiveOfoodPlans } from "@/lib/backend/plans";

export async function getActivePlans(): Promise<Plan[]> {
  const { plans } = await fetchActiveOfoodPlans();
  return plans;
}

export async function getFeaturedPlans(): Promise<Plan[]> {
  const plans = await getActivePlans();
  const featured = plans.filter((plan) => plan.isFeatured);
  return featured.length ? featured : plans;
}

export async function getPlanBySlug(slug: string): Promise<Plan | undefined> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return undefined;
  const plans = await getActivePlans();
  return plans.find((plan) => plan.slug.toLowerCase() === normalized);
}

export async function getPlanById(id: string): Promise<Plan | undefined> {
  if (!id.trim()) return undefined;
  const plans = await getActivePlans();
  return plans.find((plan) => plan.id === id);
}
