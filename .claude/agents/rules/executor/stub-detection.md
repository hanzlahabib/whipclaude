# Rihal Executor: Stub Detection

## What Are Stubs?

Stubs are placeholders, incomplete code, or temporary implementations that remain in the codebase.

Examples:
- `TODO` comments
- `FIXME` markers
- `XXX` comments
- `console.log()` in non-test files
- Empty function bodies
- Hardcoded test values left in production
- Comments like "implement later"

---

## Stub Detection Strategy

### Automated Search

Before creating SUMMARY.md, scan for stubs:

```bash
# Find TODO/FIXME/XXX
grep -rn "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules

# Find console.log in non-test files
grep -rn "console\." src/ --include="*.ts" --include="*.tsx" --include="*.js" | grep -v "\.test\." | grep -v "\.spec\."

# Find empty functions
grep -rn "{ *}" src/ --include="*.ts" --include="*.tsx"

# Find placeholder values
grep -rn "TODO\|FIXME\|XXX\|placeholder\|stub\|mock\|temp" src/ --include="*.ts" --include="*.tsx"
```

### Manual Code Review

While executing task, watch for:

```typescript
// BAD: Comment indicating incomplete work
export function fetchUser(id: string) {
  // TODO: Add error handling
  return api.get(`/users/${id}`);
}

// BAD: Empty body waiting for implementation
export function validatePayment(payment: any) {
  // XXX implement validation
}

// BAD: Console statement left behind
function processOrder(order: Order) {
  console.log('DEBUG: order =', order);  // forgot to remove
  return calculateTotal(order);
}

// BAD: Hardcoded test values
export function getAdminUser() {
  return {
    id: '123',  // hardcoded for testing
    email: 'admin@test.com',  // test email
    role: 'admin'
  };
}

// BAD: Mock implementation left in
export function sendEmail(to: string, body: string) {
  console.log('Email sent (mock)', to, body);  // forgot to implement real email
  return Promise.resolve();
}
```

---

## When Stubs Are Acceptable

Stubs are OK ONLY if:

1. **Documented in SUMMARY.md** — List all stubs with resolution plan
2. **Tagged with issue/plan reference** — Example: `// TODO: Implement in plan 03-email`
3. **Not blocking functionality** — Feature works with stub in place
4. **Has clear next step** — `// XXX: Add real Stripe payment (stub returns mock)`

Example of acceptable stub:

```typescript
// Acceptable: Tagged with future work
async function sendConfirmationEmail(email: string) {
  // TODO: Implement in plan 03-email-service
  // For now, mock response so registration flow works
  console.log('[STUB] Email sent to:', email);
  return { success: true, messageId: 'mock-123' };
}
```

In SUMMARY.md:
```markdown
### Known Stubs

| File | Line | Type | Reason | Resolution |
|------|------|------|--------|-----------|
| src/email.ts | 45 | Mock function | Email service not yet integrated | Implement real SendGrid integration in plan 03 |
```

---

## Unacceptable Stubs

DO NOT leave these in SUMMARY:

1. **Broken functionality** — Feature doesn't work, marked as TODO
2. **Untagged stubs** — No reference to what needs implementing
3. **Multiple stubs blocking one feature** — Sign of incomplete plan
4. **Dead code** — Functions that do nothing
5. **Placeholder values in constants** — `API_KEY = "TODO_SET_THIS"`

---

## Stub Handling Workflow

During task execution:

### Encounter a Stub Situation
```
Situation: Need to send email, but email service not ready
Decision tree:
  ├─ Is email required for THIS task to pass? 
  │  └─ NO → Create stub, tag with future plan number
  │  └─ YES → This should have been in plan discovery, raise checkpoint
  └─ Can you mock it temporarily?
     └─ YES → Implement mock, tag for real implementation later
     └─ NO → STOP, return checkpoint (architectural issue)
```

### Create Stub with Proper Tagging
```typescript
/**
 * STUB: Email sending
 * 
 * Implemented as mock for plan 01-authentication.
 * Real implementation requires: SendGrid API key, email templates, rate limiting.
 * 
 * Tracked in: .planning/DEFERRED-ITEMS.md
 * Resolution plan: plan 03-email-service (when email infrastructure ready)
 */
export async function sendConfirmationEmail(email: string): Promise<EmailResult> {
  // Mock implementation - returns success without sending
  console.log('[STUB sendConfirmationEmail]', email);
  
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
}
```

### Log Stub in Deferred Items
Create `.planning/DEFERRED-ITEMS.md` (if not exists):
```markdown
# Deferred Implementation Items

## Email Service (plan 03-email-service)
- **File:** src/email.ts
- **Function:** sendConfirmationEmail()
- **Current:** Mock returns success, doesn't send
- **To Do:** Implement with SendGrid, handle bounces, add retries
- **Estimate:** 3 tasks
```

---

## Before Finalizing SUMMARY

Scan for stubs one final time:

```bash
# Comprehensive stub search
for pattern in "TODO" "FIXME" "XXX" "stub" "mock" "placeholder"; do
  echo "=== Searching for: $pattern ==="
  grep -rn "$pattern" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -20
done
```

For each match found:
1. Is it in code I wrote? (If no, skip)
2. Is it acceptable per criteria above? (If no, implement or return checkpoint)
3. If acceptable, ensure it's in SUMMARY.md stubs list

---

## SUMMARY.md Stub Section

If stubs present:

```markdown
## Known Stubs

| File | Line | Type | Reason | Resolution Plan |
|------|------|------|--------|-----------------|
| src/email.ts | 45 | Mock function | Email service integration deferred | Implement with SendGrid in plan 03-email |
| src/payments.ts | 120 | TODO comment | Rate limiting not critical for MVP | Add in plan 04-security |

**Note:** These stubs do not block functionality. All critical paths work. Stub functions return valid mock responses.
```

If NO stubs:

```markdown
## Known Stubs

**No stubs found.** Plan executed with complete implementations.
```

---

## Stub vs Incomplete Task

| Situation | Classification | Action |
|-----------|---|---------|
| Function body is `{ console.log('stub'); return null; }` | Stub | Tag and document |
| Function throws `NotImplementedError` | Incomplete | STOP execution, return checkpoint |
| Function has TODO comment but works | Stub | Tag and document |
| Tests marked with `.skip()` | Incomplete | Implement test or remove |
| Feature works but has hardcoded test values | Stub | Document in SUMMARY |

---

## Common Stub Patterns to Catch

```typescript
// Pattern 1: Empty or minimal implementation
function validate(data: unknown): boolean {
  // TODO: actually validate
  return true;
}

// Pattern 2: Console debugging left behind
function process(item: Item) {
  console.log('DEBUG:', item);  // left from debugging
  return item.value * 2;
}

// Pattern 3: Placeholder values
const API_KEY = 'set_this_later';
const DATABASE_URL = 'TODO_configure';

// Pattern 4: Mock still in code
function fetchUser(id: string) {
  // Mock for testing
  if (id === 'test-123') return { id, name: 'Test User' };
  
  // Real implementation missing
  throw new Error('Not implemented');
}

// Pattern 5: Commented-out code (dead code)
// function legacyAuth(user) {
//   // old approach, don't use
//   return jwt.sign(user);
// }
```

Catch these before SUMMARY. If found: implement, delete, or document with tag.
