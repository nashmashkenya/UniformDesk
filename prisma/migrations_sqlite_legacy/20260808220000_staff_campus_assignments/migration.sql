-- CreateTable
CREATE TABLE "SupplierStaffCampus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierStaffCampus_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierStaffCampus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierStaffCampus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierStaffCampus_userId_schoolId_key" ON "SupplierStaffCampus"("userId", "schoolId");

-- CreateIndex
CREATE INDEX "SupplierStaffCampus_supplierId_userId_idx" ON "SupplierStaffCampus"("supplierId", "userId");

-- CreateIndex
CREATE INDEX "SupplierStaffCampus_schoolId_idx" ON "SupplierStaffCampus"("schoolId");
