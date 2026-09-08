import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type { CustomerPreferences } from "@/types/entities";
import type { PublicCustomer } from "@/lib/backend/customers";

export type { PublicCustomer };

export type CustomerListParams = ListParams;

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  preferences?: CustomerPreferences;
  isActive?: boolean;
}

export const customerService = {
  list(params?: CustomerListParams) {
    return api.get<PaginatedResponse<PublicCustomer>>(
      API_ENDPOINTS.customers.list,
      {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
      },
    );
  },

  getById(id: string) {
    return api.get<ApiResponse<PublicCustomer>>(
      API_ENDPOINTS.customers.detail(id),
    );
  },

  update(id: string, input: UpdateCustomerInput) {
    return api.patch<ApiResponse<PublicCustomer>>(
      API_ENDPOINTS.customers.update(id),
      input,
    );
  },
};
