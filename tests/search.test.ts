import { describe, expect, it } from "vitest";
import { issueKit } from "@/modules/issue/issue";
import {
  searchSchoolDesk,
  searchSupplierDesk,
} from "@/modules/reports/search";
import { createDelivery } from "@/modules/supply/deliveries";
import {
  fakeSignature,
  seedSchoolDesk,
  seedSupplyChain,
} from "./helpers/fixtures";

describe("desk search", () => {
  it("finds students and slips by admission / slip no fragments", async () => {
    const desk = await seedSchoolDesk();

    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      acknowledgmentName: "Parent",
      acknowledgmentSignature: fakeSignature(),
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 1 },
      ],
    });

    const byAdmission = await searchSchoolDesk(desk.school.id, "TST-001");
    expect(byAdmission.some((h) => h.kind === "student")).toBe(true);
    expect(byAdmission.some((h) => h.href === `/students/${desk.student.id}`)).toBe(
      true,
    );

    const bySlip = await searchSchoolDesk(
      desk.school.id,
      slip.slipNo.slice(0, 8),
    );
    expect(bySlip.some((h) => h.kind === "slip" && h.title === slip.slipNo)).toBe(
      true,
    );
  });

  it("returns nothing for short queries", async () => {
    const desk = await seedSchoolDesk();
    expect(await searchSchoolDesk(desk.school.id, "a")).toEqual([]);
  });
});

describe("supplier search", () => {
  it("finds products, schools, and deliveries by fragment", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      markInTransit: true,
      lines: [{ productId: chain.product.id, sizeLabel: "M", qty: 2 }],
    });

    const bySku = await searchSupplierDesk(chain.supplier.id, "SHIRT");
    expect(bySku.some((h) => h.kind === "product")).toBe(true);

    const bySchool = await searchSupplierDesk(
      chain.supplier.id,
      chain.school.code.slice(0, 3),
    );
    expect(bySchool.some((h) => h.kind === "school")).toBe(true);

    const byDn = await searchSupplierDesk(
      chain.supplier.id,
      delivery.deliveryNo.slice(0, 6),
    );
    expect(
      byDn.some((h) => h.kind === "delivery" && h.title === delivery.deliveryNo),
    ).toBe(true);
  });

  it("returns nothing for short queries", async () => {
    const chain = await seedSupplyChain();
    expect(await searchSupplierDesk(chain.supplier.id, "a")).toEqual([]);
  });
});
