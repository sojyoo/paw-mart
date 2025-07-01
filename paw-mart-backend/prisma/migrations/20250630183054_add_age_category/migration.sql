-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('PUPPY', 'YOUNG_ADULT', 'ADULT', 'SENIOR');

-- CreateEnum
CREATE TYPE "DogApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "BackgroundScreening" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "ageCategory" "AgeCategory" NOT NULL DEFAULT 'PUPPY';

-- CreateTable
CREATE TABLE "DogApplication" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "dogId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "DogApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DogApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteDog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dogId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteDog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteDog_userId_dogId_key" ON "FavoriteDog"("userId", "dogId");

-- AddForeignKey
ALTER TABLE "DogApplication" ADD CONSTRAINT "DogApplication_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DogApplication" ADD CONSTRAINT "DogApplication_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteDog" ADD CONSTRAINT "FavoriteDog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteDog" ADD CONSTRAINT "FavoriteDog_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
