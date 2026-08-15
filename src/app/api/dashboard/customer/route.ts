import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  requireAuth,
} from "@/lib/api/route-helpers";
import { PaymentStatus, SubscriptionStatus, UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  if (auth.role !== UserRole.CUSTOMER) {
    return jsonError(
      "Customer dashboard is only available to customers",
      403,
      ErrorCode.FORBIDDEN,
    );
  }

  const db = getDb();
  const customerId = auth.id;

  const subscriptions = db.subscriptions.filter(
    (item) => item.customerId === customerId,
  );
  const payments = db.payments.filter((item) => item.customerId === customerId);
  const addresses = db.addresses.filter(
    (item) => item.customerId === customerId,
  );
  const notifications = db.notifications.filter(
    (item) => item.userId === customerId,
  );

  const activeSubscription = subscriptions.find(
    (item) => item.status === SubscriptionStatus.ACTIVE,
  );

  return jsonOk({
    customerId,
    subscriptions: {
      total: subscriptions.length,
      active: subscriptions.filter(
        (item) => item.status === SubscriptionStatus.ACTIVE,
      ).length,
      paused: subscriptions.filter(
        (item) => item.status === SubscriptionStatus.PAUSED,
      ).length,
      cancelled: subscriptions.filter(
        (item) => item.status === SubscriptionStatus.CANCELLED,
      ).length,
    },
    payments: {
      total: payments.length,
      successful: payments.filter(
        (item) => item.status === PaymentStatus.SUCCESS,
      ).length,
      spent: payments
        .filter((item) => item.status === PaymentStatus.SUCCESS)
        .reduce((sum, payment) => sum + payment.amount, 0),
      currency: "INR",
    },
    addresses: {
      total: addresses.length,
      defaultAddressId: addresses.find((item) => item.isDefault)?.id ?? null,
    },
    notifications: {
      total: notifications.length,
      unread: notifications.filter((item) => !item.isRead).length,
    },
    activeSubscription: activeSubscription ?? null,
    recentPayments: [...payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    recentSubscriptions: [...subscriptions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  });
}
