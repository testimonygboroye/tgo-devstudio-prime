# Phase 1 — Core Platform Foundation

**Status:** Initial implementation delivered on an isolated feature branch. Production activation remains gated on review, tests, preview database configuration and security verification.

## Architectural decisions

- Keep the existing Next.js application, MongoDB/Mongoose connection and Vercel project.
- Extend the existing authenticated user identity rather than creating a second login system.
- Keep the current CMS `Role` model intact. Business Operating System roles use separate `BusinessRole` and `BusinessMembership` collections to avoid changing existing CMS behavior.
- Use deny-by-default authorization, explicit permission identifiers, scoped grants and explicit denies.
- Use an append-oriented platform audit-event collection for new business operations. Existing CMS audit logs remain untouched.
- Use an event outbox collection. Business writes enqueue events; a separately deployed worker will claim and dispatch them in a later phase. No event is falsely marked as delivered in this phase.
- Keep notification records separate from existing CMS push messages.
- Keep platform modules in a typed registry. Registry metadata is not a substitute for server-side authorization.

## Implemented foundation

| Capability | Implementation |
|---|---|
| Permission catalogue | `src/platform/permissions/catalog.ts` |
| Scoped authorization evaluator | `src/platform/authorization/evaluate.ts` |
| Authorization persistence | `BusinessRole`, `BusinessMembership` |
| Session bridge | `src/lib/platform/authorize.ts` |
| Platform audit events | `PlatformAuditEvent`, `src/lib/platform/audit.ts` |
| Event outbox | `PlatformEvent`, `src/lib/platform/events.ts` |
| Platform notifications | `PlatformNotification`, `src/lib/platform/notifications.ts` |
| Module registry | `src/platform/registry/modules.ts` |
| Runtime configuration | `src/lib/platform/config.ts` |
| Authenticated health diagnostics | `GET /api/platform/health` |
| Standard API response envelope | `src/lib/platform/response.ts` |
| Storage provider contract | `src/platform/storage/types.ts` |
| Authorization tests | `src/platform/authorization/__tests__/evaluate.test.ts` and `audit.test.ts` |
| API response envelope | `src/lib/platform/response.ts` |
| Storage provider contract | `src/platform/storage/types.ts` |

## Security invariants

1. No grant means no access.
2. A permission grant has an explicit scope; self, department, team, project and client scopes require matching resource context.
3. Explicit denies take precedence over grants and founder elevation.
4. The founder shortcut is derived from the existing server-verified founder role, never a client-supplied flag.
5. Non-founder access requires an active business membership and at least one assigned business role.
6. Secret-like keys are redacted before audit metadata is persisted.
7. Notification links must be same-origin relative paths.
8. Event enqueue supports idempotency keys; delivery is not claimed until a worker confirms it.
9. No credentials or payment secrets are stored in the browser.
10. Existing CMS roles, routes, APIs and public pages are not migrated or rewritten by this foundation.

## Deferred by design

- Creating the first non-founder business membership and role administration UI (Founder Control Centre / Business Administration phases).
- Background event dispatcher, retry worker and dead-letter operations UI.
- External object storage adapter and signed download delivery.
- Multi-organization tenancy and billing.
- Notification delivery channels (email, push, in-app real-time).
- MFA step-up policies for sensitive business actions.
- Database transactions for multi-document financial operations.

These items depend on subsequent modules and operational configuration. Their models and boundaries are prepared, but they are not represented as live capabilities yet.

## Operational gates before production activation

- Provide an isolated MongoDB database for preview/staging; do not point previews at production data.
- Verify MongoDB replica-set/transaction support before financial workflows depend on transactions.
- Review the existing historical cookie-export exposure and invalidate potentially affected sessions.
- Run CI build, Jest, lint and security checks against the branch. The repository CI workflow now runs unit tests and ESLint before the production build.
- Review permission seeds and initial founder account mapping before enabling non-founder access.
- Configure backups and test restore procedures with the database owner.

## UI and experience direction

The foundation intentionally adds no user-facing dashboard before its access model and data contracts are proven. All future platform interfaces must use the existing TGO visual identity: deep navy, violet and cyan, premium typography, high-quality cards, clear information hierarchy, accessible states, responsive layouts and meaningful loading/empty/error states. Do not expose a module in navigation merely because it exists in the registry; navigation visibility must also be permission-filtered.
