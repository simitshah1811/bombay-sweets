-- CreateEnum
CREATE TYPE "PreparationStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "preparationMinutes" INTEGER,
ADD COLUMN     "preparationStatus" "PreparationStatus" NOT NULL DEFAULT 'GREEN';
