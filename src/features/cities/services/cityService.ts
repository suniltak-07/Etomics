import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { City } from "@/types/entities";
import type {
  CreateCityInput,
  UpdateCityInput,
} from "@/features/cities/schemas/citySchemas";

export const cityService = {
  list(params?: { status?: string; search?: string }) {
    return api.get<ApiResponse<City[]>>(API_ENDPOINTS.cities.list, params);
  },
  get(id: string) {
    return api.get<ApiResponse<City>>(API_ENDPOINTS.cities.detail(id));
  },
  create(input: CreateCityInput) {
    return api.post<ApiResponse<City>>(API_ENDPOINTS.cities.create, input);
  },
  update(id: string, input: UpdateCityInput) {
    return api.put<ApiResponse<City>>(API_ENDPOINTS.cities.update(id), input);
  },
  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.cities.delete(id),
    );
  },
};
