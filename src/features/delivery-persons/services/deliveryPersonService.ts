import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { DeliveryPerson } from "@/types/entities";
import type {
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
} from "@/features/delivery-persons/schemas/deliveryPersonSchemas";

export const deliveryPersonService = {
  list(params?: { status?: string; search?: string }) {
    return api.get<ApiResponse<DeliveryPerson[]>>(
      API_ENDPOINTS.deliveryPersons.list,
      params,
    );
  },
  get(id: string) {
    return api.get<ApiResponse<DeliveryPerson>>(
      API_ENDPOINTS.deliveryPersons.detail(id),
    );
  },
  create(input: CreateDeliveryPersonInput) {
    return api.post<ApiResponse<DeliveryPerson>>(
      API_ENDPOINTS.deliveryPersons.create,
      input,
    );
  },
  update(id: string, input: UpdateDeliveryPersonInput) {
    return api.put<ApiResponse<DeliveryPerson>>(
      API_ENDPOINTS.deliveryPersons.update(id),
      input,
    );
  },
  remove(id: string) {
    return api.delete<ApiResponse<{ id: string }>>(
      API_ENDPOINTS.deliveryPersons.delete(id),
    );
  },
  stops(id: string, params?: { date?: string; mealType?: string }) {
    return api.get<
      ApiResponse<{
        date: string;
        mealType: string | null;
        person: DeliveryPerson;
        origin: { latitude: number; longitude: number };
        stops: Array<{
          sequence: number;
          id: string;
          latitude: number;
          longitude: number;
          customerName: string;
          address: string;
          pincode: string;
          mealTypes: string[];
          mobile?: string;
        }>;
      }>
    >(API_ENDPOINTS.deliveryPersons.route(id), params);
  },
};
