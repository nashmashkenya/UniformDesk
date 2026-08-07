import { prisma } from "@/lib/db";

export async function listSupplierProducts(supplierId: string) {
  return prisma.supplierProduct.findMany({
    where: { supplierId },
    include: { sizes: { orderBy: { sizeLabel: "asc" } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createSupplierProduct(input: {
  supplierId: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  sizes: string[];
}) {
  const sku = input.sku.trim().toUpperCase();
  const name = input.name.trim();
  const sizes = [
    ...new Set(input.sizes.map((s) => s.trim()).filter(Boolean)),
  ];
  if (!sku || !name) throw new Error("SKU and name are required");
  if (!sizes.length) throw new Error("Add at least one size");
  if (input.unitPrice < 0) throw new Error("Price cannot be negative");

  try {
    return await prisma.supplierProduct.create({
      data: {
        supplierId: input.supplierId,
        sku,
        name,
        category: input.category.trim() || "other",
        unitPrice: Math.round(input.unitPrice),
        sizes: { create: sizes.map((sizeLabel) => ({ sizeLabel })) },
      },
      include: { sizes: true },
    });
  } catch {
    throw new Error("A product with this SKU already exists");
  }
}

export async function listLinkedSchools(supplierId: string) {
  return prisma.supplierSchool.findMany({
    where: { supplierId },
    include: { school: true },
    orderBy: { school: { name: "asc" } },
  });
}

export async function listLinkedSuppliers(schoolId: string) {
  return prisma.supplierSchool.findMany({
    where: { schoolId },
    include: { supplier: true },
    orderBy: { supplier: { name: "asc" } },
  });
}
