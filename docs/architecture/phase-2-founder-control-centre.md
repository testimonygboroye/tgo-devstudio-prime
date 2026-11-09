# Phase 2 — Founder Control Centre

## Objective
Introduce the first founder-facing operating surface for the TGO Business Operating System without replacing or disrupting the existing CMS administration area.

## Delivered in this phase increment
- Founder-only navigation entry at the top of the admin sidebar.
- Responsive Founder Control Centre at the configured admin base path plus `/platform`.
- Live MongoDB-backed operational metrics for active and suspended business memberships, business roles, total recorded audit activity, founder unread notifications, and outbox event states.
- Recent platform audit activity with actor, module, outcome and timestamp context.
- Business module portfolio sourced from the central module registry, with live/roadmap status.
- Module cards remain informational until each business module has its own platform-native management screen; existing CMS roles remain a separate legacy system.
- Runtime environment and platform feature-flag visibility.
- Clear disclosure that the event outbox is not yet backed by a production dispatcher.
- Founder-only visibility in the navigation and server-side page authorization.

## Access and security
- Route: `/admin/platform` (or the configured custom admin base path followed by `/platform`).
- Requires an authenticated session with the existing founder role.
- The page performs server-side queries only; it does not expose a new unauthenticated API.
- Existing CMS roles, login, content routes and public pages remain unchanged.
- Metrics are counts only; no secrets, payment data or client PII are rendered.

## Verification
- CI must pass unit tests, scoped lint, and production build before release.
- Render production deployment must complete successfully before the feature is considered live.
- Sign in as the founder, open the admin sidebar, select Founder Control Centre, and verify:
  1. Operational snapshot loads without a server error.
  2. Counts render from the connected MongoDB database.
  3. Module cards reflect the registry and roadmap status.
  4. Recent audit activity appears when events exist, otherwise the designed empty state appears.
  5. Non-founder admin accounts do not see the Founder navigation item and are redirected if they try the route directly.
  6. Mobile layout remains usable at narrow viewport widths.

## Explicitly not claimed as delivered
This phase increment is an executive control surface, not the complete ERP. It does not yet implement membership CRUD, business-role CRUD, notification actions, event retry/dispatch, client CRM, project delivery, payments, HR, procurement, or AI agent execution. Those capabilities require their own guarded workflows and domain phases. The dashboard labels these as roadmap rather than presenting disconnected controls as working features.
