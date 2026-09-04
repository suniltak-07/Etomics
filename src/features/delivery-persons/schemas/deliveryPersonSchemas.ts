import { z } from "zod";
import { DeliveryPersonStatus, VehicleType } from "@/types/enums";

export const createDeliveryPersonSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  mobile: z.string().min(8).max(20),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.BIKE),
  vehicleNumber: z.string().max(40).optional(),
  status: z
    .nativeEnum(DeliveryPersonStatus)
    .default(DeliveryPersonStatus.ACTIVE),
  pincodeIds: z.array(z.string()).min(1, "Assign at least one pincode"),
});

export const updateDeliveryPersonSchema = createDeliveryPersonSchema.partial();

export type CreateDeliveryPersonInput = z.infer<
  typeof createDeliveryPersonSchema
>;
export type UpdateDeliveryPersonInput = z.infer<
  typeof updateDeliveryPersonSchema
>;
