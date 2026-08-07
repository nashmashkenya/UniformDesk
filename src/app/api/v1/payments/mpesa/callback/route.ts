import { NextResponse } from "next/server";
import { z } from "zod";
import { completeMpesaCallback } from "@/modules/payments/payments";

const bodySchema = z.object({
  providerRef: z.string().min(1).optional(),
  Body: z
    .object({
      stkCallback: z
        .object({
          CheckoutRequestID: z.string().optional(),
          ResultCode: z.number().optional(),
          ResultDesc: z.string().optional(),
          CallbackMetadata: z
            .object({
              Item: z
                .array(
                  z.object({
                    Name: z.string(),
                    Value: z.union([z.string(), z.number()]).optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

function receiptFromMetadata(
  items: { Name: string; Value?: string | number }[] | undefined,
) {
  const receipt = items?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
  return receipt != null ? String(receipt) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerRef = searchParams.get("providerRef");
  const simulate = searchParams.get("simulate");

  if (!providerRef || (simulate !== "success" && simulate !== "fail")) {
    return NextResponse.json(
      { error: "Use ?providerRef=…&simulate=success|fail for sandbox" },
      { status: 400 },
    );
  }

  try {
    const payment = await completeMpesaCallback({
      providerRef,
      success: simulate === "success",
      mpesaReceipt:
        simulate === "success"
          ? `SIM${Date.now().toString().slice(-8)}`
          : undefined,
      resultDesc: simulate === "fail" ? "Sandbox simulated failure" : undefined,
    });
    return NextResponse.redirect(
      new URL(`/supplier/invoices/${payment.invoiceId}`, request.url),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Callback failed",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const stk = parsed.data.Body?.stkCallback;
  const checkoutId = stk?.CheckoutRequestID;
  const providerRef =
    parsed.data.providerRef ||
    (checkoutId ? `mpesa_${checkoutId}` : "");

  if (!providerRef) {
    return NextResponse.json(
      { error: "Missing provider reference" },
      { status: 400 },
    );
  }

  try {
    const success = (stk?.ResultCode ?? 0) === 0;
    await completeMpesaCallback({
      providerRef,
      success,
      mpesaReceipt: receiptFromMetadata(stk?.CallbackMetadata?.Item),
      resultDesc: stk?.ResultDesc,
    });
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: error instanceof Error ? error.message : "Failed",
      },
      { status: 400 },
    );
  }
}
