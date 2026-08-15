import type { NextRequest } from "next/server";
import { PlanStatus } from "@/types/enums";
import { getDb } from "@/mocks/seed";
import { ErrorCode } from "@/lib/api/errors";
import {
  getAuthUser,
  isAdminRole,
  jsonError,
  jsonOk,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const plan = getDb().plans.find((item) => item.slug === slug);

  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const user = getAuthUser(request);
  if (plan.status !== PlanStatus.ACTIVE && !(user && isAdminRole(user.role))) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  return jsonOk(plan);
}
