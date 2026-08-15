"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentService,
  type CreatePaymentInput,
  type PaymentListParams,
} from "@/features/payments/services/paymentService";

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params?: PaymentListParams) =>
    [...paymentKeys.all, "list", params] as const,
};

export function usePayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentService.list(params),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => paymentService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
