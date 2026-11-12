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

## 3. Connect each person's own WhatsApp

WhatsApp is **personal per platform user**, not one shared company inbox. The founder connects the founder's own WhatsApp destination; each staff member can separately connect their own. A user's messages are mirrored only to the WhatsApp destination configured on that user's account, and a WhatsApp reply is routed back into the same private conversation. Other users do not receive that person's private AI or team conversations.

Important: the official WhatsApp Cloud API sends from a **WhatsApp Business Platform phone number** to the user's personal WhatsApp number. It does not sign in to or take over an existing personal WhatsApp account. Each person who wants two-way mirroring needs access to a Meta Business account and a WhatsApp Business Platform phone number. If they only have a personal WhatsApp number and no Cloud API business number, they can still use the platform normally, but WhatsApp mirroring remains disconnected.

### Connect your own account in TGO

1. Open **Admin → Communications / Messages** while signed in to your own staff account.
2. Expand **My personal WhatsApp**.
3. Create or select your Meta app at https://developers.facebook.com/apps/ and add the **WhatsApp** product.
4. In WhatsApp → API Setup / WhatsApp Manager, connect your own WhatsApp Business Account and business phone number. Copy the **Phone Number ID** and **WhatsApp Business Account ID**.
5. Create a Meta access token with the WhatsApp Business messaging permissions required for your number. Copy the **Meta App Secret** from App Settings → Basic.
6. Choose your own long random **Webhook Verify Token**. It is not your Meta access token.
7. Enter these six values into your own TGO Communications connection form:
   - Meta access token
   - Business Phone Number ID
   - WhatsApp Business Account ID
   - Your personal WhatsApp destination number, in international digits-only format (Nigeria example: `2348012345678`, without the leading +)
   - Meta App Secret
   - Webhook Verify Token
8. Select **Verify and connect my WhatsApp**. TGO verifies the business phone number and stores the credentials encrypted. Your access token and app secret are not displayed again.
9. In the Meta app, open **WhatsApp → Configuration → Webhooks**. Set the callback URL to:
   `https://YOUR_PUBLIC_APP_HOST/api/platform/messaging/whatsapp/webhook`
10. Enter the exact Verify Token you saved in TGO, verify the callback, and subscribe to the **messages** field. Delivery/read status notifications use the same webhook.
11. From your personal WhatsApp number, send a message to the connected WhatsApp Business phone number. It should appear in your private TGO Communications space.

Repeat these steps independently for every team member who wants WhatsApp mirroring. A member must connect their own Cloud API business number and their own personal destination number. A connection cannot be claimed by another platform account. A member can disconnect their own connection at any time from the same Communications panel.

### How conversation synchronization works

- When a member sends a message in a platform conversation, the message is delivered to the personal WhatsApp destinations connected by the conversation's participants.
- To start a WhatsApp-synced AI or team chat, open that conversation in TGO and send the first message there. This binds your WhatsApp connection to that conversation; then send a first message from your personal WhatsApp to the business number to open Meta's 24-hour service window. Continue replying in either place. If you message the business number before selecting a platform conversation, TGO creates a separate private **My WhatsApp** conversation.
- A reply sent from WhatsApp is added to the same platform conversation. Other connected participants receive their own WhatsApp copy; the sender does not receive a duplicate echo.
- AI replies in a private AI conversation are mirrored to the connected user's WhatsApp. Replies from WhatsApp continue that same AI conversation, subject to the AI employee's approval and daily token budget.
- Conversation visibility is membership-based. Founder status does not grant access to another employee's private conversations.
- Without a personal WhatsApp connection, a member's messages remain available in the platform and are not sent to another person's WhatsApp.

### Messaging safeguards and limitations

- Meta verifies webhook payload signatures before messages are accepted. Each business phone number is mapped to one platform user and only messages from that user's configured personal destination number are accepted.
- Free-form WhatsApp messaging is subject to Meta's customer-service window, opt-in requirements, templates, and other policy rules. This implementation mirrors text and supported outbound media links during the open service window. Approved template selection/delivery outside the service window is not yet exposed.
- WhatsApp media received through the webhook currently appears as a message placeholder; inbound media download/storage is not enabled yet. Platform voice notes and attachments are available in the platform itself.
- An inbound message is not treated as blanket marketing consent. WhatsApp provider charges, template fees, and Meta policy limits are controlled by Meta and may apply. Do not assume all WhatsApp messaging is free.
- Never paste access tokens, app secrets, or webhook tokens into ChatGPT or commit them to Git. Enter them only into the encrypted per-user connection form. Rotate them if exposed.

## 4. Voice notes and transcription

The communications composer can record and upload audio using the device microphone. Where the browser supports the Web Speech API, live speech recognition adds finalized speech to the message draft while recording. Browser speech recognition availability and language support vary by device/browser; the uploaded audio remains available even if transcription is unavailable. This is client-side convenience, not guaranteed server-side transcription. For text translation, select an enabled AI employee that does not require approval, enter the target language, and use **Translate draft**. Translation creates an auditable AI task and consumes the configured provider token budget; provider charges may apply.

## 5. AI employees in conversations

Staff members can open AI conversations and assign tasks where their role permits. The existing AI Workforce provider, agent enablement, daily token budget, permissions, and approval settings remain authoritative. Tasks requiring approval remain in the approval queue. Agent/provider API usage may incur costs under the configured provider's plan.
