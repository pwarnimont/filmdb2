import {Prisma} from '@prisma/client';
import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import type {BackupPayload, PrintBackup, UserBackup} from '../schemas/backup.schema';
import {filmRollService} from './film-roll.service';
import {cameraService} from './camera.service';
import {printService} from './print.service';
import type {PrintDto} from './print.service';
import type {UserRolePayload} from '../types/user';
import {parseFilmFormat} from '../utils/film-format';

const trimOrNull = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const serializeSplitGradeSteps = (
  steps: PrintBackup['splitGradeSteps']
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull => {
  if (!steps || steps.length === 0) {
    return Prisma.DbNull;
  }

  return steps.map((step) => ({
    filter: step.filter,
    exposureSeconds: step.exposureSeconds
  })) as Prisma.InputJsonValue;
};

class BackupService {
  async exportForUser(user: UserRolePayload) {
    const [filmRolls, prints, cameras, users] = await Promise.all([
      filmRollService.exportAll(user),
      printService.exportAll(user),
      cameraService.exportAll(user),
      user.role === 'ADMIN'
        ? prisma.user.findMany({
            orderBy: {createdAt: 'asc'}
          })
        : Promise.resolve(null)
    ]);

    const grouped = new Map<string, PrintDto[]>();
    for (const print of prints) {
      const list = grouped.get(print.filmRollId) ?? [];
      list.push(print);
      grouped.set(print.filmRollId, list);
    }

    const filmRollsWithPrints = filmRolls.map((roll) => ({
      ...roll,
      prints: grouped.get(roll.id) ?? []
    }));

    const cameraSnapshots = cameras.map((camera) => ({
      id: camera.id,
      manufacturer: camera.manufacturer,
      model: camera.model,
      releaseDate: camera.releaseDate ? camera.releaseDate.toISOString() : null,
      purchaseDate: camera.purchaseDate ? camera.purchaseDate.toISOString() : null,
      filmType: camera.filmType,
      lenses: camera.lenses,
      notes: camera.notes ?? null,
      createdAt: camera.createdAt.toISOString(),
      updatedAt: camera.updatedAt.toISOString(),
      userId: camera.userId,
      linkedFilmRolls: camera.filmRolls.map((roll) => ({
        id: roll.id,
        filmId: roll.filmId,
        filmName: roll.filmName,
        dateShot: roll.dateShot ? roll.dateShot.toISOString() : null
      })),
      linkedFilmRollsCount: camera.filmRolls.length
    }));

    return {
      filmRolls: filmRollsWithPrints,
      prints,
      cameras: cameraSnapshots,
      users: users ?? undefined
    };
  }

  async importForUser(payload: BackupPayload, user: UserRolePayload) {
    let filmRollsCreated = 0;
    let filmRollsUpdated = 0;
    let printsCreated = 0;
    let printsUpdated = 0;
    let camerasCreated = 0;
    let camerasUpdated = 0;

    const cameraOwnerCache = new Map<string, string>();
    const filmRollOwnerCache = new Map<string, string>();
    const aggregatedPrints = new Map<string, PrintBackup>();

    await prisma.$transaction(async (tx) => {
      if (user.role === 'ADMIN' && payload.users && payload.users.length > 0) {
        await this.upsertUsers(tx, payload.users);
      }

      for (const camera of payload.cameras ?? []) {
        const existing = await tx.camera.findUnique({where: {id: camera.id}});
        const targetUserId = user.role === 'ADMIN' ? camera.userId : user.id;

        if (existing && user.role !== 'ADMIN' && existing.userId !== user.id) {
          throw createHttpError(
            403,
            `Cannot import camera ${camera.id} owned by another user`
          );
        }

        const cameraData = {
          manufacturer: camera.manufacturer,
          model: camera.model,
          releaseDate: camera.releaseDate ? new Date(camera.releaseDate) : null,
          purchaseDate: camera.purchaseDate ? new Date(camera.purchaseDate) : null,
          filmType: camera.filmType,
          lenses: camera.lenses,
          notes: trimOrNull(camera.notes),
          userId: targetUserId
        };

        if (existing) {
          await tx.camera.update({
            where: {id: camera.id},
            data: cameraData
          });
          camerasUpdated += 1;
        } else {
          await tx.camera.create({
            data: {
              id: camera.id,
              ...cameraData,
              createdAt: new Date(camera.createdAt)
            }
          });
          camerasCreated += 1;
        }

        cameraOwnerCache.set(camera.id, targetUserId);
      }

      const resolveCameraForUser = async (
        cameraId: string | null | undefined,
        targetUserId: string
      ): Promise<string | null> => {
        if (!cameraId) {
          return null;
        }

        const owner =
          cameraOwnerCache.get(cameraId) ??
          (await (async () => {
            const record = await tx.camera.findUnique({
              where: {id: cameraId},
              select: {userId: true}
            });
            if (!record) {
              return null;
            }
            cameraOwnerCache.set(cameraId, record.userId);
            return record.userId;
          })());

        if (!owner) {
          return null;
        }

        if (owner !== targetUserId) {
          if (user.role === 'ADMIN') {
            throw createHttpError(
              400,
              `Camera ${cameraId} does not belong to user ${targetUserId}`
            );
          }
          throw createHttpError(
            403,
            `Cannot link film roll to camera owned by another user`
          );
        }

        return cameraId;
      };

      for (const roll of payload.filmRolls) {
        const existing = await tx.filmRoll.findUnique({
          where: {id: roll.id}
        });

        const targetUserId = user.role === 'ADMIN' ? roll.userId : user.id;

        if (existing && user.role !== 'ADMIN' && existing.userId !== user.id) {
          throw createHttpError(403, `Cannot import film roll ${roll.id} owned by another user`);
        }

        const linkedCameraId = await resolveCameraForUser(roll.cameraId, targetUserId);

        const rollData = {
          filmId: roll.filmId,
          filmName: roll.filmName,
          boxIso: roll.boxIso,
          shotIso: roll.shotIso,
          dateShot: roll.dateShot ? new Date(roll.dateShot) : null,
          cameraName: trimOrNull(roll.cameraName),
          cameraId: linkedCameraId,
          filmFormat: parseFilmFormat(roll.filmFormat),
          exposures: roll.exposures,
          isDeveloped: roll.isDeveloped,
          isScanned: roll.isScanned,
          scanFolder: trimOrNull(roll.scanFolder),
          userId: targetUserId
        };

        if (existing) {
          await tx.filmRoll.update({
            where: {id: roll.id},
            data: rollData
          });
          filmRollsUpdated += 1;
        } else {
          await tx.filmRoll.create({
            data: {
              id: roll.id,
              ...rollData,
              createdAt: new Date(roll.createdAt)
            }
          });
          filmRollsCreated += 1;
        }

        filmRollOwnerCache.set(roll.id, targetUserId);

        if (roll.prints && roll.prints.length > 0) {
          for (const nestedPrint of roll.prints) {
            aggregatedPrints.set(nestedPrint.id, nestedPrint);
          }
        }

        if (roll.development) {
          const devData = {
            filmRollId: roll.id,
            developer: roll.development.developer,
            temperatureC: new Prisma.Decimal(roll.development.temperatureC),
            dilution: roll.development.dilution,
            timeSeconds: roll.development.timeSeconds,
            dateDeveloped: new Date(roll.development.dateDeveloped),
            agitationScheme: roll.development.agitationScheme
          };

          await tx.development.upsert({
            where: {filmRollId: roll.id},
            update: devData,
            create: devData
          });
        } else {
          await tx.development
            .delete({where: {filmRollId: roll.id}})
            .catch(() => undefined);
        }
      }

      for (const print of payload.prints ?? []) {
        aggregatedPrints.set(print.id, print);
      }

      for (const print of aggregatedPrints.values()) {
        const filmRollOwner =
          filmRollOwnerCache.get(print.filmRollId) ??
          (await (async () => {
            const record = await tx.filmRoll.findUnique({
              where: {id: print.filmRollId},
              select: {userId: true}
            });
            if (!record) {
              throw createHttpError(400, `Referenced film roll ${print.filmRollId} not found`);
            }
            filmRollOwnerCache.set(print.filmRollId, record.userId);
            return record.userId;
          })());

        if (user.role !== 'ADMIN' && filmRollOwner !== user.id) {
          throw createHttpError(
            403,
            `Cannot import print ${print.id} for a film roll owned by another user`
          );
        }

        const existingPrint = await tx.print.findUnique({
          where: {id: print.id},
          include: {filmRoll: {select: {userId: true}}}
        });

        if (existingPrint && user.role !== 'ADMIN' && existingPrint.filmRoll.userId !== user.id) {
          throw createHttpError(
            403,
            `Cannot import print ${print.id} owned by another user`
          );
        }

        const printData = {
          filmRollId: print.filmRollId,
          frameNumber: print.frameNumber,
          paperType: print.paperType,
          paperSize: print.paperSize,
          paperManufacturer: print.paperManufacturer,
          developmentTimeSeconds: print.developmentTimeSeconds,
          fixingTimeSeconds: print.fixingTimeSeconds,
          washingTimeSeconds: print.washingTimeSeconds,
          splitGradeInstructions: trimOrNull(print.splitGradeInstructions),
          splitGradeSteps: serializeSplitGradeSteps(print.splitGradeSteps)
        };

        if (existingPrint) {
          await tx.print.update({
            where: {id: print.id},
            data: printData
          });
          printsUpdated += 1;
        } else {
          await tx.print.create({
            data: {
              id: print.id,
              ...printData,
              createdAt: new Date(print.createdAt)
            }
          });
          printsCreated += 1;
        }
      }
    });

    return {
      filmRollsCreated,
      filmRollsUpdated,
      camerasCreated,
      camerasUpdated,
      printsCreated,
      printsUpdated
    };
  }

  private async upsertUsers(
    tx: Prisma.TransactionClient,
    users: UserBackup[]
  ): Promise<void> {
    for (const backupUser of users) {
      const baseData = {
        email: backupUser.email,
        firstName: backupUser.firstName,
        lastName: backupUser.lastName,
        role: backupUser.role,
        isActive: backupUser.isActive,
        passwordHash: backupUser.passwordHash,
        failedLoginAttempts: backupUser.failedLoginAttempts,
        lockoutUntil: backupUser.lockoutUntil ? new Date(backupUser.lockoutUntil) : null
      };

      await tx.user.upsert({
        where: {id: backupUser.id},
        update: baseData,
        create: {
          id: backupUser.id,
          ...baseData,
          createdAt: new Date(backupUser.createdAt)
        }
      });
    }
  }
}

export const backupService = new BackupService();
