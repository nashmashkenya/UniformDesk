"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { adjustStock } from "@/modules/inventory/adjust";
import { receiveStock } from "@/modules/inventory/receive";

const lineSchema = z.object({
  itemId: z.string().min(1),
  sizeLabel: z.string().min(1),
  qty: z.coerce.number().int().positive(),
});

export type ReceiveState = { error?: string };
export type AdjustState = { error?: string; ok?: boolean; message?: string };

export async function receiveStockAction(
  _prev: ReceiveState,
  formData: FormData,
): Promise<ReceiveState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) {
    return { error: "You do not have permission to receive stock" };
  }

  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const rawLines = String(formData.get("linesJson") ?? "[]");

  let lines: z.infer<typeof lineSchema>[] = [];
  try {
    lines = z.array(lineSchema).parse(JSON.parse(rawLines));
  } catch {
    return { error: "Invalid stock lines" };
  }

  if (!supplierName) return { error: "Supplier name is required" };

  try {
    await receiveStock({
      schoolId: user.schoolId,
      actorUserId: user.id,
      supplierName,
      note: note || undefined,
      lines,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not receive stock",
    };
  }

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/receive");
  redirect("/stock");
}

export async function adjustStockAction(
  _prev: AdjustState,
  formData: FormData,
): Promise<AdjustState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) {
    return { error: "You do not have permission to adjust stock" };
  }

  const itemId = String(formData.get("itemId") ?? "");
  const sizeLabel = String(formData.get("sizeLabel") ?? "");
  const direction = String(formData.get("direction") ?? "increase");
  const qty = Number(formData.get("qty") ?? 0);
  const reasonNote = String(formData.get("reasonNote") ?? "");

  if (!Number.isInteger(qty) || qty <= 0) {
    return { error: "Quantity must be a positive whole number" };
  }

  const qtyDelta = direction === "decrease" ? -qty : qty;

  try {
    await adjustStock({
      schoolId: user.schoolId,
      actorUserId: user.id,
      itemId,
      sizeLabel,
      qtyDelta,
      reasonNote,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not adjust stock",
    };
  }

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/issue");
  return { ok: true, message: "Stock adjusted" };
}

