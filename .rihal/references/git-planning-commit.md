# Git Planning Commit Reference

Defines commit prefixes for planning artifacts, separate from code commits.

---

## Overview

Planning commits are **metadata about work**, not code changes. They use special prefixes to distinguish from feature/fix commits.

---

## Commit Prefixes

### 1. `plan:` — Planning Artifacts

**Purpose:** Capture or update SPRINT.md, roadmap files, phase structure

**Format:**
```
plan: <action> <artifact> for <scope>
```

**Examples:**
```
plan: add execute-phase 02 for Rihal authentication module
plan: update roadmap with Q3 milestones
plan: split phase 3 into 3a (API) and 3b (database)
plan: revise Phase 1 scope — reduce by 2 tasks
```

**When to use:**
- Create new SPRINT.md after phase design
- Update SPRINT.md during refinement (before execution)
- Record major scope decisions
- Capture planning worksheets or pre-mortems

---

### 2. `wip:` — Work In Progress

**Purpose:** Commit progress during phase execution, before completion

**Format:**
```
wip: <description> (<progress>)
```

**Examples:**
```
wip: implement auth endpoints (2 of 3 routes)
wip: add unit tests for cart service (50% coverage)
wip: refactor database layer (schema + models, queries next)
wip: revision loop attempt 2 of 3 for build failure
```

**When to use:**
- Save work checkpoint mid-phase
- Document partial completion
- Record state before escalation
- Mark iteration/retry attempts in gates

**Note:** `wip:` commits are NOT final; phase completion creates code commits.

---

### 3. `session:` — Session Markers

**Purpose:** Record session start/pause/end, escalation gates, state decisions

**Format:**
```
session: <event> at <phase> — <detail>
```

**Examples:**
```
session: pause work at phase 2 task 4 of 7
session: resume work from phase 2
session: escalation gate at phase 3 — awaiting user input on architecture
session: abort gate — state preserved for manual repair
session: context critical (92% usage) — pausing to avoid token exhaustion
```

**When to use:**
- Start/pause/resume session
- Hit escalation/abort gates
- Context budget exceeded
- Decision point needing human input

---

### 4. `roadmap:` — Long-Term Planning

**Purpose:** Capture roadmap decisions, milestone plans, future phases

**Format:**
```
roadmap: <action> for <timescale>
```

**Examples:**
```
roadmap: define Q2 2026 milestones for Rihal dashboard
roadmap: plan Phase 6–8 for mobile app redesign
roadmap: identify technical debt and refactoring priorities
roadmap: schedule team capacity planning for H2 2026
```

**When to use:**
- Create or update roadmap files
- Plan future milestones
- Document strategic decisions
- Record capacity constraints

---

## Separation from Code Commits

**Code commits** follow Conventional Commits:
```
feat(auth): add JWT token refresh endpoint
fix(cart): resolve race condition on checkout
refactor(database): normalize user schema
```

**Planning commits** use special prefixes:
```
plan: add execute-phase 02 SPRINT.md
wip: implementation attempt 1 of 2
session: pause work at task 4
roadmap: plan Q3 milestones
```

**In git log, they're clearly distinct:**
```
abc123 feat(auth): add JWT refresh          ← code
def456 wip: implement refresh logic (75%)   ← session artifact
ghi789 plan: update Phase 2 scope           ← planning artifact
jkl012 session: pause work at task 5 of 8   ← session marker
mno345 fix(auth): close XSS in token        ← code
```

---

## Hook Integration

Add to `.git/hooks/post-commit`:

```bash
#!/bin/bash
# Validate planning commit prefix matches changed files

msg=$(git log -1 --format=%B)
files=$(git diff-tree --no-commit-id --name-only -r HEAD)

if [[ "$msg" =~ ^plan: ]]; then
  # Expect *.md files (SPRINT.md, roadmap, etc.)
  if [[ ! "$files" =~ \.md$ ]]; then
    echo "Warning: 'plan:' commit but no .md files changed"
  fi
fi

if [[ "$msg" =~ ^wip: ]]; then
  # Expect source code, tests, or config
  if [[ ! "$files" =~ \.(js|ts|py|json|yaml|md)$ ]]; then
    echo "Warning: 'wip:' commit but no source files changed"
  fi
fi

if [[ "$msg" =~ ^session: ]] || [[ "$msg" =~ ^roadmap: ]]; then
  # These typically commit SPRINT.md or metadata
  true  # No validation needed
fi
```

---

## Best Practices

1. **One prefix per commit** — Don't mix `plan:` and `feat:` in same commit
2. **Descriptive detail** — "update SPRINT.md" is vague; "add execute-phase 02 for auth module" is clear
3. **Session markers** — Always mark session start/pause to enable resume
4. **Escalation tracking** — Use `session: escalation gate` to mark decision points
5. **Preserve state** — Never delete planning commits; history aids context recovery
