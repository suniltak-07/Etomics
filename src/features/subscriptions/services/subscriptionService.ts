import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type { Subscription } from "@/types/entities";
import type { SubscriptionStatus } from "@/types/enums";

export interface SubscriptionListParams extends ListParams {
  status?: SubscriptionStatus | string;
  customerId?: string;
}

export interface CreateSubscriptionInput {
  planId: string;
  addressId: string;
  customerId?: string;
  voucherCode?: string;
  status?: SubscriptionStatus;
}

export interface PatchSubscriptionInput {
  action?:
    | "pause"
    | "resume"
    | "cancel"
    | "changeAddress"
    | "change-address"
    | "setStatus";
  addressId?: string;
  status?: SubscriptionStatus;
  cancellationReason?: string;
}

export const subscriptionService = {
  list(params?: SubscriptionListParams) {
    return api.get<PaginatedResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.list,
      {
        page: params?.page,
        pageSize: params?.pageSize,
        status: params?.status,
        customerId: params?.customerId,
      },
    );
  },

  getById(id: string) {
    return api.get<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.detail(id),
    );
  },

  create(input: CreateSubscriptionInput) {
    return api.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.create,
      input,
    );
  },

  update(id: string, input: PatchSubscriptionInput) {
    return api.patch<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.update(id),
      input,
    );
  },

  pause(id: string) {
    return api.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.pause(id),
    );
  },

  resume(id: string) {
    return api.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.resume(id),
    );
  },

  cancel(id: string, cancellationReason?: string) {
    return api.post<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.cancel(id),
      cancellationReason ? { cancellationReason } : {},
    );
  },

  changeAddress(id: string, addressId: string) {
    return api.patch<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.changeAddress(id),
      { addressId },
    );
  },

  listSkips(id: string) {
    return api.get<ApiResponse<import("@/types/entities").MealSkip[]>>(
      API_ENDPOINTS.subscriptions.skips(id),
    );
  },

  skipMeal(
    id: string,
    input: { date: string; mealType: import("@/types/enums").MealType },
  ) {
    return api.post<ApiResponse<import("@/types/entities").MealSkip>>(
      API_ENDPOINTS.subscriptions.skips(id),
      input,
    );
  },

  restoreMeal(
    id: string,
    input: { date: string; mealType: import("@/types/enums").MealType },
  ) {
    return api.delete<ApiResponse<{ restored: boolean }>>(
      `${API_ENDPOINTS.subscriptions.skips(id)}?date=${input.date}&mealType=${input.mealType}`,
    );
  },

  updateMeals(
    id: string,
    input: {
      mealTypes: import("@/types/enums").MealType[];
      firstAffectedDate?: string;
    },
  ) {
    return api.patch<ApiResponse<Subscription>>(
      API_ENDPOINTS.subscriptions.meals(id),
      input,
    );
  },
};
