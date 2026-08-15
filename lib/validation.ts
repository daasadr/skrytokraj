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
  hint: z.string().max(2000).nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  visibility: z.enum(["public", "private_user"]).optional(),
  recipientId: z.string().nullish(),
  arContent: z.string().max(2000).nullish(),
  regionId: z.string().nullish(),
});

export const updatePointSchema = z.object({
  name: z.string().trim().max(200).optional(),
  description: z.string().max(5000).nullish(),
  hint: z.string().max(2000).nullish(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  visibility: z.enum(["public", "private_user"]).optional(),
  recipientId: z.string().nullish(),
  arContent: z.string().max(2000).nullish(),
  regionId: z.string().nullish(),
  isActive: z.boolean().optional(),
});

export type CreatePointInput = z.infer<typeof createPointSchema>;
export type UpdatePointInput = z.infer<typeof updatePointSchema>;

// --- Oblasti (kraje) --------------------------------------------------------
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Slug smí obsahovat jen malá písmena, číslice a pomlčky.");

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Barva musí být hex, např. #8fae8b.")
  .nullish();

export const createRegionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(5000).nullish(),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  defaultZoom: z.number().min(1).max(20).optional(),
  color: colorSchema,
  isPublished: z.boolean().optional(),
});

export const updateRegionSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(5000).nullish(),
  centerLat: z.number().min(-90).max(90).optional(),
  centerLng: z.number().min(-180).max(180).optional(),
  defaultZoom: z.number().min(1).max(20).optional(),
  color: colorSchema,
  isPublished: z.boolean().optional(),
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
