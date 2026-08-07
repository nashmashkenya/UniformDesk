import { prisma } from "@/lib/db";

const CATEGORIES = [
  "shirt",
  "trouser",
  "sweater",
  "shoes",
  "skirt",
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
