import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ListParams, PaginatedResponse } from "@/types/api";
import type { Order } from "@/types/entities";

export interface OrderListParams extends ListParams {
  status?: string;
  customerId?: string;
}

export const orderService = {
  list(params?: OrderListParams) {
    return api.get<PaginatedResponse<Order>>(API_ENDPOINTS.orders.list, {
      page: params?.page,
      pageSize: params?.pageSize,
      status: params?.status,
      customerId: params?.customerId,
    });
  },
};
