import { describe, expect, it } from "vitest";
import { issueKit } from "@/modules/issue/issue";
import {
  listSchoolIssuedForSupplier,
  listSchoolStockForSupplier,
  supplierReportStats,
} from "@/modules/reports/supplier-reports";
import { seedSupplyChain } from "./helpers/fixtures";

describe("supplier reports", () => {
  it("lists issued and stock for a linked school", async () => {
    const chain = await seedSupplyChain();

    await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "cash",
      paymentReference: "R1",
      lines: [
        { itemId: chain.item.id, sizeLabel: "M", qtyRequested: 2 },
      ],
    });

    const issued = await listSchoolIssuedForSupplier({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
    });
    expect(issued.length).toBeGreaterThanOrEqual(1);
    expect(issued[0]?.paymentMethod).toBe("cash");
    expect(issued[0]?.student.fullName).toBe(chain.student.fullName);

    // seedSupplyChain opens with qty 5
    const stock = await listSchoolStockForSupplier({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
    });
    expect(stock.some((b) => b.itemId === chain.item.id && b.qtyOnHand === 3)).toBe(
      true,
    );

    const stats = await supplierReportStats({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
    });
    expect(stats.issuedToday).toBeGreaterThanOrEqual(1);
  });

  it("rejects stock/issued for an unlinked school", async () => {
    const chain = await seedSupplyChain();
    await expect(
      listSchoolStockForSupplier({
        supplierId: chain.supplier.id,
        schoolId: "not-a-real-school",
      }),
    ).rejects.toThrow(/not linked/i);
  });
});
