# Workflow: rihal:create-epics-and-stories

<purpose>
Parse a PRD, PROJECT.md, or project document to generate numbered epic files in `.planning/epics/`. Each epic file contains user stories with acceptance criteria, development notes, and effort estimates. Output is ready for `/rihal:sprint-planning`.
</purpose>


<available_agent_types>
- `rihal-roadmapper` — reads PRD/context and generates epic structure
</available_agent_types>

## Step 0 — Parse Arguments & Detect Context Mode

```bash
INPUT_FILE=""
PREFIX=""
CONTEXT_MODE="file"   # file | interactive | codebase

for arg in $ARGUMENTS; do
  if [[ "$arg" == "--prefix" ]]; then PREFIX_NEXT=true
  elif [[ "$PREFIX_NEXT" == true ]]; then PREFIX="$arg"; PREFIX_NEXT=false
  elif [[ "$arg" != --* ]]; then INPUT_FILE="$arg"
  fi
done
```

**Route based on what was provided:**

| Situation | Action |
|-----------|--------|
| `INPUT_FILE` given and file exists | Use it — `CONTEXT_MODE=file` |
| `INPUT_FILE` given but file missing | Error — "File not found: {path}" — STOP |
| No `INPUT_FILE` given, `.planning/PROJECT.md` exists | Use PROJECT.md — `CONTEXT_MODE=file` |
| No `INPUT_FILE` given, no PROJECT.md | Ask user (see below) |

**When no context file exists — ask via AskUserQuestion:**

```
No PRD or PROJECT.md found. How should we proceed?

1. Initialize the project first — run /rihal:new-project to capture goals, stack, 
   milestones, and generate PROJECT.md. Recommended if this is a new project.

2. Gather context from codebase + GitHub issues — I'll scan the repo, read open 
   issues, and use that as the foundation. Good for existing projects.

3. Tell me what you want to build — describe the feature/epic scope and I'll 
   generate stories from that description directly.
```

- If **1**: invoke `/rihal:new-project` and stop.
- If **2**: set `CONTEXT_MODE=codebase`
- If **3**: capture description → set `CONTEXT_MODE=interactive`, `DESCRIPTION=$response`

## Step 1 — Load References & Gather Deep Context

```bash
@.rihal/references/checklist-story-draft.md
@.rihal/references/commit-conventions.md
```

**Context gathering varies by mode:**

### Mode: `file`

Read `INPUT_FILE`. Also run supplemental scan:

```bash
STACK=$(cat .planning/STACK.md 2>/dev/null || cat README.md 2>/dev/null | head -60)
OPEN_ISSUES=$(gh issue list --state open --limit 50 --json number,title,labels,assignees 2>/dev/null)
RECENT_COMMITS=$(git log --oneline -20 2>/dev/null)
```

### Mode: `codebase`

Do NOT proceed with thin analysis. Run deep parallel scan:

```bash
# 1. Codebase structure
CODEBASE=$(gemini -p "@./ Summarize: tech stack, main modules, key entry points, 
  any existing feature flags or TODOs. Under 400 words.")

# 2. Open GitHub issues (grouped by label/theme)
OPEN_ISSUES=$(gh issue list --state open --limit 100 \
  --json number,title,labels,assignees,body 2>/dev/null)

# 3. Recent git activity (last 30 commits = what changed recently)
RECENT_WORK=$(git log --oneline -30 2>/dev/null)

# 4. Existing planning files
EXISTING_EPICS=$(ls .planning/epics/*.md 2>/dev/null | xargs grep '^# Epic' 2>/dev/null)
```

After gathering, synthesize into a brief context document:

```
Project context:
- Stack: {from codebase scan}
- Recent work: {from git log}
- Open issues: {grouped themes from GitHub}
- Existing epics: {if any}
- User's scope description: {from ARGUMENTS or interactive input}
```

### Mode: `interactive`

Use the user's description + quick codebase scan:

```bash
CODEBASE_QUICK=$(gemini -p "@./ In 200 words: tech stack and main modules only.")
```

## Step 2 — Generate Epic Structure

Call `rihal-roadmapper` with full context. The prompt MUST enforce proper epic decomposition:

```
You are a senior product manager breaking down a feature area into epics and stories.

## Context

{Full context document from Step 1 — PRD/PROJECT.md content, codebase summary, 
open issues, recent git activity}

## Your task

Generate a structured set of epics. Each epic covers ONE coherent concern or phase.

## Epic decomposition rules (MANDATORY)

1. One epic = one coherent theme. Examples of correct splits:
   - ✅ "Web Search Investigation" + "Toggle Bug Fixes" + "Provider Improvements" = 3 epics
   - ❌ "Web Search (everything)" with 10 stories = 1 bloated epic (WRONG)
   
2. Each epic has 3–5 stories MAX. If you have 8+ stories for one theme, split into 2 epics.

3. Epics are ordered by dependency: investigation before implementation, 
   infrastructure before features, blockers before dependent work.

4. Story IDs use plain numbers: 1.1, 1.2 — NOT "EPIC-1.1". The epic number is 
   implied by the file. Story IDs must never repeat across epics.

5. A story must be completable in 1–5 days (S or M effort). L effort stories 
   must be split into smaller stories.

6. Investigation/spike stories are valid and should be their own epic when 
   there are 3+ unknowns to resolve.

## Output format (strict JSON)

{
  "epics": [
    {
      "number": 1,
      "title": "Short epic title (max 6 words)",
      "description": "2-3 sentences: what this epic covers, why it exists, what done looks like",
      "phase": "investigation | design | implementation | testing | release",
      "depends_on": [],
      "stories": [
        {
          "number": 1,
          "title": "Story title (max 8 words)",
          "persona": "Full name + role (e.g. 'Hanzla (Backend Engineer)')",
          "action": "I want to {specific action}",
          "outcome": "so that {specific measurable outcome}",
          "acceptance_criteria": [
            "Specific, testable criterion 1",
            "Specific, testable criterion 2",
            "Specific, testable criterion 3"
          ],
          "out_of_scope": ["What this story explicitly does NOT cover"],
          "effort": "S|M|L",
          "effort_rationale": "why this size — name the files/systems involved",
          "dev_notes": "Exact file paths, function names, line-level hints. Be specific.",
          "linked_issues": ["#123", "#456"]
        }
      ]
    }
  ]
}
```

## Quality checks

- Reject epics with >5 stories — split them
- Reject stories with vague acceptance criteria ("it works", "it is fast")  
- Reject stories missing dev_notes (every story needs at least 2 file paths)
- Reject L-effort stories — split into 2 M stories
- linked_issues must reference real issue numbers from the context above
```

Wait for the roadmapper response (JSON).

**Validate response before continuing:**

```bash
EPIC_COUNT=$(echo "$EPIC_JSON" | jq '.epics | length')
MAX_STORIES=$(echo "$EPIC_JSON" | jq '[.epics[].stories | length] | max')

if [[ $MAX_STORIES -gt 5 ]]; then
  echo "⚠ Epic has >5 stories — asking roadmapper to split..."
  # Re-prompt: "Epic {N} has {count} stories. Split into 2 epics by grouping 
  # closely related stories. Return updated JSON."
fi

if [[ $EPIC_COUNT -lt 2 && $MAX_STORIES -gt 4 ]]; then
  echo "⚠ Only 1 epic generated — likely under-split. Asking roadmapper to separate concerns..."
fi
```

## Step 3 — Validate Epic Structure

Validate each story passes draft checklist before writing any files:
- Persona named ✓
- Action/outcome specified ✓
- 3+ acceptance criteria ✓
- Out-of-scope listed ✓
- Effort is S or M (never L) ✓
- dev_notes contains at least 2 file paths ✓

If any story fails, ask roadmapper to fix before continuing.

## Step 4 — Write Split Files

**Layout:**
```
.planning/epics/
  EPIC-01.md          ← lean summary only (~25 lines)
  EPIC-02.md
  INDEX.md            ← master table of all epics + stories
  stories/
    1.1.md            ← one file per story (~35 lines)
    1.2.md
    2.1.md
```

**Why split:** Epic files are kept lean so GitHub API updates only rewrite one small story file instead of the full epic. Token cost per `/rihal:dev-story` is proportional to one story, not the whole epic.

```bash
mkdir -p .planning/epics/stories
```

**For each epic — write lean `EPIC-{NN}.md`:**

```markdown
# Epic {N}: {Title}

**Phase:** {phase}
**Scope:** {2-3 sentence description}
**Depends on:** {epic numbers or "none"}

## Stories

| Story | Title | Effort | Status |
|-------|-------|--------|--------|
| {N}.1 | {title} | S | — |
| {N}.2 | {title} | M | — |

**Total:** {sum effort}

---
*Stories: `.planning/epics/stories/{N}.1.md` … `{N}.{last}.md`*
```

**For each story — write `.planning/epics/stories/{N}.{M}.md`:**

```markdown
# Story {N}.{M}: {Title}

**Epic:** EPIC-{N} — {Epic title}
**Persona:** {Full name + role}
**Effort:** {S | M}
**Status:** todo
**Linked issues:** {#123, #456 or none}

---

## User Story

As a {persona}, I want to {action} so that {outcome}.

## Acceptance Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Out of Scope

- {Exclusion} — {why}

## Dev Notes

{Exact file paths, function names, line-level hints}

---
*Start: `/rihal:dev-story {N}.{M}`*
```

## Step 5 — Write INDEX.md

`.planning/epics/INDEX.md` — master overview, kept under 60 lines:

```markdown
# Epic Index

Generated: {ISO date} | Source: {input filename}

## Epics

| Epic | Title | Phase | Stories | Effort | Depends on |
|------|-------|-------|---------|--------|------------|
| EPIC-01 | {title} | investigation | 4 | ~1.5w | — |
| EPIC-02 | {title} | implementation | 3 | ~2w | EPIC-01 |

**Total effort:** {sum}

## All Stories

| Story | Title | Effort | Status | Issues |
|-------|-------|--------|--------|--------|
| 1.1 | {title} | S | todo | #1959 |
| 1.2 | {title} | M | todo | #1909 |
| 2.1 | {title} | M | todo | — |

---
*Update story status: edit `.planning/epics/stories/{N}.{M}.md` → change `Status:` line*
*Next: `/rihal:sprint-planning` or `/rihal:dev-story {N}.{M}`*
```

## Step 6 — Commit

```bash
git add .planning/epics/
git commit -m "feat(epics): generate epic structure from $(basename $INPUT_FILE)"
```

Print summary:

```
Epic structure generated

Epics:   {count} files in .planning/epics/
Stories: {count} files in .planning/epics/stories/
Index:   .planning/epics/INDEX.md
Effort:  ~{weeks} total

Next:
  /rihal:sprint-planning          organise into sprints
  /rihal:dev-story {N}.{M}        start working on a story
```

## Errors

- **Input file not found:** print error and exit
- **Roadmapper returns invalid JSON:** ask roadmapper to fix and re-run
- **Fewer than 3 epics:** warn and ask roadmapper to expand
- **Story missing acceptance criteria:** mark with ⚠️ and ask roadmapper to add

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

