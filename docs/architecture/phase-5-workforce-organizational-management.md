# Phase 5 — Workforce & Organizational Management

## Purpose and architecture

Phase 5 introduces a workforce domain inside the existing Next.js application. It deliberately extends the existing identity and administration architecture instead of creating a second authentication system or replacing the repository with a new monorepo.

The workforce domain owns employee records, organizational structure, schedules, attendance, HR requests and performance reviews. Existing shared domains remain authoritative for users, authentication sessions, role definitions, business permissions, notifications and platform audit events.

## Ownership and relationships

- **User** remains the canonical login identity. Workforce employees are staff users, not client users.
- **EmployeeProfile** is a one-to-one workforce record linked to a User. It holds employee code, employment status/type, department, team, position, manager, start/end dates, location, timezone and onboarding checklist.
- **Department** defines an organizational unit and optional parent/head.
- **Team** belongs to a department and may have a manager.
- **Position** belongs to a department and defines job title, level and permitted employment types.
- **BusinessRole / BusinessMembership** remain the shared authorization source. Membership links employee identities to business roles and department/team scopes. Workforce creation does not duplicate permission definitions.
- **EmployeeSchedule** stores effective-dated weekly schedules with timezone and breaks.
- **AttendanceRecord** stores one clock-in/clock-out pair per employee workday.
- **WorkforceRequest** stores leave and internal requests with review/decision metadata.
- **PerformanceReview** stores reviewer, period, competency ratings, feedback, goals, sharing and employee acknowledgement.
- **PlatformAuditEvent** records human actor, action, module, target, outcome and relevant metadata.

All workforce data is linked to user identity using ObjectId references and has supporting indexes for common lookups.

## Operational workflows

### Organization setup
1. Founder creates departments.
2. Founder creates teams and positions within active departments.
3. Founder assigns department heads, parent departments and team managers.
4. Founder can archive/reactivate structure records. Historical employee and request references are retained.

The hierarchy API rejects self-parenting and descendant cycles.

### Employee onboarding and access
1. A staff identity is created through the existing Users & Invites process.
2. Founder links that identity to a department, optional team, position, manager, employment type and work location.
3. Business roles are assigned through BusinessMembership, using the existing BusinessRole permission grants and scope model.
4. The employee receives an onboarding checklist and can sign in through the shared staff authentication/session system.
5. Employee profile changes and checklist completion are attributed to the employee identity.

This intentionally does not create a second password store or bypass the existing invite approval process.

### Employee workspace
- Employee sees their workforce identity and status.
- Employee can clock in once per local workday and clock out once.
- Attendance timestamps are server-generated; timezone is taken from the employee profile.
- Approved leave prevents attendance clocking for covered dates.
- Employee can submit leave and internal requests and inspect their status.
- Employee can view their assigned weekly schedule and shared performance reviews.
- Employee can acknowledge a review and add an acknowledgement comment.

### HR administration
- Founder can inspect employee records and update employment status.
- Suspension/termination revokes existing sessions by advancing the shared token version and blocks staff authentication.
- Founder can assign effective-dated schedules.
- Founder can review, approve, decline and close workforce requests.
- Founder can publish performance reviews. Employees can acknowledge shared reviews.
- Important changes are written to the platform audit event stream.

## Security boundaries

- Founder-only administrative APIs check the authenticated server session and founder role on the server.
- Employee APIs derive employee identity from the authenticated session; clients cannot submit another user's ID to clock attendance or create personal requests.
- Client accounts cannot access the workforce workspace.
- All workforce data endpoints are dynamic and return private, non-cacheable responses where appropriate.
- User-provided strings, IDs, status values, date ranges, timezone names, weekly schedule times and role IDs are validated server-side.
- Existing shared auth cookies, token versioning, 2FA and business role definitions are reused.

## Mobile experience

The founder workforce screen and employee workspace use responsive card layouts, stacked controls and touch-sized actions. The employee workspace has direct access to onboarding and performance review routes. Tables are avoided for the employee's core daily tasks.

## Configuration and controlled engineering

Departments, teams, positions, hierarchy assignments, schedules, role assignments, employee status, leave decisions and review content are data-driven. Authentication, role enforcement, audit behavior, model validation, indexes and session revocation remain code-governed.

## Deliberate integration boundaries

- New employee login accounts continue to be created through the existing Users & Invites workflow. The workforce module links the account rather than inventing a parallel invitation or credential system.
- Project assignments, task boards, payroll, compensation, benefits, time-off balances, statutory leave rules, payroll exports and AI-worker assignments are not represented as active functionality in this phase. They require their own governed modules and integrations.
- Attendance is an employee-entered time record, not biometric or GPS-verified proof of presence. It should not be treated as payroll-grade attendance until policies, corrections, approval and anti-fraud requirements are implemented.
- Performance reviews are qualitative/competency records, not automated employee scoring.

## Verification requirements before deployment

The phase is not ready for production release until CI passes and the full workflows are exercised against a safe deployment environment: department hierarchy, team/position setup, invite-to-employee linking, role scope assignment, employee login/2FA, onboarding checklist, attendance, approved leave boundaries, schedule changes, internal requests, review publication/acknowledgement, session revocation, audit events and mobile responsiveness.
