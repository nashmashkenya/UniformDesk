-- AlterTable
ALTER TABLE "IssueSlip" ADD COLUMN "publicToken" TEXT;

-- Backfill existing slips (id is already a cuid)
UPDATE "IssueSlip" SET "publicToken" = "id" WHERE "publicToken" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "IssueSlip_publicToken_key" ON "IssueSlip"("publicToken");
