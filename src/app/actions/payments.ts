"use server";

import { revalidatePath } from "next/cache";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import {
  cancelPendingPayment,
  initiateMpesaPayment,
  recordManualPayment,
} from "@/modules/payments/payments";
import type { PaymentMethod } from "@/generated/prisma/client";

export type PaymentState = {
  error?: string;
  ok?: boolean;
  message?: string;
  sandboxCompleteUrl?: string;
};

export async function recordPaymentAction(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  try {
    const user = await requireSupplierUser();
    if (!canSupplierManage(user.role)) return { error: "No permission" };

    const method = String(formData.get("method") ?? "cash") as PaymentMethod;
    if (method !== "cash" && method !== "bank" && method !== "other") {
      return { error: "Invalid payment method" };
    }

    const amountRaw = String(formData.get("amount") ?? "").trim();
    const amountCents = amountRaw
      ? Math.round(Number(amountRaw) * 100)
      : undefined;

    await recordManualPayment({
      supplierId: user.supplierId,
      actorUserId: user.id,
      invoiceId,
      method,
      reference: String(formData.get("reference") ?? ""),
      note: String(formData.get("note") ?? ""),
      amountCents,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not record payment",
    };
  }

  revalidatePath("/supplier/invoices");
  revalidatePath(`/supplier/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true, message: "Payment recorded" };
}

export async function initiateMpesaAction(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  try {
    const user = await requireSupplierUser();
    if (!canSupplierManage(user.role)) return { error: "No permission" };

    const result = await initiateMpesaPayment({
      supplierId: user.supplierId,
      actorUserId: user.id,
      invoiceId,
      phone: String(formData.get("phone") ?? ""),
      note: String(formData.get("note") ?? ""),
    });

    revalidatePath("/supplier/invoices");
    revalidatePath(`/supplier/invoices/${invoiceId}`);
    revalidatePath("/invoices");

    return {
      ok: true,
      message: result.customerMessage,
      sandboxCompleteUrl: result.sandboxCompleteUrl,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not start M-Pesa payment",
    };
  }
}

export async function cancelPaymentAction(formData: FormData) {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) throw new Error("No permission");
  const paymentId = String(formData.get("paymentId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  await cancelPendingPayment({
    supplierId: user.supplierId,
    paymentId,
  });
  revalidatePath(`/supplier/invoices/${invoiceId}`);
  revalidatePath("/supplier/invoices");
}
