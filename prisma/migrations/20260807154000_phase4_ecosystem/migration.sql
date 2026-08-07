-- AlterTable
ALTER TABLE "School" ADD COLUMN "schoolMasterExternalId" TEXT;
ALTER TABLE "School" ADD COLUMN "apiKeyPrefix" TEXT;
ALTER TABLE "School" ADD COLUMN "apiKeyHash" TEXT;
ALTER TABLE "School" ADD COLUMN "lastRosterSyncAt" DATETIME;
ALTER TABLE "School" ADD COLUMN "lastRosterSyncNote" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "brandName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "brandPrimary" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "brandMark" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "supportEmail" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "supportPhone" TEXT;
