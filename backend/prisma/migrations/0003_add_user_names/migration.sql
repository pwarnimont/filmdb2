-- Add firstName and lastName columns to users
ALTER TABLE "User"
    ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "lastName"  TEXT NOT NULL DEFAULT '';

-- Populate existing records with placeholder values to satisfy non-null constraint
UPDATE "User"
SET
    "firstName" = CASE
        WHEN "firstName" = '' THEN 'Account'
        ELSE "firstName"
    END,
    "lastName" = CASE
        WHEN "lastName" = '' THEN 'User'
        ELSE "lastName"
    END;

-- Drop defaults so future inserts must provide values explicitly
ALTER TABLE "User"
    ALTER COLUMN "firstName" DROP DEFAULT,
    ALTER COLUMN "lastName" DROP DEFAULT;
