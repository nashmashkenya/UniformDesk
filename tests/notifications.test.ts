import { describe, expect, it } from "vitest";
import {
  listSchoolNotifications,
  listSupplierNotifications,
} from "@/modules/reports/notifications";
import { createDelivery } from "@/modules/supply/deliveries";
import { createInvoiceFromDelivery } from "@/modules/supply/invoices";
import { seedSchoolDesk, seedSupplyChain } from "./helpers/fixtures";

describe("notifications", () => {
  it("flags low stock on the school desk", async () => {
    const desk = await seedSchoolDesk({ openingQty: 2 });
    const notices = await listSchoolNotifications(desk.school.id);

    expect(notices.some((n) => n.kind === "low_stock")).toBe(true);
    expect(notices.find((n) => n.kind === "low_stock")?.href).toBe("/reorder");
  });

  it("flags unpaid invoices and inbound deliveries", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      markInTransit: true,
      lines: [{ productId: chain.product.id, sizeLabel: "M", qty: 2 }],
    });
    const invoice = await createInvoiceFromDelivery({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      deliveryId: delivery.id,
    });

    const school = await listSchoolNotifications(chain.school.id);
    expect(
      school.some(
        (n) => n.kind === "delivery_receive" && n.href.includes(delivery.id),
      ),
    ).toBe(true);
    expect(
      school.some(
        (n) => n.kind === "unpaid_invoice" && n.href.includes(invoice.id),
      ),
    ).toBe(true);

    const supplier = await listSupplierNotifications(chain.supplier.id);
    expect(
      supplier.some(
        (n) => n.kind === "collect_payment" && n.href.includes(invoice.id),
      ),
    ).toBe(true);
  });

  it("flags packed deliveries for supplier dispatch", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      markInTransit: false,
      lines: [{ productId: chain.product.id, sizeLabel: "M", qty: 1 }],
    });

    const notices = await listSupplierNotifications(chain.supplier.id);
    expect(
      notices.some(
        (n) =>
          n.kind === "delivery_dispatch" && n.href.includes(delivery.id),
      ),
    ).toBe(true);
  });

  it("returns empty when nothing is pending", async () => {
    const desk = await seedSchoolDesk({ openingQty: 50 });
    expect(await listSchoolNotifications(desk.school.id)).toEqual([]);
  });
});
