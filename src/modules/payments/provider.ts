export type StkPushInput = {
  amountCents: number;
  phone: string;
  accountReference: string;
  description: string;
  callbackUrl: string;
};

export type StkPushResult = {
  provider: string;
  providerRef: string;
  checkoutRequestId: string;
  customerMessage: string;
};

export type PaymentProvider = {
  name: string;
  initiateStkPush(input: StkPushInput): Promise<StkPushResult>;
};

/** Dev/sandbox adapter — no real Safaricom call. */
export const mpesaSandboxProvider: PaymentProvider = {
  name: "mpesa_sandbox",
  async initiateStkPush(input) {
    const checkoutRequestId = `ws_CO_${Date.now()}`;
    const providerRef = `mpesa_${checkoutRequestId}`;
    return {
      provider: "mpesa_sandbox",
      providerRef,
      checkoutRequestId,
      customerMessage: `STK push simulated for ${input.phone}. Complete via sandbox callback.`,
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // Swap to a live Daraja adapter when credentials are present.
  if (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET) {
    // Live adapter not wired yet — keep sandbox until credentials + shortcode are configured.
    return mpesaSandboxProvider;
  }
  return mpesaSandboxProvider;
}
