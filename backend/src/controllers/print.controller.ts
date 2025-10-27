import type {Request, Response} from 'express';

import {printCreateSchema, printQuerySchema, printUpdateSchema} from '../schemas/print.schema';
import {printService} from '../services/print.service';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';

export const listPrints = asyncHandler(async (req: Request, res: Response) => {
  const query = parseWithSchema(printQuerySchema, req.query);
  const result = await printService.listPrints(req.currentUser!, query);
  res.json(result);
});

export const getPrint = asyncHandler(async (req: Request, res: Response) => {
  const print = await printService.getPrintById(req.params.id, req.currentUser!);
  res.json(print);
});

export const createPrint = asyncHandler(async (req: Request, res: Response) => {
  const payload = parseWithSchema(printCreateSchema, req.body);
  const created = await printService.createPrint(payload, req.currentUser!);
  res.status(201).json(created);
});

export const updatePrint = asyncHandler(async (req: Request, res: Response) => {
  const payload = parseWithSchema(printUpdateSchema, req.body);
  const updated = await printService.updatePrint(req.params.id, payload, req.currentUser!);
  res.json(updated);
});

export const deletePrint = asyncHandler(async (req: Request, res: Response) => {
  await printService.deletePrint(req.params.id, req.currentUser!);
  res.status(204).send();
});
