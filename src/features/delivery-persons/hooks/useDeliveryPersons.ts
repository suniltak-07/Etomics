"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveryPersonService } from "@/features/delivery-persons/services/deliveryPersonService";
import type {
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
} from "@/features/delivery-persons/schemas/deliveryPersonSchemas";

export function useDeliveryPersons(params?: {
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["delivery-persons", params],
    queryFn: async () => {
      const res = await deliveryPersonService.list(params);
      return res.data;
    },
  });
}

export function useCreateDeliveryPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeliveryPersonInput) =>
      deliveryPersonService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-persons"] }),
  });
}

export function useUpdateDeliveryPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDeliveryPersonInput;
    }) => deliveryPersonService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-persons"] }),
  });
}

export function useDeleteDeliveryPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deliveryPersonService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-persons"] }),
  });
}
