-- Create prints table to track darkroom prints made from film rolls
CREATE TABLE "Print" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filmRollId" UUID NOT NULL,
    "frameNumber" INTEGER NOT NULL,
    "paperType" TEXT NOT NULL,
    "paperSize" TEXT NOT NULL,
    "paperManufacturer" TEXT NOT NULL,
    "developmentTimeSeconds" INTEGER NOT NULL,
    "fixingTimeSeconds" INTEGER NOT NULL,
    "washingTimeSeconds" INTEGER NOT NULL,
    "splitGradeInstructions" TEXT,
    "splitGradeSteps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Maintain referential integrity and cascade deletes when a film roll is removed
ALTER TABLE "Print"
  ADD CONSTRAINT "Print_filmRollId_fkey"
  FOREIGN KEY ("filmRollId")
  REFERENCES "FilmRoll"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Speed up lookups for prints of a specific film roll
CREATE INDEX "Print_filmRollId_idx" ON "Print"("filmRollId");
