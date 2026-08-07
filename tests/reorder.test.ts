import { describe, expect, it } from "vitest";
import { createOrder } from "@/modules/supply/orders";
import { lowStockReorderSuggestions } from "@/modules/supply/reorder";
import { seedSupplyChain } from "./helpers/fixtures";
import { prisma } from "@/lib/db";

describe("low-stock reorder", () => {
  it("suggests matched lines and creates an order from them", async () => {
    const chain = await seedSupplyChain(); // opening qty 5 → at threshold

    await prisma.stockBalance.update({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
      data: { qtyOnHand: 2 },
    });

    const suggestions = await lowStockReorderSuggestions({
      schoolId: chain.school.id,
      supplierId: chain.supplier.id,
      threshold: 5,
      targetQty: 20,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    const shirt = suggestions.find(
      (s) => s.sku === "SHIRT-WHT" && s.sizeLabel === "M",
    );
    expect(shirt?.matched).toBe(true);
    expect(shirt?.productId).toBe(chain.product.id);
    expect(shirt?.suggestedQty).toBe(18);

    const order = await createOrder({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.user.id,
      note: "Low-stock reorder",
      lines: [
        {
          productId: shirt!.productId!,
          sizeLabel: "M",
          qty: shirt!.suggestedQty,
        },
      ],
    });

    expect(order.status).toBe("confirmed");
    expect(order.lines[0]?.qty).toBe(18);
  });

  it("marks unmatched when supplier lacks the size", async () => {
    const chain = await seedSupplyChain();
    await prisma.supplierProductSize.deleteMany({
      where: { productId: chain.product.id, sizeLabel: "M" },
    });

    const suggestions = await lowStockReorderSuggestions({
      schoolId: chain.school.id,
      supplierId: chain.supplier.id,
      threshold: 10,
    });

    const shirt = suggestions.find((s) => s.sku === "SHIRT-WHT");
    expect(shirt?.matched).toBe(false);
    expect(shirt?.productId).toBeNull();
  });
});
