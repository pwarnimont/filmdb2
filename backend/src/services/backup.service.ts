import {Prisma} from '@prisma/client';
import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import type {BackupPayload, PrintBackup} from '../schemas/backup.schema';
import {filmRollService} from './film-roll.service';
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
    const [filmRolls, prints] = await Promise.all([
      filmRollService.exportAll(user),
      printService.exportAll(user)
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

    return {filmRolls: filmRollsWithPrints, prints};
  }

  async importForUser(payload: BackupPayload, user: UserRolePayload) {
    let filmRollsCreated = 0;
    let filmRollsUpdated = 0;
    let printsCreated = 0;
    let printsUpdated = 0;

    const filmRollOwnerCache = new Map<string, string>();
    const aggregatedPrints = new Map<string, PrintBackup>();

    await prisma.$transaction(async (tx) => {
      for (const roll of payload.filmRolls) {
        const existing = await tx.filmRoll.findUnique({
          where: {id: roll.id}
        });

        const targetUserId = user.role === 'ADMIN' ? roll.userId : user.id;

        if (existing && user.role !== 'ADMIN' && existing.userId !== user.id) {
          throw createHttpError(403, `Cannot import film roll ${roll.id} owned by another user`);
        }

        const rollData = {
          filmId: roll.filmId,
          filmName: roll.filmName,
          boxIso: roll.boxIso,
          shotIso: roll.shotIso,
          dateShot: roll.dateShot ? new Date(roll.dateShot) : null,
          cameraName: trimOrNull(roll.cameraName),
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
      printsCreated,
      printsUpdated
    };
  }
}

export const backupService = new BackupService();
