# Phase 3 — Business Ecosystem Administration

## Objective
Establish the central administrative shell and the first shared business-organization management capability without replacing the existing CMS administration.

## Implemented
- Business Ecosystem Directory is registered in the typed central module registry.
- Founder-only administration page at the configured admin base path plus `/businesses`.
- Organization records support internal, client, partner and vendor types.
- Organization lifecycle supports active and suspended states.
- Unique normalized slugs and indexes protect directory integrity.
- Founder-only GET, POST and PATCH API operations with input validation and no-store list responses.
- Responsive directory UI includes live database metrics, search, organization creation, contact details and suspend/reactivate actions.
- Creation and lifecycle changes are written to the shared platform audit collection.
- Founder navigation uses distinct icons for Founder Control Centre and Business Ecosystem.
- Founder-only Business Roles screen provides searchable business-role listing, create/edit flows and deletion safeguards.
- The role editor is driven by the central permission catalogue and supports global, self, department and team scope selection.
- Founder-only roles API validates permission identifiers against the canonical catalogue, protects system roles and prevents deletion while a role is assigned to memberships.
- Role creation, edits and deletion are recorded in the platform audit trail.

## Shared-system integration
- Existing authenticated User identity is retained.
- Organization creation does not silently create user memberships or portal access.
- Audit records identify the human actor and the affected organization.
- Module availability is sourced from the platform registry, not hard-coded as operational status in the dashboard.

## Explicit scope boundaries
- The organization directory is the first installed business module, not the complete ERP administration shell.
- Business membership assignment/invitation UI, department/team configuration, global platform settings, workflow registration, dashboard widget customization and module activation controls remain separate administrative capabilities to be implemented before calling the full Phase 3 specification complete.
- The existing CMS Roles remain separate from BusinessRole; they must not be conflated.

## Verification gates
- CI must pass Jest, scoped ESLint and production build.
- Verify founder-only access, non-founder denial, duplicate slug handling, invalid payload rejection and audit writes.
- Verify responsive behavior and no regressions in existing CMS routes.
