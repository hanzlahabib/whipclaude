<purpose>
Show all changes to .planning/ and .rihal/state.json between two commits, labeled by phase/plan ID.
</purpose>

## Step 0: Usage Check

Parse arguments:
- No args → diff HEAD~1 to HEAD (last commit vs parent)
- `--last` → diff against the previous session's last commit (read from state.json `last_session_commit`)
- `<sha1> <sha2>` → diff between explicit commits

If invalid args: Show usage

```
Usage:
  /rihal:diff              # Diff HEAD~1 to HEAD
  /rihal:diff --last       # Diff against last session
  /rihal:diff abc123 def456  # Diff between commits
```

## Step 1: Parse Arguments

Extract SHAs:
- If no args: `sha1 = HEAD~1`, `sha2 = HEAD`
- If `--last`: Read `.rihal/state.json`, extract `sessions[].commit`, use oldest in current session as sha1, HEAD as sha2
- If explicit SHAs: Use as provided

## Step 2: Run Git Diff

```bash
git diff $sha1 $sha2 -- .planning/ .rihal/state.json
```

Capture output.

If no changes: Return `No changes between {sha1}..{sha2}`

## Step 3: Label Each Diff Hunk

For each file in diff output:

1. Extract filename: `.planning/phases/01-foundation/01-01-SPRINT.md`
2. Read that file's YAML frontmatter (if .md): extract phase/plan ID
3. Prefix the hunk with: `Phase {id} — {filename}`
4. Show the diff +/- lines

For `.rihal/state.json`: Show raw diff (no frontmatter parsing)

Example output:

```
Phase 01-01 — .planning/phases/01-foundation/01-01-SPRINT.md
  @@ -5,3 +5,4 @@
  - old line
  + new line

State changes — .rihal/state.json
  @@ -12,2 +12,3 @@
  - "status": "pending"
  + "status": "completed"
```

## Success Criteria

- [ ] Arguments parsed correctly
- [ ] Git diff executed
- [ ] Hunks labeled with phase/plan ID
- [ ] Output is readable and scannable

## On Error

- Git error (invalid SHAs, not a repo) → Show git error
- state.json missing for `--last` → "Cannot find session info. Use explicit SHAs or no args."
- No changes → Return message "No changes between {shas}"
