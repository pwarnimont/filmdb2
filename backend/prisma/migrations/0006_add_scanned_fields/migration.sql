-- Track whether a roll has been scanned and where the scans live
ALTER TABLE "FilmRoll"
  ADD COLUMN "isScanned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "scanFolder" TEXT;
