import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  jsonPaginated,
  paginate,
  parseJsonBody,
  parsePagination,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import {
  buildSubscriptionRecord,
  computeSubscriptionPricing,
} from "@/lib/api/subscription-helpers";
import { validateVoucher } from "@/features/vouchers/utils/validateVoucher";
import { countCustomerVoucherUsage } from "@/lib/api/route-helpers";
import { SubscriptionStatus, UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  addressId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  voucherCode: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  let subscriptions = getDb().subscriptions;

  if (auth.role === UserRole.CUSTOMER) {
    subscriptions = subscriptions.filter((item) => item.customerId === auth.id);
  } else if (customerId) {
    subscriptions = subscriptions.filter(
      (item) => item.customerId === customerId,
    );
  }

  if (status) {
    subscriptions = subscriptions.filter((item) => item.status === status);
  }

  subscriptions = [...subscriptions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const { items, meta } = paginate(subscriptions, page, pageSize);
  return jsonPaginated(items, meta);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const customerId =
    auth.role === UserRole.CUSTOMER
      ? auth.id
      : (parsed.data.customerId ?? auth.id);

  if (
    auth.role === UserRole.CUSTOMER &&
    parsed.data.customerId &&
    parsed.data.customerId !== auth.id
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  if (isAdminRole(auth.role)) {
    const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_UPDATE);
    if (denied) return denied;
  }

  const db = getDb();
  const plan = db.plans.find((item) => item.id === parsed.data.planId);
  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const address = db.addresses.find(
    (item) =>
      item.id === parsed.data.addressId && item.customerId === customerId,
  );
  if (!address) {
    return jsonError(
      "Address not found for customer",
      404,
      ErrorCode.NOT_FOUND,
    );
  }

  let voucher = null;
  if (parsed.data.voucherCode) {
    voucher =
      db.vouchers.find(
        (item) =>
          item.code.toUpperCase() ===
          parsed.data.voucherCode!.trim().toUpperCase(),
      ) ?? null;

    const validation = validateVoucher({
      voucher,
      planPrice: plan.price,
      planId: plan.id,
      customerUsageCount: voucher
        ? countCustomerVoucherUsage(customerId, voucher.id)
        : 0,
    });

    if (!validation.valid) {
      return jsonError(
        validation.message ?? "Voucher is invalid",
        422,
        validation.errorCode ?? ErrorCode.VALIDATION_ERROR,
      );
    }
  }

  let pricing;
  try {
    pricing = computeSubscriptionPricing(plan, voucher);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Pricing failed",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const subscription = buildSubscriptionRecord({
    customerId,
    plan,
    addressId: address.id,
    pricing,
    voucherId: voucher?.id,
    status: parsed.data.status ?? SubscriptionStatus.PENDING,
  });

  mutate((dbStore) => {
    dbStore.subscriptions.push(subscription);
    if (voucher) {
      const index = dbStore.vouchers.findIndex(
        (item) => item.id === voucher!.id,
      );
      if (index >= 0) {
        dbStore.vouchers[index].usedCount += 1;
        dbStore.vouchers[index].updatedAt = subscription.updatedAt;
      }
    }
  });

  return jsonOk(subscription, {
    status: 201,
    message: "Subscription created",
  });
}
