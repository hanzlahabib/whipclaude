# Rihal Planner: Task Templates by Type

## Standard Task Template

```xml
<task type="auto">
  <name>Task: [Action-oriented name]</name>
  <files>path/to/file.ext, path/to/another.ts</files>
  <action>[Specific implementation with what to avoid and WHY]</action>
  <verify>
    <automated>npm test -- --filter=feature_name</automated>
  </verify>
  <done>[Measurable acceptance criteria]</done>
</task>
```

---

## TDD Task Template

Use when you can write `expect(fn(input)).toBe(output)` before implementing.

```xml
<task type="auto" tdd="true">
  <name>Task: [name]</name>
  <files>src/feature.ts, src/feature.test.ts</files>
  <behavior>
    - Test 1: [expected behavior]
    - Test 2: [edge case]
    - Test 3: [error case]
  </behavior>
  <action>[Implementation after RED phase]</action>
  <verify>
    <automated>npm test -- --filter=feature</automated>
  </verify>
  <done>[All tests passing, implementation matches behavior spec]</done>
</task>
```

---

## Checkpoint: Human Verify Template

Use for visual/functional verification (90% of checkpoints).

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <name>Verify: [Feature name works]</name>
  <what-built>[What the agent automated]</what-built>
  <how-to-verify>
    1. Navigate to http://localhost:3000/login
    2. Enter email "test@example.com" and password "Test123!"
    3. Verify you see the dashboard with your name
    4. Refresh the page
    5. Verify you're still logged in (not redirected to login)
  </how-to-verify>
  <resume-signal>Type "approved" if all steps work, or describe issues</resume-signal>
</task>
```

---

## Checkpoint: Decision Template

Use for implementation choices (9% of checkpoints).

```xml
<task type="checkpoint:decision" gate="blocking">
  <name>Decide: Database schema for messages</name>
  <what-youre-deciding>
    Where to store user-to-message relationships:
    
    Option A: Single `messages` table with `userId` foreign key
    - Pros: Simple, normalized
    - Cons: Requires join for user info
    
    Option B: Embed user data in `messages` (denormalized)
    - Pros: Faster queries, less joins
    - Cons: Inconsistent if user updates name
  </what-youre-deciding>
  <what-matters>
    - Message queries run frequently (critical performance)
    - User names rarely change
    - Query response time target: <100ms
  </what-matters>
  <resume-signal>Reply with "Option A" or "Option B", we'll implement that schema</resume-signal>
</task>
```

---

## Checkpoint: Human Action Template

Use for unavoidable manual steps (1% of checkpoints).

```xml
<task type="checkpoint:human-action" gate="blocking">
  <name>Set up Stripe API key</name>
  <what-needed>
    The next task implements Stripe payment processing, which requires your API key.
  </what-needed>
  <steps>
    1. Visit https://dashboard.stripe.com
    2. Go to Developers → API Keys
    3. Copy the **Secret Key** (not the publishable key!)
    4. Set in your environment: export STRIPE_SECRET_KEY=sk_live_...
    5. Confirm below when ready
  </steps>
  <resume-signal>Reply "ready" when STRIPE_SECRET_KEY is set in your environment</resume-signal>
</task>
```

---

## Database Migration Task Template

```xml
<task type="auto">
  <name>Task: Add role field to users table</name>
  <files>prisma/schema.prisma, prisma/migrations/[timestamp]_add_role.sql</files>
  <action>
    1. Update User model in schema: add `role String @default("user")`
    2. Run `prisma migrate dev --name add_role`
    3. Verify migration file created in prisma/migrations/
    4. Do NOT manually edit migration file
  </action>
  <verify>
    <automated>prisma db push --skip-generate</automated>
  </verify>
  <done>Schema updated, migration created, database reflects new field</done>
</task>
```

---

## API Endpoint Task Template

```xml
<task type="auto">
  <name>Task: Implement POST /api/users endpoint</name>
  <files>src/app/api/users/route.ts, src/types/user.ts</files>
  <action>
    Create POST endpoint accepting { email, password, name }:
    1. Validate email format with regex (RFC 5322 subset)
    2. Validate password length >= 8 chars
    3. Validate name length 2-50 chars
    4. Hash password with bcryptjs (not plaintext!)
    5. Create user in database
    6. Return 201 with user object (exclude password)
    7. Return 400 for validation errors
    8. Return 409 if email already exists
  </action>
  <verify>
    <automated>npm test -- --filter=users-api</automated>
  </verify>
  <done>
    Valid data returns 201 + user object
    Invalid data returns 400 with error message
    Duplicate email returns 409
    Password never returned in response
  </done>
</task>
```

---

## UI Component Task Template

```xml
<task type="auto">
  <name>Task: Create LoginForm component</name>
  <files>src/components/LoginForm.tsx, src/components/LoginForm.test.tsx</files>
  <action>
    Create form component with:
    1. Email input field (required, type="email")
    2. Password input field (required, type="password")
    3. Login button (disabled while submitting)
    4. Error message display (if submission fails)
    5. Success behavior: call onSubmit({ email, password })
    6. Use Sonner toast on error (not alert())
    7. Disabled state during submission (no double-click)
  </action>
  <verify>
    <automated>npm test -- --filter=LoginForm</automated>
  </verify>
  <done>
    Component renders, accepts input, calls onSubmit, disables during submission,
    shows errors with toast notification
  </done>
</task>
```

---

## Configuration Task Template

```xml
<task type="auto">
  <name>Task: Configure environment variables</name>
  <files>.env.example, .env.local (local only)</files>
  <action>
    1. Create .env.example with template (no real values):
       DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
       JWT_SECRET=your-secret-key-here
       STRIPE_SECRET_KEY=sk_test_...
    2. Create .env.local in dev environment with real values
    3. Add .env.local to .gitignore (never commit secrets)
    4. Document each var: purpose, where to get it, format
  </action>
  <verify>
    <automated>test -f .env.example && grep -q DATABASE_URL .env.example</automated>
  </verify>
  <done>.env.example exists with all required variables documented, .env.local ignored</done>
</task>
```

---

## Documentation Task Template

```xml
<task type="auto">
  <name>Task: Document authentication flow</name>
  <files>docs/AUTHENTICATION.md</files>
  <action>
    Document in docs/AUTHENTICATION.md:
    1. Overview: How auth works (JWT with refresh tokens)
    2. User flow: Registration → Login → Access token → Refresh → Logout
    3. Developer reference: Endpoints, request/response shapes, errors
    4. Diagrams: ASCII or Mermaid sequence diagram
    5. Examples: cURL commands for each endpoint
  </action>
  <verify>
    <automated>test -f docs/AUTHENTICATION.md && grep -q "POST /api/auth/login" docs/AUTHENTICATION.md</automated>
  </verify>
  <done>Documentation complete, all endpoints documented, examples provided</done>
</task>
```

---

## Refactoring Task Template

```xml
<task type="auto">
  <name>Task: Extract auth validation to utility</name>
  <files>src/lib/auth-validation.ts, src/api/auth/login/route.ts</files>
  <action>
    1. Create src/lib/auth-validation.ts with functions:
       - validateEmail(email: string): boolean
       - validatePassword(password: string): boolean
       - validateUserInput(email, password): { valid: boolean, errors: string[] }
    2. Update src/api/auth/login/route.ts to use validators
    3. Keep behavior identical (no refactoring the logic itself)
    4. All tests must still pass
  </action>
  <verify>
    <automated>npm test && npm run type-check</automated>
  </verify>
  <done>Utilities created, API route refactored, all tests passing</done>
</task>
```

---

## Common Task Sizing Rules

| Duration | Action | Example |
|----------|--------|---------|
| < 15 min | TOO SMALL — combine with related task | "Add email field to form" + "Update User model" |
| 15-60 min | RIGHT SIZE | "Create User API endpoint with validation" |
| > 60 min | TOO LARGE — split | "Build complete auth system" → split into 3 tasks |

---

## Task Specificity Checker

**Test:** Could a different executor implement this without asking clarifying questions?

**Bad (too vague):**
```xml
<action>Add authentication</action>
```

**Good (specific):**
```xml
<action>
  Create POST /api/auth/login endpoint accepting { email, password }:
  - Validate email format with standard regex
  - Query User table by email
  - Compare password with bcryptjs.compare()
  - Return 200 + JWT token in httpOnly cookie (15-min expiry)
  - Return 401 if email not found or password wrong
  - Do NOT return password in response
</action>
```
