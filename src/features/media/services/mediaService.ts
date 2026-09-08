import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { MediaUpload } from "@/features/media/types";

export type { MediaUpload };

export const mediaService = {
  upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ApiResponse<MediaUpload>>(
      API_ENDPOINTS.media.upload,
      formData,
    );
  },
};
