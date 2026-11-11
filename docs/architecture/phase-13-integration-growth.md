# Phase 13 — Integration, Marketing & Growth

## Implemented foundation

- The Integration Centre is a founder-only administration surface inside the existing application.
- The connector registry currently describes Brevo, Paystack, GitHub, Vercel, Twilio, Google Search Console and Google Analytics 4.
- API credentials are encrypted using AES-256-GCM before storage. The encryption key is supplied through the hosting environment as `INTEGRATION_CREDENTIALS_KEY` (32 bytes represented as base64 or 64 hexadecimal characters). The key is never stored in MongoDB.
- Credential values are never returned to the browser. Saves, tests and disconnects write PlatformAuditEvent records.
- Brevo, Paystack, GitHub, Vercel and Twilio have real read-only provider verification requests. A provider is marked connected only after the provider returns a successful response.
- Search Console and GA4 are explicitly marked as OAuth-required. They cannot be marked connected through a credential form.
- Existing Paystack payment initialization, verification and webhook reconciliation remain the payment system of record. The connector centre does not initiate or alter financial transactions.

## Required production configuration

1. Generate a random 32-byte key using a cryptographically secure generator. Store it as `INTEGRATION_CREDENTIALS_KEY` in the Render environment; do not commit it or paste it into source control.
2. Configure provider credentials in the founder Integration Centre and run the read-only connection test.
3. For Brevo email sending, ensure `BREVO_SENDER_EMAIL` is configured and verified with Brevo.
4. Confirm the required provider permissions and production account ownership before enabling downstream actions.

## Sales and marketing workspace

- The founder Marketing & Sales page reads and updates the existing SalesLead collection rather than creating duplicate lead identities.
- Lead creation and stage/follow-up/note updates are persisted in MongoDB and written to the shared PlatformAuditEvent log.
- Marketing campaign records can be created and edited as drafts. The audience count shown for newsletter subscribers is read live from the existing consent-status collection.
- Campaign dispatch, scheduling, delivery retries, SMS consent collection, attribution pixels and campaign analytics are intentionally not exposed as operational actions yet. Existing newsletter broadcasting remains separate and unchanged.

## Explicit capability boundaries

A saved credential is not proof of a working integration. Only successful provider verification sets the connection state to connected. OAuth-based Google integrations require their dedicated consent/callback flow. Webhook subscriptions, durable delivery queues/retries, campaign scheduling/dispatch and campaign attribution are not represented as live by this initial connector registry and must be implemented and tested before being exposed as operational actions.

## Security

- Founder authorization is enforced server-side for every integration route.
- AES-256-GCM uses a random 96-bit IV and authentication tag.
- The encryption key is independent of the MongoDB database and deployment source.
- Connection tests use fixed provider-owned HTTPS endpoints and do not accept arbitrary URLs.
- Audit records contain provider identifiers and outcomes, never credential values.
