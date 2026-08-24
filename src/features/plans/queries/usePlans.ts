"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  planService,
  type PlanListParams,
} from "@/features/plans/services/planService";
import type {
  CreatePlanInput,
  UpdatePlanInput,
} from "@/features/plans/schemas/planSchemas";
import type { PlanStatus } from "@/types/enums";

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (params?: PlanListParams) =>
    [...planKeys.lists(), params ?? {}] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
};

export function usePlans(params?: PlanListParams) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: async () => planService.list(params),
  });
}

export function usePlan(id: string, enabled = true) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: async () => {
      const res = await planService.getById(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => planService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useUpdatePlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlanInput) => planService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: planKeys.detail(id) });
    },
  });
}

export function useUpdatePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlanStatus }) =>
      planService.updateStatus(id, status),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: planKeys.detail(id) });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planService.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.removeQueries({ queryKey: planKeys.detail(id) });
    },
  });
}
