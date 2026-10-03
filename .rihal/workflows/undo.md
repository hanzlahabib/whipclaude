<purpose>
Safe git revert workflow. Rolls back Rihal phase or plan commits using the phase manifest with dependency checks and a confirmation gate. Uses git revert --no-commit (NEVER git reset) to preserve history.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:undo <argument-here>
```

**Examples:**
```
/rihal:undo example 1
/rihal:undo example 2
```

STOP — do not proceed.

<required_reading>
@.rihal/references/ui-brand.md
@.rihal/references/gate-prompts.md
</required_reading>

<process>

<step name="banner" priority="first">
Display the stage banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Rihal ► UNDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="parse_arguments">
Parse $ARGUMENTS for the undo mode:

- `--last N` → MODE=last, COUNT=N (integer, default 10 if N missing)
- `--phase NN` → MODE=phase, TARGET_PHASE=NN (two-digit phase number)
- `--plan NN-MM` → MODE=plan, TARGET_PLAN=NN-MM (phase-plan ID)
- `--to-snapshot` → TO_SNAPSHOT=true (only combines with `--phase NN`). Uses the pre-execution git tag `rihal/snapshot/phase-NN` to determine the full commit range to revert — guaranteed to restore exact pre-execution state regardless of manifest accuracy.

If no valid argument is provided, display usage and exit:

```
Usage: /rihal:undo --last N | --phase NN [--to-snapshot] | --plan NN-MM

Modes:
  --last N              Show last N Rihal commits for interactive selection
  --phase NN            Revert all commits for phase NN (uses manifest, fallback to git log)
  --phase NN --to-snapshot
                        Revert every commit between rihal/snapshot/phase-NN and HEAD —
                        exact restore to the pre-execution tag created by /rihal:execute
  --plan NN-MM          Revert all commits for plan NN-MM

Examples:
  /rihal:undo --last 5
  /rihal:undo --phase 03
  /rihal:undo --phase 03 --to-snapshot
  /rihal:undo --plan 03-02
```

</step>

<step name="confirmation_gate" priority="safety">
**SAFETY GATE — This is a destructive operation. Confirmation is mandatory.**

Before gathering any commits, display:

```
⚠  UNDO is destructive — commits will be reverted via git revert --no-commit.

Unsure what will be reverted? Run first:

/rihal:undo --last 5

to preview the last 5 Rihal commits before choosing.
```

Use AskUserQuestion with explicit confirmation:

```
AskUserQuestion(
  header: "Confirm Undo",
  question: "Proceed with undo operation?",
  options: [
    { label: "Preview first", description: "Show what will be reverted" },
    { label: "Proceed", description: "Continue with undo" },
    { label: "Cancel", description: "Abort" }
  ]
)
```

**If "Cancel":** display "Undo cancelled. No changes made." and exit.

**If "Preview first":** temporarily switch MODE to `last` with COUNT=5, gather and display commits (do NOT confirm-revert yet), then re-ask this gate.

**If "Proceed":** continue to gather_commits.

</step>

<step name="gather_commits">
Based on MODE, gather candidate commits.

**MODE=last:**

Run:
```bash
git log --oneline --no-merges -${COUNT}
```

Filter for Rihal conventional commits matching `type(scope): message` pattern (e.g., `feat(04-01):`, `docs(03):`, `fix(02-03):`).

Display a numbered list of matching commits:
```
Recent Rihal commits:
  1. abc1234 feat(04-01): implement auth endpoint
  2. def5678 docs(03-02): complete plan summary
  3. ghi9012 fix(02-03): correct validation logic
```

Use AskUserQuestion to ask:
- question: "Which commits to revert? Enter numbers (e.g., 1,3) or 'all'"
- header: "Select"

Parse the user's selection into COMMITS list.

---

**MODE=phase:**

**If `TO_SNAPSHOT` is true:**

```bash
SNAPSHOT_TAG="rihal/snapshot/phase-${TARGET_PHASE}"
if ! git rev-parse --verify "refs/tags/${SNAPSHOT_TAG}" >/dev/null 2>&1; then
  cat <<EOF
No snapshot tag found: ${SNAPSHOT_TAG}

Snapshots are created automatically when /rihal:execute runs for a phase.
Options:
  - Drop --to-snapshot and use manifest/git-log fallback:   /rihal:undo --phase ${TARGET_PHASE}
  - Re-run /rihal:execute <phase> to create a snapshot for future undo
EOF
  exit 0
fi

mapfile -t COMMITS < <(git log --pretty=format:%H --no-merges "${SNAPSHOT_TAG}..HEAD")
```

If the range is empty (HEAD is already at the snapshot):
```
Nothing to revert — HEAD already matches ${SNAPSHOT_TAG}.
```
Exit cleanly. Skip the rest of this step.

Otherwise set `SNAPSHOT_SHA=$(git rev-parse --short "${SNAPSHOT_TAG}")` for use in the confirm_revert preview (display the target SHA).

---

**If `TO_SNAPSHOT` is false (default):**

Read `.planning/.phase-manifest.json` if it exists.

If the file exists and `manifest.phases?.[TARGET_PHASE]?.commits` is a non-empty array:
  - Use `manifest.phases[TARGET_PHASE].commits` entries as COMMITS (each entry is a commit hash)

If the file does not exist, or `manifest.phases?.[TARGET_PHASE]` is missing:
  - Display: "Manifest has no entry for phase ${TARGET_PHASE} (or file missing), falling back to git log search"
  - Fallback: run git log and filter for the target phase scope:
    ```bash
    git log --oneline --no-merges --all | grep -E "\(0*${TARGET_PHASE}(-[0-9]+)?\):" | head -50
    ```
  - Use matching commits as COMMITS

---

**MODE=plan:**

Run:
```bash
git log --oneline --no-merges --all | grep -E "\(${TARGET_PLAN}\)" | head -50
```

Use matching commits as COMMITS.

---

**Empty check:**

If COMMITS is empty after gathering:
```
No commits found for ${MODE} ${TARGET}. Nothing to revert.
```
Exit cleanly.
</step>

<step name="dependency_check">
**Applies when MODE=phase or MODE=plan.**

Skip this step entirely for MODE=last.

---

**MODE=phase:**

Read `.planning/ROADMAP.md` inline.

Search for phases that list a dependency on the target phase. Look for patterns like:
- "Depends on: Phase ${TARGET_PHASE}"
- "Depends on: ${TARGET_PHASE}"
- "depends_on: [${TARGET_PHASE}]"

For each dependent phase N found:
1. Check if `.planning/phases/${N}-*/` directory exists
2. If directory exists, check for any SPRINT.md or SUMMARY.md files inside it

If any downstream phase has started work, collect warnings:
```
⚠  Downstream dependency detected:
   Phase ${N} depends on Phase ${TARGET_PHASE} and has started work.
```

---

**MODE=plan:**

Extract the phase number from TARGET_PLAN (the NN part of NN-MM). Extract the plan number (the MM part).

Look for later plans in the same phase directory (`.planning/phases/${NN}-*/`). For each later plan (plans with number > MM):
1. Read the later plan's SPRINT.md
2. Check if its `<files>` sections or `consumes` fields reference outputs from the target plan
3. Also scan later plan's frontmatter for `depends_on:` field matching the target plan ID

If any later plan references the target plan's outputs, collect warnings:
```
⚠  Intra-phase dependency detected:
   Plan ${LATER_PLAN} in phase ${NN} references outputs from plan ${TARGET_PLAN}.
```

---

If any warnings exist (from either mode):
- Display all warnings
- Use AskUserQuestion with approve-revise-abort pattern:
  - question: "Downstream work depends on the target being reverted. Proceed anyway?"
  - header: "Confirm"
  - options: Proceed | Abort

If user selects "Abort": exit with "Revert cancelled. No changes made."
</step>

<step name="confirm_revert">
Display the confirmation gate using approve-revise-abort pattern from gate-prompts.md.

Show:
```
The following commits will be reverted (in reverse chronological order):

  {hash} — {message}
  {hash} — {message}
  ...

Total: {N} commit(s) to revert
```

Use AskUserQuestion:
- question: "Proceed with revert?"
- header: "Approve?"
- options: Approve | Abort

If "Abort": display "Revert cancelled. No changes made." and exit.
If "Approve": ask for a reason:

```
AskUserQuestion(
  header: "Reason",
  question: "Brief reason for the revert (used in commit message):",
  options: []
)
```

Store the response as REVERT_REASON. Continue to execute_revert.
</step>

<step name="execute_revert">
**HARD CONSTRAINT: Use git revert --no-commit. NEVER use git reset (except for conflict cleanup as documented below).**

**Dirty-tree guard (run first, before any revert):**

Run `git status --porcelain`. If the output is non-empty, display the dirty files and abort:
```
Working tree has uncommitted changes. Commit or stash them before running /rihal:undo.
```
Exit immediately — do not proceed to any revert operations.

---

Sort COMMITS in reverse chronological order (newest first). If commits came from git log (already newest-first), they are already in correct order.

For each commit hash in COMMITS:
```bash
git revert --no-commit ${HASH}
```

If any revert fails (merge conflict or error):
1. Display the error message
2. Run cleanup — handle both first-call and mid-sequence cases:
   ```bash
   # Try git revert --abort first (works if this is the first failed revert)
   git revert --abort 2>/dev/null
   # If prior --no-commit reverts already staged cleanly before this failure,
   # revert --abort may be a no-op. Clean up staged and working tree changes:
   git reset HEAD 2>/dev/null
   git restore . 2>/dev/null
   ```
3. Display:
   ```
   ╔══════════════════════════════════════════════════════════════╗
   ║  ERROR                                                       ║
   ╚══════════════════════════════════════════════════════════════╝

   Revert failed on commit ${HASH}.
   Likely cause: merge conflict with subsequent changes.

   **To fix:** Resolve the conflict manually or revert commits individually.
   All pending reverts have been aborted — working tree is clean.
   ```
4. Exit with error.

After all reverts are staged successfully, create a single commit:

For MODE=phase (default):
```bash
git commit -m "revert(${TARGET_PHASE}): undo phase ${TARGET_PHASE} — ${REVERT_REASON}"
```

For MODE=phase with `--to-snapshot`:
```bash
git commit -m "revert(${TARGET_PHASE}): restore phase ${TARGET_PHASE} to snapshot ${SNAPSHOT_SHA} — ${REVERT_REASON}"
```

For MODE=plan:
```bash
git commit -m "revert(${TARGET_PLAN}): undo plan ${TARGET_PLAN} — ${REVERT_REASON}"
```

For MODE=last:
```bash
git commit -m "revert: undo ${N} selected commits — ${REVERT_REASON}"
```
</step>

<step name="summary">
Display the completion banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Rihal ► UNDO COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Show summary:
```
  ✓ ${N} commit(s) reverted
  ✓ Single revert commit created: ${REVERT_HASH}
```

Show next steps:
```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**Review state** — verify project is in expected state after revert

/clear then:

/rihal:progress

───────────────────────────────────────────────────────────────

**Also available:**
- `/rihal:execute ${PHASE}` — re-execute if needed
- `/rihal:undo --last 1` — undo the revert itself if something went wrong

───────────────────────────────────────────────────────────────
```
</step>

</process>

<success_criteria>
- [ ] Arguments parsed correctly for all three modes
- [ ] --phase mode reads .planning/.phase-manifest.json using manifest.phases[TARGET_PHASE].commits
- [ ] --phase mode falls back to git log if manifest entry missing
- [ ] --phase --to-snapshot uses rihal/snapshot/phase-NN tag and reverts ${TAG}..HEAD
- [ ] --to-snapshot exits cleanly when the snapshot tag is missing (no surprise no-op)
- [ ] Dependency check warns when downstream phases have started (MODE=phase)
- [ ] Dependency check warns when later plans reference target plan outputs (MODE=plan)
- [ ] Dirty-tree guard aborts if working tree has uncommitted changes
- [ ] Confirmation gate shown before any revert execution
- [ ] Reverts use git revert --no-commit in reverse chronological order
- [ ] Single commit created after all reverts staged
- [ ] Error handling cleans up both first-call and mid-sequence conflict cases
- [ ] git reset --hard is NEVER used anywhere in this workflow
</success_criteria>

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

