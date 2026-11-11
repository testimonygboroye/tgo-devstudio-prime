# Phase 12 — Business Operations, HR & Administration

## Implementation record

Phase 12 extends the existing Next.js/Mongoose application in place. It does not create a parallel identity provider, workforce database, or hosting target.

### Shared systems reused
- User, EmployeeProfile, Department and the existing staff authentication/session system remain canonical.
- Business operation owners, departments and employee/custodian links reference existing records.
- Founder authorization is enforced on every API request.
- Create, update, approval, rejection, start, completion and archive actions are recorded in PlatformAuditEvent with actor identity, target and relevant state.
- Existing shared media/file storage remains the file system of record. This module stores optional HTTPS document references, not uploaded file bytes or credentials.

### Operational register domains
The founder Operations workspace supports records for recruitment and hiring requests, contracts, training, procurement, vendors, assets and equipment, internal policies, legal/compliance obligations, controlled document references, business calendar items, internal approvals, operational workflows and payroll connector readiness.

Recruitment is integrated by retaining the existing Careers/Applications module as the source of applicant submissions rather than copying applicant identities into a second system.

### Approval and status control
Procurement and approval records start in pending_approval. The server accepts approve/reject actions only from that state. Lifecycle transitions are validated server-side. Records are archived rather than deleted, preserving history.

### Explicit integration boundary
Payroll is a connector readiness register only. It does not collect API keys, calculate salary, initiate transfers or claim a provider is connected. A real payroll connector requires a selected provider, credential vault, compensation data, statutory configuration, verified provider events, reconciliation and sandbox testing. Those actions remain disabled rather than simulated.

### Security and integrity
- Founder authorization is checked server-side for reads and writes.
- Employee, department and owner references are validated against active shared records.
- Monetary values are non-negative and currency is a three-letter code.
- Document references must use HTTPS.
- Records have indexes for category/status, due date, department and employee.
- There is no destructive delete endpoint.
- Edits and status decisions are audit logged.

### Verification
A successful Vercel build proves compilation, not every live business workflow. Production verification still requires real founder/staff accounts and safe test records. Payroll remains disconnected until a provider-specific integration is implemented and verified.
