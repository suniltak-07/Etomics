import { z } from "zod";
import { DeliveryPersonStatus, VehicleType } from "@/types/enums";

export const createDeliveryPersonSchema = z.object({
  fullName: z.string().min(2).max(120),
  mobile: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.BIKE),
  vehicleNumber: z.string().max(40).optional(),
  status: z
    .nativeEnum(DeliveryPersonStatus)
    .default(DeliveryPersonStatus.ACTIVE),
  pincodeIds: z.array(z.string()).min(1, "Assign at least one pincode"),
  notes: z.string().max(500).optional(),
});

export const updateDeliveryPersonSchema = createDeliveryPersonSchema.partial();

export type CreateDeliveryPersonInput = z.infer<
  typeof createDeliveryPersonSchema
>;
export type UpdateDeliveryPersonInput = z.infer<
  typeof updateDeliveryPersonSchema
>;
