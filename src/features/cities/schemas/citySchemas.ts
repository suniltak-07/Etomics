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
  centerLat: z.coerce.number().min(-90).max(90),
  centerLng: z.coerce.number().min(-180).max(180),
});

export const updateCitySchema = createCitySchema.partial();

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
