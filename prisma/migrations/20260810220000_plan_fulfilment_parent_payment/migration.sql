-- CreateEnum
CREATE TYPE "PlanMoneyStatus" AS ENUM ('unpaid', 'paid', 'deposit', 'waived');

-- AlterTable Student
ALTER TABLE "Student" ADD COLUMN "parentName" TEXT;
ALTER TABLE "Student" ADD COLUMN "parentPhone" TEXT;

-- AlterTable StudentUniformPlanLine
ALTER TABLE "StudentUniformPlanLine" ADD COLUMN "moneyStatus" "PlanMoneyStatus" NOT NULL DEFAULT 'unpaid';
ALTER TABLE "StudentUniformPlanLine" ADD COLUMN "holdReason" TEXT;
ALTER TABLE "StudentUniformPlanLine" ADD COLUMN "heldAt" TIMESTAMP(3);

-- AlterTable IssueSlip
ALTER TABLE "IssueSlip" ADD COLUMN "paymentAmountCents" INTEGER;

-- AlterTable IssueLine
ALTER TABLE "IssueLine" ADD COLUMN "heldByDesk" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "StudentUniformPlanLine_moneyStatus_idx" ON "StudentUniformPlanLine"("moneyStatus");
