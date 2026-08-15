"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cityService } from "@/features/cities/services/cityService";
import type {
  CreateCityInput,
  UpdateCityInput,
} from "@/features/cities/schemas/citySchemas";

export function useCities(params?: {
  status?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["cities", params],
    queryFn: async () => {
      const res = await cityService.list(params);
      return res.data;
    },
  });
}

export function useCreateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCityInput) => cityService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}

export function useUpdateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCityInput }) =>
      cityService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}

export function useDeleteCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cityService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}
