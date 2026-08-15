"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionService,
  type SubscriptionListParams,
} from "@/features/subscriptions/services/subscriptionService";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  list: (params?: SubscriptionListParams) =>
    [...subscriptionKeys.all, "list", params] as const,
  detail: (id: string) => [...subscriptionKeys.all, "detail", id] as const,
};

export function useSubscriptions(params?: SubscriptionListParams) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => subscriptionService.list(params),
  });
}

export function useSubscription(id: string | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id ?? ""),
    queryFn: () => subscriptionService.getById(id!),
    enabled: Boolean(id),
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
    mutationFn: ({
      id,
      cancellationReason,
    }: {
      id: string;
      cancellationReason?: string;
    }) => subscriptionService.cancel(id, cancellationReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useChangeSubscriptionAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, addressId }: { id: string; addressId: string }) =>
      subscriptionService.changeAddress(id, addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useMealSkips(id: string | undefined) {
  return useQuery({
    queryKey: [...subscriptionKeys.detail(id ?? ""), "skips"],
    queryFn: () => subscriptionService.listSkips(id!),
    enabled: Boolean(id),
  });
}

export function useSkipMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      mealType,
    }: {
      id: string;
      date: string;
      mealType: import("@/types/enums").MealType;
    }) => subscriptionService.skipMeal(id, { date, mealType }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useRestoreMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      mealType,
    }: {
      id: string;
      date: string;
      mealType: import("@/types/enums").MealType;
    }) => subscriptionService.restoreMeal(id, { date, mealType }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useUpdateSubscriptionMeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      mealTypes,
    }: {
      id: string;
      mealTypes: import("@/types/enums").MealType[];
    }) => subscriptionService.updateMeals(id, { mealTypes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
