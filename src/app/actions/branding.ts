"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierUser } from "@/lib/auth";
import { updateSupplierBrand } from "@/modules/supply/branding";
import {
  createSchoolForSupplier,
  linkSchoolToSupplier,
} from "@/modules/supply/portfolio";

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

export async function createSchoolAction(
  _prev: BrandState,
  formData: FormData,
): Promise<BrandState> {
  try {
    const user = await requireSupplierUser();
    if (user.role !== "supplier_admin") {
      return { error: "Only supplier admins can create schools" };
    }
    const result = await createSchoolForSupplier({
      supplierId: user.supplierId,
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? ""),
      reporterName: String(formData.get("reporterName") ?? ""),
      reporterEmail: String(formData.get("reporterEmail") ?? ""),
      reporterPassword: String(formData.get("reporterPassword") ?? ""),
    });
    revalidatePath("/supplier");
    revalidatePath("/supplier/schools");
    revalidatePath("/supplier/issue");
    revalidatePath("/supplier/orders");
    return {
      ok: true,
      message: `Created ${result.school.name} (${result.school.code}) and reporter ${result.reporter.email}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create school",
    };
  }
}
