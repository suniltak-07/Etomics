import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type { Plan } from "@/types/entities";
import type { PlanStatus } from "@/types/enums";
import type {
  CreatePlanInput,
  UpdatePlanInput,
} from "@/features/plans/schemas/planSchemas";

export interface PlanListParams extends ListParams {
  status?: PlanStatus | string;
  featured?: boolean;
}

export const planService = {
  list(params?: PlanListParams) {
    return api.get<PaginatedResponse<Plan>>(API_ENDPOINTS.plans.list, {
      page: params?.page,
      pageSize: params?.pageSize,
      search: params?.search,
      status: params?.status,
      featured:
        params?.featured === undefined ? undefined : String(params.featured),
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
  },

  getById(id: string) {
    return api.get<ApiResponse<Plan>>(API_ENDPOINTS.plans.detail(id));
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<Plan>>(API_ENDPOINTS.plans.bySlug(slug));
  },

  create(input: CreatePlanInput) {
    return api.post<ApiResponse<Plan>>(API_ENDPOINTS.plans.create, input);
  },

  update(id: string, input: UpdatePlanInput) {
    return api.put<ApiResponse<Plan>>(API_ENDPOINTS.plans.update(id), input);
  },

  updateStatus(id: string, status: PlanStatus) {
    return api.patch<ApiResponse<Plan>>(API_ENDPOINTS.plans.update(id), {
      status,
    });
  },

  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.plans.delete(id),
    );
  },
};
