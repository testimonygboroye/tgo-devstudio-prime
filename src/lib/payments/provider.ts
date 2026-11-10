export type PaymentProviderId = "paystack";

export type InitializePaymentInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | null>;
};

export type InitializePaymentResult = {
  authorizationUrl: string;
  accessCode?: string;
  reference: string;
};

export type VerifiedProviderPayment = {
  transactionId?: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: string;
};

export interface PaymentProviderAdapter {
  readonly id: PaymentProviderId;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifiedProviderPayment>;
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProviderAdapter {
  if (id === "paystack") {
    // Lazy import keeps provider SDK / implementation concerns out of callers.
    return requirePaystackAdapter();
  }
  throw new Error("The requested payment provider is not configured.");
}

function requirePaystackAdapter(): PaymentProviderAdapter {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured. Set PAYSTACK_SECRET_KEY in the hosting environment.");
  return {
    id: "paystack",
    async initialize(input) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.email,
          amount: input.amountMinor,
          currency: input.currency,
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: input.metadata,
        }),
        cache: "no-store",
      });
      const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; access_code?: string; reference?: string } };
      if (!response.ok || !payload.status || !payload.data?.authorization_url) {
        throw new Error(payload.message || "Paystack did not return a checkout session.");
      }
      return {
        authorizationUrl: payload.data.authorization_url,
        accessCode: payload.data.access_code,
        reference: payload.data.reference || input.reference,
      };
    },
    async verify(reference) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await response.json() as { status?: boolean; message?: string; data?: { status?: string; amount?: number; currency?: string; id?: number; reference?: string } };
      if (!response.ok || !payload.status || !payload.data) {
        throw new Error(payload.message || "Paystack could not verify this payment.");
      }
      return {
        transactionId: payload.data.id ? String(payload.data.id) : undefined,
        reference: String(payload.data.reference || ""),
        amountMinor: Number(payload.data.amount),
        currency: String(payload.data.currency || "").toUpperCase(),
        status: String(payload.data.status || ""),
      };
    },
  };
}
