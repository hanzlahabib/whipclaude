# {{project_name}} — Requirements

Canonical REQ IDs for a B2B SaaS. Edit titles/acceptance, do not rename IDs once referenced by a phase.

---

## REQ-AUTH — User authentication
Users can sign up, log in, reset passwords, and verify email. Sessions survive browser restart. Credentials are hashed with a modern algorithm (argon2/bcrypt). Rate-limited.

## REQ-DB-BASE — Database baseline
Migrations are versioned and reversible. Backups run daily with verified restore drill. Connection pooling configured.

## REQ-CI — Continuous integration
Every PR runs lint, type-check, unit tests. Main branch is protected. A failing CI blocks merge.

## REQ-TENANCY — Tenant isolation
No query can return data from a tenant the caller does not belong to. Proven by adversarial cross-tenant tests that must fail when isolation breaks.

## REQ-RBAC — Role-based access control
Every mutating endpoint checks role. Roles are declarative (in code) and tested. Permission denials are logged.

## REQ-BILLING — Billing integration
Customers can buy, upgrade, downgrade, cancel. Past-due state is reached and recovered from without manual intervention. Webhook events are idempotent.

## REQ-PLANS — Plan + seat model
Seat count is enforced at the API level. Adding a seat above plan limit either blocks or auto-upgrades (pick one).

## REQ-ADMIN — Admin console
Staff can list tenants, inspect one, impersonate (with audit entry), and adjust billing state. Non-staff cannot reach the console.

## REQ-AUDIT — Audit log
Every mutating action is written to an immutable log with actor, tenant, action, before/after, timestamp. Accessible to tenant admins for their own tenant.

## REQ-OBSERVABILITY — Monitoring + alerting
The top 3-5 business metrics have dashboards. The top ~5 failure modes have alerts with on-call routing. p50/p95/p99 latency is tracked for API.

## REQ-LAUNCH — Public launch
Marketing site, docs, pricing, signup funnel, ToS/privacy, status page, support channel — all live at a public URL.
