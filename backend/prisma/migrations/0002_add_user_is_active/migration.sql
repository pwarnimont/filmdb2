ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User" SET "isActive" = true WHERE "isActive" IS NULL;
