# Workflow: rihal:pause-work

<purpose>
Capture full project context and blocking constraints before pausing work. Creates `.rihal/HANDOFF.json` (structured machine-readable handoff) and `.rihal/.continue-here.md` (human-readable summary) for seamless context restoration on resume.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:pause-work <argument-here>
```

**Examples:**
```
/rihal:pause-work example 1
/rihal:pause-work example 2
```

STOP — do not proceed.

<available_tools>
- Bash — read git status, log, file listing
- Read — read state.json, current SPRINT.md
- AskUserQuestion — collect blocking notes and constraints
- Write — write HANDOFF.json and .continue-here.md
</available_tools>

## Step 1 — Load Project State

```bash
# Check Rihal project exists
[ -d .rihal ] || (echo "❌ Not a Rihal project" && exit 1)

# Load state.json
cat .rihal/state.json 2>/dev/null || echo "{}"

# Get git status
git status --short

# Get recent commits
git log -5 --oneline --no-decorate

# List current planning files
find .planning -type f -name "*.md" 2>/dev/null | sort || true
```

Extract from state.json:
- `current_phase` — active phase name
- `current_sprint` — active plan index
- `phases` — list of all phases
- `executions` — completed executions
- `blockers` — unresolved blockers
- `decisions` — recent decisions

## Step 2 — Read Active Plan (if any)

If `current_sprint > 0`:

```bash
# Find the active SPRINT.md
PLAN_FILE=$(find .planning/plans -name "SPRINT.md" -type f | head -1)
[ -f "$PLAN_FILE" ] && cat "$PLAN_FILE" || true
```

Extract from active SPRINT.md:
- Objective
- Task list
- Checkpoint status
- Any in-progress or blocked tasks

## Step 3 — Collect Blocking Constraints

Ask user via AskUserQuestion for any constraints or notes:

```
Question:
Are there any blocking constraints, external dependencies, or critical notes
the next session should know about?

Examples:
  - Waiting for Figma designs (due Friday)
  - Auth service down, can't test login
  - Blocked on customer approval for Feature X
  - Database migration needs manual intervention on production

Leave blank if none.

Your answer:
```

Store response as `blocking_constraints` string.

## Step 4 — Analyze Uncommitted Work

```bash
GIT_STATUS=$(git status --short)
UNCOMMITTED_COUNT=$(echo "$GIT_STATUS" | wc -l)

# Categorize changes
MODIFIED=$(echo "$GIT_STATUS" | grep "^ M" | awk '{print $2}' | tr '\n' ', ')
ADDED=$(echo "$GIT_STATUS" | grep "^A " | awk '{print $2}' | tr '\n' ', ')
DELETED=$(echo "$GIT_STATUS" | grep "^ D" | awk '{print $2}' | tr '\n' ', ')
UNTRACKED=$(echo "$GIT_STATUS" | grep "^?" | awk '{print $2}' | tr '\n' ', ')
```

## Step 5 — Build HANDOFF.json

Write `.rihal/HANDOFF.json` with structured data:

```json
{
  "timestamp": "ISO-8601 timestamp",
  "project": "project name from state.json",
  "current_phase": "name of current phase or null",
  "current_sprint": "index of current plan or 0",
  "phases": [
    {
      "name": "phase name",
      "status": "not-started|in-progress|completed",
      "slug": "phase-slug"
    }
  ],
  "completed_tasks": [
    {
      "plan": "SPRINT.md filename",
      "task": "task description",
      "completed_at": "ISO-8601 timestamp"
    }
  ],
  "remaining_tasks": [
    {
      "plan": "SPRINT.md filename",
      "task": "task description",
      "status": "in-progress|blocked|pending"
    }
  ],
  "uncommitted_files": {
    "modified": ["file1", "file2"],
    "added": ["file3"],
    "deleted": ["file4"],
    "untracked": ["file5"]
  },
  "blocking_constraints": "user-provided notes",
  "notes": "auto-generated summary",
  "decisions": [
    {
      "summary": "decision text",
      "phase": "phase name",
      "date": "ISO-8601 timestamp"
    }
  ],
  "next_steps": [
    "Suggested action 1",
    "Suggested action 2"
  ]
}
```

## Step 6 — Write .continue-here.md

Write `.rihal/.continue-here.md` with human-readable summary:

```markdown
# Resume from: {timestamp}

## Project Status
- **Phase:** {current_phase or "Not started"}
- **Progress:** {X of Y phases completed}

## Current Work
{If current plan active:}
- **Plan:** {filename}
- **Objective:** {objective from SPRINT.md}
- **Status:** {in-progress|paused|blocked}

## Uncommitted Work
{If uncommitted_count > 0:}
```
Modified: {list}
Added: {list}
Deleted: {list}
Untracked: {list}
```
{Else:}
No uncommitted changes.

## Blocking Constraints
{blocking_constraints or "None"}

## Key Decisions
{list 3 most recent decisions}

## Next Steps
1. {suggested action 1}
2. {suggested action 2}
3. {suggested action 3}

---

To resume work, run:
\`\`\`bash
/rihal:resume-work
\`\`\`
```

## Step 7 — Print Summary

```
✓ Work paused successfully!

Handoff saved:
  - Machine-readable: .rihal/HANDOFF.json
  - Human-readable: .rihal/.continue-here.md
  - State snapshot: .rihal/state.json (updated)

Current phase: {current_phase or "Not started"}
Uncommitted changes: {count}

Blocking constraints:
  {blocking_constraints or "None"}

To resume work, run:

/rihal:resume-work
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

