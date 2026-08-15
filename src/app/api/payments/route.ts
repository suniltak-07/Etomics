import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode, isApiError } from "@/lib/api/errors";
import {
  countCustomerVoucherUsage,
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
import { getMockPaymentProvider } from "@/lib/api/payment-store";
import {
  buildSubscriptionRecord,
  computeSubscriptionPricing,
  resolvePlanCharge,
} from "@/lib/api/subscription-helpers";
import { validateVoucher } from "@/features/vouchers/utils/validateVoucher";
import {
  DurationKind,
  FoodPreference,
  HealthGoal,
  MealType,
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
} from "@/types/enums";

export const dynamic = "force-dynamic";

const createPaymentSchema = z.object({
  planId: z.string().min(1),
  addressId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  voucherCode: z.string().optional(),
  method: z.string().optional(),
  durationKind: z.nativeEnum(DurationKind).optional(),
  mealTypes: z.array(z.nativeEnum(MealType)).min(1).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  mobile: z.string().min(8).max(20).optional(),
  foodPreference: z.nativeEnum(FoodPreference).optional(),
  allergies: z.string().max(400).optional(),
  healthGoal: z.nativeEnum(HealthGoal).optional(),
  /** Ignored — amount is always recalculated server-side */
  amount: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.PAYMENTS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  let payments = getDb().payments;

  if (auth.role === UserRole.CUSTOMER) {
    payments = payments.filter((item) => item.customerId === auth.id);
  } else if (customerId) {
    payments = payments.filter((item) => item.customerId === customerId);
  }

  if (status) {
    payments = payments.filter((item) => item.status === status);
  }

  payments = [...payments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const { items, meta } = paginate(payments, page, pageSize);
  return jsonPaginated(items, meta);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createPaymentSchema.safeParse(body);
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

  const db = getDb();
  if (!db.users.find((item) => item.id === customerId)) {
    return jsonError("Customer not found", 404, ErrorCode.NOT_FOUND);
  }

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
      planPrice: resolvePlanCharge(
        plan,
        parsed.data.durationKind ?? DurationKind.FULL,
      ),
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

  const durationKind = parsed.data.durationKind ?? DurationKind.FULL;

  let pricing;
  try {
    pricing = computeSubscriptionPricing(plan, voucher, durationKind);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Pricing failed",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const provider = getMockPaymentProvider();

  try {
    const created = await provider.createPayment({
      customerId,
      amount: pricing.finalAmount,
      currency: plan.currency,
      method: parsed.data.method,
      description: `EatOmics subscription — ${plan.name}`,
      metadata: {
        planId: plan.id,
        addressId: address.id,
        voucherCode: voucher?.code,
        serverPriced: true,
        pricing,
      },
    });

    const confirmed = await provider.confirmPayment({
      paymentId: created.payment.id,
    });

    const subscription = buildSubscriptionRecord({
      customerId,
      plan,
      addressId: address.id,
      pricing,
      voucherId: voucher?.id,
      paymentId: confirmed.payment.id,
      status:
        confirmed.payment.status === PaymentStatus.SUCCESS
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.PENDING,
      durationKind,
      mealTypes: parsed.data.mealTypes,
      startDate: parsed.data.startDate,
    });

    mutate((dbStore) => {
      const paymentIndex = dbStore.payments.findIndex(
        (item) => item.id === confirmed.payment.id,
      );
      if (paymentIndex >= 0) {
        dbStore.payments[paymentIndex] = {
          ...confirmed.payment,
          subscriptionId: subscription.id,
        };
      }

      dbStore.subscriptions.push(subscription);

      const customerIndex = dbStore.customers.findIndex(
        (item) => item.id === customerId,
      );
      if (customerIndex >= 0) {
        const customer = dbStore.customers[customerIndex];
        const allergies = parsed.data.allergies
          ? parsed.data.allergies
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : customer.preferences?.allergies;
        dbStore.customers[customerIndex] = {
          ...customer,
          firstName: parsed.data.firstName ?? customer.firstName,
          lastName: parsed.data.lastName ?? customer.lastName,
          mobile: parsed.data.mobile ?? customer.mobile,
          preferences: {
            ...customer.preferences,
            foodPreference:
              parsed.data.foodPreference ??
              customer.preferences?.foodPreference,
            healthGoal:
              parsed.data.healthGoal ?? customer.preferences?.healthGoal,
            allergies,
            allergyNotes: parsed.data.allergies,
          },
          updatedAt: subscription.updatedAt,
        };
        const userIndex = dbStore.users.findIndex(
          (item) => item.id === customerId,
        );
        if (userIndex >= 0) {
          dbStore.users[userIndex] = {
            ...dbStore.users[userIndex],
            firstName: dbStore.customers[customerIndex].firstName,
            lastName: dbStore.customers[customerIndex].lastName,
            mobile: dbStore.customers[customerIndex].mobile,
            updatedAt: subscription.updatedAt,
          };
        }
      }

      if (voucher) {
        const voucherIndex = dbStore.vouchers.findIndex(
          (item) => item.id === voucher!.id,
        );
        if (voucherIndex >= 0) {
          dbStore.vouchers[voucherIndex].usedCount += 1;
          dbStore.vouchers[voucherIndex].updatedAt = subscription.updatedAt;
        }
      }
    });

    const payment = {
      ...confirmed.payment,
      subscriptionId: subscription.id,
    };

    return jsonOk(
      {
        payment,
        transaction: confirmed.transaction,
        subscription,
        pricing,
      },
      { status: 201, message: "Payment successful" },
    );
  } catch (error) {
    if (isApiError(error)) {
      return jsonError(
        error.message,
        error.statusCode,
        error.code,
        error.details,
      );
    }
    return jsonError(
      error instanceof Error ? error.message : "Payment failed",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}
