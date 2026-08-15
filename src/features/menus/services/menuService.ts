import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { DailyMenu, DailyMenuSlot } from "@/types/entities";

export const menuService = {
  list(date?: string) {
    return api.get<ApiResponse<DailyMenu[]>>(API_ENDPOINTS.menus.list, {
      date,
    });
  },
  save(input: {
    date: string;
    published?: boolean;
    breakfast?: DailyMenuSlot;
    lunch?: DailyMenuSlot;
    dinner?: DailyMenuSlot;
  }) {
    return api.put<ApiResponse<DailyMenu>>(API_ENDPOINTS.menus.list, input);
  },
};
