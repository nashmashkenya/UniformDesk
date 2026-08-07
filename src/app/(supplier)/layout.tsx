import { SupplierNav } from "@/components/supplier-nav";
import { requireSupplierUser } from "@/lib/auth";
import { getSupplierBrand } from "@/modules/supply/branding";
import { countSupplierNotifications } from "@/modules/reports/notifications";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSupplierUser();
  const [brand, noticeCount] = await Promise.all([
    getSupplierBrand(user.supplierId),
    countSupplierNotifications(user.supplierId),
  ]);

  const brandStyle = brand
    ? ({
        ["--accent" as string]: brand.brandPrimary,
        ["--accent-hover" as string]: brand.brandPrimary,
        ["--cta" as string]: brand.brandPrimary,
        ["--signal" as string]: brand.brandPrimary,
        ["--nav-active-text" as string]: brand.brandPrimary,
        ["--nav-underline" as string]: brand.brandPrimary,
        ["--ribbon" as string]: brand.brandPrimary,
        ["--mark-from" as string]: brand.brandPrimary,
        ["--mark-to" as string]: brand.brandPrimary,
        ["--hero-base" as string]: brand.brandPrimary,
        ["--hero-mid" as string]: brand.brandPrimary,
      } as React.CSSProperties)
    : undefined;

  const brandedUser = brand
    ? { ...user, supplierName: brand.brandName }
    : user;

  return (
    <div className="flex min-h-full flex-col" style={brandStyle} data-brand="supplier">
      <SupplierNav
        user={brandedUser}
        brandMark={brand?.brandMark}
        noticeCount={noticeCount}
      />
      <main className="desk-main flex-1">{children}</main>
    </div>
  );
}
