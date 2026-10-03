# {{project_name}} — Requirements

Canonical REQ IDs for an API backend. Edit titles/acceptance, do not rename IDs once phases reference them.

---

## REQ-SCAFFOLD — Project scaffolding
Framework, DB, migrations, local dev loop, CI, linting — all wired and tested.

## REQ-CI — Continuous integration
Every PR runs lint + type-check + tests. Main branch protected.

## REQ-AUTH-API — API key authentication
Keys are prefixed-and-hashed in storage. Issuance, rotation, revocation all work. Revocation takes effect within one request.

## REQ-SCOPES — Scoped tokens
Keys declare scopes. Endpoints enforce required scope. Denial is auditable.

## REQ-RESOURCES — Core resources
The primary resources this API exists for are implemented end-to-end with CRUD (or equivalent) and tested.

## REQ-CONTRACT — API contract as source of truth
OpenAPI / GraphQL schema / .proto checked in. Contract tests fail when implementation drifts.

## REQ-RATE-LIMIT — Rate limiting
Per-key rate limits prevent runaway clients. 429 responses include retry-after and current-limit headers.

## REQ-QUOTAS — Tier-based quotas
Daily/monthly quotas enforceable per tier. Quota state visible to clients via a headers-or-endpoint mechanism.

## REQ-SDK — First-party SDK
At least one SDK exists, is published, and has a working quickstart example.

## REQ-DOCS — Public docs
Docs generated from the API contract + hand-written guides for the top use cases. Includes authentication, errors, rate limits, changelog.

## REQ-OBSERVABILITY-API — SLOs + monitoring
p50/p95/p99 + error rate tracked per endpoint and per consumer. Status page is public. Top-5 failure runbooks exist.
