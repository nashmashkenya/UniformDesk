import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createItem } from "@/modules/catalog/items";
import { createKit } from "@/modules/catalog/kits";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";
import { seedSupplyChain } from "./helpers/fixtures";

describe("school catalogue for supplier-linked schools", () => {
  it("allows per-school items and kits after link assert", async () => {
    const chain = await seedSupplyChain();
    await assertSupplierSchoolLink(chain.supplier.id, chain.school.id);

    const skirt = await createItem({
      schoolId: chain.school.id,
      sku: `SKIRT-${Date.now().toString(36).toUpperCase()}`,
      name: "Navy Skirt",
      category: "skirt",
      sizes: ["S", "M", "L"],
    });

    const kit = await createKit({
      schoolId: chain.school.id,
      name: "Form 1 Girls",
      academicYear: "2026",
      lines: [{ itemId: skirt.id, qtyDefault: 2 }],
    });

    expect(kit.lines).toHaveLength(1);
    expect(kit.lines[0]?.item.sku).toBe(skirt.sku);

    const listed = await prisma.kit.findFirst({
      where: { id: kit.id, schoolId: chain.school.id },
      include: { lines: true },
    });
    expect(listed?.name).toBe("Form 1 Girls");
  });

  it("rejects kit lines from another school", async () => {
    const chain = await seedSupplyChain();
    const other = await prisma.school.create({
      data: {
        name: "Other School",
        code: `O${Date.now().toString(36).toUpperCase().slice(-5)}`,
      },
    });
    const foreign = await createItem({
      schoolId: other.id,
      sku: `FX-${Date.now().toString(36).toUpperCase()}`,
      name: "Foreign Shirt",
      category: "shirt",
      sizes: ["M"],
    });

    await expect(
      createKit({
        schoolId: chain.school.id,
        name: "Bad Kit",
        academicYear: "2026",
        lines: [{ itemId: foreign.id, qtyDefault: 1 }],
      }),
    ).rejects.toThrow(/not found/i);
  });
});
