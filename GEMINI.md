# TGO DevStudio - AI Coding Agent & Project Owner Instructions (`GEMINI.md`)

This file provides foundational, persistent instructions for AI coding agents and the project owner working on the **TGO DevStudio** codebase. Follow these instructions strictly to ensure architectural integrity, security, and high engineering standards.

---

## 1. Project Identity and Purpose
- **Project Name:** TGO DevStudio (`tgo-devstudio-prime`)
- **Purpose:** A professional web development studio marketing website and full-featured Admin/CMS dashboard providing content management, blog publishing, client onboarding, inquiries, role-based access control, analytics tracking, and secure authentication.

## 2. Actual Technology Stack
- **Framework:** Next.js 16 (App Router, Turbopack, Server Actions, API routes)
- **UI Library:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript (Strict mode enabled, `noEmit: true`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@tailwindcss/typography`)
- **Database & ODM:** MongoDB via Mongoose v9 (`mongoose`)
- **Authentication & Security:** 
  - JSON Web Tokens (`jsonwebtoken`)
  - Password hashing via `bcryptjs`
  - Two-Factor Authentication (2FA) via TOTP (`otplib`, `qrcode`) and backup codes
  - CSRF protection via request origin verification
  - Cloudflare Turnstile captcha integration
- **Rich Text Editor:** Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, code-block-lowlight, extensions)
- **Media Management:** Cloudinary (`cloudinary`)
- **Testing:** Jest (`jest`, `@testing-library/react`, `@testing-library/jest-dom`, babel-jest)

## 3. Project Architecture and Important Directories
- `src/app/`: Next.js App Router root.
  - `(public)/`: Public-facing website pages and layouts.
  - `admin/`: Admin CMS dashboard interface and pages.
  - `api/`: Backend API route handlers.
  - `feed.xml/`: RSS feed route generator.
- `src/components/`: Modular UI component library.
  - `admin/`: CMS forms, data tables, navigation, search bars.
  - `public/`: Marketing site components, forms, hero sections, interactive widgets.
  - `shared/`: Cross-cutting components (Theme toggle, lightboxes, back-to-top, schemas).
- `src/lib/`: Core utilities, database connection, authentication logic, security, email service, audit logging, and constants.
- `src/models/`: Mongoose ODM schema definitions and TypeScript interfaces for all data models.
- `src/proxy.ts`: Custom Next.js request proxy / middleware handling CSRF validation, audit logging, and dynamic admin path obfuscation.

## 4. Public-Site Architecture and Conventions
- Located primarily under `src/app/(public)/`.
- Server and Client components working together with strict separation of concerns.
- Reusable public components located in `src/components/public/`.
- Must maintain responsive design, accessibility standards, and SEO metadata.
- Integrates organization schemas (`OrganizationSchema.tsx`), analytics tracking (`AnalyticsTracker.tsx`), and cookie consent (`CookieConsentBanner.tsx`).

## 5. Admin/CMS Architecture and Conventions
- Located under `src/app/admin/`.
- Dynamic admin routing managed by `src/proxy.ts` using the `ADMIN_PATH` environment variable (rewrites incoming obfuscated admin paths to `/admin`).
- Admin shell components (`AdminSidebar.tsx`, `AdminTopBar.tsx`, `AdminPagination.tsx`, `AdminSearchBar.tsx`) providing a unified dashboard experience.
- CMS forms (`BlogPostForm.tsx`, `JobOpeningForm.tsx`, `TeamMemberForm.tsx`, `ServiceForm.tsx`, `RichTextEditor.tsx`, etc.) for content creation and management.

## 6. Database and Mongoose Conventions
- MongoDB connection managed via `src/lib/db.ts` utilizing global caching (`global.mongooseCache`) to prevent multiple connections in serverless/hot-reloading environments.
- All models must define strict TypeScript interfaces extending `Document` (e.g., `IUser`, `IBlogPost`, `IProject`).
- Timestamps must be enabled (`{ timestamps: true }`).
- Sensitive fields (such as `twoFactorSecret`, `backupCodeHashes`) must explicitly utilize `select: false` in schemas.

## 7. Authentication and Authorization Architecture
- JWT-based authentication (`src/lib/auth/jwt.ts`, `cookies.ts`, `serverSession.ts`).
- Secure password hashing using `bcryptjs`.
- 2FA TOTP verification using `otplib` and QR code generation.
- Session management, account lockout mechanisms, refresh tokens, and password reset workflows.

## 8. RBAC and Permissions Conventions
- Role-based access control (RBAC) utilizing MongoDB `Role` and `User` models.
- Permission utility functions located in `src/lib/utils/permissions.ts`.
- Route guards and authorization helpers (`authorize.ts`, `pageGuards.ts`) protecting admin pages and API endpoints based on user roles and permissions.

## 9. 2FA / Security / CSRF Conventions
- CSRF protection (`src/lib/security/csrf.ts`) verifying request origin (`Origin`/`Referer`) on all state-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
- Strict Content Security Policy (CSP) headers, HSTS, X-Frame-Options, X-Content-Type-Options, and Permissions Policy configured in `next.config.ts`.
- Captcha protection via Cloudflare Turnstile (`src/lib/turnstile.ts`).

## 10. API Route Conventions
- Located under `src/app/api/`.
- Return standardized JSON responses using `NextResponse.json(...)`.
- Validate request inputs thoroughly, handle errors gracefully with appropriate HTTP status codes.
- Enforce authentication, CSRF validation, and audit logging (`logAction.ts`) for administrative state-changing operations.

## 11. UI, Styling, Theme, Typography, and Design-System Conventions
- Styling via Tailwind CSS v4 (`@tailwindcss/postcss`, `@tailwindcss/typography`).
- Theme support via `ThemeProvider.tsx` and `ThemeToggle.tsx`.
- Icons from `lucide-react`.
- Maintain consistent spacing, typography, and color tokens across both public and admin interfaces.

## 12. Existing Coding Patterns to Preserve
- Strict TypeScript typing (no `any` casts, no type bypassing).
- Functional React components with hooks.
- Clean separation between models (`src/models/`), business logic/helpers (`src/lib/`), API routes (`src/app/api/`), and UI components (`src/components/`).
- Robust error handling and async/await patterns.

## 13. Component and File-Organization Conventions
- Use PascalCase for React component files (e.g., `BlogPostForm.tsx`).
- Use camelCase for utility and helper files (e.g., `slugify.ts`, `authorize.ts`).
- Follow established directory structures (`src/components/admin/`, `src/components/public/`, `src/components/shared/`).

## 14. Testing Conventions
- Testing framework: Jest with React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`).
- Test files located in `__tests__/` directories or alongside source files matching `*.test.ts`/`*.test.tsx`.
- Always write or update tests when adding features or fixing bugs.

## 15. Git and Change-Management Rules
- **Never** stage or commit changes unless explicitly instructed by the user.
- Always check `git status` and `git diff` before preparing commits.
- Propose clear, concise commit messages focused on "why" changes were made.

## 16. Rules for Inspecting Existing Code Before Modifying It
- Always inspect related existing code, utilities, models, and components using `grep_search` or `read_file` before writing new code.
- Reuse existing helper functions, components, and patterns rather than duplicating logic.

## 17. Rules Against Unnecessary Rewrites, Duplication, and Breaking Changes
- Prefer small, surgical changes over broad rewrites.
- Do not create duplicate implementations when an existing implementation can be reused.
- Do not delete existing functionality without explicit instruction.
- Do not modify unrelated files.

## 18. Rules for Secrets, Environment Variables, and Sensitive Data
- **Never** log, print, commit, or expose secret values (`MONGODB_URI`, JWT secrets, Cloudinary credentials, Turnstile keys, etc.).
- Protect `.env` files, `.git`, and local cookie/credential files (`cookies.txt`, `manager_cookies.txt`, `contributor_cookies.txt`).

## 19. Step-by-Step Feature Implementation Workflow
1. **Research & Inspect:** Explore existing codebase patterns, models, and utilities related to the feature.
2. **Plan:** Outline the architectural approach and testing strategy.
3. **Act:** Implement surgical, idiomatic code changes reusing existing abstractions.
4. **Validate:** Run the test suite, linting, and build checks.

## 20. Step-by-Step Bug Fixing Workflow
1. **Reproduce:** Empirically reproduce the issue (add a failing test case or reproduction script).
2. **Diagnose:** Research root cause through code inspection.
3. **Fix:** Apply a precise, surgical bug fix without modifying unrelated code.
4. **Verify:** Run tests and validation checks to confirm the fix.

## 21. Validation Workflow to Use After Changes
After making code changes, execute the following validation commands:
- `npm test` (Run Jest unit tests)
- `npm run lint` (Run ESLint)
- `npm run build` (Run Next.js build / TypeScript type checking)
- Inspect affected files to ensure complete correctness and compliance with workspace standards.

## 22. Important Known Technical Issues and Caution Areas
- **Dynamic Admin Path:** Admin routes are obfuscated via `ADMIN_PATH` and rewritten in `src/proxy.ts`. Ensure admin links and navigation respect this dynamic pathing.
- **Mongoose Field Selection:** Sensitive user fields use `select: false`. Explicitly select them when needed for authentication/security logic.
- **CSRF & Origin Verification:** All state-changing API requests (`POST`, `PUT`, `PATCH`, `DELETE`) undergo strict CSRF origin verification in `src/proxy.ts`.

## 23. OWNER WORKFLOW AND CODING PREFERENCES
1. **Always inspect existing code and related files** before modifying or creating anything in the repository.
2. **Prefer small, surgical changes** over broad rewrites or unnecessary refactorings.
3. **Reuse existing utilities, models, components, helpers, and patterns** rather than inventing new abstractions or duplicating code.
4. **Never expose, print, commit, or modify secret values** (`MONGODB_URI`, JWT secrets, Cloudinary credentials, Turnstile keys, etc.) or sensitive local files (`.env`, cookie files).
5. **Always validate changes thoroughly** using project validation commands (`npm test`, `npm run lint`, `npm run build`) and inspect affected files before declaring completion.
6. **Avoid modifying unrelated files** or breaking existing functionality without explicit instruction.

## 24. CHANGE SAFETY RULES
1. **Preserve Existing Architecture:** Preserve the existing architecture unless a requested task specifically requires changing it.
2. **Surgical Updates:** Always prefer small, surgical changes over broad, sweeping rewrites or opportunistic refactorings.
3. **Inspect Before Changing:** Inspect related existing code, utilities, models, and components before writing or modifying code.
4. **Code Reuse:** Reuse existing utilities, components, models, helpers, and patterns whenever appropriate; never create duplicate implementations when an existing solution is present.
5. **No Breaking Changes or Deletions:** Never delete existing functionality or break established interfaces without explicit instruction.
6. **No Unrelated Modifications:** Do not modify unrelated files or change code outside the immediate scope of the task.
7. **Protect Secrets and Sensitive Data:** Do not expose, print, log, commit, or modify secret values (`MONGODB_URI`, JWT secrets, Cloudinary credentials, Turnstile keys, etc.) or sensitive local files (`.env`, cookies).
8. **Explain Significant Changes:** Before making changes, explain what will be changed whenever the task is significant.
9. **Inspect and Validate After Changes:** After changes, inspect the affected files and run the project's validation workflow.
10. **Honest Verification:** Never claim that something works unless it has actually been verified.

## 25. TASK COMPLETION PROTOCOL
For every task, phase, audit, verification, implementation, research, debugging session, or other requested operation:

- Continue working until the requested task has actually been completed.
- Do not stop merely because the task is partially complete.
- Do not ask the owner whether they are ready to continue.
- Do not ask "Should I proceed?", "Are you ready?", or equivalent questions when the requested task is already clear.
- Complete all explicitly requested steps in the current prompt before stopping.
- Clearly distinguish between work-in-progress and completed work.
- When all requested work has genuinely finished, provide a concise completion summary.
- Then end the response with this exact completion marker on its own line:

=== TASK COMPLETE — WAITING FOR NEXT PROMPT ===

- The exact completion marker MUST NOT be displayed before all requested work is finished.
- If a task cannot be completed because of an actual blocker, do not falsely display the completion marker. Instead, clearly report the blocker and what remains incomplete.
- If a command is still running, validation is still pending, or required inspection is incomplete, the task is NOT complete and the completion marker must not yet be displayed.
- If a command times out or fails, report the actual result honestly rather than claiming successful completion.
- The completion marker means the current prompt has been fully processed and Gemini is now idle and awaiting the owner's next prompt.
- This protocol applies to all future phases and tasks unless the owner explicitly instructs otherwise.

