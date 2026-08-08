import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/db";

export type NoticeSeverity = "warn" | "info" | "accent";

export type DeskNotice = {
  id: string;
  kind:
    | "low_stock"
    | "unpaid_invoice"
    | "delivery_receive"
    | "open_order"
    | "delivery_dispatch"
    | "collect_payment";
  severity: NoticeSeverity;
  title: string;
  detail: string;
  href: string;
};

const LOW_STOCK_THRESHOLD = 5;

export async function listSchoolNotifications(
  schoolId: string,
  opts?: { threshold?: number; take?: number },
): Promise<DeskNotice[]> {
  const threshold = opts?.threshold ?? LOW_STOCK_THRESHOLD;
  const take = opts?.take ?? 12;

  const [lowStockCount, lowStockSample, deliveries] = await Promise.all([
    prisma.stockBalance.count({
      where: { schoolId, qtyOnHand: { lte: threshold } },
    }),
    prisma.stockBalance.findMany({
      where: { schoolId, qtyOnHand: { lte: threshold } },
      include: { item: { select: { name: true, sku: true } } },
      orderBy: { qtyOnHand: "asc" },
      take: 3,
    }),
    prisma.delivery.findMany({
      where: {
        schoolId,
        status: { in: ["packed", "in_transit"] },
      },
      include: { supplier: { select: { name: true, brandName: true } } },
      orderBy: { createdAt: "asc" },
      take,
    }),
  ]);

  const notices: DeskNotice[] = [];

  if (lowStockCount > 0) {
    const sample = lowStockSample
      .map((b) => `${b.item.name} ${b.sizeLabel} (${b.qtyOnHand})`)
      .join(" · ");
    notices.push({
      id: "low_stock",
      kind: "low_stock",
      severity: "warn",
      title: `${lowStockCount} low-stock size${lowStockCount === 1 ? "" : "s"}`,
      detail: sample
        ? `${sample}${lowStockCount > 3 ? " · …" : ""}`
        : `At or below ${threshold} on hand`,
      href: "/stock",
    });
  }

  for (const d of deliveries) {
    const supplier = d.supplier.brandName || d.supplier.name;
    notices.push({
      id: `delivery:${d.id}`,
      kind: "delivery_receive",
      severity: d.status === "in_transit" ? "accent" : "info",
      title: `Receive ${d.deliveryNo}`,
      detail: `${supplier} · ${d.status.replaceAll("_", " ")}`,
      href: `/deliveries/${d.id}`,
    });
  }

  return rankNotices(notices).slice(0, take);
}

export async function listSupplierNotifications(
  supplierId: string,
  opts?: { take?: number },
): Promise<DeskNotice[]> {
  const take = opts?.take ?? 12;

  const [invoices, packed, orders] = await Promise.all([
    prisma.invoice.findMany({
      where: { supplierId, status: "issued" },
      include: { school: { select: { name: true, code: true } } },
      orderBy: { issuedAt: "asc" },
      take,
    }),
    prisma.delivery.findMany({
      where: { supplierId, status: "packed" },
      include: { school: { select: { name: true, code: true } } },
      orderBy: { createdAt: "asc" },
      take,
    }),
    prisma.supplyOrder.findMany({
      where: {
        supplierId,
        status: { in: ["draft", "confirmed"] },
      },
      include: { school: { select: { name: true, code: true } } },
      orderBy: { createdAt: "asc" },
      take,
    }),
  ]);

  const notices: DeskNotice[] = [];

  for (const d of packed) {
    notices.push({
      id: `delivery:${d.id}`,
      kind: "delivery_dispatch",
      severity: "accent",
      title: `Dispatch ${d.deliveryNo}`,
      detail: `${d.school.name} · packed`,
      href: `/supplier/deliveries/${d.id}`,
    });
  }

  for (const inv of invoices) {
    notices.push({
      id: `invoice:${inv.id}`,
      kind: "collect_payment",
      severity: "warn",
      title: `Collect ${inv.invoiceNo}`,
      detail: `${inv.school.name} · ${formatMoney(inv.amountCents)}`,
      href: `/supplier/invoices/${inv.id}`,
    });
  }

  for (const o of orders) {
    notices.push({
      id: `order:${o.id}`,
      kind: "open_order",
      severity: "info",
      title: `Open order ${o.orderNo}`,
      detail: `${o.school.name} · ${o.status}`,
      href: `/supplier/orders/${o.id}`,
    });
  }

  return rankNotices(notices).slice(0, take);
}

export async function countSchoolNotifications(schoolId: string) {
  const notices = await listSchoolNotifications(schoolId, { take: 50 });
  return notices.length;
}

export async function countSupplierNotifications(supplierId: string) {
  const notices = await listSupplierNotifications(supplierId, { take: 50 });
  return notices.length;
}

function rankNotices(notices: DeskNotice[]) {
  const weight: Record<NoticeSeverity, number> = {
    warn: 0,
    accent: 1,
    info: 2,
  };
  return [...notices].sort(
    (a, b) => weight[a.severity] - weight[b.severity] || a.title.localeCompare(b.title),
  );
}
