"use client";

import { useQuery } from "@tanstack/react-query";
import {
  paymentService,
  type PaymentListParams,
} from "@/features/payments/services/paymentService";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: PaymentListParams) =>
    [...paymentKeys.lists(), params ?? {}] as const,
};

export function usePayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: async () => paymentService.list(params),
  });
}
