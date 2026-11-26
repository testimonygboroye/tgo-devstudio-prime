# TGO DevStudio Prime

TGO DevStudio Prime is a MongoDB-backed digital studio and business operations platform. It combines the public company website with founder administration, client delivery, finance, workforce, collaborative workspaces, messaging, AI workforce and integration management.

## Technology

- Next.js 16 App Router, React 19 and TypeScript
- MongoDB with Mongoose 9
- Tailwind CSS 4
- Tiptap rich-text editing, Cloudinary media support, JWT authentication, bcryptjs, OTP-based 2FA and web-push
- Jest / Testing Library unit tests and Playwright browser regression tests
- Cloudflare Worker automation and GitHub Actions CI

## Repository map

```text
src/app/
  (public)/       Public marketing and content pages
  admin/          Founder/admin application pages
  client/         Client portal
  workforce/      Workforce portal
  workspaces/     Collaborative workspace UI
  api/            App Router API endpoints
src/components/   Public, admin, client, workforce, workspace and shared UI
src/lib/          Domain services, auth, security, integrations, finance, AI and messaging
src/models/       Mongoose domain models
src/platform/     Platform permissions, registry and governance
e2e/              Playwright browser regression suite
automation/       Portable scheduled automation worker
.github/workflows/ CI and scheduled workflows
docs/             Architecture and operational documentation
public/           Brand assets, icons, PWA and static media
```

The public homepage is `src/app/(public)/page.tsx`; this is an App Router route group, not `app/page.tsx`. API handlers live under `src/app/api`.

## Local development

Requirements: Node.js 24 or newer (CI currently uses Node 24), npm, and a reachable MongoDB instance.

1. Copy `.env.example` to `.env.local`.
2. Set the required MongoDB and authentication secrets.
3. Install and run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Validation commands

```bash
npm test -- --runInBand
npm run test:coverage
npm run lint
npm run build
npm run test:e2e
```

Playwright defaults to the Vercel production URL. To target another reachable environment:

```bash
BASE_URL=https://your-deployment.example npm run test:e2e
```

Jest coverage can be generated locally with `npm run test:coverage`; no repository-wide minimum coverage threshold is currently enforced. The CI workflow provisions MongoDB 7, runs Jest, performs a defined ESLint path set, and runs the Next.js production build (including its TypeScript validation) on pull requests. Playwright browser E2E is intentionally gated to manual workflow dispatches and successful pushes to `main`, rather than every pull request, because it requires a reachable deployment. The workflow waits for the merged production release before running the browser suite.

## Environment configuration

See [`.env.example`](./.env.example) for the repository's documented baseline. Some integrations use credentials stored encrypted in the founder/client Integration Centre rather than process environment variables. See [`INTEGRATION_SETUP.md`](./INTEGRATION_SETUP.md) for Google OAuth, Brevo, Twilio, Paystack and bank-transfer setup.

Never commit production credentials. Use separate secrets for local, CI, Render and Vercel. Keep the same application-level secrets consistent across environments only when cross-environment session/data compatibility is intentionally required.

## Integration model

The Integration Centre is a provider catalogue plus separately owned account connections. Catalogue presence does not mean an adapter is implemented. An entry marked as requiring a provider-specific adapter must not be treated as connected or operational until its authorization flow, server-side adapter, permission checks and live verification are implemented. Connected credentials are stored encrypted and must never be returned to browser clients or injected into model prompts.

Founder-owned and client-owned connections are isolated by owner identity. Client integrations must also be constrained to their organization and explicit provider scopes. AI employees may use integrations only through approved server-side operations with permission checks and audit events.

## AI workforce and Gemini

TGO owns AI employee identity, shared and role-specific memory, task history and audit records. Model providers are replaceable inference services. Gemini requests use Google's Interactions API; model availability is account- and project-dependent, so the live generation test is the source of truth for a configured key.

## Deployment

The project has production deployments configured for Render and Vercel:

- Render: `https://tgo-devstudio-prime.onrender.com`
- Vercel: `https://tgo-devstudio-prime.vercel.app`

The CI workflow currently uses the Render URL for its `SITE_URL` test environment, while Playwright defaults to the Vercel URL. Keep required environment variables and MongoDB connectivity aligned intentionally before promoting a release. A successful GitHub merge does not by itself prove that both hosts have deployed successfully.

## Database bootstrap and migrations

The package scripts do not currently define a dedicated `seed`, `bootstrap` or migration command. Do not assume a clean database can be initialized by running a seed script. Founder provisioning and any one-time data migration must follow the application's authenticated setup/admin flows and the relevant domain migration instructions. Add repeatable, idempotent migration scripts before introducing schema changes that require backfilling existing production records.

## Security notes

- API mutations are protected by request-origin/CSRF checks in `src/proxy.ts`; route handlers must still enforce authentication, authorization, tenant ownership and resource-level permissions.
- `src/proxy.ts` also performs best-effort audit logging for authenticated state-changing API requests.
- `next.config.ts` sets CSP and standard browser security headers. Its current CSP includes `'unsafe-inline'` for scripts/styles; this is a known hardening item, not a strict nonce-only policy.
- Never expose integration tokens, payment secrets, private customer records or internal diagnostics to unauthorized client sessions.
- High-impact actions (payments, production deployments, destructive data changes and access changes) require explicit permission and approval gates.

## Current implementation discipline

The platform is intentionally modular, but the size of the application requires domain-level tests and clear ownership boundaries. The current global stylesheet is approximately 166 KB of source and should be split into domain/component styles as the UI is maintained. New integrations should be delivered in complete slices: encrypted account storage, authorization, adapter, scope enforcement, audit logging, UI state, tests and operational documentation. Do not label a provider as working based only on a catalogue record.
