# Workflow: rihal:list-plans

<purpose>
Display a table of all SPRINT.md plans across every phase in `.planning/phases/`. Gives a single-screen view of every plan in the project — phase, sprint ID, goal, story counts, point totals, and execution state. Use before starting new work to see what's already planned or in flight.
</purpose>

<output_format>
Open with banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► PLANS ACROSS ALL PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use status symbols in the Status column: ✓ done · ◆ active · ○ todo · ⚠ blocked.
End with totals footer and Next Up routing hint.
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` contains `--help` or `-h`:

```
/rihal:list-plans [--phase <id>] [--status <state>] [--detail]

  --phase <id>     Filter to one phase (e.g. 04 or 04-dashboard-refresh)
  --status <state> Filter by plan state: todo | active | done | blocked
  --detail         Include per-story breakdown under each plan
```

STOP — do not proceed.

## Step 1 — Locate phases

```bash
PHASES_DIR=".planning/phases"
```

If `$PHASES_DIR` does not exist, print:

```
No plans yet. This project has no `.planning/phases/` directory.

Create the first plan:
  /rihal:plan "<task description>"
```

STOP.

List every directory under `$PHASES_DIR`. For each directory, check for a `SPRINT.md` file. Directories without a `SPRINT.md` are reported separately as "Unplanned phases".

## Step 2 — Parse each SPRINT.md

For every `SPRINT.md` found, extract:

**From YAML frontmatter:**
- `phase` — phase ID (e.g. `05-dashboard-refresh`)
- `sprint` — sprint ID (e.g. `05.1`)
- `type` — plan type (e.g. `execute`)
- `autonomous` — true/false

**From body:**
- Goal: the text after `**Goal:**` on the first heading line
- Stories table: parse rows matching `| {id} | {title} | {points} | {status} | {ac} |`
  - Count stories by status: `todo`, `in_progress`, `review`, `done`, `blocked`
  - Sum points per status bucket

**Derive plan state:**
- `done` — all stories are `done`
- `blocked` — any story is `blocked`
- `active` — any story is `in_progress` or `review`
- `todo` — all stories are `todo`

## Step 3 — Apply filters

- If `--phase <id>`: keep only plans whose phase ID matches (prefix match allowed, e.g. `04` matches `04-dashboard-refresh`)
- If `--status <state>`: keep only plans whose derived state equals `<state>`

## Step 4 — Render the table

```
| Phase                  | Sprint | Goal                                  | Stories    | Points    | State  |
|------------------------|--------|---------------------------------------|------------|-----------|--------|
| 04-dashboard-refresh   | 04.1   | Dashboard shows tier breakdown...     | 0/5        | 0/15      | ○ todo |
| 05-marketing-launch    | 05.1   | Publish to npm, polish README, demo   | 0/6        | 0/13      | ○ todo |
```

Truncate `Goal` to 40 chars with ellipsis if longer. Widen the table if the terminal allows.

## Step 5 — Detail view (if `--detail`)

For each plan, after its table row, print its story breakdown indented:

```
  04-dashboard-refresh / 04.1 — Dashboard Refresh
    ✓ 04.1.01  Add tier view (Starter/Advanced/Ultra)               3pt  done
    ◆ 04.1.02  Add sprint progress visualization                    5pt  in_progress
    ○ 04.1.03  Add velocity chart                                   3pt  todo
    ○ 04.1.04  Show council session list                            2pt  todo
    ○ 04.1.05  Fix GH #12 — render per-sprint state                 2pt  todo
```

## Step 6 — Footer + totals

```
Totals: {N} plans · {done_stories}/{total_stories} stories · {done_pts}/{total_pts} points

  ○ todo:    {n}     ◆ active:  {n}
  ✓ done:    {n}     ⚠ blocked: {n}
```

## Step 7 — Next Up routing

Pick ONE suggestion based on the current state:

- If there is an `active` plan → `Next: /rihal:sprint-status --sprint <id>` (that plan's sprint ID)
- If no active but todos exist → `Next: /rihal:execute .planning/phases/<first-todo-phase>/SPRINT.md`
- If a plan is `blocked` → `Next: /rihal:correct-course --phase <id>`
- If all done → `Next: /rihal:new-milestone  (or `/rihal:sprint-planning` for the next sprint)`

If unplanned phases exist, also print:

```
⚠ Phases without SPRINT.md: {list}
  Draft a plan:  /rihal:plan --phase <id>
```
</process>

## Success Criteria

- Every `.planning/phases/*/SPRINT.md` appears exactly once in the table
- Plan state (done/active/todo/blocked) is correctly derived from story statuses
- `--phase` and `--status` filters return only matching rows
- `--detail` adds per-story lines without changing the top table
- Phases missing `SPRINT.md` are flagged, not silently skipped
- Next Up suggestion points to a runnable command

## On Error

If a `SPRINT.md` has malformed frontmatter or a broken stories table, list it under "Unparseable plans" at the bottom with the parse error, and continue rendering the rest. Do not abort the whole listing because one file is bad.
