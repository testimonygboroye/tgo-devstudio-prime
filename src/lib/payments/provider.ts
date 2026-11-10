import { paystackAdapter } from "@/lib/payments/providers/paystack";

export type PaymentProviderId = "paystack";
export type InitializePaymentInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | null>;
};
export type InitializePaymentResult = { authorizationUrl: string; accessCode?: string; reference: string };
export type VerifiedProviderPayment = { transactionId?: string; reference: string; amountMinor: number; currency: string; status: string };

export interface PaymentProviderAdapter {
  readonly id: PaymentProviderId;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifiedProviderPayment>;
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProviderAdapter {
  if (id === "paystack") return paystackAdapter;
  throw new Error("The requested payment provider is not configured.");
}
