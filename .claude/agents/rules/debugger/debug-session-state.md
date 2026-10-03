# Debug Session State Management

Debug sessions survive context resets by maintaining state in the `.rihal/debug/` directory. This file describes the state schema and recovery protocol.

---

## Session State File

**Location:** `.rihal/debug/session.json`

**Purpose:** Persist debug progress across context resets.

**Schema:**

```json
{
  "bug_id": "bug-user-auth-fails",
  "symptom": "User cannot log in with correct credentials",
  "reported_at": "2025-04-14T10:30:00Z",
  "status": "IN_PROGRESS",
  "phase": "hypothesis-testing",
  
  "facts_established": [
    "Login API endpoint responds with 401 (unauthorized)",
    "Database query returns correct user record",
    "Password comparison fails even with correct password",
    "bcrypt version: 5.1.0"
  ],
  
  "hypotheses": [
    {
      "id": "h1",
      "claim": "Password hash is corrupted in database",
      "status": "DISPROVEN",
      "tested_at": "2025-04-14T10:35:00Z",
      "evidence": "Hashes were created 2 weeks ago, no reports of earlier failures. Spot-checked 3 users' hashes — all valid format."
    },
    {
      "id": "h2",
      "claim": "bcrypt.compare() call missing await",
      "status": "CONFIRMED",
      "tested_at": "2025-04-14T10:45:00Z",
      "evidence": "Found in src/auth.js line 42: const isValid = bcrypt.compare(...) without await. Comparison returns promise, not boolean."
    }
  ],
  
  "root_cause_found": true,
  "root_cause": "Synchronous comparison of bcrypt.compare() return value (promise) treats promise as truthy, bypassing actual password verification",
  
  "fix_applied": "Added 'await' keyword to bcrypt.compare() call",
  "fix_verified": true,
  "verification_steps": [
    "Login with correct password → succeeds",
    "Login with wrong password → fails",
    "Test suite passes: npm run test -- auth.test.js"
  ],
  
  "checkpoint_reached": "DEBUG_COMPLETE",
  "checkpoint_reason": "Root cause confirmed, fix verified, no regressions"
}
```

---

## Investigation Log

**Location:** `.rihal/debug/investigation.md`

**Purpose:** Human-readable narrative of debugging steps.

**Format:**

```markdown
# Bug: [Symptom]

**Reported:** [Date]
**Status:** [IN_PROGRESS | ROOT_CAUSE_FOUND | DEBUG_COMPLETE]

## Symptom
[What user observed]

## Reproduction Steps
1. [Step 1]
2. [Step 2]

## Evidence Gathered
- [Fact 1]
- [Fact 2]

## Hypotheses Tested

### Hypothesis 1: [Claim]
- **Status:** DISPROVEN
- **Why:** [Reasoning that ruled it out]
- **Tested:** 2025-04-14 10:35

### Hypothesis 2: [Claim]
- **Status:** CONFIRMED
- **Why:** [Evidence supporting it]
- **Tested:** 2025-04-14 10:45

## Root Cause
[Explanation of why the bug happens]

## Fix Applied
[Code change]

```javascript
[Before]
↓
[After]
```

## Verification
- [ ] Bug reproducer passes
- [ ] No regressions (test suite passes)
- [ ] Root cause understood and documented
```

---

## Checkpoint Return Format

When returning from a debug session with a checkpoint:

```markdown
## CHECKPOINT REACHED

**Type:** ROOT_CAUSE_FOUND | DEBUG_COMPLETE | VERIFICATION_NEEDED

**Bug:** [One-line symptom]

**Status:** [Summary of what's been determined]

### Current Investigation
[What has been tested, what has been ruled out]

### Root Cause (if found)
[Specific explanation of why bug happens]

### Fix (if applied)
[Code change made and verification result]

### Awaiting
[What user must do/confirm to proceed]
```

**Example:**

```markdown
## CHECKPOINT REACHED

**Type:** ROOT_CAUSE_FOUND

**Bug:** Login endpoint returns 401 even with correct credentials

**Status:** Root cause identified and fix applied. Awaiting user verification.

### Investigation Summary
- Tested API response: returns 401 as reported
- Tested database: user record exists with valid password hash
- Tested password comparison logic: bcrypt.compare() was missing await
- Result: promise treated as truthy, bypassing actual verification

### Root Cause
In `src/auth.js` line 42, the code calls `bcrypt.compare()` without `await`. The promise (always truthy) was being used as the comparison result instead of waiting for the actual boolean result.

```javascript
// Before (buggy)
const isValid = bcrypt.compare(password, hash);  // returns Promise, treated as true
if (isValid) { /* always true, auth bypassed */ }

// After (fixed)
const isValid = await bcrypt.compare(password, hash);  // returns boolean
if (isValid) { /* correct behavior */ }
```

### Verification
- ✅ Login with correct password → succeeds
- ✅ Login with wrong password → fails
- ✅ Test suite passes (npm run test -- auth.test.js)
- ✅ No other calls to bcrypt.compare() without await

### Awaiting
Please confirm:
1. The fix matches your understanding of the problem
2. You're ready to commit and merge
Or ask for further investigation if needed.
```

---

## Session Recovery Protocol

If a debug session crashes or context resets:

1. **Check `.rihal/debug/session.json`** — What phase were we in?
2. **Read investigation.md** — What's been tried and ruled out?
3. **Resume from last phase**:
   - If `phase: "evidence-gathering"` → Continue gathering facts
   - If `phase: "hypothesis-testing"` → Test remaining hypotheses
   - If `phase: "fix-verification"` → Verify the applied fix
4. **Don't re-test disproven hypotheses** — They're ruled out
5. **Update session state** — Record new progress

---

## State Cleanup

After debug session completes (checkpoint reached or bug closed):

**Keep `.rihal/debug/investigation.md`** — Archive for future reference

**Archive `session.json`** — Rename to `session-[bug-id]-[date].json`

**Example:**
```bash
# After debugging bug-user-auth-fails
mv .rihal/debug/session.json \
   .rihal/debug/archives/session-user-auth-fails-2025-04-14.json
```

---

## Multi-Debug Isolation

If debugging multiple bugs in parallel:

Create separate directories:

```
.rihal/debug/
  session.json          (current active debug)
  investigation.md      (current active debug)
  
  bug-1/
    session.json
    investigation.md
  
  bug-2/
    session.json
    investigation.md
```

This prevents one bug's state from overwriting another's.

---

## Schema Validation

Before resuming, verify session.json is valid:

```bash
# Check required fields
grep -E "^  \"(bug_id|status|phase)\"" .rihal/debug/session.json

# Validate JSON
jq empty .rihal/debug/session.json && echo "Valid" || echo "Invalid JSON"
```

If session.json is corrupted, create a new one from investigation.md.
