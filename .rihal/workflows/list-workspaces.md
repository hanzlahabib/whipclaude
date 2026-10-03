# Workflow: rihal:list-workspaces

<purpose>
Display all active workspaces with summary status, creation date, and current phase. Use this to understand what parallel work is happening and switch contexts.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` contains only `--help` or `-h`:

```
/rihal:list-workspaces [--detail]
```

STOP — do not proceed.

## Step 1 — Check for workspaces

Verify `.rihal/workspaces.csv` exists. If not:

```
No workspaces defined yet. Create one:

/rihal:new-workspace <name>
```

STOP.

## Step 2 — Parse workspaces.csv

Read `.rihal/workspaces.csv` and parse each row:

```csv
name,path,created,status,parent
{name},{path},{date},{status},{parent}
```

Store in `$WORKSPACES` array.

## Step 3 — Gather workspace status

For each workspace, read:
- `{path}/planning/STATE.md` → extract current phase, active work count
- `{path}/.workspace-meta.json` → extract description

## Step 4 — Display summary table

Print table:

```
Active Workspaces

| Name                | Created  | Status    | Current Phase | Files |
|---------------------|----------|-----------|---------------|-------|
| {name}              | {date}   | {status}  | {phase}       | {#}   |
| {name}              | {date}   | {status}  | {phase}       | {#}   |

Total: {count} workspaces
```

## Step 5 — Display detail (if --detail flag)

For each workspace:

```
Workspace: {NAME}

  Location: {path}
  Created: {date}
  Status: {status}
  Current Phase: {phase}
  
  Recent Activity:
    - Last updated: {date}
    - Active tasks: {count}
    - Phases completed: {count}
  
  Use: /rihal:plan <task> --workspace={name}
```

## Step 6 — Report

If no workspaces:

```
No workspaces yet. Create one:

/rihal:new-workspace <name>
```

Otherwise:

```
✓ {count} active workspaces
  Use --detail for full status
  Switch: /rihal:workspace <name>
  Remove: /rihal:remove-workspace <name>
```

## Success Criteria

- All workspaces listed with status
- Creation date and current phase visible
- User can see what work is happening in parallel
- Easy switch/remove instructions provided

## On Error

If `.rihal/workspaces.csv` is malformed:

```
⚠ Workspaces file corrupted. Attempting to list from disk:
```

Then list directories in `.rihal/workspaces/` directly.
