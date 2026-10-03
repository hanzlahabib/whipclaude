# Checklist: Architecture Decision Checklist

Use this checklist when **making a significant technical decision** — choosing libraries, refactoring layers, picking a pattern, introducing a new service.

This prevents "let's just try it and see" decisions that cause rework.

## Current State Documented

- [ ] **Existing stack listed** — What tech do we currently use?
  - Backend framework, ORM, auth library, caching, queues, etc.
  - If you're not sure, ask CTO or read the CLAUDE.md and existing code
- [ ] **Why it exists** — What problem does the current stack solve?
  - "Using Next.js because: SSR benefits, developer experience, integrated routing"
  - Not: "That's what we've always used"
- [ ] **Constraints documented** — What can't we change?
  - Team expertise ("No Rust; we only know Python/JS")
  - Performance targets ("Must handle 10k req/sec")
  - Compliance ("Must be EU-hosted due to GDPR")
  - Cost ("Can't use Google Cloud; locked into AWS")

## Real Constraint Identified

- [ ] **NOT a preference** — This is a genuine blocker, not "I like X better"
  - Constraint: "Current auth library doesn't support OIDC; customers require it"
  - Preference: "I've heard Passport is trendy"
- [ ] **Evidence gathered** — Why can't we use the current approach?
  - Performance test showing current library fails at load
  - Customer requirement documented
  - Security audit finding a vulnerability
  - Team observation: "We've spent 20% of last 3 sprints fighting this library"

## Options Explored (2-3 Alternatives)

- [ ] **Option A** — Approach with pros/cons, fit, effort
  - Example: "Upgrade to jose v5 (our current library)"
    - Pros: No new dependency, team knows it
    - Cons: Missing feature we need (OIDC)
    - Effort: 2 days research + test
    - Fit: Doesn't solve core constraint
    
- [ ] **Option B** — Alternative approach
  - Example: "Switch to Passport.js + passport-oidc strategy"
    - Pros: Industry standard, OIDC support, large ecosystem
    - Cons: New dependency, learning curve, 2 new vulnerabilities in 2024 (but patched)
    - Effort: 1 week to migrate + test
    - Fit: Fully solves OIDC requirement
    
- [ ] **Option C** — Radical alternative or do-nothing
  - Example: "Partner with auth0 (outsource instead of building)"
    - Pros: Eliminates ongoing maintenance, compliance built-in
    - Cons: Vendor lock-in, $5k/month cost, new infrastructure
    - Effort: 3 days to integrate
    - Fit: Solves OIDC + reduces team burden

## Load-Bearing Assumptions Listed

- [ ] **What must be true for this decision to work?**
  - "Option B assumes Passport.js ecosystem doesn't have breaking changes in next 2 years"
  - "Assumes team has 1 week to dedicate to migration"
  - "Assumes 100k user base doesn't create edge cases we haven't tested"
- [ ] **How will we know if assumptions break?**
  - "Monitor Passport.js changelog; if 3+ critical vulnerabilities found in 6 months, reconsider"
  - "If migration takes >8 days, pivot to Option A and accept OIDC limitation"

## Kill-Switch Defined

- [ ] **When would we rollback?**
  - "If migration breaks production auth for >10 minutes"
  - "If new library causes >20% performance regression"
  - "If team spends >3 days on unexpected bugs"
- [ ] **Rollback plan documented** — How do we undo this?
  - "Keep old library in git history; we can revert in 1 hour"
  - "Proxy both auth systems for 1 week during migration"

## ADR Written

- [ ] **ADR file created at `.planning/adrs/YYYYMMDD-{slug}.md`**

Format:
```markdown
# ADR-001: Switch to Passport.js for OIDC Support

## Status
Accepted (date: 2026-04-12)

## Context
Current auth library (jose) doesn't support OIDC. 3 customers requested OIDC support in last 2 months. Estimated revenue impact: $50k ARR.

## Decision
Adopt Passport.js + passport-oidc for authentication.

## Consequences
- Positive: OIDC support, industry standard, 10k GitHub stars
- Negative: New dependency, migration effort (1 week), team learning curve
- Rollback: Keep old code in git, revert if migration takes >8 days

## Kill Criterion
Stop migration if:
- Performance drops >20%
- Production outage >10 minutes
- Bugs found in >3 new tests

## Reviewed By
CTO, Product Owner, QA Lead
```

## Template Checklist

```markdown
## Decision: [Feature/Library/Pattern]

**Current Stack:** [What we use now and why]

**Constraint:** [Why we can't keep using it]

**Options:**
- [ ] A: [Option with fit/effort/pros/cons]
- [ ] B: [Option with fit/effort/pros/cons]
- [ ] C: [Option with fit/effort/pros/cons]

**Assumptions:**
- [ ] If [X], then this works
- [ ] We can verify by [measurement]

**Kill Switch:** Stop if [condition]

**Rollback:** [How to undo in <1 hour]

**ADR:** `.planning/adrs/YYYYMMDD-slug.md`

**Status:** ✓ Decided (Passport.js)
```

## When NOT to Use This Checklist

- Small tactical decisions: "Should we use const or let?" → Use linter
- Reversible decisions: "What CSS utility library?" → Try it, swap if needed
- Greenfield projects: Follow checklist but options can be lighter

## When to ALWAYS Use This Checklist

- New library adoption
- Framework upgrade/replacement
- Major refactoring (splitting monolith, new service)
- Switching cloud providers or databases
- New architectural pattern (events, CQRS, microservices)
