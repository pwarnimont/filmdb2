import bcrypt from 'bcrypt';
import {PrismaClient, FilmFormat, Prisma} from '@prisma/client';

type SeedFilmRoll = {
  filmId: string;
  filmName: string;
  boxIso: number;
  shotIso?: number | null;
  dateShot?: Date | null;
  cameraName?: string | null;
  filmFormat: FilmFormat;
  exposures: number;
  isDeveloped?: boolean;
  isScanned?: boolean;
  scanFolder?: string | null;
  development?: {
    developer: string;
    temperatureC: number;
    dilution: string;
    timeSeconds: number;
    dateDeveloped: Date;
    agitationScheme: string;
  };
  prints?: Array<{
    frameNumber: number;
    paperType: string;
    paperSize: string;
    paperManufacturer: string;
    developmentTimeSeconds: number;
    fixingTimeSeconds: number;
    washingTimeSeconds: number;
    splitGradeInstructions?: string | null;
    splitGradeSteps?: Array<{filter: string; exposureSeconds: number}>;
  }>;
};

const prisma = new PrismaClient();

async function main() {
  const defaultAllowRegistration = process.env.DEFAULT_ALLOW_REGISTRATION !== 'false';

  const appSettings = await prisma.appSettings.findFirst();
  if (appSettings) {
    await prisma.appSettings.update({
      where: {id: appSettings.id},
      data: {allowRegistration: defaultAllowRegistration}
    });
  } else {
    await prisma.appSettings.create({
      data: {
        allowRegistration: defaultAllowRegistration
      }
    });
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: {email: 'admin@filmdb.local'},
    update: {},
    create: {
      email: 'admin@filmdb.local',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  const regular = await prisma.user.upsert({
    where: {email: 'user@filmdb.local'},
    update: {},
    create: {
      email: 'user@filmdb.local',
      firstName: 'Sample',
      lastName: 'User',
      passwordHash: userPassword,
      role: 'USER',
      isActive: true
    }
  });

  const baseRolls: SeedFilmRoll[] = [
    {
      filmId: 'KG200-001',
      filmName: 'Kodak Gold 200',
      boxIso: 200,
      shotIso: 200,
      dateShot: new Date('2023-10-01'),
      cameraName: 'Canon AE-1',
      filmFormat: FilmFormat.format35mm,
      exposures: 36,
      isDeveloped: true,
      isScanned: true,
      scanFolder: 'scans/2023/10',
      development: {
        developer: 'Kodak D-76',
        temperatureC: 20,
        dilution: '1+1',
        timeSeconds: 600,
        dateDeveloped: new Date('2023-10-10'),
        agitationScheme: 'Initial 30s + 10s every minute'
      },
      prints: [
        {
          frameNumber: 12,
          paperType: 'Ilford Multigrade RC',
          paperSize: '8x10',
          paperManufacturer: 'Ilford',
          developmentTimeSeconds: 210,
          fixingTimeSeconds: 120,
          washingTimeSeconds: 300,
          splitGradeInstructions: 'Soft filter first, dodge subject for 5 seconds',
          splitGradeSteps: [
            {filter: '00', exposureSeconds: 120},
            {filter: '5', exposureSeconds: 90}
          ]
        },
        {
          frameNumber: 18,
          paperType: 'Ilford Multigrade FB',
          paperSize: '8x10',
          paperManufacturer: 'Ilford',
          developmentTimeSeconds: 180,
          fixingTimeSeconds: 150,
          washingTimeSeconds: 420,
          splitGradeInstructions: 'Burn sky with filter 3 for 10s',
          splitGradeSteps: [
            {filter: '0', exposureSeconds: 90},
            {filter: '3', exposureSeconds: 60},
            {filter: '5', exposureSeconds: 45}
          ]
        }
      ]
    },
    {
      filmId: 'HP5-120-014',
      filmName: 'Ilford HP5',
      boxIso: 400,
      shotIso: 800,
      dateShot: new Date('2023-11-12'),
      cameraName: 'Mamiya RB67',
      filmFormat: FilmFormat.format6x7,
      exposures: 10,
      isDeveloped: false,
      isScanned: false
    },
    {
      filmId: 'PORTRA-160-035',
      filmName: 'Kodak Portra 160',
      boxIso: 160,
      shotIso: 160,
      dateShot: null,
      cameraName: null,
      filmFormat: FilmFormat.format35mm,
      exposures: 36,
      isDeveloped: false,
      isScanned: true,
      scanFolder: 'scans/2024/portra160-roll35'
    }
  ];

  await prisma.filmRoll.deleteMany({
    where: {
      userId: {in: [admin.id, regular.id]}
    }
  });

  for (const roll of baseRolls) {
    const created = await prisma.filmRoll.create({
      data: {
        filmId: roll.filmId,
        filmName: roll.filmName,
        boxIso: roll.boxIso,
        shotIso: roll.shotIso,
        dateShot: roll.dateShot,
        cameraName: roll.cameraName,
        filmFormat: roll.filmFormat,
        exposures: roll.exposures,
        isDeveloped: roll.isDeveloped ?? false,
        isScanned: roll.isScanned ?? false,
        scanFolder: roll.scanFolder ?? null,
        userId: regular.id
      }
    });

    if (roll.development) {
      await prisma.development.create({
        data: {
          filmRollId: created.id,
          developer: roll.development.developer,
          temperatureC: roll.development.temperatureC,
          dilution: roll.development.dilution,
          timeSeconds: roll.development.timeSeconds,
          dateDeveloped: roll.development.dateDeveloped,
          agitationScheme: roll.development.agitationScheme
        }
      });
    }

    if (roll.prints && roll.prints.length > 0) {
      for (const print of roll.prints) {
        await prisma.print.create({
          data: {
            filmRollId: created.id,
            frameNumber: print.frameNumber,
            paperType: print.paperType,
            paperSize: print.paperSize,
            paperManufacturer: print.paperManufacturer,
            developmentTimeSeconds: print.developmentTimeSeconds,
            fixingTimeSeconds: print.fixingTimeSeconds,
            washingTimeSeconds: print.washingTimeSeconds,
            splitGradeInstructions: print.splitGradeInstructions ?? null,
            splitGradeSteps: toJsonSteps(print.splitGradeSteps)
          }
        });
      }
    }
  }

  console.log('Database seeded successfully');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
function toJsonSteps(
  steps: Array<{filter: string; exposureSeconds: number}> | null | undefined
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
