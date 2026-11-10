# Phase 8 — Commerce, Payments & Finance

## Integrated implementation scope

Phase 8 extends the Phase 7 commercial order and delivery records. Payment provider callbacks are not trusted as proof of payment. All payment state changes require server-side verification with the provider and immutable ledger posting inside a MongoDB transaction.

### Implemented provider and financial foundations

- Paystack provider adapter for transaction initialization and server-side verification.
- Client-only checkout initialization for an order or an individual delivery milestone.
- Reuse of a pending checkout reference to avoid duplicate initializations.
- Paystack webhook signature verification using HMAC SHA-512 and timing-safe comparison.
- Independent Paystack transaction verification before a payment is marked paid.
- Strict matching of payment reference, amount in minor units, currency and successful provider status.
- Idempotent payment posting inside a MongoDB transaction.
- Immutable double-entry payment ledger entries for cash received and client advances.
- Unique payment references and ledger entry keys to prevent duplicate postings.
- Order payment status and milestone payment status are updated from verified payments only.
- Payment initialization and verification actions are audited.
- Unsupported currencies and zero-value orders are handled explicitly.
- Payment-required deliverables remain blocked until the related milestone payment is verified.

### Provider configuration

Set PAYSTACK_SECRET_KEY only in the production hosting environment. Use the test secret key for test-mode checkout and the live secret key only after business verification and end-to-end acceptance. Never commit keys to Git or send them in chat.

Set SITE_URL to the stable public app URL used by the production client portal. The app rejects localhost/private-network URLs and does not derive account verification or OAuth callback links from request Host headers.

Configure the Paystack webhook to:

https://tgo-devstudio-prime.onrender.com/api/webhooks/paystack

If the production app is moved to another stable domain, update the webhook URL in Paystack to match that production host.

### MongoDB requirements

Financial posting uses MongoDB transactions. The production MongoDB deployment must support transactions (MongoDB Atlas replica-set deployments do). Do not use a standalone MongoDB server for production payment posting.

### Currency and provider limitations

The adapter currently accepts NGN, GHS, ZAR, USD, KES, XOF and EGP as application-level currency candidates. This does not guarantee that a particular Paystack merchant account can collect every currency or support every cross-border transaction. Enable a currency only after checking the merchant account's live Paystack dashboard and settlement eligibility. Never silently convert currencies.

### Acceptance tests still required before live payments

- Complete a test-mode checkout with a Paystack test card.
- Confirm the browser callback alone does not mark a transaction paid.
- Confirm server verification and webhook independently converge on one payment record.
- Replay the same webhook and confirm ledger entries are not duplicated.
- Test failed, abandoned, pending and mismatched amount/currency/reference transactions.
- Test full order and milestone payments, including partial order balances.
- Reconcile Paystack dashboard transactions against the immutable ledger.
- Verify refund workflow and financial approval policy before accepting live payments.

No live payment is enabled by this documentation alone. A real merchant secret key and an eligible Paystack business account are required.