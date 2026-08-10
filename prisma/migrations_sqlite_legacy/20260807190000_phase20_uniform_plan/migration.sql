-- Still-to-receive tracking for incomplete admission kits

CREATE TABLE "StudentUniformPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kitId" TEXT,
    "label" TEXT NOT NULL,
    "academicYear" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "StudentUniformPlan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentUniformPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StudentUniformPlanLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qtyNeeded" INTEGER NOT NULL,
    "qtyReceived" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudentUniformPlanLine_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudentUniformPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentUniformPlanLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StudentUniformPlan_schoolId_status_idx" ON "StudentUniformPlan"("schoolId", "status");
CREATE INDEX "StudentUniformPlan_studentId_status_idx" ON "StudentUniformPlan"("studentId", "status");
CREATE UNIQUE INDEX "StudentUniformPlanLine_planId_itemId_key" ON "StudentUniformPlanLine"("planId", "itemId");
