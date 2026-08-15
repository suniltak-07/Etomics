import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import {
  isErrorResponse,
  jsonOk,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { PaymentStatus, PlanStatus, SubscriptionStatus } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.REPORTS_READ);
  if (denied) return denied;

  const db = getDb();

  const activeSubscriptions = db.subscriptions.filter(
    (item) => item.status === SubscriptionStatus.ACTIVE,
  ).length;
  const pausedSubscriptions = db.subscriptions.filter(
    (item) => item.status === SubscriptionStatus.PAUSED,
  ).length;
  const cancelledSubscriptions = db.subscriptions.filter(
    (item) => item.status === SubscriptionStatus.CANCELLED,
  ).length;

  const successfulPayments = db.payments.filter(
    (item) => item.status === PaymentStatus.SUCCESS,
  );
  const revenue = successfulPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const planPopularity = db.plans.map((plan) => ({
    planId: plan.id,
    name: plan.name,
    slug: plan.slug,
    subscribers: db.subscriptions.filter((sub) => sub.planId === plan.id)
      .length,
    activeSubscribers: db.subscriptions.filter(
      (sub) =>
        sub.planId === plan.id && sub.status === SubscriptionStatus.ACTIVE,
    ).length,
  }));

  return jsonOk({
    customers: {
      total: db.customers.length,
      active: db.customers.filter((customer) => customer.isActive).length,
    },
    plans: {
      total: db.plans.length,
      active: db.plans.filter((plan) => plan.status === PlanStatus.ACTIVE)
        .length,
      featured: db.plans.filter((plan) => plan.isFeatured).length,
    },
    subscriptions: {
      total: db.subscriptions.length,
      active: activeSubscriptions,
      paused: pausedSubscriptions,
      cancelled: cancelledSubscriptions,
      pending: db.subscriptions.filter(
        (item) => item.status === SubscriptionStatus.PENDING,
      ).length,
    },
    payments: {
      total: db.payments.length,
      successful: successfulPayments.length,
      failed: db.payments.filter((item) => item.status === PaymentStatus.FAILED)
        .length,
      revenue,
      currency: "INR",
    },
    vouchers: {
      total: db.vouchers.length,
      active: db.vouchers.filter((item) => item.status === "ACTIVE").length,
    },
    planPopularity,
    recentPayments: [...db.payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    recentSubscriptions: [...db.subscriptions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  });
}
