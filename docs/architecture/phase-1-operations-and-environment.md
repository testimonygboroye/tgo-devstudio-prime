# Phase 1 — Operations, Environments & Recovery

## Deployment boundaries

- Production remains the existing Vercel production environment.
- Preview/staging must use a separate MongoDB database and separate least-privilege database user.
- CI uses an ephemeral local MongoDB service and non-production JWT secrets. It must never read or write production data.
- Environment variables are scoped by environment. Database credentials, JWT secrets, provider keys and signing keys are sensitive server-only values.
- Never expose secrets through `NEXT_PUBLIC_*` variables, build logs or diagnostics responses.

## Verified infrastructure snapshot (2026-11-09)

- Vercel project: `tgo-devstudio-prime`, Next.js framework, Node 24.x.
- MongoDB Atlas project: `tgo-devstudio-prime`.
- Cluster: `tgo-devstudio-prime-cluster`, FREE tier, AWS EU_CENTRAL_1, MongoDB 8.0.37.
- One Atlas database user was visible; its role is readWrite on `tgo_devstudio_prime`.
- The Atlas project access list currently includes `0.0.0.0/0`.
- No open Atlas alerts were returned during inspection.
- Vercel currently has `MONGODB_URI` scoped to Production only; no Preview target was present.

## Outstanding infrastructure gates

1. Atlas access list is open to all IP addresses. Restrict it to the narrowest viable network policy after confirming Vercel egress architecture; do not lock out production.
2. Create a separate Preview database and least-privilege database user. The connected Atlas MCP session is read-only, so this change could not be applied from this session.
3. Add the new preview URI to Vercel as a sensitive Preview-only environment variable. Never copy the Production URI into Preview.
4. Confirm backup and point-in-time recovery capability. The inspected cluster is FREE tier; managed backup capability must not be assumed. Upgrade or configure an appropriate backup plan only after approval of any cost.
5. Perform a restore test and document RPO/RTO before storing important business or financial data.
6. Review the previously tracked cookie-export history and decide whether JWT secret rotation is required. Rotation invalidates existing sessions and needs a controlled release window.
7. Vercel deployment creation is currently blocked by the account's daily free deployment limit. Retry production deployment after the limit resets; do not switch hosting providers or bypass production safeguards.

## Monitoring

The authenticated `GET /api/platform/health` endpoint reports only high-level database connectivity, runtime environment and platform activation state. It does not reveal hostnames, credentials, database names or internal stack traces. Responses are not cacheable.
