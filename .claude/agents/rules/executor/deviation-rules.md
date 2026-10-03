# Rihal Executor: Deviation Rules

## The Four Deviation Rules

When implementation diverges from plan, follow this priority:

### RULE 1: Auto-fix bugs
**Trigger:** Code doesn't work as intended

Examples:
- Logic errors (wrong condition, bad algorithm)
- Null/undefined checks missing
- Validation skipped
- Security issues (SQL injection, XSS exposure)

**Action:** Fix immediately. Commit with `fix()` scope. No checkpoint needed.

**Example:** Plan says "validate email with regex" but implementation skips validation → fix the validation logic and commit.

---

### RULE 2: Auto-add critical functionality
**Trigger:** Missing error handling, validation, security, or reliability

Examples:
- API endpoint missing try/catch → add it
- Input validation missing → add validators
- Auth checks missing → add authentication guards
- Rate limiting missing → add rate limiter
- Database indexes missing → add indexes
- Unhandled promise rejections → add error handlers

**Action:** Add the missing critical piece. Commit with `feat()` scope if new, `fix()` if completing incomplete code.

**Example:** Plan implements payment endpoint but forgets error handling → add comprehensive error handling, commit `fix(payment): add error handling`.

---

### RULE 3: Auto-fix blocking issues
**Trigger:** Something prevents task from completing

Examples:
- Missing dependency (not in package.json)
- Broken import (file path wrong)
- Missing environment variable (required but not set)
- Database connection error (can't reach DB)
- Build configuration error (TypeScript won't compile)

**Action:** Fix the blocker. This is a prerequisite, not a deviation.

**Example:** Plan imports from `lib/utils` but file doesn't exist → create the file or fix the import path.

---

### RULE 4: Ask about architectural changes
**Trigger:** Changes that affect future plans or system design

Examples requiring human decision:
- New database table or schema change
- Major schema restructuring (many fields affected)
- New external service (Stripe, SendGrid, etc.)
- Library switch (React Router → TanStack Router)
- Authentication approach change (JWT → OAuth, etc.)
- Breaking API changes (endpoint restructuring)
- Data model redesign

**Action:** STOP execution. Return checkpoint with `type="decision"`. Explain the architectural choice and ask for user approval.

**Example:** Plan assumes User has email field, but field doesn't exist. User needs to decide: add field to schema, or change plan approach.

---

## Priority and Scoping

**Priority:** Rule 4 → STOP. Rules 1-3 → Fix. Unsure → Apply Rule 4 (ask, don't assume).

**Scope:** Only auto-fix issues DIRECTLY caused by this task's changes.
- If task A creates a bug in task A's code → auto-fix
- If task A exposes a pre-existing bug in unrelated code → log to `deferred-items.md`

**Retry Limit:** After 3 attempts per task (3 bug fixes, 3 missing features, 3 blockers), STOP execution. Document in SUMMARY.md and return checkpoint.

---

## Decision Flowchart

```
Issue detected during task execution
│
├─ Is it a logic bug in this task's code?
│  └─ YES → Rule 1: Auto-fix bug, continue
│
├─ Is it missing error/validation/security in this task?
│  └─ YES → Rule 2: Auto-add critical feature, continue
│
├─ Is it blocking this task from completing?
│  └─ YES → Rule 3: Auto-fix blocker, continue
│
└─ Does it require architectural decision?
   └─ YES → Rule 4: STOP, checkpoint, ask user
```

---

## Examples by Rule

### Rule 1 Example: Logic Bug
```javascript
// Plan says: Create endpoint that validates even request IDs
// Implementation:
app.get('/item/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id % 2 !== 0) {  // BUG: checks ODD, not EVEN
    return res.status(400).send('ID must be even');
  }
  res.json({ id });
});

// Deviation fix:
if (id % 2 === 0) {  // FIXED: now checks EVEN
```

### Rule 2 Example: Missing Validation
```javascript
// Plan says: Create POST endpoint for user creation
// Implementation (missing validation):
app.post('/users', (req, res) => {
  db.createUser(req.body);  // No validation!
  res.json({ ok: true });
});

// Deviation fix:
app.post('/users', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  db.createUser(req.body);
  res.json({ ok: true });
});
```

### Rule 3 Example: Broken Import
```javascript
// Plan references src/lib/utils.ts
// File doesn't exist → Auto-fix
// Solution: Create the file with required exports

// src/lib/utils.ts (created to unblock)
export function formatDate(d) {
  return d.toLocaleDateString();
}
```

### Rule 4 Example: Architectural Decision
```
Plan assumes: "User model has 'role' field"
Implementation: User model doesn't have role field
Question: Should we add 'role' to User, or use a separate Roles table?

Action: STOP execution
Checkpoint: "User model needs role field. Add to User, or use separate table?"
Wait: User decision
Resume: Implement based on user's chosen approach
```

---

## Special Cases

### Cascade of Bugs
If fixing one bug reveals another:
1. Fix the first bug, commit
2. Test fix (does primary issue resolve?)
3. If secondary issue appears, evaluate: Rule 1-3 → fix, Rule 4 → checkpoint
4. Continue normally

### Ambiguous Issues
If unsure which rule applies:
- Err toward Rule 4 (asking)
- Asking for confirmation costs 5 seconds
- Fixing the wrong thing can waste hours

### Cross-Task Bugs
If task A's code breaks task B's code during execution:
1. Identify root cause in task A
2. Apply appropriate rule (usually Rule 1 or 2)
3. Fix and re-test both tasks
4. Continue execution
