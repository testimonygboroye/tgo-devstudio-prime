# Portable automation and unified communications

## Portable scheduler

The Cloudflare Worker under `automation/cloudflare-worker` is deployment-provider independent. It calls the application's protected cron endpoints over HTTPS and does not depend on Render, Vercel Cron, or Netlify Scheduled Functions. Set `APP_BASE_URL` to whichever host is active and synchronize `PLATFORM_AUTOMATION_CRON_SECRET` between the Worker and app.

The app's own database, queues, permissions, and business logic remain on the app host. The Worker is only a timer and HTTP caller. Never expose cron secrets in client code.

## Communications architecture

The existing `Message` model remains the notification inbox and `WorkspaceMessage` remains workspace/channel chat. Do not conflate either with a universal conversation store. A future unified communications service should provide durable conversation membership, sender identity types (human, AI agent, external WhatsApp contact, system), message status events, attachments, threads, reactions, and provider delivery receipts. WhatsApp Cloud API credentials must be encrypted in the Integration Centre. Inbound webhooks require Meta signature verification and idempotency; outbound messages must be queued and retried without duplicate sends.

## Cost and consent

Carrier SMS is not a reliably free delivery channel. Prefer email verification, passkeys, authenticator apps, and WhatsApp where the recipient initiated the conversation. WhatsApp template messages and some categories/destinations can incur Meta charges. Do not send outbound messages without recorded consent and applicable template/24-hour-window checks. Browser speech recognition can be a no-cost convenience where supported, but is not a server-side transcription guarantee.
