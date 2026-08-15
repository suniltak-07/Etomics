"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionService,
  type SubscriptionListParams,
} from "@/features/subscriptions/services/subscriptionService";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (params?: SubscriptionListParams) =>
    [...subscriptionKeys.lists(), params ?? {}] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
};

export function useSubscriptions(params?: SubscriptionListParams) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: async () => subscriptionService.list(params),
  });
}

export function useSubscription(id: string, enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: async () => {
      const res = await subscriptionService.getById(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.pause(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.resume(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      subscriptionService.cancel(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
