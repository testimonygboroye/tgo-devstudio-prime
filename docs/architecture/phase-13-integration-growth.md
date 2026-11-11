# Phase 13 — Integration, Marketing & Growth

## Implemented platform foundations

- Founder-only Integration Centre with encrypted AES-256-GCM credentials, credential redaction, connection verification, and audit events.
- Brevo, Paystack, GitHub, Vercel, Twilio and Google Search Console / GA4 connector definitions.
- Google OAuth authorization and encrypted token storage for actual Search Console and GA4 reporting.
- GitHub/Vercel read-only project/deployment inventory.
- Signed outgoing webhooks with idempotent delivery records, retries, backoff and a protected delivery worker.
- Sales pipeline backed by the existing SalesLead collection, with audit history and scheduled follow-up notifications.
- Marketing campaign drafts and consent-filtered newsletter email delivery with per-recipient records, retry handling, unsubscribe links, and future send-at-time scheduling.
- A protected marketing campaign worker now processes queued newsletter campaigns in batches.
- Portable automation Worker under `automation/cloudflare-worker`. It runs the protected webhook, sales follow-up, executive report, campaign, analytics, support escalation and engagement expiry jobs independently of the application host.
- Automation runner uses `APP_BASE_URL` (or `SITE_URL`) and no longer hard-codes Render.

## WhatsApp and communications

- WhatsApp Cloud API credentials can be saved and verified through the encrypted Integration Centre.
- Inbound webhook validates Meta's `X-Hub-Signature-256`, deduplicates provider message IDs, stores inbound text messages, and updates sent/delivered/read status callbacks.
- Human WhatsApp replies are sent through Meta Graph API only while the contact's 24-hour customer-service window is active. Approved template messaging outside that window is not implemented.
- The admin Messages page now hosts a unified communications interface with direct conversations, groups, channels, AI conversations, threaded replies, reactions, read receipts, text messages, file/audio attachments and in-browser voice-note recording with live browser speech-to-text where supported.
- AI conversation replies use the configured, verified AI provider. Agents requiring approval create approval-queue tasks; agents without approval requirements can generate text-only replies within their configured daily token budget. The chat runtime does not execute external tools.
- AI task assignments from the communications interface are recorded in the existing AI Workforce task queue and audit trail.

## Deployment-provider independence

The application can run on Render, Vercel, Netlify or another compatible Node.js host. Set `APP_BASE_URL` to the public application origin and configure `PLATFORM_AUTOMATION_CRON_SECRET` on the app host and Cloudflare Worker. Change only `APP_BASE_URL` when moving hosts. No Render Cron Job or paid scheduler is required.

The Cloudflare Worker is a timer and HTTP caller only; it does not access MongoDB or hold database credentials. Protected application endpoints remain responsible for authentication and business logic.

## Required account setup

1. Deploy the Cloudflare Worker using `automation/cloudflare-worker/README.md`.
2. Configure `APP_BASE_URL` and `PLATFORM_AUTOMATION_CRON_SECRET` as Cloudflare Worker variables/secrets.
3. Configure `APP_BASE_URL` on the application host. Keep the same `PLATFORM_AUTOMATION_CRON_SECRET` there.
4. Configure Google OAuth credentials and authorize Search Console / GA4 if reporting is required.
5. Create a Meta Developer app with WhatsApp product, configure its webhook URL as `https://YOUR_APP_DOMAIN/api/platform/messaging/whatsapp/webhook`, subscribe to `messages` and message status events, then save the permanent access token, phone number ID, WABA ID, app secret and webhook verify token in Integration Centre. Test the connection before enabling live messaging.

## Capability boundaries

- SMS delivery is not enabled as a free service; real carrier SMS incurs provider charges. Keep SMS verification disabled unless a paid sender is explicitly approved.
- WhatsApp template creation/approval, template dispatch, media download from inbound WhatsApp, and provider billing controls are not included in this release.
- Campaign audiences remain limited to subscribed newsletter recipients. All-client/manual segments are not dispatched until their consent and lawful-basis rules are implemented.
- Email open/click/conversion attribution is not represented as complete. Scheduled newsletter email campaigns are queued with a future send time and released by the portable campaign worker.
- The voice-note feature uploads and plays audio attachments. Live browser speech recognition can add final transcript text to the draft on supported browsers; server-side transcription and built-in translation are not included.
- The communications interface currently polls for updates; realtime WebSocket presence/typing indicators and push-to-WhatsApp reporting are not yet implemented.

## Security and data handling

- Provider credentials are encrypted at rest and never serialized to the browser.
- WhatsApp webhook signatures are verified before processing.
- Inbound provider message IDs are idempotency keys.
- Chat APIs require an authenticated staff account and conversation membership, with founder controls for AI and message pinning.
- AI conversation runtime is text-only and respects agent approval requirements and daily token budgets.
- Outbound WhatsApp free-form replies are blocked outside the 24-hour customer service window.
- Email campaign delivery rechecks subscription status at send time and includes an unsubscribe link.
