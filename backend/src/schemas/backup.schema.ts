import {z} from 'zod';

import {filmFormatValues} from './film-roll.schema';

const roleValues = ['USER', 'ADMIN'] as const;

const isoDateTime = z.string().datetime({offset: true});

export const splitGradeStepSchema = z.object({
  filter: z.string(),
  exposureSeconds: z.number().int()
});

export const printBackupSchema = z.object({
  id: z.string(),
  filmRollId: z.string(),
  frameNumber: z.number().int(),
  paperType: z.string(),
  paperSize: z.string(),
  paperManufacturer: z.string(),
  developmentTimeSeconds: z.number().int(),
  fixingTimeSeconds: z.number().int(),
  washingTimeSeconds: z.number().int(),
  splitGradeInstructions: z.string().nullable(),
  splitGradeSteps: z.array(splitGradeStepSchema).nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
});

export const developmentBackupSchema = z.object({
  id: z.string(),
  filmRollId: z.string(),
  developer: z.string(),
  temperatureC: z.number(),
  dilution: z.string(),
  timeSeconds: z.number().int(),
  dateDeveloped: isoDateTime,
  agitationScheme: z.string()
});

export const filmRollBackupSchema = z.object({
  id: z.string(),
  filmId: z.string(),
  filmName: z.string(),
  boxIso: z.number().int(),
  shotIso: z.number().int().nullable(),
  dateShot: isoDateTime.nullable(),
  cameraName: z.string().nullable(),
  filmFormat: z.enum(filmFormatValues),
  exposures: z.number().int(),
  isDeveloped: z.boolean(),
  isScanned: z.boolean(),
  scanFolder: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  userId: z.string(),
  development: developmentBackupSchema.optional(),
  prints: z.array(printBackupSchema).optional().default([])
});

export const userBackupSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(roleValues),
  isActive: z.boolean(),
  passwordHash: z.string(),
  failedLoginAttempts: z.number().int(),
  lockoutUntil: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
});

export const backupPayloadSchema = z.object({
  filmRolls: z.array(filmRollBackupSchema),
  prints: z.array(printBackupSchema).optional().default([]),
  users: z.array(userBackupSchema).optional()
});

export type BackupPayload = z.infer<typeof backupPayloadSchema>;
export type PrintBackup = z.infer<typeof printBackupSchema>;
export type UserBackup = z.infer<typeof userBackupSchema>;
