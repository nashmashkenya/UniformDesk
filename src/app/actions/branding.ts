"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierUser } from "@/lib/auth";
import { updateSupplierBrand } from "@/modules/supply/branding";
import { linkSchoolToSupplier } from "@/modules/supply/portfolio";

export type BrandState = { error?: string; ok?: boolean; message?: string };

export async function updateBrandingAction(
  _prev: BrandState,
  formData: FormData,
): Promise<BrandState> {
  try {
    const user = await requireSupplierUser();
    if (user.role !== "supplier_admin") {
      return { error: "Only supplier admins can edit branding" };
    }
    await updateSupplierBrand({
      supplierId: user.supplierId,
      brandName: String(formData.get("brandName") ?? ""),
      brandPrimary: String(formData.get("brandPrimary") ?? ""),
      brandMark: String(formData.get("brandMark") ?? ""),
      supportEmail: String(formData.get("supportEmail") ?? ""),
      supportPhone: String(formData.get("supportPhone") ?? ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save branding",
    };
  }
  revalidatePath("/supplier");
  revalidatePath("/supplier/branding");
  revalidatePath("/supplier/schools");
  return { ok: true, message: "Branding updated" };
}

export async function linkSchoolAction(
  _prev: BrandState,
  formData: FormData,
): Promise<BrandState> {
  try {
    const user = await requireSupplierUser();
    if (user.role !== "supplier_admin") {
      return { error: "Only supplier admins can link schools" };
    }
    await linkSchoolToSupplier({
      supplierId: user.supplierId,
      schoolCode: String(formData.get("schoolCode") ?? ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not link school",
    };
  }
  revalidatePath("/supplier");
  revalidatePath("/supplier/schools");
  revalidatePath("/supplier/orders");
  return { ok: true, message: "School linked" };
}
