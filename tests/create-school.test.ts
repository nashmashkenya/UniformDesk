import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createSchoolForSupplier } from "@/modules/supply/portfolio";
import { seedSupplyChain } from "./helpers/fixtures";

describe("create school for supplier", () => {
  it("creates school and link without school reporter login", async () => {
    const chain = await seedSupplyChain();
    const code = `T${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const result = await createSchoolForSupplier({
      supplierId: chain.supplier.id,
      name: "Test Senior School",
      code,
    });

    expect(result.school.code).toBe(code);

    const link = await prisma.supplierSchool.findFirst({
      where: {
        supplierId: chain.supplier.id,
        schoolId: result.school.id,
      },
    });
    expect(link).toBeTruthy();

    const schoolUsers = await prisma.user.count({
      where: { schoolId: result.school.id },
    });
    expect(schoolUsers).toBe(0);
  });

  it("rejects duplicate school codes", async () => {
    const chain = await seedSupplyChain();
    await expect(
      createSchoolForSupplier({
        supplierId: chain.supplier.id,
        name: "Dup School",
        code: chain.school.code,
      }),
    ).rejects.toThrow(/already in use/i);
  });
});
