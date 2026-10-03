# Thinking Models for Debugging

Five systematic debugging models: 5 Whys, differential diagnosis, bisection, hypothesis-driven testing, and recent-changes priority.

---

## 1. Five Whys

**When to apply:** Symptom unclear, need root cause, not just surface fix

**Concrete steps:**
1. State the symptom: *"Test fails with 'undefined is not a function'"*
2. Ask why 1: *"Which function is undefined?"* → "fetchUser"
3. Ask why 2: *"Why is fetchUser undefined?"* → "Import missing"
4. Ask why 3: *"Why is import missing?"* → "File was deleted, import not updated"
5. Ask why 4: *"Why wasn't import updated?"* → "Refactoring script incomplete"
6. Ask why 5: *"Why was refactoring incomplete?"* → "Manual step skipped in checklist"

**Output:** Root cause (process, not code). Fix: update refactoring checklist.

---

## 2. Differential Diagnosis

**When to apply:** Multiple possible causes, uncertain which is real

**Concrete steps:**
1. List all plausible causes for the bug (e.g., API timeout)
   - Network outage
   - Rate limiting
   - Invalid credentials
   - Request malformed
   - Downstream service down
2. Design a test to eliminate each (in cheap-to-expensive order)
   - Cheap: Check error message (rate limit? network?)
   - Medium: Call API directly with curl/Postman
   - Expensive: Spin up test environment, mock service
3. Run tests in order, eliminate causes
4. Surviving cause is likely culprit

**Output:** Diagnosis with high confidence.

---

## 3. Bisection (Binary Search)

**When to apply:** Bug appeared recently, need to find which change broke it

**Concrete steps:**
1. Identify the "last known good" commit (tests passing)
2. Identify current commit (tests failing)
3. Bisect: check the commit halfway between
   - Does it fail? → Bug is in earlier half. Search lower half next.
   - Does it pass? → Bug is in later half. Search upper half next.
4. Repeat until you narrow to 1 commit
5. Inspect that commit's changes

**Output:** Exact commit that introduced bug. Then inspect diff.

**Example:**
```
Last good: abc123 (commit 100)
Current:   def456 (commit 200)
Check:     mid789 (commit 150) → FAILS
Check:     mid234 (commit 125) → PASSES
Check:     mid567 (commit 137) → FAILS
Check:     mid890 (commit 131) → PASSES
Repeat until → found commit 133 introduced bug
```

---

## 4. Hypothesis-Driven Testing

**When to apply:** Behavior unexpected, need to validate assumptions

**Concrete steps:**
1. Formulate hypothesis: *"Login fails because JWT expiration is 0"*
2. Design test that would **falsify** the hypothesis
   - Test: Log in, inspect JWT, check exp field
   - If exp field is nonzero → hypothesis false, look elsewhere
   - If exp field is zero → hypothesis confirmed, fix JWT generation
3. Run the test; interpret result
4. Refine hypothesis based on result; loop

**Output:** Validated or falsified hypothesis, narrowed search space.

---

## 5. Recent-Changes Priority

**When to apply:** Bug present but source unknown, no bisect history

**Concrete steps:**
1. Bugs cluster in recently-changed code (Pareto principle)
2. List commits from last N days (e.g., 7 days)
3. For each recent commit, list files changed
4. Prioritize: files most likely to impact bug symptom
5. Inspect those files first

**Example:**
```
Symptom: Cart disappears after login
Recent changes (last 5 commits):
- auth.js (login, JWT) ← likely culprit
- cart.js (add/remove items) ← possible
- api.js (endpoints) ← possible
- style.css (layout) ← unlikely
- config.yaml (unrelated) ← unlikely

Priority order: auth.js > cart.js > api.js
```

---

## Integration: Multi-Model Debugging

**When stuck, apply in order:**

1. **Recent-Changes Priority** → Identify suspect files
2. **Hypothesis-Driven Testing** → Test assumptions about those files
3. **Differential Diagnosis** → If test inconclusive, list causes and eliminate
4. **Bisection** → If cause still unclear, find commit that broke it
5. **Five Whys** → Once found, trace root cause to prevent recurrence

**Outcome:** Fast root-cause diagnosis, preventative fix.
