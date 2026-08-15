"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/features/addresses/services/addressService";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@/features/addresses/schemas/addressSchemas";

export const addressKeys = {
  all: ["addresses"] as const,
  list: (customerId?: string) =>
    [...addressKeys.all, "list", customerId] as const,
};

export function useAddresses(customerId?: string) {
  return useQuery({
    queryKey: addressKeys.list(customerId),
    queryFn: () => addressService.list(customerId),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressInput) => addressService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAddressInput }) =>
      addressService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
