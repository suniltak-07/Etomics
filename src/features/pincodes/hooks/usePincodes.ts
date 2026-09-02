"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pincodeService } from "@/features/pincodes/services/pincodeService";
import type {
  CreatePincodeInput,
  UpdatePincodeInput,
} from "@/features/pincodes/schemas/pincodeSchemas";
import { ApiError } from "@/lib/api/errors";

export function usePincodes(params?: {
  cityId?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["pincodes", params],
    queryFn: async () => {
      const res = await pincodeService.list(params);
      return res.data;
    },
  });
}

export function useCreatePincode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePincodeInput) => pincodeService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pincodes"] }),
  });
}

export function useUpdatePincode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePincodeInput }) =>
      pincodeService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pincodes"] }),
  });
}

export function usePincodeLookup(pincode: string, enabled: boolean) {
  const trimmed = pincode.trim();
  const valid = /^\d{6}$/.test(trimmed);

  return useQuery({
    queryKey: ["pincode-lookup", trimmed],
    queryFn: async () => {
      const res = await pincodeService.lookup(trimmed);
      return res.data;
    },
    enabled: enabled && valid,
    staleTime: 1000 * 60 * 60,
    retry: (count, error) => {
      if (error instanceof ApiError && error.statusCode === 404) return false;
      return count < 1;
    },
  });
}

export function useDeletePincode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pincodeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pincodes"] });
      qc.invalidateQueries({ queryKey: ["delivery-persons"] });
    },
  });
}
