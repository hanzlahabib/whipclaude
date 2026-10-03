# Rihal Execution Protocol

Shared reference `@`-included by `execute.md` workflow and `rihal-executor` subagent.

**Also see:** @.rihal/references/karpathy-guidelines.md for behavioral principles that apply during execution.

## SPRINT.md schema

Every plan file must have this frontmatter and structure:

```markdown
---
id: "01.02"                 # full hierarchical ID
phase: "01"                 # phase ID (2-digit, zero-padded)
plan: "02"                  # plan ID within phase (2-digit, zero-padded)
milestone: "M1"             # optional, if assigned to milestone
type: auto | tdd
depends_on: []              # list of other plan IDs like ["01.01"]
wave: 1                     # auto-derived from depends_on
---

## Objective
One sentence describing what this plan achieves.

## Success criteria
- [ ] Specific, verifiable outcome

## Tasks

### Task 01.02.01 — name
type: auto
**Steps:**
1. ...
**Done when:** specific, observable condition
**Commit:** feat(scope): description

### Task 01.02.02 — name
type: checkpoint:human-verify
**Verify:** what the human must confirm before continuing
```

**Hierarchical ID format:**
- Milestone: `M{N}` (e.g., M1, M2)
- Phase: `{NN}` 2-digit, zero-padded (e.g., 01, 02, 72)
- Decimal phase (inserted): `{NN.M}` (e.g., 02.1, 72.3)
- Plan within phase: `{NN.MM}` (e.g., 01.02)
- Task within plan: `{NN.MM.TT}` (e.g., 01.02.03)

**Task types:**
- `auto` — executor runs without pausing
- `checkpoint:human-verify` — executor stops, prints return format, waits for human
- `checkpoint:decision` — executor stopped itself due to a deviation requiring architectural choice

## Deviation rules

When the executor encounters something unexpected:

1. **Bug in the task itself** → fix it, continue, note in SUMMARY
2. **Missing critical dependency** (file, package, env var) → add it, continue, note in SUMMARY
3. **Blocking issue not in the plan** → fix the blocker, continue, note in SUMMARY
4. **Architectural change required** (the plan's approach is fundamentally wrong) → STOP, return `checkpoint:decision` with the options

Rules 1-3 are auto. Rule 4 always pauses for human decision.

## Analysis paralysis guard

If the executor has made 5+ Read/Grep/Glob calls without a Write, Edit, or Bash that changes state — STOP. Write what you have so far, commit, and continue from the next task. Do not read more before acting.

## Checkpoint return format

When an executor hits a checkpoint, it returns exactly this block and stops:

```
---CHECKPOINT REACHED---
Plan: {plan file path}
Task: {task name}
Type: {human-verify | decision}

{For human-verify:}
Please verify: {what to check}
URL/path: {where to look}
Resume with: /rihal:execute {plan} --continue

{For decision:}
Problem: {what the plan assumed that isn't true}
Option A: {approach} — {trade-off}
Option B: {approach} — {trade-off}
Recommendation: {which one and why}
Resume with: /rihal:execute {plan} --continue --option=A
---
```

## Commit protocol

After every completed `auto` task:

1. `git status --short` — confirm only expected files changed
2. Stage specific files: `git add path/to/file` — never `git add -A`
3. Commit: `type(scope): description` (Conventional Commits)
4. Record the SHA in the SUMMARY

**Never add:** `Co-Authored-By: Claude`, `Generated with Claude Code`, or any AI attribution.
**Never use:** `--no-verify`.
**Never run:** `git push` — pushing requires explicit human authorization outside the executor's scope. Commits only.

## SUMMARY format

Written to `{plan-dir}/{plan-name}-SUMMARY.md` after completion:

```markdown
# Plan Summary — {plan name}

**Status:** complete | partial
**Duration:** {start} → {end}
**Commits:** {count}

## Tasks
- [x] Task 1 — {commit SHA}
- [x] Task 2 — {commit SHA}
- [ ] Task 3 — SKIPPED: {reason}

## Deviations
- {deviation description} → {rule applied} → {resolution}

## Known Stubs
(Optional section if stubs exist)
- [file:line] stub pattern → reason → resolved in [plan name]

## Self-Check
**Status:** PASSED | FAILED
- Task count: {count} completed vs {plan count} in plan
- Commits: {count} recorded
- Criteria: {verified count}/{total} verified
```

### Stub Detection

Before writing SUMMARY.md, executor scans all modified files for stub patterns:
- `TODO` / `FIXME` / `XXX` comments
- `throw new Error('not implemented')` or `throw new Error('TODO')`
- Placeholder values: `'YOUR_API_KEY'`, `'REPLACE_ME'`
- `console.log` in non-test files
- Empty function bodies: `return null` / `return undefined`

If stubs exist, add `## Known Stubs` section listing each with file:line and resolution plan. Do NOT mark complete if stubs block success criteria.

### Self-Check Loop

After writing SUMMARY.md:
1. **Count tasks:** SUMMARY task count must match plan task count
2. **Count commits:** Commits listed must exist in git log
3. **Verify criteria:** Each success criterion has evidence (diff line, test, or SUMMARY entry)
4. **Report result:** Append `## Self-Check: PASSED/FAILED` with deltas if failed

Stop before state updates if self-check fails.
