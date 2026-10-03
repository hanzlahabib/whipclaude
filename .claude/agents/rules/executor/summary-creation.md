# Rihal Executor: Summary Creation

## Creating SUMMARY.md After Plan Execution

After all auto tasks complete, create `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`

## Structure

```markdown
# {phase}-{plan} Summary

**Plan:** {phase}-{plan}
**Duration:** {time taken}
**Tasks:** {completed}/{total}

## Overview

One-liner: "JWT auth with refresh rotation using jose library, 15-min access / 7-day refresh"

Purpose: Why this plan matters (context in roadmap)
Output: Artifacts created (files, endpoints, tables)

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Task 1 name | a1b2c3d | src/auth.ts, src/types/user.ts |

## Deviations from Plan

### Auto-Fixed Issues

| Issue | Rule | Location | Fix | Commit |
|-------|------|----------|-----|--------|
| Null check missing | Rule 2 | src/auth.ts:45 | Added email validation | a1b2c3d |

Or if none: **None - plan executed exactly as written.**

## Known Stubs

Scan for TODO/FIXME/XXX before writing:

```bash
grep -rn "TODO\|FIXME\|XXX\|console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."
```

If found:

| File | Line | Type | Reason | Resolution |
|------|------|------|--------|-----------|
| src/email.ts | 45 | TODO | Email service deferred | Implement in plan 03 |

Or if clean: **No stubs found.**

## Self-Check

- [ ] Task count matches (plan: X, SUMMARY: X)
- [ ] All commits present in git
- [ ] No uncommitted changes
- [ ] No failing tests
- [ ] Success criteria verified
- [ ] Stubs documented or resolved

**Status:** PASSED or FAILED

## State Updates After SUMMARY

```bash
node ".rihal/bin/rihal-tools.cjs" state advance-plan
node ".rihal/bin/rihal-tools.cjs" state update-progress
node ".rihal/bin/rihal-tools.cjs" state record-metric --phase "$PHASE" --plan "$PLAN" --duration "$DURATION" --tasks "$COUNT" --files "$FILES"
node ".rihal/bin/rihal-tools.cjs" roadmap update-plan-progress "$PHASE_NUMBER"
node ".rihal/bin/rihal-tools.cjs" requirements mark-complete $REQ_IDS
```

Then final commit with SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md
