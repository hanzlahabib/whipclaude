# Workflow: rihal:new-workspace

<purpose>
Create an isolated workspace for parallel work. Workspaces are independent planning directories with their own ROADMAP, STATE, and phases. Use when multiple concurrent initiatives need to run without interfering (e.g., "Q2 Platform Work" + "Bug Fix Sprint" in parallel).
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or only `--help` or `-h`:

```
/rihal:new-workspace <workspace-name> [--from-current]
```

**Examples:**
```
/rihal:new-workspace Bug Fix Sprint
/rihal:new-workspace --from-current Emergency Hotfix
```

STOP — do not proceed.

## Step 1 — Parse arguments

Extract from `$ARGUMENTS`:
- `$WORKSPACE_NAME` — the workspace name (e.g., "Bug Fix Sprint")
- `--from-current` flag → copy current planning state into new workspace

If `$WORKSPACE_NAME` is empty, ask:

```
AskUserQuestion(
  header: "New Workspace",
  question: "Give the workspace a name (e.g., 'Q2 Performance')",
  followUp: null
)
```

## Step 2 — Create workspace directory

Create workspace structure:

```bash
WORKSPACE_DIR=".rihal/workspaces/$(echo $WORKSPACE_NAME | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
mkdir -p "$WORKSPACE_DIR"
```

Initialize subdirectories:

```bash
mkdir -p "$WORKSPACE_DIR/planning"
mkdir -p "$WORKSPACE_DIR/phases"
mkdir -p "$WORKSPACE_DIR/artifacts"
```

## Step 3 — Initialize workspace state

If `--from-current` flag:
- Copy `.planning/ROADMAP.md` to `$WORKSPACE_DIR/planning/ROADMAP.md`
- Copy `.planning/STATE.md` to `$WORKSPACE_DIR/planning/STATE.md`
- Update timestamps and mark as "forked from main workspace"

Otherwise, create fresh files:

Create `$WORKSPACE_DIR/planning/ROADMAP.md`:

```markdown
# Workspace: {WORKSPACE_NAME}

**Created:** ISO-DATE
**Status:** PLANNING

## Scope

_Describe the work for this workspace._

## Phases

None yet.

## Success Criteria

None yet.
```

Create `$WORKSPACE_DIR/planning/STATE.md`:

```markdown
# Workspace State: {WORKSPACE_NAME}

**Created:** ISO-DATE
**Current Phase:** PLANNING

## Active Work

None yet.

## Decisions

None yet.

## Blockers

None yet.
```

## Step 4 — Create workspace metadata

Create `$WORKSPACE_DIR/.workspace-meta.json`:

```json
{
  "name": "{WORKSPACE_NAME}",
  "created": "ISO-DATE",
  "status": "active",
  "parent_workspace": "main" or "null if independent",
  "description": "Isolated workspace for parallel work"
}
```

## Step 5 — Register workspace

Create or append to `.rihal/workspaces.csv`:

```csv
name,path,created,status,parent
{WORKSPACE_NAME},{WORKSPACE_DIR},ISO-DATE,active,main
```

## Step 6 — Report

Print:

```
✓ Workspace created: {WORKSPACE_NAME}
  Location: {WORKSPACE_DIR}
  
Start work:
  /rihal:plan <task> --workspace={WORKSPACE_NAME}
  
Switch context:
  /rihal:workspace {WORKSPACE_NAME}
```

## Success Criteria

- Workspace directory created at `.rihal/workspaces/{name}/`
- ROADMAP.md and STATE.md initialized
- Workspace metadata file created
- Workspace registered in `.rihal/workspaces.csv`
- User can plan/execute within this workspace

## On Error

If workspace with that name already exists:

```
⚠ Workspace '{WORKSPACE_NAME}' already exists.
  Use a different name or: /rihal:remove-workspace {WORKSPACE_NAME}
```

If permissions prevent directory creation:

```
⚠ Cannot create workspace directory. Check permissions:
  {WORKSPACE_DIR}
```
