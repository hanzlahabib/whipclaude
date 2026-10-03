# Workflow: rihal:remove-workspace

<purpose>
Remove a workspace and clean up all its artifacts. This is destructive — deleted workspaces cannot be recovered unless `--archive` flag is used. Use when a parallel work stream is complete or abandoned.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or only `--help` or `-h`:

```
/rihal:remove-workspace <workspace-name> [--archive] [--force]
```

**Examples:**
```
/rihal:remove-workspace Bug Fix Sprint
/rihal:remove-workspace Emergency --force
/rihal:remove-workspace Old Work --archive
```

STOP — do not proceed.

## Step 1 — Parse arguments

Extract from `$ARGUMENTS`:
- `$WORKSPACE_NAME` — the workspace to remove
- `--archive` flag → copy to `.rihal/workspace-archive/` before deleting
- `--force` flag → skip confirmation prompt

If `$WORKSPACE_NAME` is empty, ask:

```
AskUserQuestion(
  header: "Remove Workspace",
  question: "Which workspace? (list: /rihal:list-workspaces)"
)
```

## Step 2 — Locate workspace

Read `.rihal/workspaces.csv` and find the row matching `$WORKSPACE_NAME`.

Extract `$WORKSPACE_PATH` from the CSV row.

If not found:

```
⚠ Workspace not found: {WORKSPACE_NAME}
  List workspaces: /rihal:list-workspaces
```

STOP.

Verify the directory exists:

```bash
if [[ ! -d "$WORKSPACE_PATH" ]]; then
  echo "⚠ Workspace directory not found: $WORKSPACE_PATH"
  exit 1
fi
```

## Step 3 — Confirm deletion (unless --force)

If NOT `--force` flag:

```
About to delete workspace: {WORKSPACE_NAME}
  Location: {WORKSPACE_PATH}
  
This cannot be undone. Continue? (y/N)

AskUserQuestion(
  header: "Confirm Deletion",
  question: "Delete {WORKSPACE_NAME}?"
)
```

If user says no, STOP.

## Step 4 — Archive workspace (if requested)

If `--archive` flag:

```bash
ARCHIVE_BASE=".rihal/workspace-archive"
mkdir -p "$ARCHIVE_BASE"
ARCHIVE_PATH="$ARCHIVE_BASE/$(basename $WORKSPACE_PATH)-$(date +%s)"
cp -r "$WORKSPACE_PATH" "$ARCHIVE_PATH"
echo "✓ Workspace archived: $ARCHIVE_PATH"
```

## Step 5 — Delete workspace directory

```bash
rm -rf "$WORKSPACE_PATH"
```

Verify deletion:

```bash
if [[ ! -d "$WORKSPACE_PATH" ]]; then
  echo "✓ Workspace deleted"
else
  echo "⚠ Failed to delete workspace. Check permissions."
  exit 1
fi
```

## Step 6 — Update workspaces registry

Remove the row from `.rihal/workspaces.csv`:

```bash
grep -v "^$WORKSPACE_NAME," ".rihal/workspaces.csv" > ".rihal/workspaces.csv.tmp"
mv ".rihal/workspaces.csv.tmp" ".rihal/workspaces.csv"
```

## Step 7 — Report

Print:

```
✓ Workspace removed: {WORKSPACE_NAME}
  [Archive location: {ARCHIVE_PATH}] (if --archive)
  
Remaining workspaces: {count}
List: /rihal:list-workspaces
```

## Success Criteria

- Workspace directory deleted
- Workspace removed from registry (workspaces.csv)
- If --archive: backed up to archive location
- User sees confirmation message

## On Error

If directory deletion fails:

```
⚠ Failed to delete workspace directory. Check:
  - File permissions
  - Open file handles
  - Disk space
  
Path: {WORKSPACE_PATH}
```

If registry update fails:

```
⚠ Failed to update workspace registry. Manual cleanup:
  rm -rf {WORKSPACE_PATH}
  Edit: .rihal/workspaces.csv (remove the {WORKSPACE_NAME} line)
```
