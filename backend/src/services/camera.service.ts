import {Prisma} from '@prisma/client';
import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import {
  CameraCreateInput,
  CameraQueryInput,
  CameraUpdateInput
} from '../schemas/camera.schema';
import type {UserRolePayload} from '../types/user';

export interface CameraFilmRollDto {
  id: string;
  filmId: string;
  filmName: string;
  dateShot: string | null;
}

export interface CameraDto {
  id: string;
  manufacturer: string;
  model: string;
  releaseDate: string | null;
  purchaseDate: string | null;
  filmType: string;
  lenses: string[];
  notes: string | null;
  linkedFilmRolls: CameraFilmRollDto[];
  linkedFilmRollsCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

const CAMERA_ROLL_LIMIT = 20;

const cameraInclude = {
  filmRolls: {
    select: {
      id: true,
      filmId: true,
      filmName: true,
      dateShot: true
    },
    orderBy: {
      dateShot: 'desc'
    },
    take: CAMERA_ROLL_LIMIT
  },
  _count: {
    select: {filmRolls: true}
  }
} satisfies Prisma.CameraInclude;

const cameraExportInclude = {
  filmRolls: {
    select: {
      id: true,
      filmId: true,
      filmName: true,
      dateShot: true
    },
    orderBy: {
      dateShot: 'desc'
    }
  }
} satisfies Prisma.CameraInclude;

type CameraRecord = Prisma.CameraGetPayload<{include: typeof cameraInclude}>;

function toDto(record: CameraRecord): CameraDto {
  return {
    id: record.id,
    manufacturer: record.manufacturer,
    model: record.model,
    releaseDate: record.releaseDate ? record.releaseDate.toISOString() : null,
    purchaseDate: record.purchaseDate ? record.purchaseDate.toISOString() : null,
    filmType: record.filmType,
    lenses: record.lenses,
    notes: record.notes ?? null,
    linkedFilmRolls: record.filmRolls.map((roll) => ({
      id: roll.id,
      filmId: roll.filmId,
      filmName: roll.filmName,
      dateShot: roll.dateShot ? roll.dateShot.toISOString() : null
    })),
    linkedFilmRollsCount: record._count?.filmRolls ?? record.filmRolls.length,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    userId: record.userId
  };
}

class CameraService {
  async listCameras(user: UserRolePayload, query: CameraQueryInput) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.CameraWhereInput = {};

    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    }

    if (query.search) {
      where.OR = [
        {manufacturer: {contains: query.search, mode: 'insensitive'}},
        {model: {contains: query.search, mode: 'insensitive'}}
      ];
    }

    if (query.filmType) {
      where.filmType = query.filmType;
    }

    const [total, records] = await prisma.$transaction([
      prisma.camera.count({where}),
      prisma.camera.findMany({
        where,
        include: cameraInclude,
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: records.map(toDto),
      total,
      page,
      pageSize
    };
  }

  async getCameraById(id: string, user: UserRolePayload): Promise<CameraDto> {
    const where: Prisma.CameraWhereInput = {id};
    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    }

    const record = await prisma.camera.findFirst({
      where,
      include: cameraInclude
    });

    if (!record) {
      throw createHttpError(404, 'Camera not found');
    }

    return toDto(record);
  }

  async createCamera(data: CameraCreateInput, user: UserRolePayload): Promise<CameraDto> {
    const created = await prisma.camera.create({
      data: {
        manufacturer: data.manufacturer,
        model: data.model,
        releaseDate: data.releaseDate ?? null,
        purchaseDate: data.purchaseDate ?? null,
        filmType: data.filmType,
        lenses: data.lenses,
        notes: data.notes ?? null,
        userId: user.id
      },
      include: cameraInclude
    });

    return toDto(created);
  }

  async updateCamera(id: string, data: CameraUpdateInput, user: UserRolePayload): Promise<CameraDto> {
    await this.ensureOwnership(id, user);

    const updated = await prisma.camera.update({
      where: {id},
      data: {
        manufacturer: data.manufacturer ?? undefined,
        model: data.model ?? undefined,
        releaseDate: data.releaseDate !== undefined ? data.releaseDate : undefined,
        purchaseDate: data.purchaseDate !== undefined ? data.purchaseDate : undefined,
        filmType: data.filmType ?? undefined,
        lenses: data.lenses ?? undefined,
        notes: data.notes !== undefined ? data.notes : undefined
      },
      include: cameraInclude
    });

    await prisma.filmRoll.updateMany({
      where: {cameraId: id},
      data: {
        cameraName: `${updated.manufacturer} ${updated.model}`.trim()
      }
    });

    return toDto(updated);
  }

  async deleteCamera(id: string, user: UserRolePayload): Promise<void> {
    await this.ensureOwnership(id, user);
    await prisma.camera.delete({where: {id}});
  }

  async exportAll(user: UserRolePayload) {
    const where: Prisma.CameraWhereInput = user.role === 'ADMIN' ? {} : {userId: user.id};
    const records = await prisma.camera.findMany({
      where,
      orderBy: {createdAt: 'asc'},
      include: cameraExportInclude
    });
    return records;
  }

  private async ensureOwnership(id: string, user: UserRolePayload): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    const record = await prisma.camera.findUnique({
      where: {id},
      select: {userId: true}
    });

    if (!record || record.userId !== user.id) {
      throw createHttpError(404, 'Camera not found');
    }
  }
}

export const cameraService = new CameraService();
