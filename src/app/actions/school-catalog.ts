"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import {
  addItemSize,
  createItem,
  setItemActive,
} from "@/modules/catalog/items";
import { createKit, setKitActive } from "@/modules/catalog/kits";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";

export type SchoolCatalogState = { error?: string; ok?: boolean };

async function requireLinkedSupplierSchool(schoolId: string) {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) {
    throw new Error("Only the supplier admin can manage school catalogues");
  }
  if (!schoolId) throw new Error("School is required");
  await assertSupplierSchoolLink(user.supplierId, schoolId);
  return user;
}

function revalidateSchoolCatalog(schoolId: string) {
  revalidatePath(`/supplier/schools/${schoolId}/catalog`);
  revalidatePath("/supplier/schools");
  revalidatePath("/supplier/issue");
  revalidatePath("/issue");
  revalidatePath("/receive");
  revalidatePath("/stock");
}

export async function createSchoolItemAction(
  _prev: SchoolCatalogState,
  formData: FormData,
): Promise<SchoolCatalogState> {
  const schoolId = String(formData.get("schoolId") ?? "");
  try {
    await requireLinkedSupplierSchool(schoolId);
    const sizesRaw = String(formData.get("sizes") ?? "");
    await createItem({
      schoolId,
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? "other"),
      sizes: sizesRaw.split(/[,\n]/).map((s) => s.trim()),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create item",
    };
  }

  revalidateSchoolCatalog(schoolId);
  return { ok: true };
}

export async function addSchoolItemSizeAction(
  _prev: SchoolCatalogState,
  formData: FormData,
): Promise<SchoolCatalogState> {
  const schoolId = String(formData.get("schoolId") ?? "");
  try {
    await requireLinkedSupplierSchool(schoolId);
    await addItemSize({
      schoolId,
      itemId: String(formData.get("itemId") ?? ""),
      sizeLabel: String(formData.get("sizeLabel") ?? ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add size",
    };
  }

  revalidateSchoolCatalog(schoolId);
  return { ok: true };
}

export async function toggleSchoolItemActiveAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  await requireLinkedSupplierSchool(schoolId);
  const itemId = String(formData.get("itemId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await setItemActive({ schoolId, itemId, active });
  revalidateSchoolCatalog(schoolId);
}

const kitLineSchema = z.object({
  itemId: z.string().min(1),
  qtyDefault: z.coerce.number().int().positive(),
});

export async function createSchoolKitAction(
  _prev: SchoolCatalogState,
  formData: FormData,
): Promise<SchoolCatalogState> {
  const schoolId = String(formData.get("schoolId") ?? "");
  try {
    await requireLinkedSupplierSchool(schoolId);
    const raw = String(formData.get("linesJson") ?? "[]");
    const lines = z.array(kitLineSchema).parse(JSON.parse(raw));
    await createKit({
      schoolId,
      name: String(formData.get("name") ?? ""),
      academicYear: String(formData.get("academicYear") ?? ""),
      lines,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create kit",
    };
  }

  revalidateSchoolCatalog(schoolId);
  return { ok: true };
}

export async function toggleSchoolKitActiveAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  await requireLinkedSupplierSchool(schoolId);
  const kitId = String(formData.get("kitId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await setKitActive({ schoolId, kitId, active });
  revalidateSchoolCatalog(schoolId);
}
