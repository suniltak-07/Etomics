import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { ServiceabilityResult } from "@/lib/serviceability/checkPincode";

export const serviceabilityService = {
  check(pincode: string) {
    return api.get<ApiResponse<ServiceabilityResult>>(
      API_ENDPOINTS.serviceability.check,
      { pincode },
    );
  },
};
