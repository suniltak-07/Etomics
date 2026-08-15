"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboardService";

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: async () => {
      const res = await dashboardService.admin();
      return res.data;
    },
  });
}
