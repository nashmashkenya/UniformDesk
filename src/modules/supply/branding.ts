import { prisma } from "@/lib/db";

const HEX = /^#([0-9a-fA-F]{6})$/;

export type SupplierBrand = {
  name: string;
  brandName: string;
  brandPrimary: string;
  brandMark: string;
  supportEmail: string | null;
  supportPhone: string | null;
};

export function normalizeBrandPrimary(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return "#0f6cbd";
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (!HEX.test(withHash)) throw new Error("Brand color must be a hex like #0F6CBD");
  return withHash.toLowerCase();
}

export async function getSupplierBrand(
  supplierId: string,
): Promise<SupplierBrand | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) return null;

  const brandName = supplier.brandName?.trim() || supplier.name;
  const brandPrimary = normalizeBrandPrimary(supplier.brandPrimary);
  const brandMark = (
    supplier.brandMark?.trim() ||
    brandName
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2) ||
    "UD"
  ).toUpperCase();

  return {
    name: supplier.name,
    brandName,
    brandPrimary,
    brandMark,
    supportEmail: supplier.supportEmail,
    supportPhone: supplier.supportPhone,
  };
}

export async function updateSupplierBrand(input: {
  supplierId: string;
  brandName: string;
  brandPrimary: string;
  brandMark: string;
  supportEmail: string;
  supportPhone: string;
}) {
  const brandName = input.brandName.trim();
  const brandMark = input.brandMark.trim().slice(0, 3).toUpperCase();
  const brandPrimary = normalizeBrandPrimary(input.brandPrimary);
  const supportEmail = input.supportEmail.trim().toLowerCase() || null;
  const supportPhone = input.supportPhone.trim() || null;

  if (!brandName) throw new Error("Brand name is required");
  if (!brandMark) throw new Error("Brand mark is required");

  return prisma.supplier.update({
    where: { id: input.supplierId },
    data: {
      brandName,
      brandPrimary,
      brandMark,
      supportEmail,
      supportPhone,
    },
  });
}
