-- This is an empty migration.

-- Alter the birthDate column to be nullable
ALTER TABLE "Dog" ALTER COLUMN "birthDate" DROP NOT NULL;