-- AlterTable
ALTER TABLE "Lottery" ADD COLUMN     "commissionWithdrawn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricePoolWithdrawn" BOOLEAN NOT NULL DEFAULT false;
