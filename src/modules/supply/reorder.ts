import { prisma } from "@/lib/db";
import { listLinkedSuppliers } from "@/modules/supply/products";

export type ReorderSuggestion = {
  itemId: string;
  itemName: string;
  sku: string;
  sizeLabel: string;
  qtyOnHand: number;
  suggestedQty: number;
  productId: string | null;
  productName: string | null;
  matched: boolean;
};

export async function lowStockReorderSuggestions(input: {
  schoolId: string;
  supplierId: string;
  threshold?: number;
  targetQty?: number;
}) {
  const threshold = input.threshold ?? 5;
  const targetQty = input.targetQty ?? 20;

  const links = await listLinkedSuppliers(input.schoolId);
  if (!links.some((l) => l.supplierId === input.supplierId)) {
    throw new Error("Supplier is not linked to this school");
  }

  const [balances, products] = await Promise.all([
    prisma.stockBalance.findMany({
      where: { schoolId: input.schoolId, qtyOnHand: { lte: threshold } },
      include: { item: true },
      orderBy: [{ qtyOnHand: "asc" }, { item: { name: "asc" } }],
    }),
    prisma.supplierProduct.findMany({
      where: { supplierId: input.supplierId, active: true },
      include: { sizes: true },
    }),
  ]);

  const bySku = new Map(products.map((p) => [p.sku.toUpperCase(), p]));

  const suggestions: ReorderSuggestion[] = [];
  for (const row of balances) {
    if (!row.item.active) continue;
    const product = bySku.get(row.item.sku.toUpperCase()) ?? null;
    const sizeOk =
      product?.sizes.some((s) => s.sizeLabel === row.sizeLabel) ?? false;
    const matched = Boolean(product && sizeOk);
    const suggestedQty = Math.max(1, targetQty - row.qtyOnHand);

    suggestions.push({
      itemId: row.itemId,
      itemName: row.item.name,
      sku: row.item.sku,
      sizeLabel: row.sizeLabel,
      qtyOnHand: row.qtyOnHand,
      suggestedQty,
      productId: matched ? product!.id : null,
      productName: matched ? product!.name : null,
      matched,
    });
  }

  return suggestions;
}
