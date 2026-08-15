import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Address } from "@/types/entities";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@/features/addresses/schemas/addressSchemas";

export const addressService = {
  list(customerId?: string) {
    return api.get<ApiResponse<Address[]>>(API_ENDPOINTS.addresses.list, {
      customerId,
    });
  },

  create(input: CreateAddressInput) {
    return api.post<ApiResponse<Address>>(
      API_ENDPOINTS.addresses.create,
      input,
    );
  },

  update(id: string, input: UpdateAddressInput) {
    return api.put<ApiResponse<Address>>(
      API_ENDPOINTS.addresses.update(id),
      input,
    );
  },

  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.addresses.delete(id),
    );
  },

  setDefault(id: string) {
    return api.patch<ApiResponse<Address>>(
      API_ENDPOINTS.addresses.setDefault(id),
    );
  },
};
