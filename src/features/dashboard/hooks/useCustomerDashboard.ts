"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { voucherService } from "@/features/vouchers/services/voucherService";
import type { ValidateVoucherBody } from "@/features/vouchers/schemas/voucherSchemas";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import {
  orderService,
  type OrderListParams,
} from "@/features/orders/services/orderService";
import {
  notificationService,
  type NotificationListParams,
} from "@/features/notifications/services/notificationService";
import {
  customerService,
  type UpdateCustomerInput,
} from "@/features/customers/services/customerService";

export function useCustomerDashboard() {
  return useQuery({
    queryKey: ["dashboard", "customer"],
    queryFn: () => dashboardService.customer(),
  });
}

export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () => orderService.list(params),
  });
}

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => notificationService.list(params),
  });
}

export function useValidateVoucher() {
  return useMutation({
    mutationFn: (input: ValidateVoucherBody) => voucherService.validate(input),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => customerService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateCustomer() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customerService.update(id, input),
  });
}
