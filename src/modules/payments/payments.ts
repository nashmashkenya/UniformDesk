import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/url";
import { getPaymentProvider } from "@/modules/payments/provider";
import type { PaymentMethod } from "@/generated/prisma/client";

async function nextPaymentNo(supplierId: string) {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;
  const latest = await prisma.payment.findFirst({
    where: { supplierId, paymentNo: { startsWith: prefix } },
    orderBy: { paymentNo: "desc" },
    select: { paymentNo: true },
  });
  const next = latest ? Number(latest.paymentNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 10) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length >= 9) return `254${digits}`;
  throw new Error("Enter a valid Kenyan phone (e.g. 07XXXXXXXX)");
}

async function settleInvoiceIfCovered(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice || invoice.status === "void" || invoice.status === "paid") {
    return invoice;
  }

  const paid = invoice.payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amountCents, 0);

  if (paid >= invoice.amountCents) {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid", paidAt: new Date() },
    });
  }
  return invoice;
}

export async function recordManualPayment(input: {
  supplierId: string;
  actorUserId: string;
  invoiceId: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  amountCents?: number;
}) {
  if (input.method === "mpesa") {
    throw new Error("Use M-Pesa STK for mobile money, or pick cash/bank/other");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, supplierId: input.supplierId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") throw new Error("Invoice is void");
  if (invoice.status === "paid") throw new Error("Invoice already paid");

  const alreadyPaid = invoice.payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const remaining = invoice.amountCents - alreadyPaid;
  if (remaining <= 0) throw new Error("Invoice already fully paid");

  const amountCents = input.amountCents ?? remaining;
  if (amountCents <= 0) throw new Error("Amount must be positive");
  if (amountCents > remaining) {
    throw new Error("Amount exceeds remaining balance");
  }

  const paymentNo = await nextPaymentNo(input.supplierId);
  const now = new Date();

  const payment = await prisma.payment.create({
    data: {
      paymentNo,
      invoiceId: invoice.id,
      supplierId: invoice.supplierId,
      schoolId: invoice.schoolId,
      amountCents,
      method: input.method,
      status: "completed",
      reference: input.reference?.trim() || null,
      note: input.note?.trim() || null,
      provider: "manual",
      recordedById: input.actorUserId,
      completedAt: now,
    },
  });

  await settleInvoiceIfCovered(invoice.id);
  return payment;
}

export async function initiateMpesaPayment(input: {
  supplierId: string;
  actorUserId: string;
  invoiceId: string;
  phone: string;
  note?: string;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, supplierId: input.supplierId },
    include: { payments: true, school: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") throw new Error("Invoice is void");
  if (invoice.status === "paid") throw new Error("Invoice already paid");

  const pending = invoice.payments.some((p) => p.status === "pending");
  if (pending) {
    throw new Error("A payment is already pending for this invoice");
  }

  const alreadyPaid = invoice.payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const remaining = invoice.amountCents - alreadyPaid;
  if (remaining <= 0) throw new Error("Invoice already fully paid");

  const phone = normalizePhone(input.phone);
  const provider = getPaymentProvider();
  const paymentNo = await nextPaymentNo(input.supplierId);
  const callbackUrl = `${appBaseUrl()}/api/v1/payments/mpesa/callback`;

  const stk = await provider.initiateStkPush({
    amountCents: remaining,
    phone,
    accountReference: invoice.invoiceNo,
    description: `UniformDesk ${invoice.invoiceNo}`,
    callbackUrl,
  });

  const payment = await prisma.payment.create({
    data: {
      paymentNo,
      invoiceId: invoice.id,
      supplierId: invoice.supplierId,
      schoolId: invoice.schoolId,
      amountCents: remaining,
      method: "mpesa",
      status: "pending",
      phone,
      note: input.note?.trim() || null,
      provider: stk.provider,
      providerRef: stk.providerRef,
      reference: stk.checkoutRequestId,
      recordedById: input.actorUserId,
    },
  });

  return {
    payment,
    customerMessage: stk.customerMessage,
    /** Dev helper: auto-complete URL for sandbox */
    sandboxCompleteUrl: `${callbackUrl}?simulate=success&providerRef=${encodeURIComponent(stk.providerRef)}`,
  };
}

export async function completeMpesaCallback(input: {
  providerRef: string;
  success: boolean;
  mpesaReceipt?: string;
  resultDesc?: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      providerRef: input.providerRef,
      method: "mpesa",
    },
  });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "completed") return payment;
  if (payment.status === "cancelled") {
    throw new Error("Payment was cancelled");
  }

  if (!input.success) {
    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        note: input.resultDesc?.trim() || payment.note,
      },
    });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      reference: input.mpesaReceipt?.trim() || payment.reference,
    },
  });

  await settleInvoiceIfCovered(payment.invoiceId);
  return updated;
}

export async function cancelPendingPayment(input: {
  supplierId: string;
  paymentId: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: { id: input.paymentId, supplierId: input.supplierId },
  });
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "pending") {
    throw new Error("Only pending payments can be cancelled");
  }
  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: "cancelled" },
  });
}
