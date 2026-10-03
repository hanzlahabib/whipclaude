# Gate Prompts

Gate prompts enforce safety, reversibility, and clarity at critical decision points. They follow three canonical patterns: **Safety gates** (before risky actions), **Decision gates** (before irreversible commitments), and **Escalation gates** (when uncertainty exceeds tolerance).

All gate prompts reference `.rihal/references/no-unauthorized-git-ops.md` — never allow unauthorized commits, pushes, or force operations.

---

## Template: Safety Gate

Use before executing **irreversible or high-impact actions** (deletes, force-pushes, breaking changes).

**Structure:**

```markdown
## Safety Gate: [Action Name]

**You are about to:** [Specific action in plain English]

**Impact:** [What user will see/lose if they proceed]

**Approval Required**

Confirm you want to:
- [ ] [Specific irreversible consequence 1]
- [ ] [Specific irreversible consequence 2]

Type `yes, proceed` to confirm or `abort` to stop.
```

**Example: Delete Branch**

```markdown
## Safety Gate: Delete Feature Branch

You are about to **permanently delete** the branch `feature/payment-redesign` and all uncommitted changes on that branch will be lost.

**Consequences:**
- 3 unpushed commits (1234abc–4567def) will be discarded
- If you pushed this branch to origin, the remote copy will remain (must delete separately)
- This cannot be undone

Confirm:
- [ ] I have reviewed all unpushed commits (above)
- [ ] I understand this is permanent
- [ ] I accept responsibility for any lost work

Type `yes, proceed` to delete or `abort` to stop.
```

---

## Template: Decision Gate

Use before **high-stakes architectural or functional commitments** (framework choice, auth model, data migration strategy).

**Structure:**

```markdown
## Decision Gate: [Decision Name]

**You have chosen:** [Option selected]

**Rationale you provided:** [Summary of reasoning]

**We will commit to:**
- [ ] [Consequence 1 — what must now be true]
- [ ] [Consequence 2 — what becomes harder/impossible]
- [ ] [Consequence 3 — reversibility or cost of changing later]

**Alternative considered:**
- [Alt 1]: Why not chosen? [Your reasoning]
- [Alt 2]: Why not chosen? [Your reasoning]

Confirm this is the right choice, or select a different option.
```

**Example: Framework Choice**

```markdown
## Decision Gate: Choose Backend Framework

**You have chosen:** Express.js

**Rationale:** "Lightweight, large ecosystem, familiar to team, handles routing + middleware out of the box"

**We will commit to:**
- [ ] Express patterns (routes, middleware, error handling) will structure all backend code
- [ ] Team becomes responsible for architectural decisions Express doesn't provide (logging, caching, auth flow)
- [ ] Switching later requires rewriting routing and middleware (medium cost, ~2-3 days)

**Alternatives considered:**
- Fastify: "Too low-level for our timeline, less middleware ecosystem"
- NestJS: "Good, but opinionated — less flexibility for experiments"

Confirm this is right, or choose differently.
```

---

## Template: Irreversible-Action Gate

Use before **operations with no undo button** (force-push, delete production data, merge to main without PR).

**Structure:**

```markdown
## Gate: Irreversible Action

**Action:** [What you're about to do]

**Undo Difficulty:** [IMPOSSIBLE | HARD | MEDIUM | EASY]

**Recovery Plan** (if action fails):
[Specific steps to recover, or "Cannot be undone — be certain"]

---

**Type your confirmation:**
- For IMPOSSIBLE/HARD: Type the exact phrase `I understand [consequence], proceed`
- For MEDIUM: Type `yes, proceed`
- For EASY: Proceed normally (standard confirmation)
```

**Example: Force-Push to Main**

```markdown
## Gate: Force-Push to Main

**Action:** `git push --force-with-lease origin main`

**Undo Difficulty:** IMPOSSIBLE (force-push rewrites history; commits are lost unless recovered via reflog within 30 days)

**Recovery Plan:**
If commits are lost, recovery requires:
1. Accessing git reflog (only possible on local machine where push originated)
2. Resetting to the lost commit
3. Re-pushing to main (requires another force-push authorization)

This is high-risk and should not be attempted in production workflows.

---

**Type your confirmation:**
`I understand this cannot be easily undone and may cause data loss, proceed`
```

---

## Approval / Revise / Abort Pattern

For gates that offer a **choice** (not just yes/no):

```markdown
## Confirmation Gate: [Decision]

[Summarize the planned action and its consequences]

### Options

1. **Approve** — Proceed with the plan as described
2. **Revise** — Go back and modify [aspect 1], [aspect 2]
3. **Abort** — Stop here; don't proceed

Enter: `approve` | `revise <aspect>` | `abort`
```

**Example: Code Review Findings**

```markdown
## Confirmation Gate: Fix Code Review Issues

Found 3 issues:
1. Missing error handling in `/api/users.js`
2. Hardcoded API key in `.env.local` (security risk)
3. Type annotation missing on `fetchUser()` return type

All are medium severity. Should we fix before merging?

### Options

1. **Approve** — Merge as-is (I accept these risks)
2. **Revise** — Fix issues 1 and 2, skip 3
3. **Abort** — Stop; I want to rethink this

Enter: `approve` | `revise 1,2` | `abort`
```

---

## Gate Placement Rules

| Gate Type | Placement | User Decision? |
|---|---|---|
| Safety | Before destructive operation | Required (explicit yes) |
| Decision | After exploring options, before implementation | Required (choose path) |
| Escalation | After investigation, before proceeding with uncertainty | Required (accept or retry) |

---

## No Unauthorized Git Operations

Reference `.rihal/references/no-unauthorized-git-ops.md` before any gate that involves:
- `git push` (any flag)
- `git reset --hard`
- `git rebase`
- `git checkout` to discard changes
- `git clean -f`

**Rule:** User types the command themselves, or explicitly authorizes it in chat (outside of gate prompts).

Gates may **describe** an intended git operation, but the user must actively choose to proceed with full understanding of consequences.
