/*
  Warnings:

  - You are about to alter the column `pricePool` on the `Lottery` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Lottery" ALTER COLUMN "pricePool" SET DATA TYPE INTEGER;
