import type {Request, Response} from 'express';

import {updateRegistrationSchema} from '../schemas/admin.schema';
import {settingsService} from '../services/settings.service';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';

export const getRegistrationSetting = asyncHandler(async (_req: Request, res: Response) => {
  const allowRegistration = await settingsService.getAllowRegistration();
  res.json({allowRegistration});
});

export const updateRegistrationSetting = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(updateRegistrationSchema, req.body);
  const allowRegistration = await settingsService.updateAllowRegistration(data.allowRegistration);
  res.json({allowRegistration});
});
