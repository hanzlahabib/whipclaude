# Rihal Executor: Authentication Gates

## Defining Authentication Gates

Authentication errors ("Not authenticated", "401", "403", "Set ENV_VAR") are gates, not failures.

A gate is:
- A checkpoint that requires human action (visiting a URL, clicking a button, entering credentials)
- Unavoidable (code alone cannot pass)
- **NOT** a task failure or bug

Examples:
- "Please visit OAuth provider and authorize app" → gate
- "Set STRIPE_API_KEY environment variable" → gate
- "Click email verification link" → gate
- "Enter 2FA code" → gate
- "Set missing database credentials" → gate

Non-examples:
- "Database connection failed" → Try to debug (wrong password? wrong host? down?)
- "API request timeout" → Retry logic
- "Missing npm dependency" → Install it

---

## When to Stop at Gate

Recognize gate patterns:

```javascript
// Pattern 1: Explicit authentication message
Error: Not authenticated
401 Unauthorized
403 Forbidden
Set ENV_VAR_NAME=<value>

// Pattern 2: Missing credentials
Missing API key
No auth token
Credentials required

// Pattern 3: OAuth/session flow
Authorization required
User consent needed
Session expired
```

---

## Gate Handling Protocol

When you hit a gate:

### 1. Identify Gate Type
- **Env variable:** Missing secret key
- **OAuth:** Authorization flow needed
- **Session:** Re-authentication required
- **Email:** Verification link click
- **MFA:** Code entry
- **Manual setup:** Dashboard configuration

### 2. Document Exact Steps
Write down EXACTLY what the user needs to do:
```
Gate: Missing STRIPE_API_KEY
Steps:
1. Visit https://dashboard.stripe.com
2. Go to Developers → API Keys
3. Copy the Secret Key (not publishable key)
4. Set in your shell: export STRIPE_API_KEY=<key>
5. Re-run plan execution
```

### 3. Return Checkpoint
```markdown
## CHECKPOINT REACHED

**Type:** human-action
**Plan:** {phase}-{plan}
**Task {N}:** [task name]
**Blocked by:** {gate type}

### What's Needed
[Exact steps from above]

### Why It's Needed
[Brief explanation of what this enables]

### Awaiting
User to complete steps and confirm.
```

### 4. Never Guess Credentials
- NEVER invent placeholder values like `api_key_123`
- NEVER hardcode fake credentials to unblock testing
- NEVER store secrets in code
- User provides real secrets during checkpoint

---

## Special Cases

### Multiple Gates in One Task
If a single task requires multiple gates (OAuth + env var + email):
1. Return ONE checkpoint with all required steps
2. Ask user to complete ALL before resuming
3. Resume and continue task execution

### Gate in Middle of Plan
If gate appears mid-plan:
1. Complete all tasks before gate
2. Return checkpoint
3. User completes gate steps
4. Resume remaining tasks

### Forgotten Gate from Previous Checkpoint
If user re-runs plan and forgot gate step:
1. Detect same gate error
2. Return same checkpoint message
3. Remind user of previous steps

---

## Never Confuse with Failure

| Situation | Is Gate? | Action |
|-----------|----------|--------|
| "401 Unauthorized" with no creds set | YES | Checkpoint, ask for credentials |
| "401 Unauthorized" with creds set but expired | NO | Retry or refresh token |
| "Missing API_KEY env var" | YES | Checkpoint, ask user to set it |
| "Database connection refused" | NO | Debug (wrong host? port? down?) |
| "OAuth authorization required" | YES | Checkpoint with OAuth flow steps |
| "Session expired" | MAYBE | Try to refresh, if no mechanism, checkpoint |

---

## Automation Preference

Always try to automate BEFORE stopping at gate:

```javascript
// BEFORE stopping, try:
1. Check if creds can be read from ~/.env or ~/.config
2. Check if refresh tokens exist
3. Check if session can be re-established
4. Try to programmatically authorize if library supports it

// ONLY AFTER automation attempts fail:
Return checkpoint with human-action type
```

Example:
```bash
# Before gate checkpoint, check:
if [ -f "$HOME/.stripe-creds" ]; then
  source "$HOME/.stripe-creds"
fi

# If still missing:
# Return checkpoint asking user to provide
```

---

## Gate Completion Verification

After user completes gate steps:

1. **Ask confirmation:** "Have you completed steps 1-3 above?"
2. **Test gate:** Try the operation that failed before
3. **If still fails:** Return checkpoint again with debugging steps
4. **If passes:** Resume execution, commit current task

Example:
```
User completes OAuth, returns to prompt saying "Done"

Verification: Run API call that previously failed
Result: Still 401

Action: Return checkpoint with debugging steps
- "Check if token is in your Authorization header"
- "Verify OAuth provider shows app as authorized"
- "Check token hasn't expired (token valid for 1 hour)"
```

---

## Documentation

When creating SUMMARY.md, list gates encountered:

```markdown
### Authentication Gates

| Gate | Type | Resolution |
|------|------|-----------|
| STRIPE_API_KEY missing | Env var | User provided key during checkpoint 1 |
| OAuth authorization | OAuth | User authorized app via Stripe dashboard |

If this plan is re-run, gates may reappear. Complete steps above to resume.
```
