import { z } from "zod";

// Validace vstupů pro body na mapě.
const POINT_TYPES = [
  "quest",
  "treasure",
  "story_location",
  "ar_location",
  "message_box",
] as const;

export const createPointSchema = z.object({
  type: z.enum(POINT_TYPES),
  name: z.string().trim().max(200).optional(),
  description: z.string().max(5000).nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  visibility: z.enum(["public", "private_user"]).optional(),
  recipientId: z.string().nullish(),
  arContent: z.string().max(2000).nullish(),
});

export const updatePointSchema = z.object({
  name: z.string().trim().max(200).optional(),
  description: z.string().max(5000).nullish(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  visibility: z.enum(["public", "private_user"]).optional(),
  recipientId: z.string().nullish(),
  arContent: z.string().max(2000).nullish(),
  isActive: z.boolean().optional(),
});

export type CreatePointInput = z.infer<typeof createPointSchema>;
export type UpdatePointInput = z.infer<typeof updatePointSchema>;
