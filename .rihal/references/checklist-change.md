# Checklist: Before Changing Existing Code

Use this checklist when **modifying an existing module, function, or component** — refactoring, bug fixing, or extending existing functionality.

This prevents breaking changes that sneak into production.

## Baseline Understanding

- [ ] **Read existing tests first** — What behavior is being tested?
  - Copy test names/assertions to your notes
  - If no tests exist, write tests for current behavior BEFORE changing anything
  - Why: Tests document the contract. Changing code without knowing the contract causes regressions
  
- [ ] **Read recent commits** — Why was this code written this way?
  - `git log -p --follow -- src/auth.ts` (last 5 commits)
  - Look for edge case fixes, performance optimizations, security patches
  - Why: Old commits often document why a seemingly-odd choice was made

- [ ] **Understand the data flow** — How does data move through this code?
  - Draw a simple diagram: inputs → processing → outputs
  - Track transformations: what format does data start in, what format does it end as?
  - Why: Breaking a transformation silently breaks downstream code

## Regression Risk Assessment

- [ ] **Identified what this code is used by** — What calls it?
  - `grep -r "functionName\|ClassName" --include="*.ts" --include="*.js" .`
  - Count: how many places depend on this?
  - Risk: 1 call site = low risk. 20+ call sites = high risk.
  
- [ ] **Named the breaking-change risk** — If this behavior changes, what breaks?
  - "This function is called by 5 API endpoints. If return type changes, all 5 break."
  - "This component is used in 3 pages. If props signature changes, all 3 break."
  - Why: Forces you to consider impact before changing

- [ ] **Confirmed backward compatibility** — Can old callers still work?
  - "Old API calls will still get valid response (new fields ignored)"
  - "Component props are additive (optional, don't break existing usage)"
  - "Database schema migration is non-breaking (old code ignores new column)"

## Rollback Planning

- [ ] **Defined rollback path** — How do we undo this if it breaks?
  - "Revert commit, redeploy previous version (5 min)"
  - "Feature flag to disable new code path (instant)"
  - "Database schema migration is reversible (downtime: 2 min)"
  - Why: If you can't explain rollback in <5 minutes, the change is too risky

- [ ] **Identified rollback entry point** — Where do we pull the lever?
  - "Kill switch in .env variable" → document the var name and values
  - "Feature flag in admin panel" → provide exact steps
  - "Git revert" → specify which commits to revert
  - Why: Under stress, ops person needs a clear lever to pull

## Testing Strategy

- [ ] **Minimum viable test suite specified** — What MUST pass?
  - Existing tests for modified code MUST still pass (regression tests)
  - New tests for new behavior (if adding features)
  - Integration tests if this touches API boundaries or data flow
  - Why: Prevents shipping tests that pass but don't catch regressions

- [ ] **Test edge cases first** — What breaks easily?
  - Null inputs, empty collections, boundary values
  - Concurrent calls, race conditions
  - Large inputs (performance)
  - Why: Edge cases are where regressions hide

- [ ] **Performance regression tested** — Is it slower?
  - If code touches hot path: benchmark before/after
  - If code touches database: check query count
  - If code touches network: check request count
  - Why: Slow deployments are silent killers

## Change Scope

- [ ] **Limited to the stated change** — Am I changing more than needed?
  - Good: Fix the bug, leave formatting alone
  - Bad: Fix the bug AND refactor 5 functions AND reorder imports
  - Why: Scope creep makes review harder and causes regressions in unexpected places

- [ ] **Commit atomicity** — Is this one logical change?
  - One bug fix = one commit
  - One feature = one commit (or a few if very large)
  - Don't mix refactoring with bug fixes
  - Why: Bisect and revert are easier with atomic commits

## Template Checklist

```markdown
## Change: [What you're changing]

**File(s):** [Paths affected]

### Baseline
- [x] Read existing tests: [test names that document current behavior]
- [x] Recent commits reviewed: [commits 1, 2, 3 and why they matter]
- [x] Data flow understood: [diagram or description]

### Regression Risk
- [x] Call sites identified: [5 API endpoints use this function]
- [x] Breaking risk: [If return type changes, all 5 callers break]
- [x] Backward compat: [New fields are optional; old code ignores them]

### Rollback Plan
- [x] Rollback: [Revert commit ABC123; redeploy]
- [x] Time to rollback: [5 minutes]
- [x] Kill switch: [Feature flag ENABLE_NEW_AUTH in .env]

### Testing
- [x] Regression tests: [Existing 12 tests for auth.ts still pass]
- [x] Edge cases: [Null user, expired token, rate-limited]
- [x] Performance: [Query count: before 3, after 3 (no regression)]

### Scope
- [x] Limited to stated change: [Only fixing the bug, not refactoring]
- [x] Atomic commit: [One logical change per commit]

**Ready to ship:** ✓ Yes
```

## Red Flags — STOP Before Committing

- ❌ Can't explain rollback path in 1 sentence
- ❌ More than 30% of test file modified (likely changing contract)
- ❌ >10 files changed for a single feature (too much scope)
- ❌ Breaking change has no migration plan documented
- ❌ No test coverage added for new behavior
- ❌ Performance regression >10% (benchmark before/after)
- ❌ "I'll fix this edge case later" (fix it now or document it as a stub)

If you hit a red flag, STOP. Either:
1. Narrow the scope (fix less)
2. Add a migration plan (if breaking)
3. Split into multiple commits (if too large)
4. Document edge cases (if intentional stubs)
