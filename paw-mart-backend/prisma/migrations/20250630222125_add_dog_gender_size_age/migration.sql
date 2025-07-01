-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "size" "Size" NOT NULL DEFAULT 'UNKNOWN';
