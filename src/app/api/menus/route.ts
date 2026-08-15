import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { SubscriptionStatus, UserRole } from "@/types/enums";
import type { DailyMenu, DailyMenuItem } from "@/types/entities";

export const dynamic = "force-dynamic";

const menuItemSchema = z
  .object({
    name: z.string().min(1).max(160),
    description: z.string().max(400).optional(),
  })
  .optional();

const upsertMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  published: z.boolean().optional(),
  breakfast: menuItemSchema,
  lunch: menuItemSchema,
  dinner: menuItemSchema,
});

function hasLiveSubscription(customerId: string): boolean {
  return getDb().subscriptions.some(
    (item) =>
      item.customerId === customerId &&
      (item.status === SubscriptionStatus.ACTIVE ||
        item.status === SubscriptionStatus.PAUSED),
  );
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.MENUS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const db = getDb();

  if (auth.role === UserRole.CUSTOMER && !hasLiveSubscription(auth.id)) {
    return jsonError(
      "Today’s menu is available after you start a subscription.",
      403,
      ErrorCode.FORBIDDEN,
    );
  }

  let menus = [...db.dailyMenus];
  if (auth.role === UserRole.CUSTOMER) {
    menus = menus.filter((item) => item.published);
  }
  if (date) {
    menus = menus.filter((item) => item.date === date);
  }
  menus.sort((a, b) => b.date.localeCompare(a.date));
  return jsonOk(menus);
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  if (!isAdminRole(auth.role)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }
  const denied = requirePermission(auth, Permission.MENUS_UPDATE);
  if (denied) return denied;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;
  const parsed = upsertMenuSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const timestamp = nowIso();
  const existing = getDb().dailyMenus.find(
    (item) => item.date === parsed.data.date,
  );
  const next: DailyMenu = {
    id: existing?.id ?? createId("menu"),
    date: parsed.data.date,
    published: parsed.data.published ?? existing?.published ?? true,
    breakfast:
      (parsed.data.breakfast as DailyMenuItem | undefined) ??
      existing?.breakfast,
    lunch: (parsed.data.lunch as DailyMenuItem | undefined) ?? existing?.lunch,
    dinner:
      (parsed.data.dinner as DailyMenuItem | undefined) ?? existing?.dinner,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    const index = db.dailyMenus.findIndex((item) => item.date === next.date);
    if (index >= 0) db.dailyMenus[index] = next;
    else db.dailyMenus.push(next);
  });

  return jsonOk(next, { message: "Menu saved" });
}
