import {Prisma} from '@prisma/client';
import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import {
  DevelopmentInput,
  FilmRollCreateInput,
  FilmRollQueryInput,
  FilmRollUpdateInput,
  PartialDevelopmentInput
} from '../schemas/film-roll.schema';
import type {UserRolePayload} from '../types/user';
import {filmFormatToApi, parseFilmFormat} from '../utils/film-format';
import type {PrintDto} from './print.service';

export interface FilmRollDto {
  id: string;
  filmId: string;
  filmName: string;
  boxIso: number;
  shotIso: number | null;
  dateShot: string | null;
  cameraName: string | null;
  filmFormat: string;
  exposures: number;
  isDeveloped: boolean;
  isScanned: boolean;
  scanFolder: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  development?: DevelopmentDto;
  prints?: PrintDto[];
}

export interface DevelopmentDto {
  id: string;
  filmRollId: string;
  developer: string;
  temperatureC: number;
  dilution: string;
  timeSeconds: number;
  dateDeveloped: string;
  agitationScheme: string;
}

function toDto(record: Prisma.FilmRollGetPayload<{include: {development: true}}>): FilmRollDto {
  return {
    id: record.id,
    filmId: record.filmId,
    filmName: record.filmName,
    boxIso: record.boxIso,
    shotIso: record.shotIso ?? null,
    dateShot: record.dateShot ? record.dateShot.toISOString() : null,
    cameraName: record.cameraName ?? null,
    filmFormat: filmFormatToApi[record.filmFormat],
    exposures: record.exposures,
    isDeveloped: record.isDeveloped,
    isScanned: record.isScanned,
    scanFolder: record.scanFolder ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    userId: record.userId,
    development: record.development
      ? {
          id: record.development.id,
          filmRollId: record.id,
          developer: record.development.developer,
          temperatureC: Number(record.development.temperatureC),
          dilution: record.development.dilution,
          timeSeconds: record.development.timeSeconds,
          dateDeveloped: record.development.dateDeveloped.toISOString(),
          agitationScheme: record.development.agitationScheme
        }
      : undefined
  };
}

class FilmRollService {
  async listFilmRolls(user: UserRolePayload, query: FilmRollQueryInput) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.FilmRollWhereInput = {};
    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    }

    if (query.search) {
      where.OR = [
        {filmName: {contains: query.search, mode: 'insensitive'}},
        {filmId: {contains: query.search, mode: 'insensitive'}},
        {cameraName: {contains: query.search, mode: 'insensitive'}}
      ];
    }

    if (typeof query.isDeveloped === 'boolean') {
      where.isDeveloped = query.isDeveloped;
    }

    const orderBy: Prisma.FilmRollOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortDir ?? 'desc';
    } else {
      orderBy.dateShot = 'desc';
    }

    const [total, items] = await prisma.$transaction([
      prisma.filmRoll.count({where}),
      prisma.filmRoll.findMany({
        where,
        include: {development: true},
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: items.map(toDto),
      total,
      page,
      pageSize
    };
  }

  async getFilmRollById(id: string, user: UserRolePayload): Promise<FilmRollDto> {
    const roll = await prisma.filmRoll.findUnique({
      where: {id},
      include: {development: true}
    });

    if (!roll || (user.role !== 'ADMIN' && roll.userId !== user.id)) {
      throw createHttpError(404, 'Film roll not found');
    }

    return toDto(roll);
  }

  async createFilmRoll(data: FilmRollCreateInput, user: UserRolePayload): Promise<FilmRollDto> {
    const created = await prisma.filmRoll.create({
      data: {
        filmId: data.filmId,
        filmName: data.filmName,
        boxIso: data.boxIso,
        shotIso: data.shotIso ?? null,
        dateShot: data.dateShot ?? undefined,
        cameraName: data.cameraName ?? null,
        filmFormat: parseFilmFormat(data.filmFormat),
        exposures: data.exposures,
        isDeveloped: data.isDeveloped ?? false,
        isScanned: data.isScanned ?? false,
        scanFolder: data.scanFolder ?? null,
        userId: user.id
      },
      include: {development: true}
    });

    return toDto(created);
  }

  async updateFilmRoll(
    id: string,
    data: FilmRollUpdateInput,
    user: UserRolePayload
  ): Promise<FilmRollDto> {
    await this.ensureOwnership(id, user);

    const updated = await prisma.filmRoll.update({
      where: {id},
      data: {
        filmId: data.filmId ?? undefined,
        filmName: data.filmName ?? undefined,
        boxIso: data.boxIso ?? undefined,
        shotIso: data.shotIso !== undefined ? data.shotIso : undefined,
        dateShot: data.dateShot !== undefined ? data.dateShot ?? null : undefined,
        cameraName: data.cameraName !== undefined ? data.cameraName ?? null : undefined,
        filmFormat: data.filmFormat ? parseFilmFormat(data.filmFormat) : undefined,
        exposures: data.exposures ?? undefined,
        isDeveloped: data.isDeveloped ?? undefined,
        isScanned: data.isScanned ?? undefined,
        scanFolder:
          data.scanFolder !== undefined ? (data.scanFolder ?? null) : undefined
      },
      include: {development: true}
    });

    return toDto(updated);
  }

  async deleteFilmRoll(id: string, user: UserRolePayload): Promise<void> {
    await this.ensureOwnership(id, user);
    await prisma.filmRoll.delete({where: {id}});
  }

  async upsertDevelopment(
    filmRollId: string,
    developmentData: DevelopmentInput,
    user: UserRolePayload
  ): Promise<FilmRollDto> {
    await this.ensureOwnership(filmRollId, user);

    const roll = await prisma.filmRoll.findUnique({where: {id: filmRollId}});
    if (!roll) {
      throw createHttpError(404, 'Film roll not found');
    }

    await prisma.development.upsert({
      where: {filmRollId},
      update: {
        developer: developmentData.developer,
        temperatureC: developmentData.temperatureC,
        dilution: developmentData.dilution,
        timeSeconds: developmentData.timeSeconds,
        dateDeveloped: developmentData.dateDeveloped ?? undefined,
        agitationScheme: developmentData.agitationScheme
      },
      create: {
        filmRollId,
        developer: developmentData.developer,
        temperatureC: developmentData.temperatureC,
        dilution: developmentData.dilution,
        timeSeconds: developmentData.timeSeconds,
        dateDeveloped: developmentData.dateDeveloped ?? new Date(),
        agitationScheme: developmentData.agitationScheme
      }
    });

    const updated = await prisma.filmRoll.update({
      where: {id: filmRollId},
      data: {
        isDeveloped: true
      },
      include: {development: true}
    });

    return toDto(updated);
  }

  async deleteDevelopment(filmRollId: string, user: UserRolePayload): Promise<FilmRollDto> {
    await this.ensureOwnership(filmRollId, user);

    await prisma.development.delete({where: {filmRollId}}).catch(() => {
      throw createHttpError(404, 'Development not found');
    });

    const updated = await prisma.filmRoll.update({
      where: {id: filmRollId},
      data: {isDeveloped: false},
      include: {development: true}
    });

    return toDto(updated);
  }

  async markDeveloped(
    filmRollId: string,
    user: UserRolePayload,
    development?: PartialDevelopmentInput
  ): Promise<FilmRollDto> {
    await this.ensureOwnership(filmRollId, user);

    if (development) {
      const requiredFields: Array<keyof DevelopmentInput> = [
        'developer',
        'temperatureC',
        'dilution',
        'timeSeconds',
        'dateDeveloped',
        'agitationScheme'
      ];

      const hasAllFields = requiredFields.every(
        (field) => development[field] !== undefined && development[field] !== null
      );

      if (!hasAllFields) {
        throw createHttpError(400, 'Complete development details are required');
      }

      return this.upsertDevelopment(filmRollId, development as DevelopmentInput, user);
    }

    const updated = await prisma.filmRoll.update({
      where: {id: filmRollId},
      data: {isDeveloped: true},
      include: {development: true}
    });

    return toDto(updated);
  }

  private async ensureOwnership(id: string, user: UserRolePayload): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    const roll = await prisma.filmRoll.findUnique({where: {id}});
    if (!roll || roll.userId !== user.id) {
      throw createHttpError(404, 'Film roll not found');
    }
  }

  async exportAll(user: UserRolePayload): Promise<FilmRollDto[]> {
    const where: Prisma.FilmRollWhereInput = user.role === 'ADMIN' ? {} : {userId: user.id};
    const records = await prisma.filmRoll.findMany({
      where,
      include: {development: true},
      orderBy: {createdAt: 'asc'}
    });
    return records.map(toDto);
  }
}

export const filmRollService = new FilmRollService();
