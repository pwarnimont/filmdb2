import type {Request, Response} from 'express';

import {
  cameraCreateSchema,
  cameraQuerySchema,
  cameraUpdateSchema
} from '../schemas/camera.schema';
import {cameraService} from '../services/camera.service';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';

export const listCameras = asyncHandler(async (req: Request, res: Response) => {
  const query = parseWithSchema(cameraQuerySchema, req.query);
  const result = await cameraService.listCameras(req.currentUser!, query);
  res.json(result);
});

export const getCamera = asyncHandler(async (req: Request, res: Response) => {
  const camera = await cameraService.getCameraById(req.params.id, req.currentUser!);
  res.json(camera);
});

export const createCamera = asyncHandler(async (req: Request, res: Response) => {
  const payload = parseWithSchema(cameraCreateSchema, req.body);
  const camera = await cameraService.createCamera(payload, req.currentUser!);
  res.status(201).json(camera);
});

export const updateCamera = asyncHandler(async (req: Request, res: Response) => {
  const payload = parseWithSchema(cameraUpdateSchema, req.body);
  const camera = await cameraService.updateCamera(req.params.id, payload, req.currentUser!);
  res.json(camera);
});

export const deleteCamera = asyncHandler(async (req: Request, res: Response) => {
  await cameraService.deleteCamera(req.params.id, req.currentUser!);
  res.status(204).send();
});
