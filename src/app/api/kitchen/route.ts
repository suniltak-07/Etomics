import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import {
  isErrorResponse,
  jsonOk,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { MealType } from "@/types/enums";
import { buildKitchenSheet } from "@/lib/kitchen/buildKitchenSheet";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.KITCHEN_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? toDateOnly(new Date());
  const mealParam = searchParams.get("mealType");
  const mealType =
    mealParam && Object.values(MealType).includes(mealParam as MealType)
      ? (mealParam as MealType)
      : null;

  const rows = buildKitchenSheet(getDb(), date, mealType);
  return jsonOk({ date, mealType, rows });
}
