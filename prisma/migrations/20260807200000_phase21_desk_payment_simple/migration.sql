-- Simple desk payment: method + reference only. Slip/signature not required for parents.

ALTER TABLE "IssueSlip" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "IssueSlip" ADD COLUMN "paymentReference" TEXT;
