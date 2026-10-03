# Workflow: rihal:update

<purpose>
Detect package updates for rihal-code by comparing installed file hashes against source package hashes. Show changelog (added/changed/removed files), ask user confirmation, then run installer with --force --yes if approved.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:update <argument-here>
```

**Examples:**
```
/rihal:update example 1
/rihal:update example 2
```

STOP — do not proceed.

## Step 1 — Locate installed package

Find the rihal-code package using one of these strategies (in order):
1. Check `$(npm root -g)/rihal-code/cli/install-v2.js` (global install)
2. Check `./cli/install-v2.js` (local install)
3. If neither exists, print:
   ```
   ❌ rihal-code package not found. Install with:
   npm install -g rihal-code
   ```
   Exit.

Store the installer path in `$INSTALLER_PATH`.

## Step 2 — Read installed manifest

Read `.rihal/_config/files-manifest.csv` from the current project:

```bash
cat .rihal/_config/files-manifest.csv
```

If the file doesn't exist:
```
ℹ️ No rihal installation detected in this project.
Run: node <installer-path> . --force --yes
```
Exit.

Parse the CSV (columns: `rel,sha256,size`). Store as `$INSTALLED_HASHES` (map rel → sha256).

## Step 3 — Read source manifest

Run the installer helper to read the source package's file list:

```bash
node "$INSTALLER_PATH" --list-files 2>/dev/null || echo "[]"
```

If that flag doesn't exist, walk the source package's `rihal/` directory manually:
- Find all files in `$(npm root -g)/rihal-code/rihal/` (or local `./rihal/`)
- Compute SHA256 for each
- Store as `$SOURCE_HASHES` (map rel → sha256)

## Step 4 — Compute changelog

Compare `$INSTALLED_HASHES` against `$SOURCE_HASHES`:

- **Added:** files in SOURCE but not in INSTALLED
- **Changed:** files in both with different SHA256
- **Removed:** files in INSTALLED but not in SOURCE

Count each category. Store results in `$ADDED`, `$CHANGED`, `$REMOVED` (arrays of rel paths).

If all three lists are empty:
```
✅ rihal-code is up to date (no changes detected)
```
Exit.

## Step 5 — Print changelog

Print a human-readable changelog:

```
📦 rihal-code Update Available

Added files (3):
  ✨ rihal/commands/update.md
  ✨ rihal/workflows/update.md
  ✨ rihal/commands/stats.md

Changed files (2):
  🔄 rihal/modules/core.yaml
  🔄 cli/install-v2.js

Removed files (1):
  ❌ rihal/references/old-style.md

Total: +3 / ~2 / -1
```

## Step 6 — Ask user confirmation

Call AskUserQuestion:

```
Proceed with update?

Options:
[1] Proceed — Apply update
[2] Cancel — Skip for now
[3] Show diff — List all changed files
```

- If user chooses [3], print full diff (all added/changed/removed file names, 1 per line)
- Then re-ask the confirmation question
- If user chooses [1], proceed to Step 7
- If user chooses [2], print "Update cancelled" and exit

## Step 7 — Apply update

Run the installer with `--force --yes`:

```bash
node "$INSTALLER_PATH" . --force --yes
```

If the command exits with non-zero status, print:
```
❌ Update failed. Check the output above.
```
Exit with error code.

## Step 8 — Pull Rihal brain content (v2.0)

After installer finishes, refresh the brain content from configured sources (issue #158). This is idempotent and safe to re-run.

```bash
node .rihal/bin/rihal-tools.cjs brain pull
```

Parse the JSON output. Report counts to the user:
- `pulled[]` — sources actually fetched (git or in-repo)
- `skipped[]` — sources with `<PLACEHOLDER>` URLs (waiting on issue #162 / M5)
- `errors[]` — sources that failed (network, auth, etc.)

If the user passed a version argument (`/rihal:update v1.3.0`), pass it through to `brain pull` as `--version v1.3.0`. When supported, `brain pull` will pin each source to the commit recorded in that release's `sources.yaml`. Unknown versions: treat as latest and warn.

## Step 9 — Success summary

Print:

```
✅ rihal-code updated successfully

Updated files: N
  - file-path-1
  - file-path-2
  ...

Rihal brain: M sources pulled, K skipped (placeholder URLs)

New version available at: .rihal/

Run /rihal:status to verify installation.
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

