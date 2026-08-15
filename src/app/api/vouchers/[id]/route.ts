import type { NextRequest } from "next/server";
import type { Voucher } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { updateVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.VOUCHERS_READ);
  if (denied) return denied;

  const { id } = await context.params;
  const voucher =
    getDb().vouchers.find((item) => item.id === id) ??
    getDb().vouchers.find(
      (item) => item.code.toUpperCase() === id.toUpperCase(),
    );

  if (!voucher) {
    return jsonError("Voucher not found", 404, ErrorCode.NOT_FOUND);
  }

  return jsonOk(voucher);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.VOUCHERS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().vouchers.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Voucher not found", 404, ErrorCode.NOT_FOUND);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  if (parsed.data.code) {
    const code = parsed.data.code.trim().toUpperCase();
    const conflict = getDb().vouchers.find(
      (item) => item.code.toUpperCase() === code && item.id !== existing.id,
    );
    if (conflict) {
      return jsonError("Voucher code already exists", 409, ErrorCode.CONFLICT);
    }
    parsed.data.code = code;
  }

  const updated: Voucher = {
    ...existing,
    ...parsed.data,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.vouchers.findIndex((item) => item.id === id);
    if (index >= 0) db.vouchers[index] = updated;
  });

  return jsonOk(updated, { message: "Voucher updated" });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return PUT(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.VOUCHERS_DELETE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().vouchers.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Voucher not found", 404, ErrorCode.NOT_FOUND);
  }

  mutate((db) => {
    db.vouchers = db.vouchers.filter((item) => item.id !== id);
  });

  return jsonOk({ id }, { message: "Voucher deleted" });
}
