# Checkpoint Recovery Protocol

When resuming from a debug checkpoint (after a context reset), use this protocol to get back to productive debugging quickly without losing progress.

---

## Pre-Recovery Checklist

Before resuming, verify:

1. **Session state exists:** `.rihal/debug/session.json` present
2. **Investigation log exists:** `.rihal/debug/investigation.md` readable
3. **Session is valid:** Check for corrupt JSON, missing fields
4. **Current phase is clear:** Read `"phase"` field in session.json

If any are missing, create a minimal session from available evidence.

---

## Recovery Steps by Phase

### Phase: EVIDENCE_GATHERING

You were collecting facts about the bug.

**Recovery:**

1. **Read investigation.md** — What facts have been established?
2. **Review facts_established array** in session.json
3. **Pick the next fact to verify:**
   - Have you checked the exact error message?
   - Have you reproduced the bug consistently?
   - Have you traced the code path where it fails?
   - Have you checked database state, API responses, logs?
4. **Continue gathering** — Don't re-check facts already established
5. **Update session.json** with new facts as you discover them

**When to move to next phase:** After 3-5 independent facts support a clear direction.

---

### Phase: HYPOTHESIS_TESTING

You were testing hypotheses to identify root cause.

**Recovery:**

1. **Read hypotheses array** in session.json
2. **Identify untested hypotheses:**
   - status: "DISPROVEN" — ignore, already tested
   - status: "UNTESTED" — test these
   - status: "CONFIRMED" — might be the root cause
3. **Resume testing untested hypotheses:**
   - Pick the most likely next hypothesis
   - Follow its "How to test" field
   - Record result: CONFIRMED or DISPROVEN
4. **Update session.json** with test results
5. **If CONFIRMED hypothesis found** → move to ROOT_CAUSE phase

**When to move to next phase:** When one hypothesis is CONFIRMED and others are DISPROVEN.

---

### Phase: ROOT_CAUSE_ANALYSIS

You identified the root cause and are understanding it.

**Recovery:**

1. **Read root_cause field** in session.json
2. **Verify the explanation makes sense:**
   - Does it explain the symptom?
   - Are there edge cases it doesn't explain?
3. **If understanding is incomplete:**
   - Add follow-up questions to investigation.md
   - Dig deeper into the code
   - Update root_cause field with new understanding
4. **Update session.json:** Set `"root_cause_found": true`

**When to move to next phase:** When you can explain the bug and HOW to fix it.

---

### Phase: FIX_DEVELOPMENT

You were writing and testing a fix.

**Recovery:**

1. **Read fix_applied field** in session.json
2. **Verify the fix is actually applied:**
   - Open the file mentioned
   - Check if the change is there
   - If not, apply it now
3. **Run verification steps:**
   - Follow verification_steps array
   - Reproduce bug reproducer (should now pass)
   - Run test suite (should pass)
4. **If verification fails:**
   - Revert the fix
   - Move back to HYPOTHESIS_TESTING (fix was wrong)
   - Test different hypothesis
5. **If verification passes:**
   - Update session.json: `"fix_verified": true`
   - Move to CHECKPOINT phase

**When to move to next phase:** When fix is applied, tested, and verified.

---

### Phase: CHECKPOINT

You're ready to return to the user with findings.

**Recovery:**

1. **Read checkpoint_reached field** in session.json
2. **Identify checkpoint type:**
   - ROOT_CAUSE_FOUND: Root cause identified, no fix yet
   - DEBUG_COMPLETE: Root cause found, fix applied, verified
   - VERIFICATION_NEEDED: Fix applied, needs user confirmation

3. **Format the checkpoint message** using template below
4. **Return the checkpoint to user**

---

## Checkpoint Message Template

Use this template to format your return message:

```markdown
## CHECKPOINT REACHED

**Type:** [ROOT_CAUSE_FOUND | DEBUG_COMPLETE | VERIFICATION_NEEDED]

**Bug:** [One-line symptom from session.json]

### Investigation Timeline
- **Phase 1 (Evidence):** [What facts were established]
- **Phase 2 (Hypotheses):** [Which were tested, which confirmed]
- **Phase 3 (Root Cause):** [The identified cause]

### Root Cause Analysis

[Detailed explanation of why the bug happens]

### Fix (if available)

[Code change made]

```javascript
// Before
[buggy code]

// After
[fixed code]
```

### Verification Results

[What was tested and result]

- [ ] Reproducer passes
- [ ] Test suite passes
- [ ] No new regressions
- [ ] Root cause explained

### Awaiting

[What user should do next]
```

---

## Mid-Phase Actions

### If Facts Conflict

**Situation:** You established "fact A is true" but now found evidence that contradicts it.

**Action:**
1. Don't discard the original fact
2. Add the conflicting evidence as a new fact
3. Update investigation.md with resolution
4. Update session.json facts_established array

**Example:**
```
Fact 1: "API endpoint returns 200"
Fact 2: "But response body is empty"
Resolution: "API returns 200 with Content-Length: 0 due to missing response body"
```

### If Hypothesis Becomes Clearer

**Situation:** You're testing a hypothesis and realize it's too vague or needs refinement.

**Action:**
1. Split into more specific hypotheses
2. Add them to hypotheses array in session.json
3. Prioritize testing the most likely variant first
4. Record the refinement in investigation.md

**Example:**

Original: "Password validation fails"

Refined into:
- H1: "Password hash is corrupted"
- H2: "bcrypt.compare() is missing await"
- H3: "Password encoding mismatch (UTF-8 vs ASCII)"

### If New Code Change is Needed

**Situation:** During investigation, you identify a secondary bug.

**Action:**
1. Document it in a separate section: "Secondary Issues Found"
2. Don't fix it now (stay focused on primary bug)
3. Create a new debug session for it later
4. Add to `.rihal/debug/backlog.md` if it's not urgent

---

## Safety Checks Before Proceeding

Before resuming investigation, ask:

1. **Is the session state current?**
   - Does last update timestamp make sense?
   - Or has code been changed since last session?

2. **Is the bug still reproducible?**
   - Has the codebase changed?
   - Does the exact reproduction still work?
   - If not, update the steps

3. **Are all hypotheses still valid?**
   - Has code been changed that makes a hypothesis obsolete?
   - Update hypotheses array if needed

4. **Is the fix still appropriate?**
   - If fix was already applied, verify it's still there
   - Has code changed around the fix?
   - Do tests still pass?

If answers indicate significant changes, create a fresh debug session.

---

## Resumption Tips

- **Start with the last log line** in investigation.md — it tells you exactly where you left off
- **Reread the last 3 hypotheses** you tested — they anchor your thinking
- **Check for "TODO" comments** you left in code or logs
- **Verify timestamps** — Did investigation pause hours ago or days ago? Helps assess what might have changed
- **Don't re-read everything** — Jump to the section you were working on, then read backwards to context

---

## When to Create a Fresh Session

If any of these apply, start fresh instead of recovering:

- [ ] Session.json is missing or corrupted
- [ ] Bug symptoms have changed since original report
- [ ] Codebase has had major changes (new commits, branch switch)
- [ ] Investigation paused > 1 week and you're unsure if findings are still valid
- [ ] You're unable to reproduce the bug anymore

Fresh sessions let you validate assumptions rather than assume they're still true.
