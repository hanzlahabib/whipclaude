# Workflow: rihal:sprint-status

<purpose>
Display current sprint progress: stories by status, points done vs remaining, velocity comparison, and burndown. Quick situational awareness without starting execution.
</purpose>

<output_format>
Open with banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► SPRINT {NN.S} STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
Use status symbols (✓ done, ◆ in_progress, ○ todo) in story board.
Show sprint progress bar: `Sprint 01.1: 8/13 points ████████░░░░░ 61%`.
Show velocity line: `Velocity: avg 11 pts (last 3 sprints)`.
End with Next Up routing based on sprint state.
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` contains `--help` or `-h`:

```
/rihal:sprint-status [--sprint <NN.S>]
```

**Examples:**
```
/rihal:sprint-status              # current sprint
/rihal:sprint-status --sprint 01.2
```

STOP — do not proceed.

## Step 1 — Load sprint data

```bash
SPRINT_STATUS=$(node .rihal/bin/rihal-tools.cjs state sprint status)
VELOCITY=$(node .rihal/bin/rihal-tools.cjs state sprint velocity)
STORIES=$(node .rihal/bin/rihal-tools.cjs state story list)
```

If no current sprint:
```
No active sprint. Run /rihal:sprint-planning to create one.
```
Exit.

## Step 2 — Display

Print a compact status board:

```
Sprint {sprint_id} — {goal}
Status: {active|planned|completed}

Stories                         Points
  todo:        {n}              done:      {done_pts}/{total_pts}
  in_progress: {n}              remaining: {rem_pts}
  review:      {n}              target:    {velocity_target}
  done:        {n}
  ────────────                  ────────────
  total:       {total}          progress:  {pct}%

Velocity
  This sprint: {velocity_actual or "in progress"}
  Average:     {avg_velocity} (last {sprint_count} sprints)
  Trend:       {up/down/stable}
```

## Step 3 — Story board

Show stories grouped by status:

```
IN PROGRESS
  {id} {title} ({points}pts)

TODO
  {id} {title} ({points}pts)

DONE
  {id} {title} ({points}pts) ✓

REVIEW
  {id} {title} ({points}pts)
```

## Step 4 — Recommendations

Based on data, suggest next action:

- **All stories done:** "Sprint ready to close. Run `/rihal:sprint-planning` for next sprint."
- **In progress stories exist:** "Continue executing. Run `/rihal:execute` to pick up next story."
- **Over capacity (committed > velocity avg):** "Over-committed by {N} points. Consider deferring lowest-priority story."
- **No stories moved today:** "No progress since last check. Blockers?"

## Output Format

- Compact terminal-friendly status board (no markdown tables, just aligned text)
- Story board grouped by status
- One-line recommendation with actionable command

## Examples

### Happy Path
**Input:** `/rihal:sprint-status`
**Expected:** Board showing 3 done / 1 in_progress / 2 todo, 8/13 points, velocity trend stable.

### Edge Case: No sprint
**Input:** `/rihal:sprint-status` (no active sprint)
**Expected:** "No active sprint" + suggestion to run sprint-planning.

### Negative Test
**Input:** `/rihal:sprint-status --sprint 99.9`
**Expected:** "Sprint 99.9 not found."

</process>
