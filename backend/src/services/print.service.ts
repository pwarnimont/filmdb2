import {Prisma} from '@prisma/client';
import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import {PrintCreateInput, PrintQueryInput, PrintUpdateInput, SplitGradeStepInput} from '../schemas/print.schema';
import type {UserRolePayload} from '../types/user';

export interface SplitGradeStepDto extends SplitGradeStepInput {}

export interface PrintDto {
  id: string;
  filmRollId: string;
  frameNumber: number;
  paperType: string;
  paperSize: string;
  paperManufacturer: string;
  developmentTimeSeconds: number;
  fixingTimeSeconds: number;
  washingTimeSeconds: number;
  splitGradeInstructions: string | null;
  splitGradeSteps: SplitGradeStepDto[] | null;
  createdAt: string;
  updatedAt: string;
  filmRoll?: {
    id: string;
    filmName: string;
    filmId: string;
  };
}

type PrintRecord = {
  id: string;
  filmRollId: string;
  frameNumber: number;
  paperType: string;
  paperSize: string;
  paperManufacturer: string;
  developmentTimeSeconds: number;
  fixingTimeSeconds: number;
  washingTimeSeconds: number;
  splitGradeInstructions: string | null;
  splitGradeSteps: unknown;
  createdAt: Date;
  updatedAt: Date;
  filmRoll?: {
    id: string;
    filmName: string;
    filmId: string;
  };
};

function parseSplitGradeSteps(value: unknown): SplitGradeStepDto[] | null {
  if (!value || !Array.isArray(value)) {
    return null;
  }

  const steps: SplitGradeStepDto[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === 'object' &&
      'filter' in item &&
      'exposureSeconds' in item &&
      typeof (item as Record<string, unknown>).filter === 'string'
    ) {
      const rawExposure = (item as Record<string, unknown>).exposureSeconds;
      const numericExposure =
        typeof rawExposure === 'number'
          ? rawExposure
          : typeof rawExposure === 'string'
            ? Number.parseInt(rawExposure, 10)
            : Number.NaN;

      if (Number.isFinite(numericExposure)) {
        steps.push({
          filter: (item as Record<string, string>).filter,
          exposureSeconds: numericExposure
        });
      }
    }
  }

  return steps.length > 0 ? steps : null;
}

function toDto(record: PrintRecord): PrintDto {
  return {
    id: record.id,
    filmRollId: record.filmRollId,
    frameNumber: record.frameNumber,
    paperType: record.paperType,
    paperSize: record.paperSize,
    paperManufacturer: record.paperManufacturer,
    developmentTimeSeconds: record.developmentTimeSeconds,
    fixingTimeSeconds: record.fixingTimeSeconds,
    washingTimeSeconds: record.washingTimeSeconds,
    splitGradeInstructions: record.splitGradeInstructions ?? null,
    splitGradeSteps: parseSplitGradeSteps(record.splitGradeSteps ?? null),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    filmRoll: record.filmRoll
      ? {
          id: record.filmRoll.id,
          filmName: record.filmRoll.filmName,
          filmId: record.filmRoll.filmId
        }
      : undefined
  };
}

class PrintService {
  private async ensureFilmRollAccess(filmRollId: string, user: UserRolePayload) {
    const filmRoll = await prisma.filmRoll.findUnique({
      where: {id: filmRollId},
      select: {id: true, userId: true}
    });

    if (!filmRoll || (user.role !== 'ADMIN' && filmRoll.userId !== user.id)) {
      throw createHttpError(404, 'Film roll not found');
    }

    return filmRoll;
  }

  async listPrints(user: UserRolePayload, query: PrintQueryInput) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.PrintWhereInput = {};

    if (query.filmRollId) {
      await this.ensureFilmRollAccess(query.filmRollId, user);
      where.filmRollId = query.filmRollId;
    } else if (user.role !== 'ADMIN') {
      where.filmRoll = {userId: user.id};
    }

    const [total, records] = await prisma.$transaction([
      prisma.print.count({where}),
      prisma.print.findMany({
        where,
        include: {filmRoll: {select: {id: true, filmName: true, filmId: true}}},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: records.map((record) => toDto(record as PrintRecord)),
      total,
      page,
      pageSize
    };
  }

  async getPrintById(id: string, user: UserRolePayload): Promise<PrintDto> {
    const where: Prisma.PrintWhereInput = {id};
    if (user.role !== 'ADMIN') {
      where.filmRoll = {userId: user.id};
    }

    const record = await prisma.print.findFirst({
      where,
      include: {filmRoll: {select: {id: true, filmName: true, filmId: true}}}
    });

    if (!record) {
      throw createHttpError(404, 'Print not found');
    }

    return toDto(record as PrintRecord);
  }

  async createPrint(data: PrintCreateInput, user: UserRolePayload): Promise<PrintDto> {
    await this.ensureFilmRollAccess(data.filmRollId, user);

    const created = await prisma.print.create({
      data: {
        filmRollId: data.filmRollId,
        frameNumber: data.frameNumber,
        paperType: data.paperType,
        paperSize: data.paperSize,
        paperManufacturer: data.paperManufacturer,
        developmentTimeSeconds: data.developmentTimeSeconds,
        fixingTimeSeconds: data.fixingTimeSeconds,
        washingTimeSeconds: data.washingTimeSeconds,
        splitGradeInstructions: data.splitGradeInstructions ?? null,
        splitGradeSteps: toJsonSteps(data.splitGradeSteps)
      },
      include: {filmRoll: {select: {id: true, filmName: true, filmId: true}}}
    });

    return toDto(created as PrintRecord);
  }

  async updatePrint(id: string, data: PrintUpdateInput, user: UserRolePayload): Promise<PrintDto> {
    const where: Prisma.PrintWhereInput = {id};
    if (user.role !== 'ADMIN') {
      where.filmRoll = {userId: user.id};
    }

    const existing = await prisma.print.findFirst({
      where,
      include: {filmRoll: {select: {id: true, filmName: true, filmId: true}}}
    });

    if (!existing) {
      throw createHttpError(404, 'Print not found');
    }

    const targetFilmRollId = data.filmRollId ?? existing.filmRollId;
    if (targetFilmRollId !== existing.filmRollId) {
      await this.ensureFilmRollAccess(targetFilmRollId, user);
    }

    const updated = await prisma.print.update({
      where: {id},
      data: {
        filmRollId: data.filmRollId ?? undefined,
        frameNumber: data.frameNumber ?? undefined,
        paperType: data.paperType ?? undefined,
        paperSize: data.paperSize ?? undefined,
        paperManufacturer: data.paperManufacturer ?? undefined,
        developmentTimeSeconds: data.developmentTimeSeconds ?? undefined,
        fixingTimeSeconds: data.fixingTimeSeconds ?? undefined,
        washingTimeSeconds: data.washingTimeSeconds ?? undefined,
        splitGradeInstructions:
          data.splitGradeInstructions !== undefined ? data.splitGradeInstructions : undefined,
        splitGradeSteps:
          data.splitGradeSteps !== undefined
            ? toJsonSteps(data.splitGradeSteps)
            : undefined
      },
      include: {filmRoll: {select: {id: true, filmName: true, filmId: true}}}
    });

    return toDto(updated as PrintRecord);
  }

  async deletePrint(id: string, user: UserRolePayload): Promise<void> {
    const where: Prisma.PrintWhereInput = {id};
    if (user.role !== 'ADMIN') {
      where.filmRoll = {userId: user.id};
    }

    const existing = await prisma.print.findFirst({
      where
    });

    if (!existing) {
      throw createHttpError(404, 'Print not found');
    }

    await prisma.print.delete({where: {id}});
  }
}

export const printService = new PrintService();
function toJsonSteps(
  steps: SplitGradeStepInput[] | null | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull | undefined {
  if (steps === undefined) {
    return undefined;
  }
  if (steps === null || steps.length === 0) {
    return Prisma.DbNull;
  }
  return steps.map((step) => ({
    filter: step.filter,
    exposureSeconds: step.exposureSeconds
  })) as Prisma.InputJsonValue;
}
