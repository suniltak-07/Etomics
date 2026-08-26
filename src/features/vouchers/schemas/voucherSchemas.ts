import { z } from "zod";
import { DiscountType, VoucherStatus } from "@/types/enums";

export const createVoucherSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  maxDiscount: z.number().positive().nullish(),
  minimumOrderValue: z.number().nonnegative().nullish(),
  startDate: z.string().min(1),
  expiryDate: z.string().min(1),
  usageLimit: z.number().int().positive().nullish(),
  usagePerCustomer: z.number().int().positive().nullish(),
  applicablePlans: z.array(z.string()).optional(),
  status: z.nativeEnum(VoucherStatus).default(VoucherStatus.DRAFT),
});

export const updateVoucherSchema = createVoucherSchema.partial();

export const validateVoucherSchema = z.object({
  code: z.string().min(1),
  planId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  orderAmount: z.number().positive().optional(),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
export type ValidateVoucherBody = z.infer<typeof validateVoucherSchema>;
