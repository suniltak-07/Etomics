import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type {
  Payment,
  PaymentTransaction,
  Subscription,
} from "@/types/entities";
import type { CheckoutPricingResult } from "@/lib/pricing/pricingEngine";
import type {
  DurationKind,
  FoodPreference,
  HealthGoal,
  MealType,
} from "@/types/enums";

export interface PaymentListParams extends ListParams {
  status?: string;
  customerId?: string;
}

export interface CreatePaymentInput {
  planId: string;
  addressId: string;
  customerId?: string;
  voucherCode?: string;
  method?: string;
  durationKind?: DurationKind;
  mealTypes?: MealType[];
  startDate?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  foodPreference?: FoodPreference;
  allergies?: string;
  healthGoal?: HealthGoal;
  /** Client amounts are ignored — server recalculates via pricingEngine */
  amount?: number;
}

export interface CreatePaymentResult {
  payment: Payment;
  transaction: PaymentTransaction;
  subscription: Subscription;
  pricing: CheckoutPricingResult;
}

export const paymentService = {
  list(params?: PaymentListParams) {
    return api.get<PaginatedResponse<Payment>>(API_ENDPOINTS.payments.list, {
      page: params?.page,
      pageSize: params?.pageSize,
      status: params?.status,
      customerId: params?.customerId,
    });
  },

  create(input: CreatePaymentInput) {
    return api.post<ApiResponse<CreatePaymentResult>>(
      API_ENDPOINTS.payments.create,
      input,
    );
  },
};
