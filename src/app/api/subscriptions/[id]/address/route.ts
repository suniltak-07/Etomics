import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb, mutate } from "@/mocks/seed";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
} from "@/lib/api/route-helpers";
import { UserRole } from "@/types/enums";
import type { Subscription } from "@/types/entities";

export const dynamic = "force-dynamic";

const schema = z.object({
  addressId: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;
  const existing = getDb().subscriptions.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }

  if (
    !isAdminRole(auth.role) &&
    !(auth.role === UserRole.CUSTOMER && existing.customerId === auth.id)
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const address = getDb().addresses.find(
    (item) =>
      item.id === parsed.data.addressId &&
      item.customerId === existing.customerId,
  );
  if (!address) {
    return jsonError(
      "Address not found for customer",
      404,
      ErrorCode.NOT_FOUND,
    );
  }

  const updated: Subscription = {
    ...existing,
    addressId: address.id,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.subscriptions.findIndex((item) => item.id === id);
    if (index >= 0) db.subscriptions[index] = updated;
  });

  return jsonOk(updated, { message: "Subscription address updated" });
}
