# Platform Permission Catalogue

Permission identifiers are stable API contracts. Add new identifiers here and in `src/platform/permissions/catalog.ts` before using them in a route or workflow.

## Conventions

- Format: `<domain>.<resource>.<action>` (two-part identifiers are allowed for platform-wide capabilities).
- Unknown permissions are denied.
- Wildcards are allowed only in assigned role rules, not as user-requested route permissions.
- Every grant has a scope: global, self, department, team, project or client.
- Explicit denies override all grants, including founder elevation.
- A role title never grants access by itself.

## Domains

- Platform: `platform.*`
- Identity: `identity.*`
- Governance: `governance.*`
- Clients: `clients.*`
- Projects: `projects.*`
- Finance: `finance.*`
- Workforce: `workforce.*`
- Workspace: `workspace.*`
- Support: `support.*`
- AI: `ai.*`
- Reports: `reports.*`
- Automation: `automation.*`

The TypeScript catalogue is the canonical machine-readable list. Changes to the catalogue should include evaluator tests and a review of API consumers.
