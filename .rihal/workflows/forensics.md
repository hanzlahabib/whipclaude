# Workflow: rihal:forensics

<purpose>
Analyze execution history in state.json and filesystem to detect incomplete work. Show timeline of what happened, where it broke, and suggest resume command.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:forensics <argument-here>
```

**Examples:**
```
/rihal:forensics example 1
/rihal:forensics example 2
```

STOP — do not proceed.

## Step 1 — Load state

Read `.rihal/state.json`:

```bash
cat .rihal/state.json 2>/dev/null || echo '{}'
```

Parse as JSON. If invalid or missing, print:
```
ℹ️ No rihal state found. Nothing to diagnose.
```
Exit.

Extract:
- **executions**: array of execution records (each has: id, phase, timestamp, status, error)
- **current_phase**: string or null (name of current phase)
- **last_session**: timestamp of most recent activity

## Step 2 — Find failed executions

From `$STATE.executions`, filter for ones where:
- `status !== "complete"` OR
- `error` field is present and non-empty OR
- `status === "failed"`

Store as `$FAILED_EXECS`.

## Step 3 — Check for incomplete plans

Scan `.planning/` directory for:

```bash
find .planning/ -name "SPRINT.md" -type f
```

For each SPRINT.md found, check if a corresponding SUMMARY.md exists:

```bash
ls -1 .planning/*/SUMMARY.md 2>/dev/null || true
```

If SPRINT.md exists but no SUMMARY.md, that's an incomplete execution.

Store as `$INCOMPLETE_PLANS` (list of plan IDs).

## Step 4 — Check for checkpoint artifacts

Search for checkpoint markers in recent planning artifacts:

```bash
grep -r "---CHECKPOINT REACHED---" .planning/ 2>/dev/null | head -10 || echo ""
```

If found, these indicate partial progress within a phase. Extract:
- File containing checkpoint
- Line number
- Context around checkpoint

Store as `$CHECKPOINTS`.

## Step 5 — Scan recent git history for rihal commits

If `.git/` exists, extract rihal-related commits:

```bash
git log --oneline -20 --pretty=format:'%h %s' -- .rihal rihal/ .planning/ 2>/dev/null || echo ""
```

Parse to identify:
- Last commit on .rihal (install/config changes)
- Last commit on rihal/ (workflow/agent changes)
- Last commit on .planning/ (execution artifacts)

Store as `$RECENT_COMMITS`.

## Step 6 — Assemble timeline

Build a chronological timeline from:
1. `current_phase` (if set, this is where work stopped)
2. Most recent execution from `$FAILED_EXECS` (when and why it failed)
3. Last item in `$INCOMPLETE_PLANS` (phase with PLAN but no SUMMARY)
4. Most recent checkpoint from `$CHECKPOINTS` (partial progress)
5. Last commit from `$RECENT_COMMITS`

Format as:

```
Timeline of Execution

T-5h: Started phase "Feature X" (/rihal:plan feature-x)
T-3h: Phase created, plan saved to .planning/feature-x/SPRINT.md
T-2h: Execution began — checkpoint at step 3/8
T-0h: ❌ FAIL — Execution error: "Dependency not installed"
      Stuck at: .planning/feature-x/ (no SUMMARY.md yet)
      Last git: commit abc1234 "draft plan"
```

## Step 7 — Suggest recovery

Based on what was found:

**If incomplete phase with checkpoint:**
```
💡 Suggested recovery:

You were working on phase "phase-name" and reached checkpoint 3.

To resume:
  /rihal:resume-work
```

**If failed execution with error:**
```
💡 Suggested recovery:

Phase "phase-name" failed during execution:
  Error: [error message from state.json]

To retry:
  1. Fix the issue noted above
  2. Run: /rihal:next
```

**If incomplete plan (PLAN exists, no SUMMARY):**
```
💡 Suggested recovery:

Phase "phase-name" was planned but never executed.

To continue:
  /rihal:execute phase-name
```

**If no incomplete work found:**
```
✅ No incomplete executions detected. All phases complete or active.
```

## Step 8 — Print full diagnostic report

If user needs more detail, print:

```
📋 Full Forensic Report

Current Phase: {phase_name or "none"}
Last Session: {last_session timestamp}

Failed Executions: {count}
  [List each with ID, phase, error, timestamp]

Incomplete Plans: {count}
  [List each with plan ID, created timestamp]

Checkpoints Reached: {count}
  [List each with location and progress]

Recent Rihal Commits: {count}
  [List with hash, message, timestamp]

Recommendation: {recovery suggestion}
```

## Success Criteria

- [ ] Task completed as requested
- [ ] Output saved or reported
- [ ] State updated if necessary
- [ ] No errors encountered

## On Error

If arguments are invalid, missing files, or subagent fails:
- Validate inputs match expected format
- Check that required files exist
- Retry with clearer arguments or report the specific error to the user

