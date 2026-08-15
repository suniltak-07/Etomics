import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { KitchenSheetRow } from "@/lib/kitchen/buildKitchenSheet";
import type { MealType } from "@/types/enums";

export const kitchenService = {
  list(params?: { date?: string; mealType?: MealType | string }) {
    return api.get<
      ApiResponse<{
        date: string;
        mealType: MealType | null;
        rows: KitchenSheetRow[];
      }>
    >(API_ENDPOINTS.kitchen.list, params);
  },
};
