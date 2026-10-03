# Workflow: rihal:workstream

<purpose>
Manage parallel workstreams (milestone tracks) in Rihal. A workstream is an independent execution path with its own phases and tasks. Multiple workstreams can run in parallel, sharing decisions, blockers, and council sessions. This workflow handles creation, switching, listing, and completion of workstreams stored in state.json.
</purpose>

<required_reading>
@.rihal/references/workstream-flag.md
</required_reading>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:
- Print the usage block below
- STOP — do not proceed to Step 1

**Usage:**
```
/rihal:workstream create --name <name>
/rihal:workstream switch --name <name>
/rihal:workstream list
/rihal:workstream status
/rihal:workstream complete --name <name>
```

**Examples:**
```
/rihal:workstream create --name "Frontend Redesign"
/rihal:workstream switch --name "Frontend Redesign"
/rihal:workstream list
/rihal:workstream status
/rihal:workstream complete --name "Backend Migration"
```

Only after the user provides arguments, proceed to Step 1.

## Step 1 — Parse arguments

Extract from `$ARGUMENTS`:
- `subcommand` — one of: `create`, `switch`, `list`, `status`, `complete`
- `--name` flag value (for `create`, `switch`, `complete`)

Call the state helper:
```bash
RESULT=$(node .rihal/bin/rihal-tools.cjs state workstream-validate "$subcommand" --name "${NAME}" 2>&1)
```

If validation fails, print error and STOP.

## Step 2 — Execute subcommand

### Subcommand: create

**Check:** name is not empty, does not already exist in state.json workstreams.

**Execute:**
```bash
node .rihal/bin/rihal-tools.cjs state workstream-create --name "$NAME"
```

**Output:**
```
✅ Workstream created: {name}
   ID: {id}
   Active: false
   Phases: 0
```

Set it as active unless user specifies `--no-activate` (not currently supported — leave for future).

### Subcommand: switch

**Check:** name exists in workstreams.

**Execute:**
```bash
node .rihal/bin/rihal-tools.cjs state workstream-switch --name "$NAME"
```

**Output:**
```
✅ Switched to workstream: {name}
   Previous: {old_name}
   Phases in this workstream: {count}
```

### Subcommand: list

**Execute:**
```bash
node .rihal/bin/rihal-tools.cjs state workstream-list
```

**Output (formatted table):**
```
Name                     Active  Completed  Phases  Created
─────────────────────────────────────────────────────────────
Frontend Redesign        ✓       ✗          3       2026-04-12
Backend Migration        ✗       ✓          2       2026-04-10
API Refactor             ✗       ✗          1       2026-04-09
```

### Subcommand: status

**Execute:**
```bash
node .rihal/bin/rihal-tools.cjs state workstream-status
```

**Output:**
```
📌 Current Workstream

Name: {name}
Active: {yes|no}
Completed: {yes|no}
Phases: {count}
Created: {date}

Recent phases:
  - {phase_name} ({date})
  - {phase_name} ({date})
```

### Subcommand: complete

**Check:** name exists and is not already completed.

**Execute:**
```bash
node .rihal/bin/rihal-tools.cjs state workstream-complete --name "$NAME"
```

**Output:**
```
✅ Marked workstream complete: {name}
   Completed at: {ISO date}
   All phases: {count}
   Commits in this workstream: {count}
```

## Step 3 — Update state validation

After any state mutation (create/switch/complete), validate:
- workstreams array exists
- active_workstream field is set
- no duplicate names
- all workstreams have: name, created (ISO), active (bool), completed (bool), phases (array)

## Data Structure

All workstreams are stored in state.json:

```json
{
  "workstreams": [
    {
      "name": "Frontend Redesign",
      "id": "ws-abc123",
      "created": "2026-04-12T10:30:00Z",
      "active": true,
      "completed": false,
      "phases": []
    }
  ],
  "active_workstream": "Frontend Redesign"
}
```

- `name` — human readable workstream name (unique)
- `id` — short UUID or hash (for future linking)
- `created` — ISO timestamp when created
- `active` — boolean, only one workstream is active at a time
- `completed` — boolean, marks workstream as done
- `phases` — array of phase objects that belong to this workstream

**Shared state** (NOT scoped to workstream):
- `decisions` — all decisions apply to all workstreams
- `blockers` — all blockers apply to all workstreams
- `council_sessions` — sessions record which workstream they apply to (if any)

**Future:** phases will record which workstream they belong to via `workstream_id` field.

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

