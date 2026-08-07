import { notFound } from "next/navigation";
import { BrandingForm } from "@/components/branding-form";
import { requireSupplierUser } from "@/lib/auth";
import { getSupplierBrand } from "@/modules/supply/branding";

export default async function SupplierBrandingPage() {
  const user = await requireSupplierUser();
  if (user.role !== "supplier_admin") notFound();

  const brand = await getSupplierBrand(user.supplierId);
  if (!brand) notFound();

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">White-label branding</h1>
        <p className="page-sub">
          Portal mark, color, and support contacts for your supply desk.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-[4px] text-sm font-bold text-white"
              style={{ background: brand.brandPrimary }}
            >
              {brand.brandMark}
            </span>
            <div>
              <h2 className="card-title text-base">{brand.brandName}</h2>
              <p className="card-subtitle">Legal name · {brand.name}</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <BrandingForm brand={brand} />
        </div>
      </section>
    </div>
  );
}
