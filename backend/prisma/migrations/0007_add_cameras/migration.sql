-- Cameras catalog and relation to film rolls
CREATE TABLE "Camera" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "filmType" TEXT NOT NULL,
    "lenses" TEXT[] NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Camera_userId_idx" ON "Camera"("userId");

ALTER TABLE "Camera"
  ADD CONSTRAINT "Camera_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "FilmRoll"
  ADD COLUMN "cameraId" UUID;

ALTER TABLE "FilmRoll"
  ADD CONSTRAINT "FilmRoll_cameraId_fkey"
  FOREIGN KEY ("cameraId")
  REFERENCES "Camera"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "FilmRoll_cameraId_idx" ON "FilmRoll"("cameraId");
