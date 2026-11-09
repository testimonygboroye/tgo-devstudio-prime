# TGO DevStudio Prime — API Surface Review (Phase 0)

**Audit date:** 9 November 2026  
**Base commit reviewed:** 640b10df030abef31c72772db78aa67e78dc415c  
**Scope:** Static inventory of all 95 files under src/app/api/**/route.ts.

This is a source-level route inventory and control-pattern review, not a penetration test. The review records exported HTTP methods and identifies the main access-control pattern. Individual handlers still require endpoint-specific tests for object-level authorization, input validation, rate limits, and data exposure before the new platform is built on top of them.

## 1. Route inventory summary

The 95 route-handler files fall into these broad groups:

| Area | Routes / responsibilities | Access pattern observed |
|---|---|---|
| Authentication | Login, Google login, refresh, logout, registration/invitation, password reset, 2FA setup/verification/recovery | Public credential/token exchange endpoints plus authenticated account actions |
| Public content | Blog, services, FAQ, help, team, projects/portfolio, stack, process, page content, availability, home/about settings | Public read paths and authenticated admin write paths |
| Public submissions | Contact, reviews, job applications, newsletter signup/unsubscribe, analytics tracking | Public submission endpoints; some use Turnstile and email-based rate limits |
| Admin operations | Users, roles, invites, applications, contact, messages, reviews, audit logs, analytics, media, notifications | Most sampled handlers use the shared session helper and/or content permission checks |
| Media | Media library, uploads, upload signature, document upload, delete | Authenticated media administration plus one public resume/document upload route |
| Notifications | Push public key and subscription management | Public key is public; subscription management uses authenticated session |
| Scheduled operations | Analytics snapshot and keep-alive email | Shared secret header/bearer authorization |
| System maintenance | Debug, cleanup, founder hierarchy, content-author repair, and seed routes | Most use CRON_SECRET; multiple GET handlers perform writes or other side effects |
| Health/liveness | Health and ping endpoints | Public by design; detail exposure differs |

## 2. Important route-level findings

### A. Most CMS administration handlers are session-gated

The reviewed content-management routes generally call getAuthenticatedSession and then use a content permission or management check for protected reads/writes. User and role handlers also check user/role management permissions. This is a useful base, but it is not a central authorization boundary: the proxy does not globally authenticate every API request, so every handler must continue to enforce its own policy.

### B. Public endpoints are a deliberate part of the application

The following types of unauthenticated access are expected:
- Public content reads.
- Contact, review, job-application, newsletter, and analytics submissions.
- Login, Google sign-in, password reset, invitation acceptance, and 2FA token exchange.
- Public push public-key retrieval, review-target lookup, and Open Graph generation.

These routes still need abuse controls, input limits, token validation, privacy review, and monitoring. “Public” must never mean unrestricted.

### C. Public resume/document upload needs hardening

The media upload-document handler accepts PDF and Word files up to 5 MB and uploads them to the Cloudinary resumes folder. The route itself does not call the authenticated-session helper, Turnstile verification, or a rate limiter. It checks the browser-provided MIME type and size, but the inspected handler does not validate file signatures/magic bytes.

Recommended before broader growth:
- Add server-side file signature validation and safe filename handling.
- Add Turnstile or equivalent abuse protection and per-IP/per-session rate limits.
- Enforce upload quotas and storage lifecycle/retention.
- Ensure uploaded resume URLs are not treated as trusted executable content.
- Keep document access and deletion controls explicit.

### D. System maintenance surface

There are 16 files under the system route group. The ping route is a simple public liveness response. The other maintenance/debug/seed/keep-alive routes inspected use CRON_SECRET checks. Multiple handlers expose GET methods that can perform database writes, deletes, seed operations, or email side effects.

This should be reduced to a minimal maintenance surface:
- Remove obsolete seed/fix routes after confirming they are no longer needed.
- Change remaining state-changing actions to POST.
- Require a strong, rotated secret or a signed scheduled-job identity.
- Make destructive operations one-time, idempotent, explicitly scoped, and fully audited.
- Keep debug endpoints disabled or private in production.
- Do not return sensitive records or detailed internal diagnostics unnecessarily.

### E. Authentication and recovery routes

- Founder bootstrap registration requires the SETUP_SECRET_KEY header and refuses to create another founder if a founder role already exists.
- Invite lookup uses a token hash and checks approval, use, and expiry before returning the invited email and role label.
- 2FA disable confirmation requires a one-time token plus the account password and increments refreshTokenVersion, revoking existing sessions.
- Login uses a per-account failed-attempt counter and temporary lock. IP/device-level rate limiting should also be assessed.
- The 2FA verification and recovery paths should be covered by explicit brute-force, replay, expiry, and enumeration tests.

### F. Health and public liveness

- /api/health is public and currently returns database connection state plus the raw error message when the database connection fails. Public health output should be minimal; detailed diagnostics belong behind authenticated monitoring.
- /api/system/ping returns a simple liveness response and does not expose business data.

## 3. Cross-cutting controls to preserve and extend

- CSRF origin verification is invoked by the Next proxy for state-changing API methods.
- The proxy records selected authenticated admin API actions through the audit helper, but logging is fire-and-forget and is not a substitute for transactionally recording critical business events.
- Public contact/review/application flows include Turnstile verification in the inspected handlers; rate limiting is implemented in some submission paths.
- The new platform should use shared typed authorization guards, default-deny policy checks, resource ownership checks, audit records, idempotency, and rate limits.

## 4. Phase 1 implications

The current API surface can remain operational while the business platform is introduced, but new modules must not copy the existing scattered authorization pattern. Define the permission registry and resource-scope policy first, then implement all new endpoints through shared route guards.

The full 95-file inventory is complete at the static source-review level. Security testing of each endpoint remains a separate verification task and should be performed before any sensitive existing endpoint is changed.
