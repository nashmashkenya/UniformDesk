"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  canSupplierManage,
  canSupplierWrite,
  canWrite,
  requireSchoolUser,
  requireSupplierUser,
} from "@/lib/auth";
import {
  createDelivery,
  dispatchDelivery,
  receiveAgainstDelivery,
} from "@/modules/supply/deliveries";
import {
  createInvoiceFromDelivery,
  markInvoicePaid,
} from "@/modules/supply/invoices";
import { cancelOrder, createOrder } from "@/modules/supply/orders";
import { createSupplierProduct } from "@/modules/supply/products";

export type SupplyState = { error?: string; ok?: boolean };

const lineSchema = z.object({
  productId: z.string().min(1),
  sizeLabel: z.string().min(1),
  qty: z.coerce.number().int().positive(),
});

function parseLines(raw: string) {
  return z.array(lineSchema).parse(JSON.parse(raw || "[]"));
}

export async function createSupplierProductAction(
  _prev: SupplyState,
  formData: FormData,
): Promise<SupplyState> {
  try {
    const user = await requireSupplierUser();
    if (!canSupplierManage(user.role)) {
      return { error: "Only the supplier admin can manage products" };
    }
    const price = Number(formData.get("unitPrice") ?? 0);
    await createSupplierProduct({
      supplierId: user.supplierId,
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? "other"),
      unitPrice: Math.round(price * 100),
      sizes: String(formData.get("sizes") ?? "")
        .split(/[,\n]/)
        .map((s) => s.trim()),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create product",
    };
  }
  revalidatePath("/supplier/catalog");
  return { ok: true };
}

export async function createOrderAction(
  _prev: SupplyState,
  formData: FormData,
): Promise<SupplyState> {
  const asSupplier = String(formData.get("asSupplier") ?? "") === "true";
  let orderId = "";
  try {
    const lines = parseLines(String(formData.get("linesJson") ?? "[]"));
    const schoolId = String(formData.get("schoolId") ?? "");
    const supplierId = String(formData.get("supplierId") ?? "");
    const note = String(formData.get("note") ?? "");

    if (asSupplier) {
      const user = await requireSupplierUser();
      if (!canSupplierManage(user.role)) return { error: "No permission" };
      const order = await createOrder({
        supplierId: user.supplierId,
        schoolId,
        actorUserId: user.id,
        note,
        lines,
      });
      orderId = order.id;
    } else {
      const user = await requireSchoolUser();
      if (!canWrite(user.role)) {
        return { error: "No permission" };
      }
      const order = await createOrder({
        supplierId,
        schoolId: user.schoolId,
        actorUserId: user.id,
        note,
        lines,
      });
      orderId = order.id;
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create order",
    };
  }

  revalidatePath("/supplier/orders");
  revalidatePath("/orders");
  redirect(asSupplier ? `/supplier/orders/${orderId}` : `/orders/${orderId}`);
}

export async function createDeliveryAction(
  _prev: SupplyState,
  formData: FormData,
): Promise<SupplyState> {
  let deliveryId = "";
  try {
    const user = await requireSupplierUser();
    if (!canSupplierManage(user.role)) return { error: "No permission" };
    const lines = parseLines(String(formData.get("linesJson") ?? "[]"));
    const delivery = await createDelivery({
      supplierId: user.supplierId,
      schoolId: String(formData.get("schoolId") ?? ""),
      actorUserId: user.id,
      orderId: String(formData.get("orderId") ?? "") || undefined,
      note: String(formData.get("note") ?? ""),
      markInTransit: String(formData.get("markInTransit") ?? "") === "true",
      lines,
    });
    deliveryId = delivery.id;
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create delivery",
    };
  }
  revalidatePath("/supplier/deliveries");
  revalidatePath("/deliveries");
  redirect(`/supplier/deliveries/${deliveryId}`);
}

export async function dispatchDeliveryAction(formData: FormData) {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) throw new Error("No permission");
  const deliveryId = String(formData.get("deliveryId") ?? "");
  await dispatchDelivery({
    deliveryId,
    supplierId: user.supplierId,
  });
  revalidatePath("/supplier/deliveries");
  revalidatePath(`/supplier/deliveries/${deliveryId}`);
  revalidatePath("/deliveries");
}

export async function receiveDeliveryAction(
  _prev: SupplyState,
  formData: FormData,
): Promise<SupplyState> {
  const deliveryId = String(formData.get("deliveryId") ?? "");
  try {
    const user = await requireSchoolUser();
    if (!canWrite(user.role)) return { error: "No permission" };
    await receiveAgainstDelivery({
      schoolId: user.schoolId,
      actorUserId: user.id,
      deliveryId,
      note: String(formData.get("note") ?? ""),
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not receive delivery",
    };
  }
  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${deliveryId}`);
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/deliveries/${deliveryId}`);
}

export async function createInvoiceAction(formData: FormData) {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) throw new Error("No permission");
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const invoice = await createInvoiceFromDelivery({
    supplierId: user.supplierId,
    actorUserId: user.id,
    deliveryId,
    note: String(formData.get("note") ?? ""),
  });
  revalidatePath("/supplier/invoices");
  revalidatePath("/supplier/deliveries");
  revalidatePath(`/supplier/deliveries/${deliveryId}`);
  revalidatePath("/invoices");
  redirect(`/supplier/invoices/${invoice.id}`);
}

export async function markInvoicePaidAction(formData: FormData) {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) throw new Error("No permission");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const methodRaw = String(formData.get("method") ?? "cash");
  const method =
    methodRaw === "bank" || methodRaw === "other" ? methodRaw : "cash";
  await markInvoicePaid({
    invoiceId,
    supplierId: user.supplierId,
    actorUserId: user.id,
    method,
    reference: String(formData.get("reference") ?? ""),
  });
  revalidatePath("/supplier/invoices");
  revalidatePath(`/supplier/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function cancelOrderAction(formData: FormData) {
  const asSupplier = String(formData.get("asSupplier") ?? "") === "true";
  const orderId = String(formData.get("orderId") ?? "");
  if (asSupplier) {
    const user = await requireSupplierUser();
    if (!canSupplierManage(user.role)) throw new Error("No permission");
    await cancelOrder({ orderId, supplierId: user.supplierId });
    revalidatePath("/supplier/orders");
    revalidatePath(`/supplier/orders/${orderId}`);
  } else {
    const user = await requireSchoolUser();
    await cancelOrder({ orderId, schoolId: user.schoolId });
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
  }
}
