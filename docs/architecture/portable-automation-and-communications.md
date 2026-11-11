# Portable automation and unified communications

## Portable scheduler

The Cloudflare Worker under `automation/cloudflare-worker` is a provider-independent timer and HTTP caller. It invokes protected application routes for webhook delivery, sales follow-ups, executive reports, scheduled email campaigns, support SLA escalation, engagement expiry, and analytics snapshots. It does not connect to MongoDB or contain database credentials. Set `APP_BASE_URL` to the currently active host and synchronize `PLATFORM_AUTOMATION_CRON_SECRET` between the Worker and application environment. The manual trigger uses a separate secret.

The same protected routes can be called by another scheduler or self-hosted cron runner. No Render Cron Job, Vercel Cron, or Netlify Scheduled Function is required. The application host remains replaceable.

## Unified communications

The existing notification inbox and workspace chat models remain separate. The unified conversation/message store supports direct conversations, groups, channels, AI employee conversations, and WhatsApp external contacts. Messages support text, audio/file attachments, read state, threads, reactions, edits, deletion, pinning, and WhatsApp delivery status. The Admin Messages screen includes conversation search, message search, voice-note recording, and attachment upload.

AI employee conversations use the configured AI Workforce provider runtime and token budget. AI tasks assigned from communications are stored in the existing approval/ execution queue; completed tasks can publish their result back into the originating conversation. Existing AI provider permissions and approval gates remain authoritative.

WhatsApp Cloud API credentials are encrypted in the Integration Centre. Webhook GET verification uses the configured verify token; webhook POST payloads require a valid Meta HMAC signature. Inbound message IDs are deduplicated and delivery receipts update outbound message state. Free-form outbound replies are restricted to the 24-hour customer-service window after the latest inbound contact message. An inbound message is not stored as marketing opt-in. Approved template selection/delivery and inbound media retrieval are not yet part of this interface.

## Cost, consent, and portability

Carrier SMS is not a reliably free delivery channel. Prefer email verification, passkeys, and authenticator apps for account security. WhatsApp pricing and template fees are determined by Meta and may apply. AI provider calls may incur usage charges according to the configured provider account.

Browser speech recognition can add live transcript text while recording a voice note on supported browsers; this is not a server-side transcription guarantee and browser/language support varies. Voice recording and attachment storage depend on device microphone permissions and the configured Cloudinary account.
