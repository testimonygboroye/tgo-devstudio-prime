# Phase 14 — Executive Intelligence

## What is delivered
- Founder-only executive intelligence page at the configured admin base path plus `/executive-intelligence`.
- Live aggregation from verified payment transactions, finance ledger entries, commercial orders, delivery projects and milestones, workforce profiles and attendance, client accounts and lifecycle profiles, support tickets, business operations, AI providers/agents/tasks, platform events and integration connection records.
- Revenue is displayed in separate currencies. The headline collected amount is based on verified paid or partially-refunded transactions, net of recorded refunds; it is not a conversion into a single currency.
- Forecasts use a transparent linear trend across up to six months of verified collections. They are directional estimates, not accounting or guaranteed forecasts.
- Risk signals are deterministic and explain their source. Founder refresh persists recommendations; approval/rejection is audited.
- Approval of a supported follow-up recommendation creates a real BusinessOperation workflow record. Other recommendations remain review-only and are never represented as executed.
- Natural-language analytics uses an enabled AI agent and a connection-verified provider. It sends only the aggregate company snapshot, not raw client or employee records. AI_ENCRYPTION_KEY and a verified enabled provider are prerequisites.
- Executive decisions are persisted with status, rationale, owner and outcome fields.
- Report schedules are persisted and executed by the protected `/api/cron/executive-reports` route. Each run stores a point-in-time JSON snapshot available for download in the Founder interface. Delivery is currently in-app/report history; no email delivery is claimed.
- The report scheduler is included in `vercel.json` as a daily invocation. Configure `CRON_SECRET` or `PLATFORM_AUTOMATION_CRON_SECRET` in the production runtime. The endpoint requires an exact Bearer token.

## Security and governance
- Every dashboard/API operation requires an authenticated founder session on the server.
- Every state-changing action writes PlatformAuditEvent records.
- AI receives only aggregate metrics; it cannot execute tools or change business records.
- Recommendation approval can create only the whitelisted internal workflow follow-up. Finance, payroll, client data and external provider settings are not autonomously modified.
- Financial transactions are never initiated, adjusted or reconciled by analytics.
- Metrics with no source records display zero/empty states; missing provider configuration is not disguised as connected.

## Operational verification
After CI/build succeeds and before production deployment:
1. Sign in as the founder and open Executive Intelligence.
2. Confirm currency-separated verified collections against Finance & Payments.
3. Compare project, workforce, attendance, client, support, AI and event counts with their source modules.
4. Ask a natural-language question after verifying an AI provider and enabling an AI agent.
5. Generate insights, approve a supported follow-up, and verify the resulting record in Business Operations and Audit Log.
6. Create a daily/weekly/monthly report schedule; invoke the cron endpoint with the configured secret in a non-production environment and verify a report run is saved.
7. Create and complete an executive decision; verify the audit trail.
8. Confirm mobile layout at phone and tablet widths.

## Known external prerequisites
- MongoDB production availability and read permissions for all source collections.
- AI_ENCRYPTION_KEY plus a verified AI provider and enabled AI agent for LLM answers.
- CRON_SECRET or PLATFORM_AUTOMATION_CRON_SECRET for scheduled report execution.
- A Vercel cron-enabled deployment for automatic scheduled execution. The founder can still generate an on-demand report from the page.
