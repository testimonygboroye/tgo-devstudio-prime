# TGO DevStudio production payment and support integrations

## Paystack live payments

The application already has server-side Paystack checkout initialization, provider-side transaction verification, signed webhook handling, idempotent payment settlement, invoices, receipts, partial payments, installment payments, refunds and reconciliation.

Required production environment variables (Vercel project → Settings → Environment Variables → Production):
- `PAYSTACK_SECRET_KEY`: live secret key beginning `sk_live_`. Server-only; never use a `NEXT_PUBLIC_` variable.
- `PAYSTACK_WEBHOOK_SECRET`: webhook signing secret generated for the live webhook endpoint (the current signed webhook format uses a `whsec_` value).
- `SITE_URL`: `https://tgo-devstudio-prime.vercel.app` (or the final canonical TGO domain).

Dashboard actions that require the business owner:
1. Sign in to the Paystack business dashboard: https://dashboard.paystack.com/
2. Open the Compliance page and complete every required business profile, owner, bank account and document field. Submit the business for activation. Paystack must approve the business before live keys are available.
3. After activation, switch to Live Mode, open Settings → API Keys & Webhooks (or Developers → API configuration), and reveal/copy the Live Secret Key.
4. In Developers → Webhooks, add `https://tgo-devstudio-prime.vercel.app/api/webhooks/paystack` as the live webhook URL and create/copy its webhook signing secret.
5. In Vercel, add the two values above as encrypted/sensitive Production environment variables. Do not paste secrets into GitHub, source code, email or chat.
6. Save and redeploy the Vercel Production deployment. In Founder Admin → Finance & Payments, enable Paystack and only currencies enabled for the activated merchant.
7. Run a controlled low-value live transaction with the business owner. Verify the payment appears in Paystack Live Mode, the webhook is delivered, the local payment becomes paid after server verification, the receipt is generated, and reconciliation shows no discrepancy.

Official references:
- Paystack API keys: https://paystack.com/docs/developer-tools/api-keys/
- Business activation requirements: https://support.paystack.com/en/articles/2125506
- Webhook configuration and signatures: https://paystack.com/docs/payments/webhooks/

## Support email notifications (Brevo)

The project already uses the shared Brevo transport. Ensure the existing Vercel Production values `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are valid and the sender address is verified in Brevo. Set `FOUNDER_NOTIFICATION_EMAIL` to the monitored support inbox. Ticket creation notifies the support inbox; staff replies notify the client. Do not create a second email provider unless needed.

## WhatsApp support notifications (Twilio)

This integration is optional and remains disabled until the business owner provisions WhatsApp credentials:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` (encrypted/sensitive)
- `TWILIO_WHATSAPP_FROM` (approved Twilio WhatsApp sender, normally formatted as `whatsapp:+1415...`)
- `SUPPORT_WHATSAPP_TO` (TGO support phone in E.164 format, e.g. `whatsapp:+234...`)

Owner steps:
1. Create/sign in to Twilio Console: https://console.twilio.com/
2. Open Messaging → Try it out → Send a WhatsApp message to configure the sandbox for initial testing, or complete WhatsApp sender onboarding for a production sender.
3. Copy Account SID and Auth Token from the Console. Never share the Auth Token in chat or commit it.
4. Add the four variables to Vercel Production environment variables. Keep `SUPPORT_WHATSAPP_TO` in E.164 format (with the `whatsapp:` prefix accepted).
5. Enable WhatsApp notifications in Founder Admin → Support Operations → Support configuration.
6. Send a test ticket and verify a notification reaches the configured support phone. A sandbox sender only reaches numbers that have joined the sandbox; use an approved sender for production customer messaging and follow WhatsApp template/opt-in requirements.

## AI-assisted support drafting (Google Gemini)

The AI feature is a staff-only draft assistant. It reads the selected ticket conversation and produces a suggested response. It does not send messages or change ticket status; a human must review and send the draft.

Required production variable:
- `GEMINI_API_KEY` (encrypted/sensitive).

Owner steps:
1. Open Google AI Studio: https://aistudio.google.com/app/apikey
2. Sign in with the Google account that owns TGO's AI project, create an API key, and restrict it to the Generative Language API where the Google Cloud project settings allow.
3. Add `GEMINI_API_KEY` to Vercel Production as an encrypted/sensitive variable.
4. Redeploy. Enable AI reply drafting in Founder Admin → Support Operations → Support configuration.
5. Open a support ticket and use “Draft reply with AI”. Review, edit and send manually.

## Automated SLA escalation

The scheduled Vercel route is `/api/cron/support-escalation`. It requires the existing `CRON_SECRET` environment variable and runs daily at 09:00 UTC on the Vercel Hobby schedule. It escalates overdue tickets, raises priority and notifies the support inbox/WhatsApp destination when configured. Because Hobby cron frequency is daily, use a paid Vercel plan or an external scheduler if sub-day SLA automation is required.

## Environment-variable safety

Use the Vercel project environment settings directly:
https://vercel.com/testimonygboroye/tgo-devstudio-prime/settings/environment-variables

Select Production for each secret, save, then redeploy. Never paste any API secret into this repository, a public issue, or this conversation. A value is only operational after it is saved in Vercel and a new production deployment has completed successfully.
