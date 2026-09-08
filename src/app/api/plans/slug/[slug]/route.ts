import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  getAuthUser,
  isAdminRole,
  jsonError,
  jsonOk,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies } from "@/lib/backend/proxy";
import { fetchActiveOfoodPlans } from "@/lib/backend/plans";
import { getRequestAccessToken } from "@/lib/backend/session";
import { rolesFromJwt } from "@/lib/backend/jwt";
import { isAdminBackendRole } from "@/lib/backend/roles";

export const dynamic = "force-dynamic";

function isAdminRequest(request: NextRequest): boolean {
  const user = getAuthUser(request);
  if (user && isAdminRole(user.role)) return true;
  const token = getRequestAccessToken(request);
  if (!token) return false;
  return rolesFromJwt(token).some(isAdminBackendRole);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { result, plans } = await fetchActiveOfoodPlans();
  if (!result.ok) {
    return applyUpstreamCookies(
      jsonError(
        result.error?.message || "Unable to load plans",
        result.status,
        result.error?.code || ErrorCode.BAD_GATEWAY,
      ),
      result.setCookies,
    );
  }

  const normalized = slug.trim().toLowerCase();
  const plan = plans.find((item) => item.slug.toLowerCase() === normalized);
  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!isAdminRequest(request) && plan.status !== "ACTIVE") {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  return applyUpstreamCookies(jsonOk(plan), result.setCookies);
}
