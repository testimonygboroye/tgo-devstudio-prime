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

## 3. Connect each person's own WhatsApp destination

TGO uses one shared company WhatsApp Business Platform sender, configured once by the founder in **Admin → Integrations**. Each platform user registers only their own personal WhatsApp destination number and consent in **Communications / Messages → My personal WhatsApp**. TGO sends from the company business number to each participant's registered personal number. It does not sign in to, take over, or send from an employee's personal WhatsApp account. Staff members do **not** need their own Meta Business account, WhatsApp Business Account, or business phone number.

### Founder setup (one-time)

1. Connect TGO's company WhatsApp Business Platform number in Meta WhatsApp Manager.
2. In **Founder Admin → Integrations → WhatsApp Cloud API**, configure the company sender's access token, Phone Number ID, WhatsApp Business Account ID, Meta App Secret, and a long random Webhook Verify Token. Verify the connection and keep the credentials in the encrypted integration record.
3. In the Meta app, open **WhatsApp → Configuration → Webhooks**. Set the callback URL to:
   `https://YOUR_PUBLIC_APP_HOST/api/platform/messaging/whatsapp/webhook`
4. Enter the exact Webhook Verify Token configured in TGO, verify the callback, and subscribe to the **messages** field. Delivery/read status notifications use the same webhook.

### Each team member connects their own destination

1. Sign in to your own TGO staff account.
2. Open **Admin → Communications / Messages** and expand **My personal WhatsApp**.
3. Enter your personal WhatsApp number in international digits-only format (Nigeria example: `2348012345678`, without the leading +).
4. Tick the explicit consent checkbox and select **Register my WhatsApp destination**.
5. From that personal WhatsApp number, send a message to TGO's company WhatsApp Business number. This opens Meta's 24-hour customer-service window for replies.

Each member repeats only these five steps for their own destination. A member cannot register a number already connected to another TGO account. They can update or disconnect their own destination at any time.

### How conversation synchronization works

- Each platform user has one private WhatsApp destination record. TGO mirrors a message only to the registered destinations of members in that conversation; it never sends an employee's private conversation to the founder's WhatsApp unless the founder is actually a member of that conversation and has separately opted in.
- To start a WhatsApp-synced AI or team chat, open that conversation in TGO and send the first message there. This associates your WhatsApp destination with the selected conversation. Then reply from your personal WhatsApp to the company business number. If you message the business number before selecting a TGO conversation, TGO creates a separate private **My WhatsApp** conversation.
- A reply sent from WhatsApp is added to the same platform conversation. Other connected participants receive their own WhatsApp copy; the sender does not receive a duplicate echo.
- AI replies in a private AI conversation are mirrored to the connected user's WhatsApp. If the AI employee requires founder approval, the inbound message is saved and an approval task is placed in AI Workforce; after approval and execution, the AI response is posted back into the same conversation and mirrored to the user's WhatsApp.
- Conversation visibility is membership-based. Founder status does not grant access to another employee's private conversations.
- Without a personal WhatsApp destination, a member's messages remain available in TGO and are not sent to another person's WhatsApp.

### Messaging safeguards and limitations

- Meta verifies webhook payload signatures before messages are accepted. Each inbound sender is matched to the personal destination number registered to that TGO user.
- Free-form WhatsApp messaging is subject to Meta's customer-service window, opt-in requirements, templates, and other policy rules. This implementation mirrors text and supported outbound media links during the open service window. Approved template selection/delivery outside the service window is not yet exposed.
- WhatsApp media received through the webhook currently appears as a message placeholder; inbound media download/storage is not enabled yet. Platform voice notes and attachments are available in the platform itself.
- An inbound message is not treated as blanket marketing consent. WhatsApp provider charges, template fees, and Meta policy limits are controlled by Meta and may apply. Do not assume all WhatsApp messaging is free.
- Never paste access tokens, app secrets, or webhook tokens into ChatGPT or commit them to Git. Enter them only into the encrypted founder integration form. Rotate them if exposed.

## 4. Voice notes and transcription

The communications composer can record and upload audio using the device microphone. Where the browser supports the Web Speech API, live speech recognition adds finalized speech to the message draft while recording. Browser speech recognition availability and language support vary by device/browser; the uploaded audio remains available even if transcription is unavailable. This is client-side convenience, not guaranteed server-side transcription. For text translation, select an enabled AI employee that does not require approval, enter the target language, and use **Translate draft**. Translation creates an auditable AI task and consumes the configured provider token budget; provider charges may apply.

## 5. AI employees in conversations

Staff members can open AI conversations and assign tasks where their role permits. The existing AI Workforce provider, agent enablement, daily token budget, permissions, and approval settings remain authoritative. Tasks requiring approval remain in the approval queue. Agent/provider API usage may incur costs under the configured provider's plan.
