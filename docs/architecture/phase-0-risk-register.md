# TGO DevStudio Prime — Phase 0 Risk Register

**Audit date:** 9 November 2026  
**Status key:** Open = requires remediation or explicit acceptance; Mitigated = current-tree mitigation applied; Verified = evidence collected.

| ID | Severity | Finding | Evidence / impact | Required action |
|---|---|---|---|---|
| SEC-001 | Critical | Session-cookie exports were tracked in the public repository. | Three cookie-jar files contained accessToken and refreshToken entries for the former Render host. Public repository history may retain those values even after current-tree deletion. | Files removed from the Phase 0 branch and ignore patterns added. Before Phase 1, invalidate affected sessions and assess whether repository-history sanitization is required. A normal file deletion does not erase old Git history. |
| SEC-002 | High | Legacy system maintenance/seed/fix handlers include state-changing GET endpoints. | Sampled /api/system/* handlers use a shared CRON_SECRET header while GET requests can rewrite ownership fields, delete records, or seed content. GET is not an appropriate mutation method and these routes are powerful maintenance surfaces. | Inventory every system handler. Remove obsolete seed/fix routes; convert required mutations to POST; add one-time execution, strict authorization, audit, and least-privilege controls. |
| SEC-003 | High | Authorization is decentralized across 95 API handlers. | The Next proxy performs CSRF-origin checks and optional audit logging; it does not provide a universal authentication/permission gate. Each handler must implement its own checks. | Complete a route-by-route access matrix before Phase 1 protected modules. Introduce shared typed guards and default-deny authorization for new modules. |
| SEC-004 | High | Existing RBAC is CMS-oriented, not a business-wide permission registry. | Current roles contain broad booleans and content-type actions. Founder role bypasses content permission checks. Resource-level scope, explicit deny, delegation, temporary grants, approval policies, and AI principals are not yet represented. | Design the permission registry and policy evaluation contract before adding business routes. Keep legacy role behaviour compatible while migrating incrementally. |
| SEC-005 | High | Automated quality gates are incomplete. | CI runs build only; lint and Jest are not run. Only three test files exist. | Add lint, type checking, unit, API authorization, integration, and end-to-end business-flow checks incrementally. |
| SEC-006 | High | MongoDB transaction and recovery capability is unverified. | Mongoose is used, but cluster topology, transaction support, backups, PITR, and restore drills were not verifiable from source inspection. | Verify Atlas topology and operational backup/restore settings before finance ledger or multi-record payment operations. |
| SEC-007 | Medium | Health endpoint returns database error details. | GET /api/health returns database status and an error message. This can disclose internal operational information. | Return minimal public health status; keep detailed diagnostics behind authenticated monitoring. |
| SEC-008 | Medium | Project setup and environment documentation are missing. | Generic starter README, no environment template, and no architecture documentation were found. | Add setup docs and a names-only environment template; never commit secrets or cookie exports. |
| SEC-009 | Medium | The app is currently one large Next.js deployment. | Public site, CMS admin, and APIs share one application and deployment. | Keep a modular monolith initially; establish domain boundaries and separate shells. Avoid premature microservices or multi-project deployment. |
| SEC-010 | Medium | Current project records are portfolio content, not delivery operations. | Existing Project model belongs to the public CMS/portfolio domain. | Create a separate delivery-project domain; do not repurpose the portfolio collection. |
| SEC-011 | Medium | Existing identity model is admin-centric. | User and Role represent website administrators; no client/employee/AI identity model exists. | Define platform principals and separate client, organization, employee, contractor, and AI profile records. |
| SEC-012 | Medium | Configured environment records do not prove integration health. | Vercel exposes 27 variable records, but values were intentionally not decrypted and runtime logs have limited retention. | Validate each provider with a non-destructive health check during its implementation phase. |
| SEC-013 | High | Vercel preview deployments cannot build without a preview database URI. | MONGODB_URI is scoped to production only. The Phase 0 PR preview builds fail while prerendering database-backed pages, reporting a missing MONGODB_URI. | Provision an isolated staging MongoDB database and add its URI only to the preview target, or implement a deliberate preview-safe build/data strategy. Never point previews at production by default. |
| SEC-014 | Medium | Public resume/document upload has limited abuse and file validation controls. | The unauthenticated upload-document route accepts PDF/Word files up to 5 MB and sends them to Cloudinary. The inspected handler has no Turnstile or rate-limit check and relies on the client-provided MIME type rather than validating file signatures. | Add content signature validation, abuse protection, per-IP/session quotas, safe naming, storage retention, and explicit access rules before scaling public uploads. |
| SEC-015 | Medium | Auth and recovery endpoints need dedicated brute-force/replay tests. | Login has per-account lockout, but the inspected 2FA verification/recovery paths do not show a consistent shared IP/device rate-limit policy. | Add bounded attempts and rate limits for login, 2FA verification, password/2FA recovery, invitation-token validation, and account recovery. Test expiry, replay, enumeration, and session revocation. |

## Phase 0 remediation performed

- Created dedicated audit branch: phase-0/audit-foundation-2026-11.
- Added ignore patterns for local cookie/session exports.
- Removed the three tracked cookie-export files from the branch's current tree.
- Added the Phase 0 architecture audit, current-state inventory, and this risk register.
- No production application code, database records, Vercel environment variables, or live service configuration was changed.

## Gate before Phase 1

SEC-001 through SEC-006 must be resolved or explicitly accepted with a documented mitigation before the new platform's identity, authorization, financial, or workflow foundations are deployed. SEC-007 through SEC-012 should be incorporated into the relevant foundation and module work.

**Important:** The cookie files have been removed from the proposed branch's current tree, but their values may remain in earlier public Git history. Session invalidation and any history rewrite are separate security actions and are not implied by deleting the current files.
