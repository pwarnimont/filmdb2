import type {Request, Response} from 'express';

import {
  developmentSchema,
  filmRollCreateSchema,
  filmRollUpdateSchema,
  markDevelopedSchema,
  paginationQuerySchema
} from '../schemas/film-roll.schema';
import {asyncHandler} from '../utils/async-handler';
import {parseWithSchema} from '../utils/validation';
import {filmRollService} from '../services/film-roll.service';

export const listFilmRolls = asyncHandler(async (req: Request, res: Response) => {
  const query = parseWithSchema(paginationQuerySchema, req.query);
  const result = await filmRollService.listFilmRolls(req.currentUser!, query);
  res.json(result);
});

export const getFilmRoll = asyncHandler(async (req: Request, res: Response) => {
  const roll = await filmRollService.getFilmRollById(req.params.id, req.currentUser!);
  res.json(roll);
});

export const createFilmRoll = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(filmRollCreateSchema, req.body);
  const roll = await filmRollService.createFilmRoll(data, req.currentUser!);
  res.status(201).json(roll);
});

export const updateFilmRoll = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(filmRollUpdateSchema, req.body);
  const roll = await filmRollService.updateFilmRoll(req.params.id, data, req.currentUser!);
  res.json(roll);
});

export const deleteFilmRoll = asyncHandler(async (req: Request, res: Response) => {
  await filmRollService.deleteFilmRoll(req.params.id, req.currentUser!);
  res.status(204).send();
});

export const upsertDevelopment = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(developmentSchema, req.body);
  const roll = await filmRollService.upsertDevelopment(req.params.id, data, req.currentUser!);
  res.json(roll);
});

export const deleteDevelopment = asyncHandler(async (req: Request, res: Response) => {
  const roll = await filmRollService.deleteDevelopment(req.params.id, req.currentUser!);
  res.json(roll);
});

export const markDeveloped = asyncHandler(async (req: Request, res: Response) => {
  const data = parseWithSchema(markDevelopedSchema, req.body ?? {});
  const roll = await filmRollService.markDeveloped(req.params.id, req.currentUser!, data.development);
  res.json(roll);
});
