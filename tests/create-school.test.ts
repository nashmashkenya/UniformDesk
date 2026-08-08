import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createSchoolForSupplier } from "@/modules/supply/portfolio";
import { seedSupplyChain } from "./helpers/fixtures";

describe("create school for supplier", () => {
  it("creates school, link, and reporter", async () => {
    const chain = await seedSupplyChain();
    const code = `T${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const result = await createSchoolForSupplier({
      supplierId: chain.supplier.id,
      name: "Test Senior School",
      code,
      reporterName: "Desk Reporter",
      reporterEmail: `report-${code.toLowerCase()}@test.school`,
      reporterPassword: "desk1234x",
    });

    expect(result.school.code).toBe(code);
    expect(result.reporter.role).toBe("school_reporter");

    const link = await prisma.supplierSchool.findFirst({
      where: {
        supplierId: chain.supplier.id,
        schoolId: result.school.id,
      },
    });
    expect(link).toBeTruthy();
  });

  it("rejects duplicate school codes", async () => {
    const chain = await seedSupplyChain();
    await expect(
      createSchoolForSupplier({
        supplierId: chain.supplier.id,
        name: "Dup School",
        code: chain.school.code,
        reporterName: "R",
        reporterEmail: `dup-${Date.now()}@test.school`,
        reporterPassword: "desk1234x",
      }),
    ).rejects.toThrow(/already in use/i);
  });
});
