"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManage, requireSchoolUser } from "@/lib/auth";
import {
  addItemSize,
  createItem,
  setItemActive,
} from "@/modules/catalog/items";
import { createKit, setKitActive } from "@/modules/catalog/kits";

export type CatalogState = { error?: string; ok?: boolean };

async function requireAdmin() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) {
    throw new Error("Only school admins can manage the catalog");
  }
  return user;
}

export async function createItemAction(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  try {
    const user = await requireAdmin();
    const sizesRaw = String(formData.get("sizes") ?? "");
    await createItem({
      schoolId: user.schoolId,
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

  revalidatePath("/catalog");
  revalidatePath("/kits");
  revalidatePath("/issue");
  revalidatePath("/receive");
  return { ok: true };
}

export async function addItemSizeAction(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  try {
    const user = await requireAdmin();
    await addItemSize({
      schoolId: user.schoolId,
      itemId: String(formData.get("itemId") ?? ""),
      sizeLabel: String(formData.get("sizeLabel") ?? ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add size",
    };
  }

  revalidatePath("/catalog");
  revalidatePath("/issue");
  revalidatePath("/receive");
  return { ok: true };
}

export async function toggleItemActiveAction(formData: FormData) {
  const user = await requireAdmin();
  const itemId = String(formData.get("itemId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await setItemActive({ schoolId: user.schoolId, itemId, active });
  revalidatePath("/catalog");
  revalidatePath("/issue");
  revalidatePath("/receive");
}

const kitLineSchema = z.object({
  itemId: z.string().min(1),
  qtyDefault: z.coerce.number().int().positive(),
});

export async function createKitAction(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  try {
    const user = await requireAdmin();
    const raw = String(formData.get("linesJson") ?? "[]");
    const lines = z.array(kitLineSchema).parse(JSON.parse(raw));
    await createKit({
      schoolId: user.schoolId,
      name: String(formData.get("name") ?? ""),
      academicYear: String(formData.get("academicYear") ?? ""),
      lines,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create kit",
    };
  }

  revalidatePath("/kits");
  revalidatePath("/issue");
  return { ok: true };
}

export async function toggleKitActiveAction(formData: FormData) {
  const user = await requireAdmin();
  const kitId = String(formData.get("kitId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await setKitActive({ schoolId: user.schoolId, kitId, active });
  revalidatePath("/kits");
  revalidatePath("/issue");
}
