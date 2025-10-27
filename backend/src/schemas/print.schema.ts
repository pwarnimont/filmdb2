import {z} from 'zod';

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
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

const splitGradeStepSchema = z.object({
  filter: z.string().min(1, 'Filter is required'),
  exposureSeconds: z
    .number({invalid_type_error: 'Exposure must be a number'})
    .int('Exposure must be an integer')
    .positive('Exposure must be positive')
});

const splitGradeStepsField = z
  .union([z.array(splitGradeStepSchema), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return value.length > 0 ? value : null;
  });

export const printCreateSchema = z.object({
  filmRollId: z.string().uuid('A valid film roll is required'),
  frameNumber: z
    .number({invalid_type_error: 'Frame number must be a number'})
    .int('Frame number must be an integer')
    .positive('Frame number must be positive'),
  paperType: z.string().min(1, 'Paper type is required'),
  paperSize: z.string().min(1, 'Paper size is required'),
  paperManufacturer: z.string().min(1, 'Paper manufacturer is required'),
  developmentTimeSeconds: z
    .number({invalid_type_error: 'Development time must be a number'})
    .int('Development time must be an integer')
    .positive('Development time must be positive'),
  fixingTimeSeconds: z
    .number({invalid_type_error: 'Fixing time must be a number'})
    .int('Fixing time must be an integer')
    .positive('Fixing time must be positive'),
  washingTimeSeconds: z
    .number({invalid_type_error: 'Washing time must be a number'})
    .int('Washing time must be an integer')
    .positive('Washing time must be positive'),
  splitGradeInstructions: optionalText.default(null),
  splitGradeSteps: splitGradeStepsField.default(null)
});

export const printUpdateSchema = z
  .object({
    filmRollId: z.string().uuid().optional(),
    frameNumber: z
      .number({invalid_type_error: 'Frame number must be a number'})
      .int('Frame number must be an integer')
      .positive('Frame number must be positive')
      .optional(),
    paperType: z.string().min(1, 'Paper type is required').optional(),
    paperSize: z.string().min(1, 'Paper size is required').optional(),
    paperManufacturer: z.string().min(1, 'Paper manufacturer is required').optional(),
    developmentTimeSeconds: z
      .number({invalid_type_error: 'Development time must be a number'})
      .int('Development time must be an integer')
      .positive('Development time must be positive')
      .optional(),
    fixingTimeSeconds: z
      .number({invalid_type_error: 'Fixing time must be a number'})
      .int('Fixing time must be an integer')
      .positive('Fixing time must be positive')
      .optional(),
    washingTimeSeconds: z
      .number({invalid_type_error: 'Washing time must be a number'})
      .int('Washing time must be an integer')
      .positive('Washing time must be positive')
      .optional(),
    splitGradeInstructions: optionalText,
    splitGradeSteps: splitGradeStepsField
  })
  .partial();

export const printQuerySchema = z.object({
  filmRollId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10)
});

export type PrintCreateInput = z.infer<typeof printCreateSchema>;
export type PrintUpdateInput = z.infer<typeof printUpdateSchema>;
export type PrintQueryInput = z.infer<typeof printQuerySchema>;
export type SplitGradeStepInput = z.infer<typeof splitGradeStepSchema>;
