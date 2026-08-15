"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  customerService,
  type CustomerListParams,
  type UpdateCustomerInput,
} from "@/features/customers/services/customerService";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params?: CustomerListParams) =>
    [...customerKeys.lists(), params ?? {}] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => customerService.list(params),
  });
}

export function useCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const res = await customerService.getById(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customerService.update(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      void queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: ["kitchen"] });
    },
  });
}
