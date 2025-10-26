-- Add login throttle fields
ALTER TABLE "User"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockoutUntil" TIMESTAMP(3);

-- Ensure legacy records have zero attempts
UPDATE "User"
SET "failedLoginAttempts" = 0
WHERE "failedLoginAttempts" IS NULL;
