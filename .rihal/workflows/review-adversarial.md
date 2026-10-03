# Workflow: rihal:review-adversarial

<purpose>
Assume an adversarial/hostile perspective and audit code for weaknesses: SQL injection, XSS, race conditions, data loss scenarios, unauthorized access, abuse cases, denial of service vectors. Output attack/weakness report that feeds into story AC or subtasks.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:review-adversarial <argument-here>
```

**Examples:**
```
/rihal:review-adversarial example 1
/rihal:review-adversarial example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-security-adversary` — adversarial code reviewer (security-focused)
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init review-adversarial "$ARGUMENTS")
```

Parse:
- `flags.phase` — specific phase to review (optional)
- `flags.component` — specific component/file (optional)
- `review_path` — `.rihal/ADVERSARIAL-REVIEW-{phase}.md` or `.rihal/ADVERSARIAL-REVIEW.md`
- `targets` — files/components to audit

## Step 1 — Identify Review Targets

**If `flags.component` provided:** Review single component
```bash
find {project} -name "{component}*" -type f
```

**If `flags.phase` provided:** Review all files changed in phase
```bash
git diff HEAD~{wave}..HEAD --name-only | grep -E '\.(js|ts|py|go|rs)$'
```

**Otherwise:** Review all source files in current phase/latest changes

Collect:
- File paths
- File types (backend, frontend, API, database, etc.)
- Lines of code per file
- External dependencies used

## Step 2 — Spawn Adversarial Reviewer

Spawn `rihal-security-adversary` subagent:

```
Task tool call:
  subagent_type: "rihal-security-adversary"
  description: "Adversarial security review"
  prompt: |
    Conduct an adversarial security review. Assume a hostile perspective.
    Goal: Find every possible way this code could be exploited, broken, or abused.
    
    **Files to audit:**
    {target_files_with_contents}
    
    **Attack categories (audit all):**
    
    1. INJECTION ATTACKS
       - SQL Injection (parameterized queries? raw string interpolation?)
       - Command Injection (shell commands, subprocess, exec?)
       - XSS (input sanitization? output encoding?)
       - Template Injection
    
    2. AUTHENTICATION & AUTHORIZATION
       - Session hijacking (JWT stored in localStorage?)
       - Privilege escalation (role checks everywhere?)
       - API key exposure (hardcoded, logged, in git history?)
       - Insecure password storage
    
    3. DATA LOSS & CORRUPTION
       - Race conditions (concurrent writes without locks?)
       - Unprotected database transactions
       - Missing rollback on error
       - Unchecked third-party API failures
    
    4. DENIAL OF SERVICE
       - Unbounded loops or recursion
       - Excessive resource allocation (memory, CPU)
       - No rate limiting on public endpoints
       - Infinite file uploads
    
    5. ABUSE CASES
       - Can user bypass limits (pagination, quotas)?
       - Can user access data not theirs?
       - Can user trigger expensive operations?
       - Can user enumerate/discovery resources?
    
    For each vulnerability:
    - Type (injection, authz, data loss, DoS, abuse)
    - Severity (critical, high, medium, low)
    - Attack scenario (specific steps to exploit)
    - Impact (data breach, outage, corruption, etc.)
    - Proof of concept (code snippet showing vulnerability)
    - Fix (specific remediation)
    
    Output: ADVERSARIAL-REVIEW.md
```

## Step 3 — Store Review and File Tasks

Write review to `.rihal/ADVERSARIAL-REVIEW-{phase}.md`

Extract findings:
- Critical vulnerabilities
- High-risk issues
- Medium-risk issues
- Low-risk recommendations

## Step 4 — File Security Tasks

For each critical/high finding, optionally file as subtask:

```bash
node .rihal/bin/rihal-tools.cjs state add-task \
  --title "Fix {vulnerability_type}: {brief_description}" \
  --severity critical/high/medium \
  --component {component_name}
```

Or add to story AC:

Update `.rihal/story-current.md` acceptance criteria:

```markdown
## Security Requirements

- [ ] No SQL injection vulnerabilities (parameterized queries)
- [ ] All user input sanitized per OWASP guidelines
- [ ] API keys not logged or stored in repository
- [ ] Rate limiting on public endpoints
- [ ] CSRF tokens on state-changing requests
```

Print:
```
🛡️ Adversarial Review Complete

Findings by severity:
  • Critical: {count}
  • High: {count}
  • Medium: {count}
  • Low: {count}

Review: {review_path}

Critical findings filed as blocking AC. High findings as optional tasks.
```

## Success Criteria

- ADVERSARIAL-REVIEW.md created
- All 5 attack categories audited
- Findings ranked by severity
- Proof-of-concept included for each vulnerability
- Critical/high issues filed as tasks or AC

## On Error

- If subagent fails: provide template adversarial review structure
- If files too large: split review across multiple components
- If no findings: report "No vulnerabilities found" (document assumptions)
