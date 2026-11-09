# Phase 2 — Founder Control Centre

## Objective
Provide a founder-only administrative entry point that preserves the existing public website CMS and reuses its authenticated identity system.

## Implemented
- Founder-only Founder Control Centre route under the configured admin base path at `/platform`.
- Server-side founder-role verification; unauthenticated users are redirected to the existing login and non-founder users are denied.
- Live database-backed operational indicators for memberships, roles, audit records, notifications and event outbox state.
- Application launcher links to the public website, existing website administration and the Business Ecosystem Directory.
- Client Portal and Workforce Portal are visibly labelled Planned and are not clickable until their actual applications exist.
- Founder universal search for organization names/slugs and user names/emails. The API is founder-only, query-length bounded, regex-escaped, result-limited and private/no-store.
- Founder notification centre with unread counts, recent in-app notifications, individual mark-read and mark-all-read actions.
- Notification reads are scoped to the authenticated founder and important read actions are audited.
- Security settings and existing administration preferences are linked from the control centre.
- Responsive cards and status treatments use the existing TGO design tokens and visual language.

## Shared-system integration
- Existing server session and founder role remain the identity boundary; no second authentication system was introduced.
- Search reads the canonical User and BusinessOrganization collections.
- Notifications use the shared PlatformNotification collection and PlatformAuditEvent trail.
- The module portfolio continues to use the central platform module registry.

## Explicit scope boundaries
- Client Portal and Workforce Portal are not yet applications and are intentionally shown as Planned.
- Search currently covers users and business organizations only; it does not claim to search future projects, payments, messages or files.
- Notification delivery is in-app only. Email, web-push and real-time delivery require provider configuration and delivery workers.
- The existing CMS account profile remains the account identity surface; a separate founder profile editor has not been introduced.
- Founder settings are linked to existing administration settings; a separate platform-wide settings editor is not yet available.

## Verification gates
- CI must pass Jest, scoped ESLint and the Next.js production build.
- Founder and non-founder route access must be tested using real sessions.
- Search and notification APIs must be verified for 401/403, bounded results, no-store headers and user-scoped writes.
- Verify application links against the configured custom admin base path.
