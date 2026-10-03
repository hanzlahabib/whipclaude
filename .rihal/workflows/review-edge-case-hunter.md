# Workflow: rihal:review-edge-case-hunter

<purpose>
Systematically enumerate edge cases by category (input, state, concurrency, network) with severity (critical/high/medium/low). Callable during code-review.md workflow. Output feeds into story AC or subtasks. Focuses on "what breaks?" rather than security.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:review-edge-case-hunter <argument-here>
```

**Examples:**
```
/rihal:review-edge-case-hunter example 1
/rihal:review-edge-case-hunter example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-edge-case-hunter` — edge case enumeration agent
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init review-edge-case-hunter "$ARGUMENTS")
```

Parse:
- `flags.phase` — specific phase to analyze (optional)
- `flags.component` — specific component (optional)
- `output_path` — `.rihal/EDGE-CASES-{phase}.md` or `.rihal/EDGE-CASES.md`
- `targets` — files/components to audit

## Step 1 — Identify Review Targets

Same as review-adversarial Step 1:

Collect files by phase or component, extract:
- Function/method signatures
- Input parameters and types
- State mutations
- External API calls
- Error handling

## Step 2 — Spawn Edge Case Hunter

Spawn `rihal-edge-case-hunter` subagent:

```
Task tool call:
  subagent_type: "rihal-edge-case-hunter"
  description: "Enumerate edge cases"
  prompt: |
    Enumerate all edge cases that could cause failures or unexpected behavior.
    Focus on: What inputs break? What state combinations are invalid? What network scenarios fail?
    
    **Files/functions to analyze:**
    {target_files_with_signatures}
    
    **Enumerate by category:**
    
    1. INPUT EDGE CASES
       - Empty inputs (null, undefined, empty string, empty array)
       - Boundary values (0, -1, MAX_INT, MAX_FLOAT)
       - Invalid types (string instead of number, object instead of array)
       - Malformed data (invalid JSON, truncated, oversized)
       - Special characters (unicode, newlines, control chars, emoji)
       - Whitespace variations (leading/trailing spaces, tabs, mixed)
    
    2. STATE EDGE CASES
       - Uninitialized/missing state
       - State mutations during async operations
       - Re-entrance (function called again while executing)
       - State transitions not covered (skipped steps, out-of-order)
       - Stale cached state
       - Conflicting state values
    
    3. CONCURRENCY EDGE CASES
       - Two requests for same resource simultaneously
       - Writes during reads
       - Partial updates (write interrupted)
       - Lock contention or deadlock
       - Race conditions between check and use
       - Order-dependent operations executed out of order
    
    4. NETWORK EDGE CASES
       - Timeouts (slow/hanging requests)
       - Connection drops (mid-response)
       - Retries (request sent twice, duplicate processing)
       - Invalid responses (malformed JSON, wrong status code)
       - Cascading failures (API A calls B, B fails)
       - Rate limiting (429 Too Many Requests)
    
    For each edge case:
    - Category (input, state, concurrency, network)
    - Severity (critical, high, medium, low)
    - Scenario (specific input/state combination)
    - Expected behavior (what should happen)
    - Actual behavior (what might go wrong)
    - Test case (how to reproduce)
    - Acceptance criteria for handling
    
    Output: EDGE-CASES.md with severity-ordered list
```

## Step 3 — Categorize by Severity

Critical: Causes data loss, security breach, complete feature failure
High: Causes incorrect output, feature partially broken, user-facing error
Medium: Degrades performance, confuses user, edge case not handled gracefully
Low: Minor inconsistency, cosmetic issue, optimization opportunity

Organize output:

```markdown
# Edge Cases: {phase_name}

## Critical ({count})
- {edge_case_1}
- {edge_case_2}

## High ({count})
- {edge_case_1}
- {edge_case_2}

## Medium ({count})
- {edge_case_1}

## Low ({count})
- {edge_case_1}
```

## Step 4 — File as AC or Tasks

For each critical/high edge case, add to story AC:

Update `.rihal/story-current.md` acceptance criteria:

```markdown
## Edge Case Handling

**Critical:**
- [ ] {edge_case_1}: {acceptance_criteria}

**High:**
- [ ] {edge_case_2}: {acceptance_criteria}
```

Or file as subtasks:

```bash
node .rihal/bin/rihal-tools.cjs state add-task \
  --title "Handle edge case: {scenario}" \
  --category edge-case \
  --severity {critical|high}
```

Print:
```
🔍 Edge Case Analysis Complete

By severity:
  • Critical: {count}
  • High: {count}
  • Medium: {count}
  • Low: {count}

Analysis: {output_path}

Critical/high cases filed as AC or tasks.
```

## Integration: code-review.md

In code-review.md workflow, after completing main review, optionally offer:

```bash
AskUserQuestion([
  {
    header: "Edge Cases",
    question: "Run edge case analysis on this code?",
    multiSelect: false,
    options: [
      { label: "Yes, find edge cases", description: "Comprehensive edge case hunt" },
      { label: "Skip for now", description: "Continue review" }
    ]
  }
])
```

If "Yes, find edge cases":
```
/rihal:review-edge-case-hunter --phase {current_phase}
```

## Success Criteria

- EDGE-CASES.md created with all 4 categories
- Minimum 3 edge cases per category (if applicable)
- Severity-ordered list
- Test case included for each critical/high
- Critical/high filed as AC or tasks

## On Error

- If subagent fails: provide template edge-case structure
- If no edge cases found: report "No new edge cases identified" (acceptable)
- If too many cases: prioritize by severity, file medium/low in backlog
