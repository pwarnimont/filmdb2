import {z} from 'zod';

export const filmFormatValues = ['35mm', '6x6', '6x4_5', '6x7', '6x9', 'other'] as const;

const optionalDate = z
  .union([z.string().datetime({offset: true}), z.string().length(0), z.null()])
  .optional()
  .transform((value) => {
    if (!value || (typeof value === 'string' && value.length === 0)) {
      return null;
    }
    return new Date(value);
  });

const requiredDate = z.string().datetime({offset: true}).transform((value) => new Date(value));

const optionalTrimmedString = z
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

export const filmRollCreateSchema = z.object({
  filmId: z.string().min(1),
  filmName: z.string().min(1),
  boxIso: z.number().int().positive(),
  shotIso: z.number().int().positive().optional().nullable(),
  dateShot: optionalDate,
  cameraName: z.string().optional().nullable(),
  filmFormat: z.enum(filmFormatValues),
  exposures: z.number().int().positive(),
  isDeveloped: z.boolean().optional(),
  isScanned: z.boolean().optional(),
  scanFolder: optionalTrimmedString.optional()
});

export const filmRollUpdateSchema = filmRollCreateSchema.partial();

export const developmentSchema = z.object({
  developer: z.string().min(1),
  temperatureC: z.number().min(0).max(100),
  dilution: z.string().min(1),
  timeSeconds: z.number().int().positive(),
  dateDeveloped: requiredDate,
  agitationScheme: z.string().min(1)
});

export const markDevelopedSchema = z.object({
  development: developmentSchema.partial().optional()
});

export const paginationQuerySchema = z.object({
  search: z.string().optional(),
  isDeveloped: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(['filmName', 'dateShot', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});

export type FilmRollCreateInput = z.infer<typeof filmRollCreateSchema>;
export type FilmRollUpdateInput = z.infer<typeof filmRollUpdateSchema>;
export type DevelopmentInput = z.infer<typeof developmentSchema>;
export type PartialDevelopmentInput = Partial<DevelopmentInput>;
export type MarkDevelopedInput = z.infer<typeof markDevelopedSchema>;
export type FilmRollQueryInput = z.infer<typeof paginationQuerySchema>;
