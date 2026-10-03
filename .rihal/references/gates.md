# Gates Reference

Defines 4 gate types used in rihal workflows to control execution flow, validate decisions, and escalate blockers.

## Gate Types

### 1. Pre-Flight (Validation Before Action)

**Purpose:** Block invalid operations before they start.

**Behavior:**
- Check preconditions (file exists, user authorized, config valid)
- Either block execution or warn with recovery suggestion
- Non-blocking warnings permit continuation; blocking gates halt

**Recovery:** Suggest specific fix and retry path

**Example:** Phase execution gate
```
Gate: Check phase.md exists and has required sections
Block: "Phase {N} has no SPRINT.md. Create with /rihal:help"
Warn: "Phase overdue by {days}. Review roadmap?"
```

---

### 2. Revision (Iteration Loop)

**Purpose:** Catch defects within a task, permit retries.

**Behavior:**
- Max retries: 3 (configurable per workflow)
- Detect stalls: if N consecutive attempts fail identically, escalate
- Log each retry attempt with timestamp and error

**Recovery:** After 3 failures, escalate to Escalation gate

**Example:** Code compilation gate
```
Revision Loop: Test build
Retry 1: "Build failed: missing import. Added import, retrying..."
Retry 2: "Build failed: type error. Fixed type, retrying..."
Retry 3: "Build succeeded."
On 4th failure: escalate to user
```

---

### 3. Escalation (Decision Needed)

**Purpose:** Pause execution and ask user for direction.

**Behavior:**
- Preserve current state (save SPRINT.md, commit progress)
- Pause execution with AskUserQuestion
- Wait for user decision (proceed, abort, or retry with modified approach)
- Log decision timestamp and rationale

**Recovery:** User confirms direction; resume or return to Revision

**Example:** Architecture decision gate
```
Gate: Design choice between Pattern A and Pattern B
State: Saved current work, phase paused
Ask: "Pattern A is faster but less flexible. Pattern B is extensible but slower.
       Which should we implement? (A/B/defer)"
```

---

### 4. Abort (Unrecoverable)

**Purpose:** Exit gracefully when task cannot proceed.

**Behavior:**
- Preserve all state (don't delete files, commit progress, log cause)
- Exit cleanly without recovery attempt
- Suggest manual recovery path

**Recovery:** Manual repair via `/rihal:health` or `/rihal:forensics`

**Example:** Corrupted state gate
```
Gate: Validate state.json integrity
Fail: "state.json corrupted (invalid JSON at line 42).
       Aborting to prevent further damage.
       Recovery: /rihal:health --repair"
```

---

## State Preservation Rules

**Revision gates:** Commit work-in-progress at each retry
```bash
git add -A
git commit -m "wip: revision loop attempt {N} of {max}"
```

**Escalation gates:** Tag the commit with the question
```bash
git add -A
git commit -m "session: escalation gate at {phase} — awaiting user input"
```

**Abort gates:** Preserve full state, no cleanup
```bash
git add -A
git commit -m "session: abort gate — state preserved for manual repair"
# Do NOT delete files, do NOT reset --hard
```

---

## Iteration Cap Rule

Revision gates must fail fast:
- **Cap:** 3 retries maximum per gate
- **Stall detection:** If retries 2 and 3 fail identically, escalate immediately
- **Rationale:** Prevent infinite loops; protect token budget

Example stall detection:
```
Retry 2 error: "Compilation failed: missing MockDB"
Retry 3 error: "Compilation failed: missing MockDB"
→ Detect stall (identical error) → Escalate to user
```
