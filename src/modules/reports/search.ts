import { prisma } from "@/lib/db";

export type SearchHit = {
  id: string;
  kind: "student" | "slip" | "delivery" | "order" | "invoice";
  title: string;
  subtitle: string;
  href: string;
};

export async function searchSchoolDesk(
  schoolId: string,
  query: string,
  take = 8,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const like = q;
  const [students, slips, deliveries, orders, invoices] = await Promise.all([
    prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { admissionNo: { contains: like } },
          { fullName: { contains: like } },
          { className: { contains: like } },
        ],
      },
      take,
      orderBy: { admissionNo: "asc" },
    }),
    prisma.issueSlip.findMany({
      where: {
        schoolId,
        OR: [
          { slipNo: { contains: like } },
          { student: { fullName: { contains: like } } },
          { student: { admissionNo: { contains: like } } },
        ],
      },
      include: { student: true },
      take,
      orderBy: { issuedAt: "desc" },
    }),
    prisma.delivery.findMany({
      where: {
        schoolId,
        OR: [
          { deliveryNo: { contains: like } },
          { supplier: { name: { contains: like } } },
        ],
      },
      include: { supplier: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplyOrder.findMany({
      where: {
        schoolId,
        OR: [
          { orderNo: { contains: like } },
          { supplier: { name: { contains: like } } },
        ],
      },
      include: { supplier: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        schoolId,
        OR: [
          { invoiceNo: { contains: like } },
          { supplier: { name: { contains: like } } },
        ],
      },
      include: { supplier: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hits: SearchHit[] = [];

  for (const s of students) {
    hits.push({
      id: `student:${s.id}`,
      kind: "student",
      title: s.fullName,
      subtitle: `${s.admissionNo}${s.className ? ` · ${s.className}` : ""}`,
      href: `/students/${s.id}`,
    });
  }

  for (const slip of slips) {
    hits.push({
      id: `slip:${slip.id}`,
      kind: "slip",
      title: slip.slipNo,
      subtitle: `${slip.student.fullName} · ${slip.status}`,
      href: `/slips/${slip.id}`,
    });
  }

  for (const d of deliveries) {
    hits.push({
      id: `delivery:${d.id}`,
      kind: "delivery",
      title: d.deliveryNo,
      subtitle: `${d.supplier.name} · ${d.status}`,
      href: `/deliveries/${d.id}`,
    });
  }

  for (const o of orders) {
    hits.push({
      id: `order:${o.id}`,
      kind: "order",
      title: o.orderNo,
      subtitle: `${o.supplier.name} · ${o.status}`,
      href: `/orders/${o.id}`,
    });
  }

  for (const inv of invoices) {
    hits.push({
      id: `invoice:${inv.id}`,
      kind: "invoice",
      title: inv.invoiceNo,
      subtitle: `${inv.supplier.name} · ${inv.status}`,
      href: `/invoices/${inv.id}`,
    });
  }

  // Prefer exact-ish prefix matches first, then kind order.
  const rank = (hit: SearchHit) => {
    const t = hit.title.toLowerCase();
    const s = hit.subtitle.toLowerCase();
    const needle = q.toLowerCase();
    if (t === needle || s.startsWith(needle)) return 0;
    if (t.startsWith(needle)) return 1;
    if (t.includes(needle) || s.includes(needle)) return 2;
    return 3;
  };

  return hits.sort((a, b) => rank(a) - rank(b)).slice(0, take * 3);
}

export type SupplierSearchHit = {
  id: string;
  kind: "school" | "product" | "order" | "delivery" | "invoice";
  title: string;
  subtitle: string;
  href: string;
};

export async function searchSupplierDesk(
  supplierId: string,
  query: string,
  take = 8,
): Promise<SupplierSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const like = q;
  const [schools, products, orders, deliveries, invoices] = await Promise.all([
    prisma.supplierSchool.findMany({
      where: {
        supplierId,
        school: {
          OR: [
            { name: { contains: like } },
            { code: { contains: like } },
          ],
        },
      },
      include: { school: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierProduct.findMany({
      where: {
        supplierId,
        OR: [
          { sku: { contains: like } },
          { name: { contains: like } },
          { category: { contains: like } },
        ],
      },
      take,
      orderBy: { sku: "asc" },
    }),
    prisma.supplyOrder.findMany({
      where: {
        supplierId,
        OR: [
          { orderNo: { contains: like } },
          { school: { name: { contains: like } } },
          { school: { code: { contains: like } } },
        ],
      },
      include: { school: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.delivery.findMany({
      where: {
        supplierId,
        OR: [
          { deliveryNo: { contains: like } },
          { school: { name: { contains: like } } },
          { school: { code: { contains: like } } },
        ],
      },
      include: { school: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        supplierId,
        OR: [
          { invoiceNo: { contains: like } },
          { school: { name: { contains: like } } },
          { school: { code: { contains: like } } },
        ],
      },
      include: { school: true },
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hits: SupplierSearchHit[] = [];

  for (const link of schools) {
    hits.push({
      id: `school:${link.school.id}`,
      kind: "school",
      title: link.school.name,
      subtitle: link.school.code,
      href: `/supplier/schools?schoolId=${link.school.id}`,
    });
  }

  for (const p of products) {
    hits.push({
      id: `product:${p.id}`,
      kind: "product",
      title: p.name,
      subtitle: `${p.sku}${p.category ? ` · ${p.category}` : ""}`,
      href: `/supplier/catalog`,
    });
  }

  for (const o of orders) {
    hits.push({
      id: `order:${o.id}`,
      kind: "order",
      title: o.orderNo,
      subtitle: `${o.school.name} · ${o.status}`,
      href: `/supplier/orders/${o.id}`,
    });
  }

  for (const d of deliveries) {
    hits.push({
      id: `delivery:${d.id}`,
      kind: "delivery",
      title: d.deliveryNo,
      subtitle: `${d.school.name} · ${d.status}`,
      href: `/supplier/deliveries/${d.id}`,
    });
  }

  for (const inv of invoices) {
    hits.push({
      id: `invoice:${inv.id}`,
      kind: "invoice",
      title: inv.invoiceNo,
      subtitle: `${inv.school.name} · ${inv.status}`,
      href: `/supplier/invoices/${inv.id}`,
    });
  }

  const rank = (hit: SupplierSearchHit) => {
    const t = hit.title.toLowerCase();
    const s = hit.subtitle.toLowerCase();
    const needle = q.toLowerCase();
    if (t === needle || s.startsWith(needle)) return 0;
    if (t.startsWith(needle)) return 1;
    if (t.includes(needle) || s.includes(needle)) return 2;
    return 3;
  };

  return hits.sort((a, b) => rank(a) - rank(b)).slice(0, take * 3);
}
