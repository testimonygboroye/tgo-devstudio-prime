# TGO DevStudio Prime — Playwright E2E

The Playwright suite covers public routes, the priced service catalogue, the capability catalogue, FAQ slug routing, mobile navigation, contact-form validation, homepage media, mobile overflow and portal entry routes.

Run locally:

```bash
npm install --no-save --package-lock=false @playwright/test
npx playwright install chromium
BASE_URL=https://tgo-devstudio-prime.vercel.app npm run test:e2e
npm run test:e2e:report
```

CI runs unit tests, lint and a production build on pull requests to `main`. Browser E2E is run manually after deployment because Vercel preview deployments are protected; this avoids weakening deployment protection. Trigger the workflow manually and supply the public production URL (the default is `https://tgo-devstudio-prime.vercel.app`). Reports, traces and failure screenshots are retained as a seven-day artifact. Authenticated client/admin workflows and live payment tests require a dedicated non-production test identity and provider sandbox credentials; the public smoke suite does not create records, send messages or charge money.
