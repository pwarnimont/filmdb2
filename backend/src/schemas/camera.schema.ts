import {z} from 'zod';

const trimmedString = z
  .string()
  .min(1)
  .transform((value) => value.trim());

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalDate = z
  .union([z.string().datetime({offset: true}), z.string().length(0), z.null()])
  .optional()
  .transform((value) => {
    if (!value || (typeof value === 'string' && value.length === 0)) {
      return null;
    }
    return new Date(value);
  });

const baseSchema = z.object({
  manufacturer: trimmedString,
  model: trimmedString,
  releaseDate: optionalDate,
  purchaseDate: optionalDate,
  filmType: trimmedString,
  lenses: z
    .array(trimmedString)
    .min(1, 'Add at least one lens to describe this camera'),
  notes: optionalText.optional()
});

export const cameraCreateSchema = baseSchema;
export const cameraUpdateSchema = baseSchema.partial();

export const cameraQuerySchema = z.object({
  search: z.string().optional(),
  filmType: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(10)
});

export type CameraCreateInput = z.infer<typeof cameraCreateSchema>;
export type CameraUpdateInput = z.infer<typeof cameraUpdateSchema>;
export type CameraQueryInput = z.infer<typeof cameraQuerySchema>;
