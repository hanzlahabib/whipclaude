# Rihal Executor: Task Commit Protocol

## Commit Workflow for Each Task

After completing a task's implementation, follow this protocol to atomically commit changes.

---

## Step 1: Check Git Status
```bash
git status --short
```

Example output:
```
M  src/auth/login.ts
M  src/types/user.ts
?? src/auth/refresh.ts
```

Understand what changed:
- `M` = Modified file
- `??` = Untracked (new) file
- `D` = Deleted file

---

## Step 2: Stage Files Individually

**NEVER use `git add .` or `git add -A`**

Stage each file explicitly:
```bash
git add src/auth/login.ts
git add src/types/user.ts
git add src/auth/refresh.ts
```

Or for multiple related files:
```bash
git add src/auth/
```

Only stage files changed by this task. If other files were modified (e.g., from previous unrelated work), leave them unstaged.

---

## Step 3: Determine Commit Type

Match the change to a conventional commit type:

| Type | When | Example |
|------|------|---------|
| `feat` | New feature, endpoint, component | "Add JWT refresh token rotation" |
| `fix` | Bug fix, error handling | "Fix null check in auth middleware" |
| `test` | Test file creation/modification | "Add test suite for login flow" |
| `refactor` | Code improvement (no feature change) | "Extract auth validation to utility" |
| `chore` | Build, config, deps | "Add prisma migration" |
| `docs` | Documentation updates | "Document auth strategy" |

---

## Step 4: Choose Scope

Scope is the area affected, in parentheses:

- `feat(auth)` - authentication feature
- `fix(payments)` - payments bug fix
- `test(api)` - API tests
- `refactor(ui)` - UI code cleanup

Scope should match the PLAN task name or subsystem.

---

## Step 5: Single vs Multi-Repo Commits

### Single Repository (Standard)
```bash
git commit -m "feat(auth): add JWT refresh token rotation"
```

Extract and save the commit hash:
```bash
HASH=$(git rev-parse HEAD)
echo "Task committed: $HASH"
```

### Multiple Repositories (Sub-repos)
Use the `commit-to-subrepo` tool:
```bash
node ".rihal/bin/rihal-tools.cjs" commit-to-subrepo \
  --repo frontend \
  --message "feat(ui): redesign login form" \
  --files src/pages/login.tsx
```

The tool:
1. Commits to the sub-repo
2. Returns the sub-repo commit hash
3. Then commits a reference in the parent repo

Extract both hashes from response.

---

## Step 6: Check Untracked Files

After commit, verify no accidental files were left:
```bash
git status --short | grep '^??'
```

If untracked files appear:
- **If generated (node_modules, .next, build/):** Add to .gitignore
- **If intentional:** Stage and commit in a new commit
- **If accidental:** Delete and update .gitignore

Example:
```bash
# Untracked: console.log.tmp
# Accidental → delete
rm src/console.log.tmp

# Untracked: src/features/auth.generated.ts
# Generated code → add to .gitignore
echo "**/*.generated.ts" >> .gitignore
```

---

## Step 7: Record Task Completion

Track the committed task:
```javascript
{
  taskNumber: 1,
  taskName: "Task: Implement JWT refresh tokens",
  commitHash: "a1b2c3d",
  commitMessage: "feat(auth): add JWT refresh token rotation",
  filesModified: ["src/auth/login.ts", "src/types/user.ts", "src/auth/refresh.ts"],
  status: "complete"
}
```

---

## Common Commit Patterns

### TDD Pattern
Three commits per task:

1. **Test commit** (RED phase):
   ```bash
   git add src/auth.test.ts
   git commit -m "test(auth): add failing test for password validation"
   ```

2. **Implementation commit** (GREEN phase):
   ```bash
   git add src/auth.ts
   git commit -m "feat(auth): implement password validation"
   ```

3. **Refactor commit** (if needed):
   ```bash
   git add src/auth.ts
   git commit -m "refactor(auth): extract validation logic to utility"
   ```

### Bug Fix Pattern
```bash
git add src/component.tsx
git commit -m "fix(ui): prevent double-click on submit button"
```

### Multiple File Pattern
```bash
git add src/api/auth/route.ts src/lib/jwt.ts src/types/auth.ts
git commit -m "feat(auth): implement login endpoint with JWT generation"
```

---

## Commit Message Format

All commits must follow Conventional Commits:

```
<type>(<scope>): <subject>

<body (optional)>
```

Rules:
- **Type:** Lowercase (feat, fix, test, refactor, chore, docs)
- **Scope:** Lowercase, no spaces
- **Subject:** Imperative mood ("add", not "adds" or "added"), lowercase first letter, NO period at end, under 72 characters
- **Body:** Explain WHY if needed (not WHAT, commit diff shows that)

Good:
```
feat(auth): add JWT refresh token rotation
fix(payments): handle stripe webhook retries
refactor(ui): extract form validation to utility
```

Bad:
```
feat(auth): Adds JWT refresh tokens.
fix: I fixed the payment thing
Updated auth code
```

---

## Multi-Repo Workflow

When plan spans multiple repositories (e.g., frontend + backend):

1. **Per-repo commits:** Commit to each repo separately
2. **Extract hashes:** Save each repo's commit hash
3. **Orchestrator commit:** Parent repo records all hashes

Example:
```bash
# Frontend repo
cd frontend
git add src/pages/login.tsx
git commit -m "feat(ui): redesign login form"
FRONTEND_HASH=$(git rev-parse HEAD)

# Backend repo
cd ../backend
git add src/routes/auth.ts
git commit -m "feat(api): add passwordless login endpoint"
BACKEND_HASH=$(git rev-parse HEAD)

# Parent repo (records cross-repo work)
cd ..
git add .planning/phases/01-auth/01-login-SUMMARY.md
git commit -m "docs(01-auth): complete login feature (frontend: $FRONTEND_HASH, backend: $BACKEND_HASH)"
```

---

## Troubleshooting Commits

### "Committed wrong file"
1. Don't force-push (violates AGENTS.md rule)
2. Create a new commit fixing it
3. Document in task notes

### "Need to split large commit"
1. Use `git reset HEAD~1` (undoes last commit, leaves changes staged)
2. Stage part of changes
3. Commit
4. Stage remainder
5. Commit again

### "Forgot to add a file"
1. Stage the file
2. Use `git commit --amend` (modifies last commit)
3. OR create a new commit if last commit already pushed

### Merge conflicts after commit
1. Pull latest from origin
2. Resolve conflicts
3. Create new "fix(merge):" commit documenting resolution
4. Never force-push

---

## Automation Note

The `.rihal/bin/rihal-tools.cjs` provides a `commit` helper:

```bash
node ".rihal/bin/rihal-tools.cjs" commit "feat(auth): implement login" \
  --files src/auth.ts src/types/auth.ts
```

This ensures consistency and can integrate with project hooks.
