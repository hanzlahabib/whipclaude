# {{project_name}} — Roadmap

**Milestone: M1 — v1 API GA** (v1.0)
Template: api-backend · Seeded {{date}}

---

## Phase 01 — Scaffolding

**Goal:** Framework chosen, DB wired, migrations working, CI green. No business endpoints yet.

**Delivers:**
- Project skeleton in chosen framework
- Database + migration tool
- Local dev + CI both run the full test suite in <2 minutes
- Linting + formatting enforced

**Requirements:** REQ-SCAFFOLD, REQ-CI

---

## Phase 02 — Auth + API keys

**Goal:** Every endpoint requires a valid key. Keys have scopes. Key rotation + revocation works.

**Delivers:**
- API key issuance flow (token prefix + hashed secret storage)
- Scope model (read vs write, per-resource)
- Revocation endpoint that takes effect within one request cycle
- Rate limit on auth failures to prevent key enumeration

**Requirements:** REQ-AUTH-API, REQ-SCOPES

---

## Phase 03 — Core resources + contract

**Goal:** The primary resources this API exists to serve are implemented end-to-end with tests.

**Delivers:**
- CRUD (or equivalent) for the 3-5 primary resources
- OpenAPI (or GraphQL schema / .proto) checked into the repo as the source of truth
- Contract tests that fail if implementation drifts from the schema
- Consistent error schema across all endpoints

**Requirements:** REQ-RESOURCES, REQ-CONTRACT

**Depends on:** Phase 02

---

## Phase 04 — Rate limiting + quotas

**Goal:** A single misbehaving client cannot take down the service. Quotas are visible to clients.

**Delivers:**
- Per-key rate limit (token bucket or sliding window)
- Per-tier daily/monthly quota
- `429` responses include retry-after + current limit headers
- Dashboard for internal staff to see top talkers

**Requirements:** REQ-RATE-LIMIT, REQ-QUOTAS

---

## Phase 05 — SDK + public docs

**Goal:** A competent developer can integrate in under 30 minutes without help.

**Delivers:**
- At least one first-party SDK (language chosen to match top consumer)
- Docs site generated from OpenAPI/schema + hand-written guides
- Runnable examples (not just snippets — actual curl/SDK calls that work)
- Changelog

**Requirements:** REQ-SDK, REQ-DOCS

**Depends on:** Phase 03

---

## Phase 06 — Observability + SLOs

**Goal:** Published SLOs, measured SLIs, alerting that fires before customers notice.

**Delivers:**
- p50/p95/p99 latency tracked per endpoint
- Error rate per endpoint + per consumer
- Public status page
- Runbooks for the top 5 failure modes

**Requirements:** REQ-OBSERVABILITY-API
