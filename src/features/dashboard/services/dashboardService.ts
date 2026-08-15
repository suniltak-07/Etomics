import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Payment, Subscription } from "@/types/entities";

export interface AdminDashboardMetrics {
  customers: { total: number; active: number };
  plans: { total: number; active: number; featured: number };
  subscriptions: {
    total: number;
    active: number;
    paused: number;
    cancelled: number;
    pending: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    revenue: number;
    currency: string;
  };
  vouchers: { total: number; active: number };
  planPopularity: Array<{
    planId: string;
    name: string;
    slug: string;
    subscribers: number;
    activeSubscribers: number;
  }>;
  recentPayments: Payment[];
  recentSubscriptions: Subscription[];
}

export interface CustomerDashboardMetrics {
  customerId: string;
  subscriptions: {
    total: number;
    active: number;
    paused: number;
    cancelled: number;
  };
  payments: {
    total: number;
    successful: number;
    spent: number;
    currency: string;
  };
  addresses: {
    total: number;
    defaultAddressId: string | null;
  };
  notifications: {
    total: number;
    unread: number;
  };
  activeSubscription: Subscription | null;
  recentPayments: Payment[];
  recentSubscriptions: Subscription[];
}

export const dashboardService = {
  admin() {
    return api.get<ApiResponse<AdminDashboardMetrics>>(
      API_ENDPOINTS.dashboard.admin,
    );
  },

  customer() {
    return api.get<ApiResponse<CustomerDashboardMetrics>>(
      API_ENDPOINTS.dashboard.customer,
    );
  },
};
