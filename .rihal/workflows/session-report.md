# Workflow: rihal:session-report

<purpose>
Generate a comprehensive session report covering work done, token usage estimation, commits, decisions, blockers, and council sessions. Writes SESSION-REPORT-{date}.md to .planning/ directory.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:session-report <argument-here>
```

**Examples:**
```
/rihal:session-report example 1
/rihal:session-report example 2
```

STOP — do not proceed.

## Step 1 — Check usage

Verify .rihal/state.json exists:

```bash
test -f .rihal/state.json && echo "exists" || echo "missing"
```

If missing, print and stop:

```
No state found. Run /rihal:council or execute a plan to initialize state.
```

## Step 2 — Read state

```bash
cat .rihal/state.json
```

Parse the JSON. Extract:

- `created` — project creation timestamp
- `updated` — last update timestamp
- `current_phase` — current phase (or null)
- `current_plan` — plan number (0-based)
- `executions` — array of execution records
- `decisions` — array of decision records
- `blockers` — array of blocker records
- `council_sessions` — array of session records

## Step 3 — Compute duration

Calculate time span covered by this session:

- **Start:** First timestamp in state (created, or first session/decision/blocker timestamp)
- **End:** Last timestamp in state (updated, or last session/decision/blocker timestamp)
- **Duration:** Human-readable format (e.g. "2 hours 15 minutes", "1 day")

If no timestamps available, use current time as both start/end.

## Step 4 — Count artifacts

List all artifacts in `.planning/`:

```bash
find .planning -type f \( -name "council-session-*.json" -o -name "*-chain.md" -o -name "*-discuss.md" \) | wc -l
```

Extract counts:
- **Council sessions:** count of `council-session-*.json` files
- **Chains:** count of `*-chain.md` files
- **Discusses:** count of `*-discuss.md` files

## Step 5 — Estimate token usage

Calculate estimated tokens (note: this is an estimate, not actual measurement):

- **Council sessions:** count × 50,000 tokens (5 agents × 2 rounds × ~5K avg per agent)
- **Chains:** count × 30,000 tokens (3-5 stages × ~8K avg per stage)
- **Discusses:** count × 10,000 tokens (single agent, focused conversation)
- **Execute:** (executions count) × 20,000 tokens (estimation only)

**Total estimate:** sum of above (with disclaimer)

## Step 6 — List commits

Get commits touching rihal paths since state creation:

```bash
git log --since="$(date -d '$(cat .rihal/state.json | jq -r .created)' '+%Y-%m-%dT%H:%M:%S')" --oneline -- .rihal rihal/ .planning 2>/dev/null || git log --all --oneline -- .rihal rihal/ .planning 2>/dev/null | head -20
```

Extract commit hashes and subjects. If git errors, report gracefully (project may not be git-based).

## Step 7 — Build report

Write `.planning/SESSION-REPORT-{YYYY-MM-DD-HHmmss}.md` with this structure:

```markdown
# Session Report — {project_name}

**Period:** {start_date} → {end_date} ({duration})

## Work Summary

- **Current Phase:** {phase or "None started"}
- **Plan Progress:** {current_plan} / {total_plans}
- **Council Sessions:** {count}
- **Chains:** {count}
- **Discusses:** {count}
- **Decisions Logged:** {count}
- **Blockers Identified:** {count} ({open_count} open)
- **Commits:** {count}

## Estimated Token Usage

**Note:** Token estimates are approximations based on artifact counts.

- Council Sessions: {count} × 50K = {total}K
- Chains: {count} × 30K = {total}K
- Discusses: {count} × 10K = {total}K
- Execute/Deploy: {count} × 20K = {total}K
- **Total Estimate: {grand_total}K tokens**

## Recent Decisions

{list last 5 decisions, format: "• {decision} — {phase} ({date})"}

{or: "No decisions logged in this session."}

## Open Blockers

{list all unresolved blockers, format: "⚠ {description} — {phase} (added {date})"}

{or: "No open blockers."}

## Recent Council Sessions

{list last 5 council sessions, format: "• {date} — {question_slug} — Panel: {panel}"}

{or: "No council sessions in this session."}

## Commits in Phase

{list commits with hash and subject}

{or: "No commits to tracked paths."}

## Next Steps

- Address {count} open blocker(s) before proceeding
- Plan next phase with `/rihal:plan-phase {next_phase}`
```

## Step 8 — Print confirmation

Print success:

```
✓ Session report written to .planning/SESSION-REPORT-{date}.md
```

Then print summary:
- Period covered
- Total artifacts
- Estimated tokens
- Open blockers count

## Success Criteria

- [ ] `.planning/SESSION-REPORT-{date}.md` written with all sections populated
- [ ] Report includes artifact counts, token estimates, decisions, blockers, and commits
- [ ] Confirmation message printed with period and summary
- [ ] Report is readable markdown with proper formatting

## On Error

- **No state.json found:** print error and stop (Step 1).
- **state.json has invalid JSON:** print error with path and stop.
- **No artifacts in .planning/:** report gracefully ("No session artifacts found yet.").
- **Git not available:** report gracefully ("Git not available, skipping commit history.").
- **Write permission denied to .planning/:** print error and stop.
- **Insufficient readable history:** report gracefully and skip that section.
