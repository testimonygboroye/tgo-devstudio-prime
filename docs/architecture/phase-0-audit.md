# TGO DevStudio Prime — Phase 0 Architecture Audit

**Status:** Completed from repository, GitHub, and Vercel configuration inspection  
**Audit date:** 9 November 2026  
**Repository:** testimonygboroye/tgo-devstudio-prime  
**Audited main commit:** 03ad71fac5920c0c9e0b3de69059b0f6502fc6d3  
**Production project:** Vercel tgo-devstudio-prime

## 1. Executive summary

TGO DevStudio Prime is an established, production-deployed Next.js application. It is not a blank project and must not be replaced. It already contains a substantial public marketing/content website and a private CMS administration environment, with custom authentication, role-based access, analytics, audit logging, media upload, email, push notifications, SEO, and MongoDB persistence.

The proposed TGO Business Operating System should be introduced as a carefully bounded expansion of the existing platform. The recommended starting point is a **modular monolith inside the existing repository and Vercel project**, with explicit module boundaries and shared platform services. Do not split the system into microservices or multiple deployable applications during the foundation phase.

The current application is CMS- and marketing-oriented. It does not yet provide the core business operating capabilities in the master blueprint: client organizations and portal, workforce lifecycle, project delivery operations, commercial orders, payments, finance ledger, AI workforce, or universal workspaces. These must be added as new domains rather than repurposing existing content models.

## 2. Audit scope and evidence

The audit inspected:
- GitHub repository metadata, default branch, current branch list, recursive source tree, key application/configuration files, authentication and authorization code, representative API handlers, and existing tests.
- Vercel project configuration, production deployment metadata, recent deployment history, project environment-variable names/targets (without decrypting values), and the available recent runtime-log window.
- Existing deployment and CI configuration.

No production database records were changed. No application runtime code was changed. No production environment variables or credentials were read in decrypted form.

## 3. Verified current state

### Repository and deployment
- Public GitHub repository: testimonygboroye/tgo-devstudio-prime.
- Default branch: main; the connected account has administrative and push permissions.
- Repository inventory at audit time: 429 tracked file blobs and 668 total tree entries.
- Current branches include main, fix/vercel-html-sanitizer, and legal-centre-refresh-2026-11.
- Vercel project: tgo-devstudio-prime, framework detected as Next.js, Node.js runtime setting 24.x.
- The audited main commit had a production deployment reported READY, with aliases tgo-devstudio-prime.vercel.app and tgo-devstudio-prime-testimonygboroye.vercel.app; deployment region reported as iad1.
- The Vercel project metadata lists only those two vercel.app domains. No custom domain is attached to this Vercel project in the inspected metadata.
- The audited production commit was 03ad71fac5920c0c9e0b3de69059b0f6502fc6d3, titled “feat: migrate legacy legal pages on founder admin access”. Vercel reported READY and a successful Vercel status check.
- Runtime-log access for a 24-hour range was unavailable on the connected Vercel plan. A 30-minute error/warning query returned no matching log entries; this is not proof that no errors occurred outside that retention window.

### Application stack
- Next.js App Router, Next.js 16.3.0, React 19.2.8, TypeScript 5.x, Tailwind CSS 4.x.
- MongoDB with Mongoose 9.9.1.
- npm lockfile and npm scripts.
- Vercel Analytics, Cloudinary, Brevo email, Google Identity Services, Cloudflare Turnstile, Web Push/VAPID, JWT, bcrypt, and TOTP/2FA dependencies are present.
- One Next.js application currently hosts the public site, admin interface, and API routes. The repository is not currently a monorepo.

### Application surface
- 97 page route files.
- 95 API route handler files.
- 51 React component files.
- 32 Mongoose model files.
- 75 files under src/lib.
- Existing public routes cover homepage, about, services, portfolio, blog, careers, contact, FAQ/help, team, testimonials, legal pages, settings, and related content.
- Existing admin routes cover dashboard, content management, portfolio content, services, team, blog, careers/applications, contact/messages, reviews, analytics, audit log, media, users, roles, invites, availability, security, and settings.
- The current Project collection is a public portfolio/content domain. It is not a commercial project-delivery engine with tasks, milestones, contracts, approvals, payment conditions, and deliverable release controls.

### Existing data domains
The 32 current Mongoose models are:
AboutSettings, AnalyticsEvent, AuditLog, AvailabilityStatus, BlogPost, BookACallSettings, ContactSubmission, FaqItem, HelpArticle, HomeSettings, Invite, JobApplication, JobOpening, LaunchSettings, Message, NewsletterSubscriber, PageContent, PageView, PasswordResetToken, ProcessStep, Project, PushAnalyticsSnapshot, PushSubscription, Review, Role, RoleChangeRequest, Service, StackItem, TeamMember, TwoFactorDisableToken, User, and Visitor.

### Authentication and permissions
- The application uses custom JWT access and refresh cookies, with access-token expiry configured to 15 minutes and refresh-token expiry configured to 30 days.
- The user model supports password hashes, Google subject linkage, role reference, 2FA state/secrets, hashed backup codes, refresh-token versioning, failed-login counters, temporary account lock, and ban status.
- The role model supports a founder-role flag, hierarchy level, system-role flag, user/role management booleans, 2FA requirement, content-type permission maps, and analytics permission flags.
- Authorization is implemented through shared session and authorization helpers, but the permission vocabulary is currently oriented around CMS actions and a small set of administrative capabilities. It is not yet the universal permission registry with resource scopes, explicit deny, delegation, temporary grants, and approval policies required by the new platform.
- The founder role currently receives broad bypass treatment for content permissions. Preserve existing CMS behaviour, but do not use this as the access model for new business modules.
- Admin URLs are rewritten through the ADMIN_PATH environment setting, while direct /admin paths are hidden by the proxy. This is route obscurity, not a substitute for authentication and authorization.

### Existing shared capabilities
- MongoDB connection helper with cached Mongoose connection handling.
- Authentication/session, JWT, password, 2FA, and CSRF utilities.
- Audit logging.
- Email notification helpers.
- Cloudinary media upload and deletion.
- Web Push subscription and delivery.
- Analytics and visitor tracking.
- Internationalization, SEO metadata/schema helpers, HTML sanitization, and content visibility helpers.

### CI and tests
- GitHub Actions has a CI workflow triggered on pushes and pull requests targeting main.
- It uses Node 24, installs dependencies with npm install, and runs npm run build.
- The workflow does not currently run ESLint or Jest.
- package.json defines lint and test scripts, but the repository contains only three Jest test files (i18n, reading time, and slugify).
- The README remains the default create-next-app guide rather than project-specific setup and architecture documentation.
- No .env.example, .env.sample, or .env.template is present in the repository tree.
- Vercel has 27 configured environment-variable entries across production, preview, and development targets. Names and target scopes were inventoried without exposing or decrypting values. MONGODB_URI is configured for production only, not preview. The PR preview builds therefore fail during static prerendering of database-backed pages such as /about and /blog with a missing MONGODB_URI error. Do not copy the production database URI into preview; provision an isolated staging database or an approved preview-safe data strategy first. Runtime availability and correctness of every integration key still need feature-specific health checks.

## 4. Architecture decision

### Decision: extend the existing app as a modular monolith

For the first business-platform releases:
1. Keep the current public website and CMS admin routes operational.
2. Add the new business ecosystem as a distinct route group/application shell, with separate navigation and explicit route guards.
3. Introduce domain modules with their own services, validation, models, API handlers, tests, and permissions.
4. Share only genuinely cross-cutting platform capabilities: identity, authorization primitives, audit, events, notifications, file access, search, integrations, and AI orchestration.
5. Keep public CMS content models separate from new CRM, workforce, project-delivery, commerce, finance, and workspace models.
6. Use a module registry for navigation, permissions, settings, event subscriptions, and dashboard contributions. The registry should be code-defined initially; do not build an arbitrary runtime code/plugin loader.
7. Extract independent services only when scale, security isolation, team ownership, or deployment needs justify the operational cost.

### Proposed logical structure

- app/(public): existing public website; preserve.
- app/admin: existing CMS administration; preserve.
- app/founder: new founder launcher and command centre.
- app/business: new business ecosystem administration.
- app/portal: future client portal.
- app/workforce: future employee/contractor portal.
- platform/identity, authorization, audit, events, notifications, files, integrations, search, workflows.
- modules/clients, organization, workforce, workspaces, projects, services, sales, commerce, finance, support, rewards, ai-workforce, analytics.

This is a logical target, not an instruction to move all existing files in one refactor. New modules should start in their own boundaries; existing code should only move when a tested incremental migration makes it safer.

## 5. Integration boundaries

### Preserve during initial foundation
- Public website URLs, content, SEO metadata, sitemap/feed behaviour, service worker, media assets, and existing public forms.
- Existing CMS admin URL and sign-in/session flow.
- Existing public content collections and their admin workflows.
- Existing Vercel project, deployment aliases, environment configuration, and MongoDB connection.

### Reuse after explicit review
- Existing User identity as a starting administrative identity record, but do not overload it with client, employee, or AI-specific profile fields.
- Existing audit and notification helpers as implementation references; evolve them behind stable interfaces before making them global services.
- Existing Cloudinary and email integrations behind provider adapters.
- Existing analytics models for public-site analytics only; new business analytics need clear event ownership and privacy boundaries.

### Build as new business domains
- Client accounts, client organizations, contacts, CRM, enquiries, proposals, contracts, orders, and client portal.
- Departments, teams, positions, employee/contractor profiles, HR, attendance, leave, and workforce portal.
- Workspace membership, channels, messages, collaboration, tasks, documents, and approvals.
- Commercial project lifecycle, milestones, QA, deliverables, change requests, and release conditions.
- Payment provider abstraction, payment attempts, verified provider events, invoices, refunds, immutable ledger, account credits, and reconciliation.
- Support tickets and SLA operations.
- Rewards and referral records.
- AI provider credentials, agents, assignments, executions, budgets, approvals, and handovers.
- Executive intelligence and operational reporting.

## 6. Database and financial design constraints

MongoDB/Mongoose is the current persistence layer and is a reasonable first choice for the extension, but production cluster topology, transaction support, backup policy, point-in-time recovery, and restore procedure must be confirmed before financial or multi-document workflows are implemented.

For new domains:
- Use explicit identifiers and ownership references.
- Keep client, workforce, finance, AI credentials, and public CMS data separated by domain and authorization policy.
- Add schema validation and indexes with each model.
- Use idempotency keys for external and retryable operations.
- Use an outbox/event record for reliable side effects rather than relying on untracked fire-and-forget work for critical business events.
- Use database transactions where supported for ledger postings and related balance changes.
- Treat provider webhooks as untrusted until signature, timestamp, amount, currency, reference, and idempotency checks pass.
- Store monetary amounts in integer minor units or a rigorously defined decimal representation; never use binary floating-point arithmetic for ledger balances.
- Keep account credit as controlled, non-transferable customer credit until regulatory and payment-partner review permits anything broader.

## 7. Phase 1 entry prerequisites

Before implementing the platform foundation:
1. Resolve the exposed cookie-export risk in repository history and invalidate any affected sessions.
2. Review and secure legacy /api/system/* maintenance/seed/fix endpoints; remove obsolete handlers or convert mutations to tightly authorized POST operations with one-time execution controls.
3. Complete a route-by-route authorization inventory for the existing 95 API handlers.
4. Confirm MongoDB cluster topology, transaction support, backup schedule, retention, and restore process.
5. Create a safe environment-variable template containing names and descriptions only, never values.
6. Document local development and deployment procedures.
7. Expand CI to run type checking/build, lint, unit tests, and focused integration/security tests. Configure an isolated preview database before relying on Vercel preview deployments; the current preview environment is missing MONGODB_URI.
8. Define the first identity model boundary: platform user, client account, organization membership, employee profile, and AI principal must be distinct concepts linked through explicit identity records.
9. Agree the initial permission catalogue and module registration contract before adding protected business routes.

## 8. Audit conclusion

Phase 0 has established the current application baseline, integration boundaries, architecture decision, and risk register. The safest path is an incremental modular-monolith extension of the existing Next.js/MongoDB/Vercel application. The existing public website and CMS are assets to preserve, not systems to replace.

Phase 1 should begin only after the high-priority security and operational prerequisites in the risk register are addressed or explicitly accepted with a documented mitigation.
