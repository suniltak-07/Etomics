import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  getAuthUser,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import {
  applyUpstreamCookies,
  ofoodErrorResponse,
  ofoodFetch,
} from "@/lib/backend/proxy";
import { mapOfoodPlan, toOfoodUpdateBody } from "@/lib/backend/plans";
import { getRequestAccessToken } from "@/lib/backend/session";
import { rolesFromJwt } from "@/lib/backend/jwt";
import { isAdminBackendRole } from "@/lib/backend/roles";
import { PlanStatus } from "@/types/enums";
import {
  planStatusActionSchema,
  updatePlanSchema,
} from "@/features/plans/schemas/planSchemas";

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

async function loadPlan(
  id: string,
  accessToken: string | null,
  admin: boolean,
) {
  const path = admin ? `/api/v1/plans/${id}/admin` : `/api/v1/plans/${id}`;
  return ofoodFetch<unknown>(path, { accessToken });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = getRequestAccessToken(request);
  const admin = isAdminRequest(request);

  const result = await loadPlan(id, accessToken, admin);
  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Plan not found",
    );
  }

  const plan = mapOfoodPlan(result.data);
  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  return applyUpstreamCookies(jsonOk(plan), result.setCookies);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
  }

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const current = await loadPlan(id, accessToken, true);
  if (current.ok) {
    const existing = mapOfoodPlan(current.data);
    if (existing?.status === PlanStatus.ACTIVE) {
      return jsonError(
        "You can't edit an active plan. Set it inactive first.",
        409,
        ErrorCode.CONFLICT,
      );
    }
  }

  const result = await ofoodFetch<unknown>(`/api/v1/plans/${id}`, {
    method: "PUT",
    accessToken,
    body: toOfoodUpdateBody(parsed.data),
  });

  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update plan",
    );
  }

  const plan = mapOfoodPlan(result.data);
  if (!plan) {
    return failedUpstream(
      502,
      { message: "Plan was updated but the response could not be read." },
      result.setCookies,
      "Unable to update plan",
    );
  }

  return applyUpstreamCookies(
    jsonOk(plan, { message: "Plan updated" }),
    result.setCookies,
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
  }

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = planStatusActionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>(`/api/v1/plans/${id}`, {
    method: "PATCH",
    accessToken,
    body: { status: parsed.data.status },
  });

  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update plan status",
    );
  }

  const plan = mapOfoodPlan(result.data);
  if (!plan) {
    return failedUpstream(
      502,
      {
        message: "Plan status was updated but the response could not be read.",
      },
      result.setCookies,
      "Unable to update plan status",
    );
  }

  return applyUpstreamCookies(
    jsonOk(plan, { message: "Plan status updated" }),
    result.setCookies,
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
  }

  const { id } = await params;
  const result = await ofoodFetch<unknown>(`/api/v1/plans/${id}`, {
    method: "DELETE",
    accessToken,
  });

  if (!result.ok) {
    return failedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to delete plan",
    );
  }

  return applyUpstreamCookies(
    jsonOk({ id }, { message: "Plan deleted" }),
    result.setCookies,
  );
}
