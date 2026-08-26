import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type { Voucher } from "@/types/entities";
import type {
  CreateVoucherInput,
  UpdateVoucherInput,
  ValidateVoucherBody,
} from "@/features/vouchers/schemas/voucherSchemas";

export interface VoucherListParams extends ListParams {
  status?: string;
}

export interface ValidateVoucherResult {
  valid: boolean;
  code: string;
  voucherId: string;
  discountAmount: number;
  planPrice: number;
  message?: string;
}

export const voucherService = {
  list(params?: VoucherListParams) {
    return api.get<PaginatedResponse<Voucher>>(API_ENDPOINTS.vouchers.list, {
      page: params?.page,
      pageSize: params?.pageSize,
      search: params?.search,
      status: params?.status,
    });
  },

  getById(id: string) {
    return api.get<ApiResponse<Voucher>>(API_ENDPOINTS.vouchers.detail(id));
  },

  getByCode(code: string) {
    return api.get<ApiResponse<Voucher>>(API_ENDPOINTS.vouchers.byCode(code));
  },

  create(input: CreateVoucherInput) {
    return api.post<ApiResponse<Voucher>>(API_ENDPOINTS.vouchers.create, input);
  },

  update(id: string, input: UpdateVoucherInput) {
    return api.put<ApiResponse<Voucher>>(
      API_ENDPOINTS.vouchers.update(id),
      input,
    );
  },

  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.vouchers.delete(id),
    );
  },

  validate(input: ValidateVoucherBody) {
    return api.post<ApiResponse<ValidateVoucherResult>>(
      API_ENDPOINTS.vouchers.validate,
      input,
    );
  },
};
