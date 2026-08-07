"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { createOrder } from "@/modules/supply/orders";

export type ReorderState = { error?: string };

const lineSchema = z.object({
  productId: z.string().min(1),
  sizeLabel: z.string().min(1),
  qty: z.coerce.number().int().positive(),
});

export async function createReorderOrderAction(
  _prev: ReorderState,
  formData: FormData,
): Promise<ReorderState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) {
    return { error: "No permission to place supply orders" };
  }

  const supplierId = String(formData.get("supplierId") ?? "");
  const note = String(formData.get("note") ?? "");
  let lines: z.infer<typeof lineSchema>[] = [];
  try {
    lines = z
      .array(lineSchema)
      .parse(JSON.parse(String(formData.get("linesJson") ?? "[]")));
  } catch {
    return { error: "Select at least one matched reorder line" };
  }

  if (!supplierId) return { error: "Choose a supplier" };
  if (!lines.length) {
    return { error: "Select at least one line with a supplier SKU match" };
  }

  let orderId = "";
  try {
    const order = await createOrder({
      supplierId,
      schoolId: user.schoolId,
      actorUserId: user.id,
      note: note || "Low-stock reorder from UniformDesk",
      lines,
    });
    orderId = order.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create order",
    };
  }

  revalidatePath("/orders");
  revalidatePath("/reorder");
  revalidatePath("/stock");
  redirect(`/orders/${orderId}`);
}
