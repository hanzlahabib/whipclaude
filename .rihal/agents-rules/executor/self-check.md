# Rihal Executor: Self-Check Verification

## Pre-SUMMARY Self-Check

Before finalizing SUMMARY.md, verify plan execution was complete and correct.

---

## Verification Checklist

### Task Completion
- [ ] All `type="auto"` tasks executed
- [ ] No `type="checkpoint:*"` tasks remain (or documented in prompt)
- [ ] Task count in SUMMARY matches plan's `<tasks>` count
- [ ] Each completed task has git commit hash

### Git Commits
- [ ] One commit per task (or multiple for TDD)
- [ ] Commit messages follow Conventional Commits format
- [ ] No commits contain `git add .` or `git add -A`
- [ ] Each commit references specific task
- [ ] Final commit includes SUMMARY.md

### Deviations Documented
- [ ] All Rule 1 fixes (bugs) listed in deviations
- [ ] All Rule 2 additions (critical features) listed
- [ ] All Rule 3 fixes (blockers) listed
- [ ] No unlisted auto-fixes in commit messages
- [ ] Deviations list is complete or empty

### Code Quality
- [ ] No TODO/FIXME/XXX remaining (or documented as stubs)
- [ ] No console.log() in non-test code
- [ ] No hardcoded test values
- [ ] All imports resolve (no broken paths)
- [ ] All tests passing (if tests were modified)

### Success Criteria
- [ ] Original plan `<success_criteria>` met
- [ ] All `<verify>` checks pass
- [ ] All `<done>` acceptance criteria satisfied

---

## Verification Commands

Run these before finalizing:

### 1. Verify All Tasks Completed
```bash
# Count tasks in plan
PLAN_TASKS=$(grep -c "^<task" .planning/phases/XX-name/PLAN.md)
echo "Plan declares: $PLAN_TASKS tasks"

# Count commits in SUMMARY
SUMMARY_TASKS=$(grep -c "^| [0-9]" .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md)
echo "SUMMARY lists: $SUMMARY_TASKS tasks"

# Should match
if [ "$PLAN_TASKS" = "$SUMMARY_TASKS" ]; then
  echo "✓ Task counts match"
else
  echo "✗ Task count mismatch!"
fi
```

### 2. Verify Git Status
```bash
# Should be clean (no uncommitted changes)
git status
# Output should be: "On branch ... nothing to commit"

# If dirty, list changes:
git status --short
```

### 3. Verify Commits Exist
```bash
# List commits from this plan
git log --oneline | head -20

# Count commits (should match task count)
COMMIT_COUNT=$(git log --oneline | wc -l)
echo "Commits in current branch: $COMMIT_COUNT"
```

### 4. Verify No Stubs
```bash
# Search for stubs
grep -rn "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"

# Search for console.log
grep -rn "console\." src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "\.spec\." | head -10

# If any found, decide: document in SUMMARY or implement
```

### 5. Run Plan's Verify Commands
```bash
# From plan's <verify> section, run specified commands
# Example:
npm test -- --filter=auth
npm run build
curl -X POST http://localhost:3000/api/auth/login
```

### 6. Verify Success Criteria
From plan `<success_criteria>`, manually verify:
```
Example success criteria:
- "All tasks executed or paused at checkpoint" → ✓ (all auto tasks done)
- "Each task committed individually" → ✓ (git log confirms)
- "Deviations documented" → ✓ (SUMMARY deviations section populated)
- "Auth gates handled" → ✓ (no 401 errors in final test)
```

---

## Self-Check Failure Scenarios

### Scenario 1: Missing Tasks
**Problem:** SUMMARY shows 2 tasks but plan has 3.

**Debug:**
1. Re-read plan `<tasks>` section
2. Check git log: which task is missing commits?
3. Execute missing task
4. Update SUMMARY
5. Create final commit with updated SUMMARY

### Scenario 2: Unverified Tests
**Problem:** Tests were modified but you didn't run them.

**Fix:**
```bash
npm test -- --filter=task_name
# Verify all pass

# If failing:
# - Fix code
# - Re-run test
# - Commit
# - Update SUMMARY
```

### Scenario 3: Uncommitted Changes
**Problem:** `git status` shows modified files.

**Fix:**
```bash
# Option 1: These belong to this plan
git add src/file.ts
git commit -m "fix(scope): fix issue found during verification"

# Option 2: These are unrelated changes
# Stash them and commit later
git stash
# Complete plan execution and SUMMARY
# Later: git stash pop
```

### Scenario 4: Leftover Stubs
**Problem:** Search finds `// TODO: add validation` in your code.

**Fix:**
- If critical: Implement it, commit, re-run tests
- If non-critical: Document in SUMMARY.md Known Stubs section

### Scenario 5: Success Criteria Not Met
**Problem:** Plan says "endpoint returns 200" but it returns 500.

**Fix:**
1. Debug the issue
2. Apply appropriate Deviation Rule (likely Rule 1 or 2)
3. Fix the code
4. Re-run success criteria verification
5. Create fix commit
6. Update SUMMARY deviations section

---

## Red Flags (Stop and Review)

**STOP before finalizing SUMMARY if:**

- [ ] Tests are failing
- [ ] `git status` shows uncommitted changes
- [ ] Success criteria verification fails
- [ ] More stubs exist than documented
- [ ] Commit count doesn't match task count
- [ ] Task names in SUMMARY don't match plan
- [ ] Deviations list is incomplete
- [ ] You're unsure whether code works

**If any flag raised:**
1. Don't create SUMMARY yet
2. Go back and fix the issue
3. Re-run verification
4. Only after ALL checks pass: create SUMMARY

---

## SUMMARY Self-Check Block

In the SUMMARY.md, before submitting, include:

```markdown
## Self-Check

**Status:** [PASSED | FAILED]

Verification performed:
- [ ] Task count matches (plan: X, SUMMARY: X)
- [ ] All commits present in git log
- [ ] No uncommitted changes
- [ ] No failing tests
- [ ] Success criteria verified
- [ ] Stubs documented or resolved
- [ ] Deviations documented

**Issues encountered and resolved:**
[List any red flags caught and how you fixed them]

**Ready for state update:** [YES | NO]
```

If any checkbox is unchecked, status is FAILED. Fix issues before moving forward.

---

## Post-SUMMARY Actions

After SUMMARY.md is finalized and verified:

1. Create final commit
2. Update STATE.md
3. Record metrics
4. Update ROADMAP
5. Mark requirements complete

Only proceed to next plan after SUMMARY is verified and all state updates complete.
