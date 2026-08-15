import type { BadgeVariant } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/entities";
import type { PaymentStatus, SubscriptionStatus } from "@/types/enums";

export function subscriptionBadgeVariant(
  status: SubscriptionStatus | string,
): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PAUSED":
      return "warning";
    case "CANCELLED":
    case "EXPIRED":
      return "danger";
    case "PENDING":
      return "info";
    case "COMPLETED":
      return "muted";
    default:
      return "default";
  }
}

export function paymentBadgeVariant(
  status: PaymentStatus | string,
): BadgeVariant {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "PROCESSING":
    case "PENDING":
      return "warning";
    case "REFUNDED":
      return "muted";
    default:
      return "default";
  }
}

export function orderBadgeVariant(status: OrderStatus | string): BadgeVariant {
  switch (status) {
    case "DELIVERED":
    case "CONFIRMED":
      return "success";
    case "OUT_FOR_DELIVERY":
    case "PREPARING":
      return "info";
    case "PENDING":
      return "warning";
    case "CANCELLED":
    case "FAILED":
      return "danger";
    default:
      return "muted";
  }
}
