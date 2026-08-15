import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { DailyMenu, DailyMenuItem } from "@/types/entities";

export const menuService = {
  list(date?: string) {
    return api.get<ApiResponse<DailyMenu[]>>(API_ENDPOINTS.menus.list, {
      date,
    });
  },
  save(input: {
    date: string;
    published?: boolean;
    breakfast?: DailyMenuItem;
    lunch?: DailyMenuItem;
    dinner?: DailyMenuItem;
  }) {
    return api.put<ApiResponse<DailyMenu>>(API_ENDPOINTS.menus.list, input);
  },
};
