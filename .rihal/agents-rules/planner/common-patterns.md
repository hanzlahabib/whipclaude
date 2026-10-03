# Common Planning Patterns

Recurring patterns emerge in well-written plans. Use these as templates to speed up your planning and ensure consistency.

---

## Pattern 1: Vertical Slice (Feature Implementation)

**When to use:** Implementing a user-facing feature that touches model, API, and UI.

**Structure:**
```
Plan X.1 (Wave 1): Model + Schema
  - Create database schema
  - Add validation logic
  - Write unit tests

Plan X.2 (Wave 1): API Endpoint
  - Create REST endpoint (POST/GET/PUT/DELETE)
  - Add error handling
  - Verify with curl/Postman

Plan X.3 (Wave 2): UI Form/Component
  - Build React component
  - Wire to API endpoint
  - Integration test: form → API → database

Plan X.4 (Wave 3): End-to-End Verification
  - Test full user flow (UI → API → DB → UI)
  - Checkpoint: Visual/functional review
```

**Dependencies:** 1.3 → {1.1, 1.2}, 1.4 → 1.3

**Wave:** 1.1=1, 1.2=1, 1.3=2, 1.4=3

**Key:** Parallelize independent work (model and API can happen together), serialize when one blocks another (UI needs working API).

---

## Pattern 2: Research + Implementation

**When to use:** Work requiring learning before building (new library, unfamiliar pattern, architecture choice).

**Structure:**
```
Plan Y.1 (Wave 1): Research/Spike
  - Evaluate 2-3 options
  - Build proof-of-concept
  - Document findings + recommendation
  - Checkpoint: Approval on chosen approach

Plan Y.2 (Wave 2): Implementation
  - Build full feature using chosen approach
  - Integrate with codebase
  - Tests + documentation

Plan Y.3 (Wave 3): Optimization + Hardening
  - Performance tuning based on findings
  - Edge case handling
  - Final verification
```

**Dependencies:** 2 → 1, 3 → 2

**Wave:** 1=1, 2=2, 3=3

**Key:** Always wait for research approval before building. Don't implement multiple approaches in parallel.

---

## Pattern 3: Refactoring + Testing

**When to use:** Large refactors where you need to maintain test coverage throughout.

**Structure:**
```
Plan Z.1 (Wave 1): Extract Abstractions
  - Create new abstraction layer
  - Write unit tests for new layer
  - Don't change existing code yet

Plan Z.2 (Wave 1): Parallel Migration Tasks
  - Migrate Component A to use new abstraction
  - Migrate Component B to use new abstraction
  - (A and B can run parallel if they don't share files)

Plan Z.3 (Wave 2): Cleanup
  - Remove old abstraction/code
  - Update integration tests
  - Verify no regressions
```

**Dependencies:** 2 → 1, 3 → 2

**Wave:** 1=1, 2a=1, 2b=1, 3=2

**Key:** Test at every step. Parallelize migrations when they don't overlap. Clean up old code last.

---

## Pattern 4: Bug Fix + Root Cause Prevention

**When to use:** Fixing bugs that expose systemic issues.

**Structure:**
```
Plan A.1 (Wave 1): Root Cause Investigation
  - Debug the symptom
  - Identify root cause
  - Checkpoint: Confirm understanding

Plan A.2 (Wave 2): Fix + Add Safeguards
  - Apply minimal fix to symptom
  - Add tests to prevent regression
  - Add validation/guard code to prevent root cause

Plan A.3 (Wave 3): Broader Audit
  - Search codebase for similar patterns
  - Apply same fix in 1-2 other places
  - Verify with tests
```

**Dependencies:** 2 → 1, 3 → 2

**Wave:** 1=1, 2=2, 3=3

**Key:** Start with minimal fix. Then prevent recurrence. Then look for similar bugs elsewhere.

---

## Pattern 5: Performance Optimization

**When to use:** Addressing bottlenecks (slow queries, rendering, builds, etc.).

**Structure:**
```
Plan B.1 (Wave 1): Measure Baseline
  - Set up profiling/monitoring
  - Establish baseline metrics
  - Document bottleneck details

Plan B.2 (Wave 2): Implement Optimization
  - Try optimization approach A
  - Measure improvement
  - Decide: keep, iterate, or discard

Plan B.3 (Wave 3): Validate + Deploy
  - Performance testing in staging
  - Compare before/after metrics
  - Checkpoint: Performance improvement approved
```

**Dependencies:** 2 → 1, 3 → 2

**Wave:** 1=1, 2=2, 3=3

**Key:** Never optimize without baselines. Measure before/after. Some "optimizations" slow things down.

---

## Pattern 6: Configuration + Rollout

**When to use:** Changes that need careful rollout (feature flags, env configs, rollback plans).

**Structure:**
```
Plan C.1 (Wave 1): Feature Flag Infrastructure
  - Create feature flag or environment variable
  - Add conditional logic to feature
  - Set default to OFF (safe default)

Plan C.2 (Wave 2): Testing with Flag OFF
  - Unit tests with flag disabled
  - Integration tests with flag disabled
  - Verify old behavior unchanged

Plan C.3 (Wave 2): Testing with Flag ON
  - Unit tests with flag enabled
  - Integration tests with flag enabled
  - Verify new behavior works

Plan C.4 (Wave 3): Gradual Rollout
  - Enable for 10% of users
  - Monitor metrics
  - Checkpoint: Should we increase rollout?
  - If yes, increase to 50% → 100%
  - If no, disable and investigate
```

**Dependencies:** 2 → 1, 3 → 1, 4 → {2, 3}

**Wave:** 1=1, 2=2, 3=2, 4=3

**Key:** Test both states (on/off). Roll out gradually. Have a disable strategy.

---

## Pattern 7: API Versioning

**When to use:** Making breaking changes to APIs (endpoints, schemas, etc.).

**Structure:**
```
Plan D.1 (Wave 1): Design New Version
  - Document new API spec
  - Design migration path from v1 to v2
  - Plan deprecation timeline

Plan D.2 (Wave 2): Implement v2 Endpoint (Parallel with D.3)
  - Build new v2 endpoint (e.g., /api/v2/users)
  - Tests for v2
  - Keep v1 endpoint working

Plan D.3 (Wave 2): Implement Adapter (Parallel with D.2)
  - Build adapter that translates v2 requests → internal v2 model
  - Unit tests for adapter

Plan D.4 (Wave 3): Migrate Clients
  - Update internal clients to use v2
  - Checkpoint: All internal clients migrated?
  - Start deprecating v1

Plan D.5 (Wave 4): Cleanup
  - Remove v1 endpoint
  - Remove adapter
  - Final tests
```

**Dependencies:** 2 → 1, 3 → 1, 4 → {2, 3}, 5 → 4

**Wave:** 1=1, 2=2, 3=2, 4=3, 5=4

**Key:** Build new version alongside old. Migrate clients gradually. Remove old version last.

---

## Pattern 8: Database Schema Migration

**When to use:** Changing database structure with live data.

**Structure:**
```
Plan E.1 (Wave 1): Add New Column/Table (Backward Compatible)
  - Create new column (nullable) or table
  - Deploy to production (zero downtime)
  - Application ignores new field initially

Plan E.2 (Wave 2): Backfill Data
  - Write migration script to populate new column/table
  - Run on production database
  - Verify data integrity

Plan E.3 (Wave 3): Update Application Code
  - Update code to read/write new column/table
  - Keep reading old column for safety (dual write)
  - Deploy and monitor

Plan E.4 (Wave 4): Remove Old Column (Cleanup)
  - Once new column is working, remove old column
  - Run cleanup migration
  - Deploy final version
```

**Dependencies:** 2 → 1, 3 → 2, 4 → 3

**Wave:** 1=1, 2=2, 3=3, 4=4

**Key:** Never lock the database. Deploy schema changes first (backward compatible), then application changes, then cleanup.

---

## Pattern 9: Documentation + Code

**When to use:** Feature where users need docs to understand/use it.

**Structure:**
```
Plan F.1 (Wave 1): Implement Feature
  - Build the feature
  - Write unit tests
  - Code review + merge

Plan F.2 (Wave 2): Write Documentation
  - API documentation (if applicable)
  - User guide
  - Examples
  - Checkpoint: Docs reviewed by user/PO

Plan F.3 (Wave 3): User Testing
  - Give docs + feature to actual user
  - Observe if they can use it without help
  - Update docs based on feedback
```

**Dependencies:** 2 → 1, 3 → 2

**Wave:** 1=1, 2=2, 3=3

**Key:** Write docs AFTER implementation (you know what you built). Get real user feedback.

---

## Quick Pattern Selector

| Situation | Pattern | Waves |
|---|---|---|
| New user-facing feature | Vertical Slice | 3-4 |
| Need to learn before building | Research + Implementation | 3 |
| Large refactor | Refactoring + Testing | 2-3 |
| Fixing bugs | Bug Fix + Prevention | 3 |
| Slow system | Optimization | 3 |
| Safe rollout needed | Configuration + Rollout | 3-4 |
| Breaking API change | API Versioning | 4 |
| Database change | Schema Migration | 4 |
| Feature + docs | Documentation + Code | 3 |

---

## Antipattern: Everything in One Task

**Problem:**
```
Plan X.1: Implement user authentication
  - Create schema
  - Build API endpoint
  - Build UI form
  - Test everything
  - Write docs
  - Deploy to production
```

**Why it's wrong:**
- Task is 3+ days (should be < 60 min)
- Can't parallelize any work
- One mistake blocks everything
- Hard to verify/test incrementally

**Fix:** Split into Vertical Slice pattern (4-5 tasks, waves 1-3, parallelizable).

---

## Antipattern: Excessive Parallelization

**Problem:**
```
Plan X.1: Create schema
Plan X.2: Build endpoint (depends on 1.1)
Plan X.3: Build form (depends on 1.2)
Plan X.4: Write tests (depends on 1.3)
... (10 more sequential tasks)
wave: 1
```

**Why it's wrong:**
- Wave = 1 but tasks are sequential → misleading
- Waves should increase as dependencies deepen
- If everything depends on the previous task, only 1 task can run at a time

**Fix:** Calculate waves correctly. If wave=1, tasks should truly be independent.

---

## When Pattern Doesn't Fit

If your work doesn't match any pattern:

1. Break it down into steps
2. Identify which steps can run in parallel
3. Create tasks accordingly
4. Document the rationale in the plan

Novel patterns are fine — just ensure they're still decomposed correctly.
