# Playwright E2E checks

The Playwright suite is a public-site smoke test. It does not sign in, submit forms, or mutate application data.

## Run locally

The Playwright runner is installed transiently in GitHub Actions so it does not become a production dependency or force a package-lock change. To run it locally:

```bash
npm install --no-save --package-lock=false @playwright/test
npx playwright install chromium
BASE_URL=https://tgo-devstudio-prime.vercel.app TGO_ADMIN_LOGIN_PATH=/command-deck/login npm run test:e2e
npm run test:e2e:report
```

Set `BASE_URL` to a different deployment when testing a preview. Set `TGO_ADMIN_LOGIN_PATH` if the founder sign-in base path changes.

## CI

The `Playwright E2E` workflow runs on pull requests to `main` and can also be started manually. It uses the repository variables `TGO_E2E_BASE_URL` and `TGO_ADMIN_LOGIN_PATH` when configured; otherwise it targets the primary Vercel production URL and the current `/command-deck/login` path.

Reports, traces, screenshots, and videos from failures are uploaded as a seven-day GitHub Actions artifact.

The homepage route currently has a temporary allowlist for React hydration error #418 while the deterministic countdown fix in PR #42 is awaiting release. Remove that allowlist once the fix is live and the production smoke run confirms the error is gone.
