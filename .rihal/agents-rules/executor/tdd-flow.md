# Rihal Executor: TDD Execution Flow

## Test-Driven Development Phases

For tasks with `tdd="true"`, execute in three phases:

---

## Phase 1: RED — Write Failing Tests

**Objective:** Establish expected behavior before implementation.

### Step 1: Create Test File
Create test file alongside implementation (or in tests/ directory):
- Implementation: `src/auth.ts` → Test: `src/auth.test.ts` or `tests/auth.spec.ts`
- Implementation: `src/api/users/route.ts` → Test: `src/api/users/route.test.ts`

### Step 2: Write Test Cases
From task `<behavior>` block, write tests that define expectations:

Example from task:
```xml
<behavior>
  - Test 1: Valid email returns true
  - Test 2: Invalid email (no @) returns false
  - Test 3: Empty string returns false
</behavior>
```

Write tests:
```typescript
import { validateEmail } from './auth';

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('returns false for invalid email (no @)', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

### Step 3: Verify Tests FAIL
```bash
npm test -- --filter=auth
# Expected: FAILED (function doesn't exist yet)
```

**CRITICAL:** Tests MUST fail at this point. If they pass, you're not testing anything.

### Step 4: Commit RED
```bash
git add src/auth.test.ts
git commit -m "test({scope}): add failing test for {feature}"
```

Example:
```bash
git commit -m "test(auth): add failing test for email validation"
```

---

## Phase 2: GREEN — Write Minimal Implementation

**Objective:** Make tests pass with minimal code (no over-engineering).

### Step 1: Write Implementation
Implement ONLY what's needed to pass tests. Resist over-engineering:

```typescript
// MINIMAL implementation (passes test)
export function validateEmail(email: string): boolean {
  return email.includes('@') && email.length > 0;
}

// NOT this (over-engineered, but test wouldn't catch it)
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### Step 2: Verify Tests PASS
```bash
npm test -- --filter=auth
# Expected: PASSED
```

If test fails, fix implementation. Don't change the test.

### Step 3: Commit GREEN
```bash
git add src/auth.ts
git commit -m "feat({scope}): implement {feature}"
```

Example:
```bash
git commit -m "feat(auth): implement email validation"
```

---

## Phase 3: REFACTOR — Clean Up (If Needed)

**Objective:** Improve code quality while keeping tests passing.

Only refactor if:
- Tests still pass after refactoring
- Code is genuinely hard to read or maintain
- No behavior change

Example refactoring:
```typescript
// BEFORE (verbose, GREEN state)
export function validateEmail(email: string): boolean {
  return email.includes('@') && email.length > 0 && email.indexOf('@') !== 0 && email.indexOf('@') !== email.length - 1;
}

// AFTER (clearer, still passes test)
export function validateEmail(email: string): boolean {
  const hasAtSign = email.includes('@');
  const notEmpty = email.length > 0;
  const atNotAtStart = email.indexOf('@') !== 0;
  const atNotAtEnd = email.indexOf('@') !== email.length - 1;
  
  return hasAtSign && notEmpty && atNotAtStart && atNotAtEnd;
}

// Verify tests still pass
npm test -- --filter=auth
# Expected: PASSED
```

### REFACTOR Commit
```bash
git add src/auth.ts
git commit -m "refactor(auth): clarify email validation logic"
```

**Skip refactor if:** Tests pass and code is already clear.

---

## TDD Workflow Summary

```
RED PHASE:
  ├─ Create test file
  ├─ Write failing tests
  ├─ Run: npm test → FAIL ✓
  └─ Commit: test(scope): add failing test

GREEN PHASE:
  ├─ Write minimal implementation
  ├─ Run: npm test → PASS ✓
  ├─ Verify no cheating (all tests pass legitimately)
  └─ Commit: feat(scope): implement

REFACTOR PHASE (optional):
  ├─ Improve code clarity
  ├─ Run: npm test → PASS ✓ (unchanged)
  └─ Commit: refactor(scope): clean up (or skip)
```

---

## Common TDD Patterns

### API Endpoint (REST)
```typescript
// Test
describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@test.com', password: 'Pass123!' })
    });
    expect(response.status).toBe(201);
    const user = await response.json();
    expect(user.email).toBe('user@test.com');
  });

  it('returns 400 for invalid email', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid', password: 'Pass123!' })
    });
    expect(response.status).toBe(400);
  });
});

// Implementation (minimal)
export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
  }

  const user = await db.users.create({ email, password });
  return new Response(JSON.stringify(user), { status: 201 });
}
```

### React Component
```typescript
// Test
describe('LoginForm', () => {
  it('calls onSubmit with form data when submitted', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'Pass123!');
    await userEvent.click(screen.getByText('Login'));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@test.com', password: 'Pass123!' });
  });

  it('disables submit button while submitting', async () => {
    const onSubmit = jest.fn(() => new Promise(r => setTimeout(r, 100)));
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await userEvent.click(screen.getByText('Login'));

    expect(screen.getByText('Login')).toBeDisabled();
  });
});

// Implementation (minimal)
export function LoginForm({ onSubmit }: { onSubmit: (data: LoginData) => Promise<void> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await onSubmit({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button disabled={isSubmitting}>Login</button>
    </form>
  );
}
```

---

## Red Flags in TDD

### Test Passes Immediately After Writing
Problem: Your test doesn't actually test anything.
Solution: Verify function doesn't exist, or test is checking wrong thing.

### Too Many Tests Failing at Once
Problem: Can't tell which fix makes which test pass.
Solution: Write fewer, simpler tests first.

### Implementation Becomes Complex
Problem: Minimal code is hard to understand.
Solution: Extract helper functions during refactor phase, keep tests simple.

### Tests Are Brittle
Problem: Small implementation change breaks many tests.
Solution: Test behavior, not implementation details. Avoid testing internal state.

---

## Skipping Refactor

Refactor phase is optional. Skip if:
- Code is already clean
- Tests pass and behavior is correct
- No repeated logic
- No naming clarity issues

In most TDD tasks, RED → GREEN is sufficient. REFACTOR adds polish.
