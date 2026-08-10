import { prisma } from "@/lib/db";

const CATEGORIES = [
  "shirt",
  "blouse",
  "trouser",
  "skirt",
  "sweater",
  "tunic",
  "dress",
  "shoes",
  "socks",
  "tie",
  "other",
] as const;

export type ItemCategory = (typeof CATEGORIES)[number];

export function listCategories() {
  return CATEGORIES;
}

export async function listItems(schoolId: string) {
  return prisma.item.findMany({
    where: { schoolId },
    include: { sizes: { orderBy: { sizeLabel: "asc" } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

/** Copy selected supplier products onto a school catalogue (SKU + sizes). */
export async function publishProductsToSchool(input: {
  supplierId: string;
  schoolId: string;
  productIds: string[];
}) {
  const productIds = [...new Set(input.productIds.filter(Boolean))];
  if (!productIds.length) throw new Error("Select at least one product");

  const products = await prisma.supplierProduct.findMany({
    where: {
      supplierId: input.supplierId,
      id: { in: productIds },
      active: true,
    },
    include: { sizes: { orderBy: { sizeLabel: "asc" } } },
  });
  if (!products.length) {
    throw new Error("No matching active products found");
  }

  let added = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await prisma.item.findFirst({
      where: {
        schoolId: input.schoolId,
        sku: product.sku,
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const sizes = product.sizes.map((s) => s.sizeLabel);
    if (!sizes.length) {
      throw new Error(
        `Product ${product.sku} has no sizes. Add sizes under Products first.`,
      );
    }

    await createItem({
      schoolId: input.schoolId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      sizes,
    });
    added += 1;
  }

  if (!added && skipped) {
    throw new Error(
      "Those products are already on this school’s catalogue",
    );
  }

  return { added, skipped };
}

export async function createItem(input: {
  schoolId: string;
  sku: string;
  name: string;
  category: string;
  sizes: string[];
}) {
  const sku = input.sku.trim().toUpperCase();
  const name = input.name.trim();
  const sizes = [
    ...new Set(
      input.sizes
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];

  if (!sku || !name) throw new Error("SKU and name are required");
  if (!sizes.length) throw new Error("Add at least one size");

  try {
    return await prisma.item.create({
      data: {
        schoolId: input.schoolId,
        sku,
        name,
        category: input.category.trim() || "other",
        sizes: {
          create: sizes.map((sizeLabel) => ({ sizeLabel })),
        },
      },
      include: { sizes: true },
    });
  } catch {
    throw new Error("An item with this SKU already exists");
  }
}

export async function addItemSize(input: {
  schoolId: string;
  itemId: string;
  sizeLabel: string;
}) {
  const sizeLabel = input.sizeLabel.trim();
  if (!sizeLabel) throw new Error("Size is required");

  const item = await prisma.item.findFirst({
    where: { id: input.itemId, schoolId: input.schoolId },
  });
  if (!item) throw new Error("Item not found");

  try {
    return await prisma.itemSize.create({
      data: { itemId: item.id, sizeLabel },
    });
  } catch {
    throw new Error("This size already exists on the item");
  }
}

export async function setItemActive(input: {
  schoolId: string;
  itemId: string;
  active: boolean;
}) {
  const item = await prisma.item.findFirst({
    where: { id: input.itemId, schoolId: input.schoolId },
  });
  if (!item) throw new Error("Item not found");

  return prisma.item.update({
    where: { id: item.id },
    data: { active: input.active },
  });
}

export async function updateItem(input: {
  schoolId: string;
  itemId: string;
  sku: string;
  name: string;
  category: string;
}) {
  const item = await prisma.item.findFirst({
    where: { id: input.itemId, schoolId: input.schoolId },
  });
  if (!item) throw new Error("Item not found");

  const sku = input.sku.trim().toUpperCase();
  const name = input.name.trim();
  const category = input.category.trim() || "other";
  if (!sku || !name) throw new Error("SKU and name are required");

  if (sku !== item.sku) {
    const clash = await prisma.item.findFirst({
      where: {
        schoolId: input.schoolId,
        sku,
        NOT: { id: item.id },
      },
      select: { id: true },
    });
    if (clash) throw new Error("Another item already uses this SKU");
  }

  try {
    return await prisma.item.update({
      where: { id: item.id },
      data: { sku, name, category },
      include: { sizes: { orderBy: { sizeLabel: "asc" } } },
    });
  } catch {
    throw new Error("Could not update item");
  }
}
