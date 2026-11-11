# TGO portable automation scheduler

This Worker is independent of Render, Vercel, Netlify, and the application host. It calls the app's protected automation routes every 15 minutes. It does not create a paid cron service or require a Render Cron Job.

## Deploy on Cloudflare Workers Free

1. Open https://dash.cloudflare.com/ and sign in.
2. Select **Workers & Pages** → **Create** → **Create Worker**.
3. Name it `tgo-platform-automation`, create it, then open **Edit code**.
4. Replace the starter code with `src/index.js` from this directory and save/deploy.
5. Open the Worker **Settings → Variables and Secrets**:
   - Add plain-text variable `APP_BASE_URL` with the exact public origin serving this app, e.g. `https://your-domain.example`. Do not add a trailing slash.
   - Add secret `PLATFORM_AUTOMATION_CRON_SECRET` with the exact same secret configured in the app hosting environment.
   - Add secret `MANUAL_TRIGGER_SECRET` with a separate random value for manual runs.
6. Open **Settings → Triggers → Cron Triggers**, add `*/15 * * * *` (UTC), and save. The supplied `wrangler.toml` already declares this trigger if deploying with Wrangler.
7. Visit the Worker's `/health` URL. It should return `{"ok":true,...}`.
8. Test a manual run from a terminal:
   `curl -X POST https://YOUR-WORKER.workers.dev/run -H "Authorization: Bearer YOUR_MANUAL_TRIGGER_SECRET"`

## Portability and security

- Change only `APP_BASE_URL` when moving the application between hosts. Keep the app's cron secret and Worker secret synchronized.
- The Worker never stores database credentials and never connects to MongoDB.
- The manual trigger requires a separate secret. Do not put either secret in browser code, Git, screenshots, or chat.
- All app cron endpoints must validate the bearer secret. The Worker reports each endpoint's HTTP result; inspect Cloudflare Worker logs after the first scheduled run.
- Free plan limits and availability can change; check Cloudflare's current Workers limits before increasing schedule frequency.
