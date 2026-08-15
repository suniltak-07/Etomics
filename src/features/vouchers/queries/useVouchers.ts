"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  voucherService,
  type VoucherListParams,
} from "@/features/vouchers/services/voucherService";
import type {
  CreateVoucherInput,
  UpdateVoucherInput,
} from "@/features/vouchers/schemas/voucherSchemas";

export const voucherKeys = {
  all: ["vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  list: (params?: VoucherListParams) =>
    [...voucherKeys.lists(), params ?? {}] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (id: string) => [...voucherKeys.details(), id] as const,
};

export function useVouchers(params?: VoucherListParams) {
  return useQuery({
    queryKey: voucherKeys.list(params),
    queryFn: async () => voucherService.list(params),
  });
}

export function useVoucher(id: string, enabled = true) {
  return useQuery({
    queryKey: voucherKeys.detail(id),
    queryFn: async () => {
      const res = await voucherService.getById(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVoucherInput) => voucherService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all });
    },
  });
}

export function useUpdateVoucher(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVoucherInput) => voucherService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all });
      void queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) });
    },
  });
}
