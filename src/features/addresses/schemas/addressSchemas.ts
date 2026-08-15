import { z } from "zod";
import { AddressType } from "@/types/enums";

export const createAddressSchema = z.object({
  customerId: z.string().min(1).optional(),
  fullName: z.string().min(1).max(120),
  mobile: z.string().min(8).max(20),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  area: z.string().max(120).optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  cityId: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  addressType: z.nativeEnum(AddressType).default(AddressType.HOME),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial().omit({
  customerId: true,
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
