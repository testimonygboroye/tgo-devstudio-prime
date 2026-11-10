# Phase 8 — Commerce, Payments & Finance

## Implemented application capabilities

- A typed payment-provider adapter contract with the Paystack adapter as the first online provider.
- Paystack checkout initialization and server-side transaction verification. Browser redirects are never treated as proof of payment.
- Timestamped Paystack-Signature verification using PAYSTACK_WEBHOOK_SECRET, with constant-time digest comparison and a five-minute replay window. Legacy x-paystack-signature verification remains available during migration when only PAYSTACK_SECRET_KEY is configured.
- Signed webhook processing for successful charges, Paystack ping events and refund lifecycle events.
- Currency minor-unit conversion. Paystack XOF amounts are sent in provider subunits while the UI accepts whole-number XOF amounts.
- Partial order and invoice payments. Orders remain partially paid until the total verified amount reaches the order total.
- Configurable installment plans with exact total validation and per-installment online payment, bank-transfer submission or account-credit application.
- Manual bank transfers. Client submissions remain pending review until a founder matches the reference against the receiving bank statement and explicitly verifies them.
- Client account credit balances with balanced ledger postings for credit issuance and use.
- Invoices generated from accepted quotation line items, discounts and configured tax snapshots; invoices can be issued and printed/saved as PDF from the client portal.
- Payment receipts created idempotently after payment settlement and available through a client-owned, printable receipt page.
- Refund requests, founder approval, Paystack refund submission and signed webhook settlement. Refunds are not recorded as completed until Paystack confirms them.
- Expense submission, founder approval and payment posting.
- Reconciliation runs that verify local Paystack references, amount, currency and provider status against Paystack's API and record discrepancies.
- Currency and tax settings, invoice numbering, bank transfer instructions, provider enablement and partial-payment settings.
- Financial summaries and append-only ledger entries for payment, client-credit, expense and refund activity.
- Audit events for critical finance actions.

## Important production configuration

Set these values in the production hosting environment. Never commit them or paste them into chat.

| Variable | Purpose |
| --- | --- |
| SITE_URL | Canonical public HTTPS origin used for verification, invoice and payment links. |
| PAYSTACK_SECRET_KEY | Server-only Paystack secret key (sk_test_... for testing; sk_live_... after activation). |
| PAYSTACK_WEBHOOK_SECRET | Paystack webhook signing secret (whsec_...) used to authenticate modern timestamped webhooks. |
| BREVO_API_KEY | Existing Brevo email transport. |
| BREVO_SENDER_EMAIL | Existing verified Brevo sender address. |

The client verification email continues to use the shared Brevo service. It does not require Resend.

For a Nigerian Paystack business, NGN is the safe initial currency. USD is only available when the account is approved for international payments and the required USD settlement arrangement is active. GHS, ZAR, KES and XOF are tied to the relevant merchant countries. Do not enable a currency in Finance & Payments merely because the dropdown accepts its ISO code; enable only currencies shown as available for the activated Paystack business.

## Paystack setup

1. Create or sign in to the TGO DevStudio Paystack business account.
2. In the Paystack Dashboard, open Settings → API Keys & Webhooks (the exact menu label may vary).
3. Enable Test Mode and copy the Test Secret Key. Use the secret key, not the public key.
4. In the production host's environment settings, add PAYSTACK_SECRET_KEY with that test secret key. Do not put it in a NEXT_PUBLIC_* variable.
5. In the same Paystack API/Webhooks settings, configure the webhook URL as https://YOUR-PUBLIC-DOMAIN/api/webhooks/paystack and create/copy the webhook signing secret into PAYSTACK_WEBHOOK_SECRET.
6. Set SITE_URL to the same public HTTPS domain. Save the environment variables and redeploy/restart the service.
7. Open Founder Admin → Finance & Payments, enable Paystack and the currencies that the business is actually approved to collect.
8. Run a low-value test-mode payment. Confirm the browser returns to the client portal, the signed webhook is accepted, the payment is marked paid only after server verification, and a receipt is issued.
9. Reconcile the transaction in Finance & Payments. Check that the ledger entries balance and that the order/invoice payment balance updates.
10. Before collecting real money, complete Paystack business verification and replace the test secret/webhook values with the live values. Confirm the live webhook URL and perform a controlled live transaction.

## Security and operational rules

- The secret key belongs only on the server.
- A client-submitted bank transfer reference is not proof of payment; a founder must verify the actual bank credit.
- A refund request is not a refund. It requires approval, provider submission and a verified provider settlement event.
- Financial ledger entries are append-only through application interfaces. Corrections must be represented by new compensating entries.
- Amounts are stored as integer minor units. Do not calculate financial values with floating-point arithmetic in ledger operations.
- Finance APIs are founder-restricted; client APIs scope every invoice, payment, credit and receipt to the authenticated client account.
- The Paystack integration is not live until the account is activated, the production secret and webhook signing secret are configured, and a live transaction is verified.

## Acceptance tests still required before declaring production acceptance

The automated build and unit-test suite must pass after merge. Then run authenticated staging tests for:
- client invoice issuance and email delivery through Brevo;
- full and partial Paystack payments, repeated webhook delivery and invalid/stale signatures;
- bank transfer submission, founder verification and rejection;
- account-credit issuance and application;
- installment payment through each enabled method;
- refund approval, provider processing, webhook settlement and duplicate events;
- expense approval and payment posting;
- reconciliation with both matching and mismatching provider data;
- payment-gated milestone/deliverable release;
- client/staff sign-in using the same email with independent credentials;
- client verification email opening the production HTTPS domain, completing verification and signing in.

No live credentials or real bank account details are stored in source control.
