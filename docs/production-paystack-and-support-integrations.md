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


## Exact Google OAuth redirect URI fix

The client sign-in callback now uses the stable Vercel production origin. The reported `redirect_uri_mismatch` is fixed in Google's OAuth console, not by changing the email or password.

1. Open https://console.cloud.google.com/auth/clients.
2. Select the Google Cloud project currently used by TGO.
3. Open **Google Auth Platform → Clients** and select the existing **Web application** OAuth client used by TGO.
4. Under **Authorized JavaScript origins**, add exactly:
   `https://tgo-devstudio-prime.vercel.app`
5. Under **Authorized redirect URIs**, add exactly:
   `https://tgo-devstudio-prime.vercel.app/api/client/auth/google/callback`
6. Click **Save**. Do not add a trailing slash or use the Render/preview URL.
7. Copy that same client's **Client ID** and **Client secret**.
8. In Vercel → Settings → Environment Variables, add the following to **Production**:
   - `GOOGLE_CLIENT_ID` = the Web application Client ID
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the same Client ID
   - `GOOGLE_CLIENT_SECRET` = the Web application Client secret
   - `SITE_URL` = `https://tgo-devstudio-prime.vercel.app`
9. Save and redeploy Production. Then test `/client/login` and `/client/register`.

The two Client ID variables must belong to the same Web application OAuth client. The Client Secret must never be exposed through a `NEXT_PUBLIC_` variable. If Google's consent screen is in Testing mode, add the testing Google account under **Google Auth Platform → Audience → Test users**.

Direct pages:
- Google OAuth clients: https://console.cloud.google.com/auth/clients
- Vercel environment variables: https://vercel.com/testimonygboroye/tgo-devstudio-prime/settings/environment-variables
- Google explanation of exact redirect matching: https://developers.google.com/identity/protocols/oauth2/web-server

## SMS phone verification — new required Twilio settings

The client profile now sends a six-digit OTP by SMS and verifies the code server-side. It requires Twilio Programmable Messaging. The code expires after five minutes, applies a resend delay and limits incorrect attempts.

### Twilio setup for Nigerian mobile numbers

1. Open https://console.twilio.com/ and sign in.
2. Copy **Account SID** (starts `AC`) from the Console dashboard. Reveal and copy the **Auth Token**; keep it private.
3. Upgrade a Trial account to **Pay as you go** before testing Nigerian numbers. Trial messaging has destination restrictions and is not a production SMS setup.
4. Open **Communications → Trust Hub → Registrations → Alphanumeric Sender IDs**.
5. Click **Create registration**, select **Nigeria**, and submit TGO's genuine business details.
6. State that the use case is client-requested, transactional one-time phone-verification codes. Do not describe it as promotional marketing.
7. Request a short brand sender ID (for example `TGODEV`, maximum 11 characters) and submit the supporting documents and sample message Twilio requests.
8. Wait for approval. Twilio's Nigeria guidelines require pre-registration for international alphanumeric sender IDs and indicate that provisioning can take about three weeks.
9. Open **Messaging → Services → Create Messaging Service**. Name it `TGO DevStudio Client Verification`, choose the transactional/notify-users use case, add the approved sender ID to its sender pool, set it as the default sender for Nigeria, save, and copy the Messaging Service SID (starts `MG`).
10. In Vercel Production, add:
    - `TWILIO_ACCOUNT_SID` = the Account SID (AC…)
    - `TWILIO_AUTH_TOKEN` = the Auth Token (sensitive)
    - `TWILIO_MESSAGING_SERVICE_SID` = the Messaging Service SID (MG…)
    - `JWT_TEMP_2FA_SECRET` must also already exist; the OTP hash uses this server secret.
11. If you do not use a Messaging Service, set `TWILIO_SMS_FROM` to the exact sender ID Twilio approved. The application prefers `TWILIO_MESSAGING_SERVICE_SID` when it is set.
12. Save the variables, redeploy Production, sign in to a client account, open **Account settings**, choose the country and calling code, enter the phone number, click **Send verification code by SMS**, enter the six-digit code and click **Verify phone**.

Nigeria-specific delivery notes: Twilio documents that Nigeria does not support two-way SMS; one-way OTP delivery is sufficient here. Nigerian carrier DND controls and sender-ID filtering can still block some OTP messages. Use the approved sender ID and inspect Twilio Message Logs if delivery fails.

Official Twilio pages:
- Console: https://console.twilio.com/
- Nigeria SMS guidelines and sender-ID requirements: https://www.twilio.com/en-us/guidelines/ng/sms
- Alphanumeric sender ID registration: https://www.twilio.com/docs/trust-hub/registrations/alphanumeric-sender-id
- International SMS setup: https://www.twilio.com/docs/messaging/guides/sending-international-sms-guide

## Provider dashboard click-path summary

### Paystack

1. Open https://dashboard.paystack.com/ and sign in.
2. Open **Settings → Compliance**. Complete Profile, Contact, Account/Payout, Documents and Directors/Owners as applicable. Submit/activate the business and wait for approval.
3. Open **Settings → API Keys & Webhooks** (direct route: https://dashboard.paystack.com/#/settings/developer).
4. Switch to **Live Mode**, scroll to **API Configuration — Live Mode**, reveal **Live Secret Key**, confirm with the dashboard password if asked, and copy the key beginning `sk_live_`.
5. Open **Developers → API configuration**, create/copy the Live webhook signing secret beginning `whsec_`.
6. Open **Developers → Webhooks** in Live Mode and add exactly:
   `https://tgo-devstudio-prime.vercel.app/api/webhooks/paystack`
7. In Vercel Production, enter `PAYSTACK_SECRET_KEY` = the sk_live key, `PAYSTACK_WEBHOOK_SECRET` = the whsec signing secret, and `SITE_URL` = `https://tgo-devstudio-prime.vercel.app`. Save and redeploy.
8. In TGO Founder Admin → Finance & Payments, enable Paystack and the merchant's supported currency. Test a low-value live payment and confirm webhook settlement, invoice balance, receipt and ledger.

Use the real legal/business documents requested by Paystack. Do not invent company registration details. Test and Live keys are different; do not use an sk_test key for production.

### Brevo transactional email

1. Open https://app.brevo.com/ and sign in.
2. Click **Settings → SMTP & API → API Keys & MCP → Generate API key**.
3. Name it `TGO DevStudio Production`, complete Brevo's identity check, choose the access level that allows transactional email sending, click Generate and copy the key immediately.
4. Open **Settings → Senders, Domains, IPs → Senders → Add a sender**. Use sender name `TGO DevStudio` and an email address on a domain TGO actually controls. Verify the sender using the email code.
5. Open **Settings → Senders, Domains, IPs → Domains**, add the sending domain, copy the exact DNS records Brevo provides into the domain's DNS manager, then return to Brevo and authenticate the domain.
6. In Vercel Production, enter `BREVO_API_KEY` = the API key, `BREVO_SENDER_EMAIL` = the exact verified sender email, and `FOUNDER_NOTIFICATION_EMAIL` = the real support inbox monitored by TGO. Save and redeploy.
7. Test a new client registration email-verification link and a support ticket. Check Brevo's transactional email logs.

Direct pages:
- Brevo: https://app.brevo.com/
- API key instructions: https://help.brevo.com/hc/en-us/articles/40159485019794-Create-and-manage-your-API-keys
- Sender/domain guide: https://developers.brevo.com/docs/getting-started-with-senders-and-domains

### Gemini support drafting

1. Open https://aistudio.google.com/app/apikey.
2. Sign in, select/create TGO's Google Cloud project and click **Create API key**.
3. Name it `TGO DevStudio Production Support` and copy it.
4. Add `GEMINI_API_KEY` = that key in Vercel Production, save and redeploy.
5. Enable AI reply drafting under Founder Admin → Support Operations → Support configuration. Staff must review and send each draft manually.

### WhatsApp support

1. Open https://console.twilio.com/ → **Messaging → Try it out → Send a WhatsApp message** for a sandbox test; join the sandbox from the receiving number using the instructions Twilio displays.
2. For production, complete Twilio/Meta WhatsApp sender onboarding, business verification and template/opt-in requirements.
3. Add `TWILIO_WHATSAPP_FROM` = the approved WhatsApp sender in `whatsapp:+...` format and `SUPPORT_WHATSAPP_TO` = the real support destination in `whatsapp:+234...` format to Vercel Production.
4. Reuse the existing `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. Enable WhatsApp in Founder Admin → Support Operations → Support configuration and send a test ticket.

## Vercel environment-variable entry procedure

Open https://vercel.com/testimonygboroye/tgo-devstudio-prime/settings/environment-variables. For every variable above, click **Add New**, type the exact variable name into **Key**, paste the provider value into **Value**, select **Production**, then click **Save**. Do not add `NEXT_PUBLIC_` to secrets. After all variables are saved, open **Deployments**, choose the latest Production deployment and click **Redeploy**. Never paste secret values into this repository or into ChatGPT.
