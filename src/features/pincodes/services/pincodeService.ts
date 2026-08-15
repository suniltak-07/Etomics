import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { ServicePincode } from "@/types/entities";
import type {
  CreatePincodeInput,
  UpdatePincodeInput,
} from "@/features/pincodes/schemas/pincodeSchemas";

export const pincodeService = {
  list(params?: { cityId?: string; search?: string; activeOnly?: boolean }) {
    return api.get<ApiResponse<ServicePincode[]>>(API_ENDPOINTS.pincodes.list, {
      cityId: params?.cityId,
      search: params?.search,
      activeOnly: params?.activeOnly ? "true" : undefined,
    });
  },
  create(input: CreatePincodeInput) {
    return api.post<ApiResponse<ServicePincode>>(
      API_ENDPOINTS.pincodes.create,
      input,
    );
  },
  update(id: string, input: UpdatePincodeInput) {
    return api.put<ApiResponse<ServicePincode>>(
      API_ENDPOINTS.pincodes.update(id),
      input,
    );
  },
  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.pincodes.delete(id),
    );
  },
};
