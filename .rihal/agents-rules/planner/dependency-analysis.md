# Dependency Analysis for Task Planning

When building SPRINT.md frontmatter, you must determine dependencies between tasks. This determines **wave assignment** — which tasks can run in parallel and which must run sequentially.

---

## Core Rule: Detect `depends_on` Signals

A task **depends_on** another if:

1. **It reads files the other task creates** — "Task 2 needs the component Task 1 builds"
2. **It requires a prior checkpoint result** — "This task waits for human approval from the previous step"
3. **It refines/iterates on the other task's output** — "Task 2 improves the implementation from Task 1"
4. **It requires setup/initialization from another task** — "Must create database schema before inserting seed data"
5. **Its verification depends on the other task** — "Can't test integration until both sides are built"

---

## Wave Assignment Algorithm

Use this deterministic rule to calculate waves:

```
if task.depends_on is empty:
  task.wave = 1
else:
  task.wave = max(wave of all dependencies) + 1
```

**Example:**

```
Task 1.1 (no dependencies) → wave 1
Task 1.2 (no dependencies) → wave 1
Task 1.3 (depends on 1.1) → wave 2
Task 1.4 (depends on 1.1 and 1.3) → wave 3 (max of waves 1 and 2 = 2, plus 1 = 3)
```

---

## File Ownership Rule

Tasks can run in parallel **if and only if** their `files_modified` lists don't overlap.

**Parallel-Safe:**
```yaml
task-1:
  files_modified: [src/api/routes.ts, src/api/middleware.ts]
task-2:
  files_modified: [src/ui/Button.tsx, src/ui/Input.tsx]
→ No overlap, can be parallel
```

**Not Parallel-Safe:**
```yaml
task-1:
  files_modified: [src/index.ts, src/config.ts]
task-2:
  files_modified: [src/index.ts, src/logger.ts]
→ Both modify src/index.ts, so task-2 must depend_on task-1
```

---

## Common Dependency Patterns

### Pattern 1: Vertical Slices (PREFER)
One feature = one task, cutting through model/API/UI.

**Example:** "Add user authentication"
- Task 1.1: Implement Auth schema + login endpoint
- Task 1.2: Add login UI form
- Task 1.3: Wire UI to endpoint + test flow

**Dependency:** 1.2 → 1.1, 1.3 → 1.1+1.2 (API must exist before UI, form must exist before wiring)

**Wave:** 1.1 (wave 1), 1.2 (wave 1), 1.3 (wave 2)

### Pattern 2: Architectural Prerequisites
Some tasks must complete before others can start.

**Example:** "Add caching layer"
- Task 2.1: Design cache schema, pick library (Redis vs in-memory)
- Task 2.2: Implement cache abstraction
- Task 2.3: Wire cache into data layer

**Dependency:** 2.2 → 2.1, 2.3 → 2.2

**Wave:** 2.1 (wave 1), 2.2 (wave 2), 2.3 (wave 3)

### Pattern 3: Testing Verification
Tests can run in parallel with implementation, but NOT before it.

**Example:** "Build search feature"
- Task 3.1: Implement search algorithm
- Task 3.2: Write integration tests
- Task 3.3: Benchmark + optimize

**Dependency:** 3.2 → 3.1 (need implementation to test), 3.3 → 3.1+3.2

**Wave:** 3.1 (wave 1), 3.2 (wave 2), 3.3 (wave 3)

---

## Red Flags (Over-Splitting)

If you're creating too many tasks in sequence, you may be over-splitting. Check:

| Red Flag | Why It's Wrong | Fix |
|---|---|---|
| **All tasks are wave N+1** | Everything is sequential; no parallelism | Identify truly independent work (UI, API, tests) |
| **Tasks > 8 with no parallelism** | Likely over-scoped; should merge tasks | Combine tasks that can't run parallel anyway |
| **Vague `depends_on`** | "Depends on team context" is not a dependency | Name the **specific prior task** |

---

## Documenting Dependencies

In SPRINT.md frontmatter, list ONLY the tasks this plan **directly** depends on:

```yaml
depends_on: [01, 03]
```

NOT the transitive dependencies. Wave calculation handles the rest.

Example (WRONG):
```yaml
depends_on: [01, 02, 03]  # If 03 depends on 02, don't repeat
```

Example (RIGHT):
```yaml
depends_on: [03]  # Only direct dependencies
```

---

## Checkpoint Dependencies

A task that requires **human approval** creates a dependency for subsequent tasks.

**Pattern:**
```
Task 1.1: Implement feature (auto, no checkpoint)
Task 1.2: Verify on staging (checkpoint: human-verify)
Task 1.3: Deploy to production (depends_on: [1.2])
```

Task 1.3 must wait for 1.2's checkpoint because 1.2's verification result determines whether to proceed.

---

## Gotchas

### Gotcha 1: Implied Dependencies
**Problem:** You assume a dependency but don't state it.

**Example:** "Task 2 extends Task 1's component"
- If not in the task description, it's implied
- Put it in `depends_on` or it may run before 1 completes

**Fix:** Always be explicit. If Task 2 modifies a file Task 1 creates, add `depends_on: [1]`.

### Gotcha 2: Parallel Tasks with Shared Resources
**Problem:** Two tasks can't modify the same file simultaneously.

**Example:**
```yaml
task-1:
  files_modified: [src/index.ts]
task-2:
  files_modified: [src/index.ts]
```

**Fix:** Make task-2 depend_on task-1, or split the shared file logic.

### Gotcha 3: Build Dependencies vs. Runtime Dependencies
**Problem:** Confusing "needs at build time" with "needs at runtime".

**Example:** Component A uses library X at runtime. Task 1 creates A, Task 2 installs X. Does Task 1 depend_on Task 2?

**Answer:** Only if you need to test/verify A immediately. If Task 2 installs X later, no dependency needed.

---

## Verification Checklist

Before submitting SPRINT.md, verify:

- [ ] Each `depends_on` list is explicit and specific (not transitive)
- [ ] Wave assignment follows the algorithm (wave = max(dependencies) + 1)
- [ ] No `files_modified` overlap between parallel tasks
- [ ] Every checkpoint task has explicit `depends_on` from following tasks
- [ ] Total wave count is reasonable (< 5 waves for most plans)
