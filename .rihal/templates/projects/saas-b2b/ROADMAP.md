# {{project_name}} — Roadmap

**Milestone: M1 — Production launch** (v1.0)
Template: saas-b2b · Seeded {{date}}

---

## Phase 01 — Foundations

**Goal:** Repo, CI, DB, auth stack, and environments ready for feature work. No business logic.

**Delivers:**
- Dev + staging + prod environments
- Baseline auth (email/password + magic link) with password hashing best-practice
- Database schema for `users`, `organizations`, `memberships`
- CI pipeline running lint + test on every PR
- Error reporting (Sentry/Highlight) and logs shipping somewhere queryable

**Requirements:** REQ-AUTH, REQ-DB-BASE, REQ-CI

---

## Phase 02 — Multi-tenancy + RBAC

**Goal:** Every query is tenant-scoped; every endpoint enforces role. This is the phase where a leak would be catastrophic, so it gets its own phase.

**Delivers:**
- Tenant-scoping middleware (or row-level security)
- Role model: owner / admin / member (minimum)
- Invitation + membership flows
- Cross-tenant access tests that intentionally fail — proving isolation

**Requirements:** REQ-TENANCY, REQ-RBAC

**Depends on:** Phase 01

---

## Phase 03 — Billing + subscription lifecycle

**Goal:** Customers can pay, change plan, cancel. Trial → active → past-due → canceled transitions handled correctly.

**Delivers:**
- Stripe (or equivalent) integration with webhooks
- Plan model + seat counting
- Past-due and dunning flows
- Billing portal for customers to manage themselves

**Requirements:** REQ-BILLING, REQ-PLANS

**Depends on:** Phase 02

---

## Phase 04 — Admin console + audit log

**Goal:** Internal tooling for support + compliance-ready audit trail.

**Delivers:**
- Staff-only admin console for inspecting tenants, impersonating (with audit entry), and resetting things
- Immutable audit log table written for every mutating action
- Export endpoint for tenant admins to pull their own audit data

**Requirements:** REQ-ADMIN, REQ-AUDIT

---

## Phase 05 — Observability + incident response

**Goal:** You notice problems before customers do.

**Delivers:**
- Dashboards for the 3-5 metrics that actually matter
- Alerting (PagerDuty/on-call) for the handful of conditions that wake someone up
- Runbooks in `docs/runbooks/` for the top incident patterns
- SLO definition per critical path

**Requirements:** REQ-OBSERVABILITY

---

## Phase 06 — Launch readiness

**Goal:** First paying customer can sign up self-serve without a human escort.

**Delivers:**
- Public marketing site with pricing, demo request, signup
- Docs site for customers + API reference
- Support channel + response-time SLA
- Legal (ToS, privacy, DPA template)
- Status page

**Requirements:** REQ-LAUNCH

**Depends on:** Phase 05
