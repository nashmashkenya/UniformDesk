import { describe, expect, it } from "vitest";
import { adjustStock } from "@/modules/inventory/adjust";
import { issueKit } from "@/modules/issue/issue";
import { recordManualPayment } from "@/modules/payments/payments";
import {
  schoolActivityFeed,
  supplierActivityFeed,
} from "@/modules/reports/activity";
import { createDelivery, dispatchDelivery } from "@/modules/supply/deliveries";
import { createInvoiceFromDelivery } from "@/modules/supply/invoices";
import { seedSchoolDesk, seedSupplyChain } from "./helpers/fixtures";

describe("school activity feed", () => {
  it("includes issue and adjust events with correlation ids", async () => {
    const desk = await seedSchoolDesk({ openingQty: 10 });

    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 2 },
      ],
    });

    await adjustStock({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      itemId: desk.item.id,
      sizeLabel: "M",
      qtyDelta: 1,
      reasonNote: "Found in cupboard",
    });

    const feed = await schoolActivityFeed(desk.school.id, 20);
    const kinds = feed.map((e) => e.kind);

    expect(kinds).toContain("issue");
    expect(kinds).toContain("adjust");

    const issueEvent = feed.find((e) => e.kind === "issue");
    expect(issueEvent?.correlationId).toBe(slip.slipNo);
    expect(issueEvent?.href).toBe(`/slips/${slip.id}`);

    const adjustEvent = feed.find((e) => e.kind === "adjust");
    expect(adjustEvent?.detail).toMatch(/Found in cupboard/);
    expect(adjustEvent?.correlationId).toBeTruthy();
  });
});

describe("supplier activity feed", () => {
  it("tracks pack, dispatch, invoice, and payment confirmation", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      lines: [{ productId: chain.product.id, sizeLabel: "M", qty: 2 }],
    });

    await dispatchDelivery({
      supplierId: chain.supplier.id,
      deliveryId: delivery.id,
    });

    const invoice = await createInvoiceFromDelivery({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      deliveryId: delivery.id,
    });

    const payment = await recordManualPayment({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      invoiceId: invoice.id,
      amountCents: invoice.amountCents,
      method: "cash",
    });

    const feed = await supplierActivityFeed(chain.supplier.id, 30);
    const kinds = feed.map((e) => e.kind);

    expect(kinds).toContain("delivery_created");
    expect(kinds).toContain("delivery_dispatch");
    expect(kinds).toContain("invoice_issued");
    expect(kinds).toContain("payment_confirmed");

    expect(
      feed.find((e) => e.kind === "delivery_created")?.correlationId,
    ).toBe(delivery.deliveryNo);
    expect(
      feed.find((e) => e.kind === "invoice_issued")?.href,
    ).toBe(`/supplier/invoices/${invoice.id}`);
    expect(
      feed.find((e) => e.kind === "payment_confirmed")?.correlationId,
    ).toBe(payment.paymentNo);
  });
});
