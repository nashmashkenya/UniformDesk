import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { publishProductsToSchool } from "@/modules/catalog/items";
import { seedSupplyChain } from "./helpers/fixtures";

describe("publishProductsToSchool", () => {
  it("copies selected supplier products onto the school catalogue", async () => {
    const chain = await seedSupplyChain();

    const extra = await prisma.supplierProduct.create({
      data: {
        supplierId: chain.supplier.id,
        sku: "TIE-NVY",
        name: "Navy Tie",
        category: "tie",
        unitPrice: 50000,
        sizes: { create: [{ sizeLabel: "ONESIZE" }] },
      },
    });

    const result = await publishProductsToSchool({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      productIds: [extra.id],
    });

    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);

    const item = await prisma.item.findFirstOrThrow({
      where: { schoolId: chain.school.id, sku: "TIE-NVY" },
      include: { sizes: true },
    });
    expect(item.name).toBe("Navy Tie");
    expect(item.sizes.map((s) => s.sizeLabel)).toEqual(["ONESIZE"]);
  });

  it("skips products already on the school", async () => {
    const chain = await seedSupplyChain();

    await expect(
      publishProductsToSchool({
        supplierId: chain.supplier.id,
        schoolId: chain.school.id,
        productIds: [chain.product.id],
      }),
    ).rejects.toThrow(/already on this school/i);
  });
});
