# TGO DevStudio Prime — Current-State Inventory

**Audit date:** 9 November 2026  
**Audited main commit:** 03ad71fac5920c0c9e0b3de69059b0f6502fc6d3

## Repository metrics

| Area | Verified count / state |
|---|---:|
| Tracked file blobs | 429 |
| Total tree entries | 668 |
| App page route files | 97 |
| API route handler files | 95 |
| React component files | 51 |
| Mongoose model files | 32 |
| src/lib TypeScript files | 75 |
| Jest test files | 3 |
| Environment templates | 0 |
| Project-specific architecture/setup docs | 0 |

Counts are repository-tree counts at the audited commit, not estimates of runtime routes. Dynamic route files can represent multiple URL instances.

## Current public website

The existing public application includes:
- Homepage and company information.
- Service catalogue and service detail pages.
- Portfolio/project showcase and detail pages.
- Blog and article detail pages.
- Careers and job detail/application flows.
- Contact, book-a-call, FAQ, help, team, testimonials, and technology stack pages.
- Privacy, terms, usage, and accessibility pages.
- Language/theme settings.
- SEO metadata/schema, sitemap/feed, Open Graph image generation, manifest, favicon/icons, service worker, offline page, and network status components.

## Current administration

The existing private CMS administration includes:
- Admin sign-in, signup/invitation, password recovery, 2FA setup/recovery/disable flows.
- Dashboard and navigation shell.
- Blog, services, portfolio/case studies, process, team, careers, FAQ, help articles, legal pages, homepage settings/media, and technology stack management.
- Contact submissions, messages, reviews, applications, newsletter, and booking/availability administration.
- Analytics and conversion analytics.
- Audit log, roles, users, invites, security, notification settings, media library, language/theme settings.

This is an existing CMS administration system. It is not yet the new business ecosystem admin described in the master blueprint.

## Current persistence models

| Domain | Existing models |
|---|---|
| Identity & admin | User, Role, Invite, RoleChangeRequest, PasswordResetToken, TwoFactorDisableToken |
| Public content | AboutSettings, HomeSettings, PageContent, BlogPost, FaqItem, HelpArticle, JobOpening, JobApplication, Project, Service, ProcessStep, TeamMember, StackItem, Review, AvailabilityStatus, BookACallSettings |
| Communications | ContactSubmission, Message, NewsletterSubscriber |
| Analytics & audit | AnalyticsEvent, AuditLog, PageView, Visitor, PushAnalyticsSnapshot |
| Notifications | PushSubscription |
| Other | LaunchSettings |

## Existing infrastructure and integrations

| Capability | Current implementation evidence |
|---|---|
| Database | MongoDB + Mongoose connection helper |
| Authentication | Custom JWT access/refresh cookies |
| Passwords | bcrypt |
| MFA | TOTP and backup-code model fields |
| Google sign-in | Google Identity Services/token verification |
| Authorization | Role model + shared authorization helpers |
| CSRF | Origin verification helper invoked from Next proxy |
| Audit | Shared audit logging helpers and AuditLog model |
| Media | Cloudinary |
| Email | Brevo integration helpers |
| Bot protection | Cloudflare Turnstile |
| Push notifications | Web Push/VAPID |
| Analytics | Vercel Analytics plus custom visitor/page/event models |
| SEO | Metadata, schema, keyword strategy helpers |
| Deployment | Vercel Next.js project; GitHub-linked production branch |
| Scheduled job | Vercel cron for analytics snapshot |

## Environment configuration inventory

Vercel reported 27 environment-variable entries. Names only are listed; values were not decrypted or copied into this document.

- GOOGLE_CLIENT_ID
- NEXT_PUBLIC_GOOGLE_CLIENT_ID
- NEXT_PUBLIC_VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT
- TWO_FACTOR_ENABLED
- TURNSTILE_SECRET_KEY
- TURNSTILE_ENABLED
- SITE_URL
- SETUP_SECRET_KEY
- OG_IMAGES_ENABLED
- NEXT_PUBLIC_TURNSTILE_SITE_KEY
- NEXT_PUBLIC_TURNSTILE_ENABLED
- NEXT_PUBLIC_NEWSLETTER_BROADCAST_ENABLED
- NEWSLETTER_BROADCAST_ENABLED
- MONGODB_URI
- JWT_TEMP_2FA_SECRET
- JWT_REFRESH_SECRET
- JWT_ACCESS_SECRET
- FOUNDER_NOTIFICATION_EMAIL
- CRON_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_SECRET
- CLOUDINARY_API_KEY
- BREVO_SENDER_EMAIL
- BREVO_API_KEY
- ADMIN_PATH

The list confirms configured variable records and target scopes, not that every integration is currently healthy or that every variable is populated correctly. Do not expose or copy values into source control or documentation.

## Build and quality checks

- npm scripts: dev, build, start, lint, test.
- CI currently executes npm install and npm run build on Node 24.
- CI does not currently execute the existing lint or Jest scripts.
- Only three Jest test files were found.
- README is still the generic Next.js starter README.
- No environment template is present.

## Explicitly not present yet

The source inventory does not show implemented business modules for:
- Client organizations and client portal.
- Employee/contractor workforce portal and HR lifecycle.
- Departments, teams, positions, and reporting hierarchy as operational workforce records.
- Universal workspace engine.
- Internal project delivery with tasks, milestones, dependencies, QA, approvals, deliverables, and release rules.
- Commercial quotations, proposals, contracts, orders, checkout, or payment provider integration.
- Financial ledger, account credits, reconciliation, expenses, or financial approvals.
- Support ticket/SLA service desk.
- Loyalty/referral engine.
- AI provider/agent registry, AI workforce, or command centre.
- Integration registry/workflow engine for configurable business operations.
- Company-wide executive intelligence and forecasting.

These are new modules to design and implement; they must not be represented as already working capabilities.
