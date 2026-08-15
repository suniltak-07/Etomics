"use client";

import { useQuery } from "@tanstack/react-query";
import {
  planService,
  type PlanListParams,
} from "@/features/plans/services/planService";

export const planKeys = {
  all: ["plans"] as const,
  list: (params?: PlanListParams) => [...planKeys.all, "list", params] as const,
  detail: (id: string) => [...planKeys.all, "detail", id] as const,
};

export function usePlans(params?: PlanListParams) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => planService.list(params),
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: planKeys.detail(id ?? ""),
    queryFn: () => planService.getById(id!),
    enabled: Boolean(id),
  });
}
