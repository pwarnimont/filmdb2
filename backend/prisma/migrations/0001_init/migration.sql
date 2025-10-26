-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FilmFormat" AS ENUM ('35mm', '6x6', '6x4_5', '6x7', '6x9', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" UUID NOT NULL,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmRoll" (
    "id" UUID NOT NULL,
    "filmId" TEXT NOT NULL,
    "filmName" TEXT NOT NULL,
    "boxIso" INTEGER NOT NULL,
    "shotIso" INTEGER,
    "dateShot" TIMESTAMP(3),
    "cameraName" TEXT,
    "filmFormat" "FilmFormat" NOT NULL,
    "exposures" INTEGER NOT NULL,
    "isDeveloped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    CONSTRAINT "FilmRoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Development" (
    "id" UUID NOT NULL,
    "filmRollId" UUID NOT NULL,
    "developer" TEXT NOT NULL,
    "temperatureC" DECIMAL(4,1) NOT NULL,
    "dilution" TEXT NOT NULL,
    "timeSeconds" INTEGER NOT NULL,
    "dateDeveloped" TIMESTAMP(3) NOT NULL,
    "agitationScheme" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Development_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Development_filmRollId_key" ON "Development"("filmRollId");

-- AddForeignKey
ALTER TABLE "FilmRoll" ADD CONSTRAINT "FilmRoll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Development" ADD CONSTRAINT "Development_filmRollId_fkey" FOREIGN KEY ("filmRollId") REFERENCES "FilmRoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

