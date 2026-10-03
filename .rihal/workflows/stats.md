# Workflow: rihal:stats

<purpose>
Read .rihal/state.json and display project statistics: phases, plans, council sessions, decisions, blockers, timeline, and git stats.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:stats <argument-here>
```

**Examples:**
```
/rihal:stats example 1
/rihal:stats example 2
```

STOP — do not proceed.

## Step 1 — Load state

Read `.rihal/state.json`:

```bash
cat .rihal/state.json 2>/dev/null || echo '{}'
```

Parse as JSON. If parse fails or file doesn't exist, print:
```
ℹ️ No rihal state found in this project yet.
Run /rihal:help to get started.
```
Exit.

Store the parsed state as `$STATE`.

## Step 2 — Compute statistics

From `$STATE`, extract:

- **phases**: `$STATE.phases.length` (total)
- **active_phases**: count of phases with status = "active"
- **plans_completed**: `$STATE.current_plan` (number completed in current phase)
- **council_sessions**: `$STATE.council_sessions.length`
- **chains_run**: `$STATE.executions.length` (all execution records)
- **decisions**: `$STATE.decisions.length` (total)
- **blockers_open**: count of blockers with status = "open"
- **blockers_resolved**: count of blockers with status = "resolved"
- **last_3_decisions**: extract summaries from the last 3 items in `$STATE.decisions` array (summary field or description field)
- **timeline_start**: `$STATE.created` (ISO timestamp of first session)
- **timeline_end**: `$STATE.last_session` (ISO timestamp of most recent activity)

## Step 3 — Compute timeline duration

Calculate human-readable duration from timeline_start to timeline_end:
- If more than 30 days: show "N months"
- If 1-30 days: show "N days"
- If less than 1 day: show "hours"
- If null/missing: show "never started"

## Step 4 — Compute git stats (if .git exists)

If `.git/` directory exists, run:

```bash
git log --oneline --pretty=format:'%s' -- .rihal rihal/ | wc -l
git log --oneline --pretty=format:'%s' -- .rihal rihal/ | head -5
```

Extract:
- **rihal_commits**: count of commits on .rihal or rihal paths
- **recent_commits**: last 5 commit messages

If `.git/` does not exist, set `rihal_commits` = 0 and omit recent_commits from output.

## Step 5 — Format and print output

Print a human-readable stats block:

```
📊 rihal:stats — Project Timeline

Project: $PROJECT_NAME
Created: $TIMELINE_START
Updated: $TIMELINE_END
Duration: $DURATION

Phases
  Total: N
  Active: N
  Example: [01] Initial Setup, [02] API Development, [02.1] Urgent Fix

Plans
  Completed: N
  Example: [01.01] Schema setup, [01.02] Seed data

Council
  Sessions: N
  Decisions: N (last 3: "...", "...", "...")

Chains
  Executions: N

Blockers
  Open: N
  Resolved: N

Git Activity (rihal-related)
  Commits: N
  Recent:
    - [01.02] message-1
    - [02.01] message-2
    - [02.1] message-3
```

**ID Format Notes:**
- Phases display as `[NN]` (e.g., `[01]`, `[02]`)
- Decimal phases display as `[NN.M]` (e.g., `[02.1]`)
- Plans display as `[NN.MM]` (e.g., `[01.02]`)
- Include IDs in examples and recent commit references where available

If any counts are 0, still show them (e.g., "Phases: 0").

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

