# Communications and portable automation setup

This guide covers the two account-owner steps that cannot safely be completed from source control. No paid scheduler is required.

## 1. Configure the application secret

In the environment-variable settings of the currently active app host, set:

- `PLATFORM_AUTOMATION_CRON_SECRET`: a long random secret shared only with the scheduler.
- `APP_BASE_URL`: the canonical public origin of the deployed app, with no trailing slash.

Use the same cron secret on every app host that should accept scheduler calls. Do not commit it, put it in browser code, or paste it into chat. Existing `CRON_SECRET` remains a compatibility fallback for older cron routes.

## 2. Set up the free portable scheduler

### Recommended: GitHub Actions (no additional scheduler account)

The repository is public, so standard GitHub-hosted Linux runners are free for this workflow. It runs the protected automation endpoints every 15 minutes and can also be started manually. GitHub's official billing guidance confirms standard runner use is free for public repositories: https://docs.github.com/en/actions/concepts/billing-and-usage.

1. Open the repository: https://github.com/testimonygboroye/tgo-devstudio-prime
2. Go to **Settings → Secrets and variables → Actions**.
3. Add repository secret `APP_BASE_URL` with the canonical public origin of the active app, with no trailing slash.
4. Add repository secret `PLATFORM_AUTOMATION_CRON_SECRET` with the exact same value configured in the app host.
5. After this change is merged into `main`, open **Actions → TGO Platform Automation** and run it once with **Run workflow**.
6. Confirm the run succeeds. The same workflow then runs every 15 minutes automatically.

Do not enable paid/larger runners. Do not put secrets in workflow YAML, commits, browser code, screenshots, or chat.

### Alternative: Cloudflare Workers Free

Use this only if you prefer an independent scheduler outside GitHub Actions. Do **not** enable both schedulers at the same time because that would run the same jobs twice.

1. Open https://dash.cloudflare.com/ and sign in.
2. Go to **Workers & Pages** and create a Worker named `tgo-platform-automation`.
3. Copy the code from `automation/cloudflare-worker/src/index.js` into the Worker editor and deploy.
4. In **Settings → Variables and Secrets**, add `APP_BASE_URL` as a normal variable.
5. Add `PLATFORM_AUTOMATION_CRON_SECRET` as a secret matching the app environment.
6. Add `MANUAL_TRIGGER_SECRET` as a different random secret.
7. Under **Settings → Triggers → Cron Triggers**, add `*/15 * * * *`.
8. Open the Worker's `/health` URL. Then run the manual test described in `automation/cloudflare-worker/README.md` and inspect Worker logs.

The application remains portable: change only `APP_BASE_URL` when moving between Render, Vercel, Netlify, or another compatible host. Both schedulers call the same protected application endpoints; only one scheduler should be active at a time.

## 3. Connect WhatsApp Cloud API

1. Open https://developers.facebook.com/apps/ and create or select a Meta app.
2. Add the **WhatsApp** product and connect the intended WhatsApp Business Account and business phone number.
3. Obtain the Meta app secret, a WhatsApp access token with the required WhatsApp messaging permissions, the Phone Number ID, and the WhatsApp Business Account ID.
4. Create a strong random **Verify token**. Keep it ready for the Meta webhook setup.
5. In TGO Admin → Integrations, save these values under **WhatsApp Cloud API**, then run **Verify WhatsApp phone number**. The integration must show as connected before Meta's verification request can succeed.
6. In the Meta app's webhook configuration, use this callback URL:
   `https://YOUR_PUBLIC_APP_HOST/api/platform/messaging/whatsapp/webhook`
7. Enter the exact same Verify token from step 4 and complete webhook verification. Subscribe the WhatsApp webhook to the `messages` field; message delivery status updates arrive through the same webhook.
8. Send a message from a test/allowed phone to the business number; the inbound message should appear in Admin → Messages.

Keep all credentials in the encrypted Integration Centre. Never put them in source files or browser settings. Rotate tokens if they are exposed.

### Messaging safeguards

- Incoming messages are synchronized with their external sender and delivery IDs; signed webhook payloads are verified before processing.
- Free-form WhatsApp replies are accepted only within 24 hours of the contact's latest inbound message. Outside that window, this implementation blocks free-form replies. Approved template selection and template delivery are not yet exposed in this interface.
- An inbound message opens the WhatsApp customer-service window; it is **not** treated as blanket marketing consent.
- Media received through WhatsApp currently appears as a message placeholder; inbound media download/storage is not enabled.
- WhatsApp provider charges, template fees, and Meta policy limits are controlled by Meta and may apply. Do not assume all WhatsApp messaging is free.

## 4. Voice notes and transcription

The communications composer can record and upload audio using the device microphone. Where the browser supports the Web Speech API, live speech recognition adds finalized speech to the message draft while recording. Browser speech recognition availability and language support vary by device/browser; the uploaded audio remains available even if transcription is unavailable. This is client-side convenience, not guaranteed server-side transcription. For text translation, select an enabled AI employee that does not require approval, enter the target language, and use **Translate draft**. Translation creates an auditable AI task and consumes the configured provider token budget; provider charges may apply.

## 5. AI employees in conversations

Founder users can open an AI conversation or assign a message as an AI task. The existing AI Workforce provider, agent enablement, daily token budget, permissions, and approval settings remain authoritative. Tasks requiring approval remain in the approval queue. Agent/provider API usage may incur costs under the configured provider's plan.
