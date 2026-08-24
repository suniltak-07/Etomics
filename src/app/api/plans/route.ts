import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  getAuthUser,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  jsonPaginated,
  paginate,
  parseJsonBody,
  parsePagination,
} from "@/lib/api/route-helpers";
import {
  applyUpstreamCookies,
  ofoodErrorResponse,
  ofoodFetch,
} from "@/lib/backend/proxy";
import {
  mapOfoodPlan,
  toOfoodCreateBody,
  unwrapOfoodPlans,
} from "@/lib/backend/plans";
import { getRequestAccessToken } from "@/lib/backend/session";
import { rolesFromJwt } from "@/lib/backend/jwt";
import { isAdminBackendRole } from "@/lib/backend/roles";
import { createPlanSchema } from "@/features/plans/schemas/planSchemas";
import type { Plan } from "@/types/entities";

export const dynamic = "force-dynamic";

function isAdminRequest(request: NextRequest): boolean {
  const user = getAuthUser(request);
  if (user && isAdminRole(user.role)) return true;
  const token = getRequestAccessToken(request);
  if (!token) return false;
  return rolesFromJwt(token).some(isAdminBackendRole);
}

function failedUpstream(
  status: number,
  error: Parameters<typeof ofoodErrorResponse>[1],
  cookies: string[],
  fallback: string,
) {
  return applyUpstreamCookies(
    ofoodErrorResponse(status, error, fallback),
    cookies,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = getRequestAccessToken(request);
  const admin = isAdminRequest(request);

  const result = await ofoodFetch<unknown>(
    admin ? "/api/v1/plans/all" : "/api/v1/plans",
    { accessToken },
  );

  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load plans",
    );
  }

  let plans = unwrapOfoodPlans(result.data)
    .map(mapOfoodPlan)
    .filter((plan): plan is Plan => plan !== null);

  const status = searchParams.get("status") ?? undefined;
  const featured = searchParams.get("featured");
  const search = searchParams.get("search")?.trim().toLowerCase();
  const sortBy = searchParams.get("sortBy") ?? "displayOrder";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

  if (!admin) {
    plans = plans.filter((plan) => plan.status === "ACTIVE");
  } else if (status) {
    plans = plans.filter((plan) => plan.status === status);
  }

  if (featured === "true") {
    plans = plans.filter((plan) => plan.isFeatured);
  } else if (featured === "false") {
    plans = plans.filter((plan) => !plan.isFeatured);
  }

  if (search) {
    plans = plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(search) ||
        plan.slug.toLowerCase().includes(search) ||
        plan.shortDescription.toLowerCase().includes(search),
    );
  }

  plans = [...plans].sort((a, b) => {
    const direction = sortOrder === "desc" ? -1 : 1;
    if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
    if (sortBy === "price") return (a.price - b.price) * direction;
    if (sortBy === "updatedAt") {
      return a.updatedAt.localeCompare(b.updatedAt) * direction;
    }
    return (a.displayOrder - b.displayOrder) * direction;
  });

  const { page, pageSize } = parsePagination(searchParams);
  const { items, meta } = paginate(plans, page, pageSize);
  return applyUpstreamCookies(jsonPaginated(items, meta), result.setCookies);
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>("/api/v1/plans", {
    method: "POST",
    accessToken,
    body: toOfoodCreateBody(parsed.data),
  });

  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to create plan",
    );
  }

  const plan = mapOfoodPlan(result.data);
  if (!plan) {
    return failedUpstream(
      502,
      { message: "Plan was created but the response could not be read." },
      result.setCookies,
      "Unable to create plan",
    );
  }

  return applyUpstreamCookies(
    jsonOk(plan, { status: 201, message: "Plan created" }),
    result.setCookies,
  );
}
