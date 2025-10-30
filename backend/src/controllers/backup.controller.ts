import type {Request, Response} from 'express';

import {backupPayloadSchema} from '../schemas/backup.schema';
import {backupService} from '../services/backup.service';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';

export const exportBackup = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await backupService.exportForUser(req.currentUser!);
  res.json({
    generatedAt: new Date().toISOString(),
    ...snapshot
  });
});

export const importBackup = asyncHandler(async (req: Request, res: Response) => {
  const payload = parseWithSchema(backupPayloadSchema, req.body);
  const summary = await backupService.importForUser(payload, req.currentUser!);
  res.status(200).json(summary);
});
