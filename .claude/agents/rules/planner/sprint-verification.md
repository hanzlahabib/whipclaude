# Plan Verification Checklist

Before outputting a SPRINT.md file, run this self-check to catch common planning errors. This is the planner's **"did I build this right?"** validation.

---

## Pre-Output Verification

### Frontmatter Completeness

- [ ] `phase:` — Filled with actual phase name (not "XX-name")
- [ ] `plan:` — Filled with plan number (NN)
- [ ] `type:` — Is either "execute" or "tdd" (not both, not neither)
- [ ] `wave:` — Set correctly (calculated from max depends_on + 1)
- [ ] `depends_on:` — Lists only directly-dependent plan IDs, or empty if none
- [ ] `files_modified:` — Lists all files any task will touch
- [ ] `autonomous:` — Is `true` if no checkpoints, `false` if has checkpoints
- [ ] `requirements:` — NOT EMPTY (must list REQ-IDs from ROADMAP)
- [ ] `must_haves:` — Has 2+ truths, 2+ artifacts, 2+ key_links

### Task Structure

- [ ] Each task has `<action>` section (not just description)
- [ ] Each `<action>` includes "what to avoid & WHY"
- [ ] Each task has `<verify>` with automated command (< 60 sec)
- [ ] Each task has `<done>` with measurable acceptance criteria
- [ ] No task is < 15 min or > 60 min (combine or split if needed)
- [ ] Task IDs follow hierarchical format: `### Task {plan-id}.{NN}`

### Dependency Validation

- [ ] Wave calculation is correct (`max(dep_waves) + 1`)
- [ ] No file ownership overlap between parallel tasks
- [ ] Every checkpoint task has explicit `depends_on` from followers
- [ ] No circular dependencies (Task A depends on B, B depends on A)

### Content Quality

- [ ] Locked decisions (D-01, D-02, etc.) appear in at least one task
- [ ] No vague task descriptions ("Add authentication" → specific endpoint name + method)
- [ ] No references to files that don't exist
- [ ] Every task references concrete, existing file paths
- [ ] Context bloat < 50% (if context section > 300 lines, trim it)

### Objective & Output

- [ ] `<objective>` clearly states what the plan accomplishes
- [ ] `<objective>` includes "Purpose:" explaining why
- [ ] `<objective>` includes "Output:" listing artifacts created
- [ ] `<output>` section specifies exact SUMMARY.md filename and location

---

## Common Errors to Catch

### Error 1: Empty Requirements

**Symptom:**
```yaml
requirements: []
```

**Why It's Wrong:** Every plan must address ≥1 requirement from ROADMAP. Empty requirements = you didn't tie work to actual goals.

**Fix:** Read ROADMAP, identify which REQ-IDs this plan fulfills, list them.

### Error 2: Vague Task Descriptions

**Symptom:**
```
### Task 01.1 — Add authentication

Implement user authentication.
```

**Why It's Wrong:** "Add authentication" could mean OAuth, JWT, session-based, etc. Executor doesn't know what to build.

**Fix:**
```
### Task 01.1 — Implement JWT-based login endpoint

Create POST /api/auth/login that accepts email+password, validates against db,
returns 15-min access token + 7-day refresh token (stored as HttpOnly cookie).
```

### Error 3: Missing Verify Command

**Symptom:**
```
<verify>
Run manual tests to check if login works
</verify>
```

**Why It's Wrong:** "Manual tests" is not automatable and exceeds Nyquist Rule (60 sec max).

**Fix:**
```
<verify>
npm run test -- --testPathPattern="auth.test.js"
# Must pass all login endpoint tests in < 30 sec
</verify>
```

### Error 4: Parallel Tasks with Overlapping Files

**Symptom:**
```yaml
plan: 01

task-1:
  files_modified: [src/index.ts, src/config.ts]

task-2:
  files_modified: [src/index.ts, src/api.ts]

wave: 1
```

**Why It's Wrong:** Both tasks modify `src/index.ts`. If they run in parallel, one will overwrite the other's changes.

**Fix:** Add `depends_on: [01.1]` to Task 1.2, increasing its wave to 2.

### Error 5: Circular Dependencies

**Symptom:**
```
Task 1.1 depends_on: [1.3]
Task 1.3 depends_on: [1.1]
```

**Why It's Wrong:** Neither can start if both are waiting on the other.

**Fix:** Identify the true dependency direction. Usually one is misidentified.

### Error 6: Context Bloat

**Symptom:**
```
<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-research/SUMMARY.md
@.planning/phases/01-research/01-research-01-SUMMARY.md
@.planning/phases/02-design/SUMMARY.md
@.planning/phases/02-design/02-design-01-SUMMARY.md
... (20 more lines)
</context>
```

**Why It's Wrong:** Context > 50% = cognitive overload. Executor spends time reading, not planning.

**Fix:** Include only **genuinely needed** references. Trim to 2-3 SUMMARY files from prior phases.

---

## Self-Check Questions

Before finalizing, ask yourself:

1. **Could a different agent execute this?** If you replaced yourself with another LLM, would they understand exactly what to build?
2. **Are all decisions locked?** Or are there ambiguities the executor must resolve?
3. **Is the scope right for a single plan?** Or does this feel like 2-3 plans forced into one?
4. **Did I reference decisions from CONTEXT.md?** Or am I ignoring user constraints?
5. **Can I explain this plan to a junior dev in 2 minutes?** If not, it's too complex.

---

## Fast Verification Script

Use this to spot-check SPRINT.md files locally:

```bash
# Check for empty fields
grep -E "^(requirements|files_modified):\s*\[\s*\]" SPRINT.md && echo "ERROR: Empty array found"

# Check for vague action descriptions
grep -E "^\s+<action>\s*$" SPRINT.md | head -1 && echo "WARNING: Action section may be empty"

# Count verify commands
grep -c "<verify>" SPRINT.md  # Should equal task count

# Check wave calculation
grep "wave:" SPRINT.md
```

---

## When to Reject & Replan

If you catch **any** of these, reject the SPRINT.md and replan:

- [ ] Empty `requirements` field
- [ ] Circular dependencies
- [ ] Task with no `<verify>` command
- [ ] Task < 15 min or > 60 min
- [ ] File ownership overlap in same wave
- [ ] Context > 1000 lines
- [ ] Wave count > 5 (likely over-split)

Otherwise, output the SPRINT.md with confidence.
