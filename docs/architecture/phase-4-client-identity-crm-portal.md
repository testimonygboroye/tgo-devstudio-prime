# Phase 4 — Client Identity, CRM & Client Portal

## Objective

Deliver a real client-facing account environment connected to the founder's client administration tools while reusing the platform's existing User identity, authentication cookies, audit records, organization directory and notification collection.

## Implemented scope

### Identity and authentication
- Client accounts use the existing `User` collection and shared JWT/session implementation. No parallel client auth database or token format was introduced.
- `accountType` distinguishes client identities from staff identities; existing users default to `staff` to preserve existing CMS behavior.
- Client accounts are bound to a protected system role with no CMS management privileges.
- The shared password login route accepts an explicit client audience and rejects cross-environment account sign-in.
- New client registration enforces normalized email, bounded name, and a 12-character password policy with uppercase, lowercase and numeric characters.
- Client accounts remain unverified until a single-use, SHA-256-hashed, 24-hour verification token is redeemed.
- Verification email delivery uses the Resend API. Delivery is not simulated; registration fails cleanly if email delivery is not configured or rejected.
- Google sign-in uses OAuth authorization-code exchange, state-cookie validation, Google userinfo verification, and the provider's account chooser prompt. Existing verified client identities can link Google by verified matching email; staff identities are never silently converted.
- Password and Google sign-in both retain the existing authenticator/backup-code 2FA challenge; Google-only accounts with 2FA enabled receive a short-lived challenge cookie.
- Password changes verify the current password and increment the shared refresh-token version to revoke existing sessions.

### Account selector
- The sign-in page can remember up to five recently used client email identities in a non-HttpOnly, same-site cookie.
- The selector only stores email identifiers, never passwords or authentication tokens.
- Google OAuth uses `prompt=select_account` so Google can present its account chooser.
- Users can select a remembered identity or use another account.

### Client profile and organizations
- `ClientProfile` is one-to-one with a client User and stores contact information, lifecycle, segmentation, onboarding state and optional organization relationship.
- Client organizations reuse `BusinessOrganization`; the client CRM can link a client profile to an active organization of type `client`.
- Profile updates validate field lengths and HTTPS website URLs.
- Completing phone, country and timezone fields marks onboarding complete. Other lifecycle decisions remain under staff control.

### Client CRM and operations
- Founder-only client management lists client identities, verification state, lifecycle, segments, onboarding status and linked client organization.
- Founder actions can update lifecycle, onboarding status, segment labels and organization association.
- Client interaction history is visible in the client profile administration flow.
- Client enquiries have categories, status, priority and staff assignment.
- Founder operations can review enquiries, change status/priority, write client-visible responses and assign eligible staff accounts.
- Enquiry responses and status changes create client activity records, client notifications and platform audit events; new enquiries notify the founder notification centre.
- New client enquiries notify the founder notification centre.

### Client portal
- Responsive client entry, registration, verification, sign-in, dashboard, account settings, enquiry centre and notifications.
- Dashboard metrics are based on actual client enquiry records and onboarding fields; unavailable projects, payment, credits and rewards are explicitly marked as future modules rather than populated with invented data.
- Client-facing APIs scope all records to the authenticated client identity and return private no-store responses.
- Clients can review their full activity timeline and update their display name, contact details and password (password-enabled accounts).
- Client activity is recorded with actor type and timestamp.

## Data models

- `User`: shared identity, account type, verified-email state, provider list and Google subject.
- `ClientProfile`: profile fields, organization link, lifecycle, segment labels and onboarding.
- `ClientEmailVerification`: token hash, expiry and consumed timestamp.
- `ClientEnquiry`: client, optional organization, category, status, priority, assignee and latest staff response.
- `ClientActivity`: client, actor, action, summary and metadata.
- Existing `BusinessOrganization`, `PlatformNotification` and `PlatformAuditEvent` are reused.

## Main routes

### Client pages
- `/client/login`
- `/client/register`
- `/client/verify-email`
- `/client/dashboard`
- `/client/settings`
- `/client/enquiries`
- `/client/notifications`
- `/client/activity`

### Client APIs
- `POST /api/client/register`
- `POST /api/client/verify-email`
- `POST /api/client/resend-verification`
- `GET/PATCH /api/client/profile`
- `GET/POST /api/client/enquiries`
- `GET /api/client/activity`
- `POST /api/client/security`
- `GET/PATCH /api/client/notifications`
- `GET /api/client/auth/google`
- `GET /api/client/auth/google/callback`

### Founder administration
- `/admin/clients`
- `/admin/client-enquiries`
- `GET/PATCH /api/platform/clients`
- `GET /api/platform/clients/:clientId/activity`
- `GET/PATCH /api/platform/client-enquiries`

## Required environment configuration

The following server-side variables must be configured in the hosting environment before practical email/Google sign-in testing:

- `SITE_URL`: canonical deployed site origin.
- `RESEND_API_KEY`: Resend API key for verification messages.
- `EMAIL_FROM`: verified sender identity accepted by the Resend account.
- `GOOGLE_CLIENT_ID`: Google OAuth web client id.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.

Google OAuth authorized redirect URI must exactly match:
`https://<SITE_URL-host>/api/client/auth/google/callback`

Do not put any of these secrets in client-side variables or commit them to Git. The CI environment intentionally does not contain production credentials.

## Security and operational boundaries

- All client profile, enquiry, activity and notification reads are scoped to the authenticated client id.
- Client management and enquiry administration endpoints require the server-verified founder role.
- Client account sign-in cannot use the staff audience, and staff accounts cannot use the client audience.
- Suspending a client increments the refresh-token version, invalidating existing sessions.
- Verification tokens are random, hashed at rest, expire after 24 hours and are consumed atomically.
- Google state is random, HttpOnly, same-site and short-lived.
- Google verified email is required before creating/linking a client identity.
- Client and staff account types are never silently merged.
- Client account data and activity are not exposed in public endpoints.
- Important client and staff actions are written to client activity and/or the platform audit stream.
- No project, deliverable, payment, invoice, credit, reward or referral functionality is claimed by this phase.

## Verification gates before practical deployment

1. CI Jest, ESLint and production build pass on the final phase branch.
2. Confirm the Resend sender/domain and required environment variables are configured in the chosen hosting environment.
3. Confirm Google OAuth client configuration and exact callback URI.
4. Test registration, verification expiry/replay, password sign-in, Google account chooser, duplicate account behavior and staff/client boundary.
5. Test founder-only client administration, non-founder denial, segment updates, organization linking, activity history and enquiry assignment.
6. Test client data isolation between two client accounts.
7. Test responsive layouts on a narrow Android viewport and desktop.
8. Confirm existing public pages and CMS sign-in/admin workflows remain unchanged.
9. Do not trigger a deployment until all these gates are met and the user is ready to perform the practical walkthrough.

## Explicit remaining platform dependencies

This phase does not invent functionality from later roadmap modules. Client project workspaces, milestone delivery, payment processing, invoices, credits, rewards, referrals, secure file delivery and real-time messaging depend on their own later phases. They are intentionally not displayed as operational capabilities.
