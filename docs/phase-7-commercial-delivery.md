# Phase 7 — Services, Sales, Projects & Delivery

## Operational scope

Phase 7 adds a commercial delivery domain separate from the public portfolio CMS models. The public Service and Project records remain intact.

- **Service catalogue:** CommercialService records, package pricing, billing model, delivery days, revisions, package features, publication state, custom-request and consultation controls.
- **Sales:** SalesLead records and pipeline stages (new, qualified, discovery, proposal, negotiation, won, lost).
- **Commercial documents:** versioned proposals, quotations and contracts with references, scope, exclusions, line items, totals, validity and client acceptance.
- **Orders:** order records are created only after the client accepts the contract and quotation.
- **Delivery:** order-linked projects, reusable project templates, milestones, tasks, employee/team assignment and capacity-checked resource allocation.
- **Quality and client review:** per-deliverable QA checklists, client review and approval, change requests and decisions.
- **Progressive Delivery Engine:** a deliverable can be released only after that deliverable passes QA, the client approves it, and its milestone payment is verified (or the milestone is explicitly zero-value / payment-not-required).
- **Completion and aftercare:** project completion checks all tasks, milestones and deliverables; warranty and maintenance records attach to completed projects.
- **Client workspace:** clients can browse published services, submit custom requests, request consultations, accept contracts, pay orders or milestones, track delivery, download private deliverables, approve releases and submit change requests.
- **Audit:** commercial and delivery mutations are recorded in the shared platform audit log; client actions are also added to client activity history.

## Main routes

- Founder operations UI: /admin/commercial
- Public commercial catalogue: /services/catalogue
- Client commercial workspace: /client/services
- Founder API: /api/platform/commercial\n- Read-only financial ledger: /admin/commercial (Immutable ledger tab)
- Founder workflow actions: /api/platform/commercial-actions
- Client API: /api/client/commercial
- Secure deliverable upload: /api/platform/commercial/deliverables/upload
- Client deliverable download: /api/client/commercial/deliverables/:id/download
- Paystack webhook: /api/webhooks/paystack

## Live provider configuration

Set secrets in the Render service Environment page. Do not commit secrets to GitHub.

### Client verification email

- RESEND_API_KEY — Resend API key.
- EMAIL_FROM — sender address on a domain verified with Resend.

Client registration and resend-verification derive the base URL from the incoming request, so they do not require SITE_URL for this email flow. Registration checks provider configuration before creating the account; failed email delivery also rolls back the unverified identity and token to avoid orphaned accounts.

### Paystack payments

- PAYSTACK_SECRET_KEY — Paystack test or live secret key.
- SITE_URL — recommended canonical public site URL. Payment initialization falls back to the request origin if this is not set.

Configure the Paystack dashboard webhook to:

https://tgo-devstudio-prime.onrender.com/api/webhooks/paystack

The server verifies the webhook HMAC signature and independently verifies the transaction with Paystack before recording payment. The verified amount, currency and reference must match the internal payment transaction. Payment initialization is idempotent while a checkout remains pending. A provider callback alone never marks an order or milestone as paid.

The current adapter accepts NGN, GHS, ZAR, USD, KES, XOF and EGP. Confirm the selected Paystack account supports the currency and intended cross-border use before enabling live payments. Each verified payment is written in a MongoDB transaction with two immutable ledger entries: debit cash and credit client advances. Unique source keys prevent duplicate postings. The MongoDB deployment must support replica-set transactions (MongoDB Atlas does). Ledger records have no update/delete API; founder access is read-only.

### Private deliverable storage

- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Commercial deliverables upload as Cloudinary authenticated assets. The application stores the asset key and issues a five-minute signed download only after checking client/project ownership and deliverable review status. Public upload URLs are not stored or exposed.

## Release state rules

1. A deliverable must be uploaded and saved as a draft.
2. Founder/authorized delivery staff submit a QA checklist.
3. A passed QA review moves it to client review.
4. The owning client downloads and approves it.
5. The Progressive Delivery Engine checks the same deliverable's passed QA record, client approval timestamp, milestone approval state and verified payment state.
6. Only then can a founder/authorized delivery operator release it.
7. A milestone can be completed after release; a project can be completed only when every task is done, every milestone is completed and every deliverable is released.

A payment-required milestone remains blocked until Paystack has verified the transaction. The platform does not offer an admin "mark as paid" shortcut.

## Verification

Run the repository's configured test, lint, typecheck and production build commands before merging. Tests cover structured client registration validation and the Progressive Delivery Engine's release gates. Follow with authenticated end-to-end tests using provider test credentials before enabling live transactions.
