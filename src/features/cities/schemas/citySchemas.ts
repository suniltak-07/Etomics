import { z } from "zod";
import { CityStatus } from "@/types/enums";

export const createCitySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase slug, e.g. bengaluru"),
  state: z.string().min(2).max(120),
  status: z.nativeEnum(CityStatus).default(CityStatus.ACTIVE),
});

export const updateCitySchema = createCitySchema.partial();

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
