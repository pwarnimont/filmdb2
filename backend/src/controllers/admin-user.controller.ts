import type {Request, Response} from 'express';

import {adminUserService} from '../services/admin-user.service';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';
import {adminUserCreateSchema, adminUserPasswordSchema, adminUserUpdateSchema} from '../schemas/admin.schema';

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await adminUserService.listUsers();
  res.json({users});
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(adminUserCreateSchema, req.body);
  const created = await adminUserService.createUser(data);
  res.status(201).json({user: created});
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(adminUserUpdateSchema, req.body);
  const updated = await adminUserService.updateUser(req.params.id, data, req.currentUser!.id);
  res.json({user: updated});
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(adminUserPasswordSchema, req.body);
  await adminUserService.resetPassword(req.params.id, data.password);
  res.status(204).send();
});
