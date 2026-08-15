import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ListParams, PaginatedResponse } from "@/types/api";
import type { Notification } from "@/types/entities";

export interface NotificationListParams extends ListParams {
  unread?: boolean;
  userId?: string;
}

export const notificationService = {
  list(params?: NotificationListParams) {
    return api.get<PaginatedResponse<Notification>>(
      API_ENDPOINTS.notifications.list,
      {
        page: params?.page,
        pageSize: params?.pageSize,
        unread:
          params?.unread === undefined ? undefined : String(params.unread),
        userId: params?.userId,
      },
    );
  },
};
