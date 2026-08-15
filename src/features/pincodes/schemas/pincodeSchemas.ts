import { z } from "zod";

export const createPincodeSchema = z.object({
  cityId: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  areaName: z.string().max(120).optional(),
  isActive: z.boolean().default(true),
});

export const updatePincodeSchema = createPincodeSchema.partial();

export type CreatePincodeInput = z.infer<typeof createPincodeSchema>;
export type UpdatePincodeInput = z.infer<typeof updatePincodeSchema>;
