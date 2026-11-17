# TGO DevStudio Prime — Playwright E2E

The Playwright suite covers public routes, the priced service catalogue, the capability catalogue, FAQ slug routing, mobile navigation, contact-form validation, homepage media, mobile overflow and portal entry routes.

Run locally:

```bash
npm install --no-save --package-lock=false @playwright/test
npx playwright install chromium
BASE_URL=https://tgo-devstudio-prime.vercel.app npm run test:e2e
npm run test:e2e:report
```

CI runs on pull requests to `main` and can be triggered manually. Reports, traces and failure screenshots are retained as a seven-day artifact. Authenticated client/admin workflows and live payment tests require a dedicated non-production test identity and provider sandbox credentials; the public smoke suite does not create records, send messages or charge money.
