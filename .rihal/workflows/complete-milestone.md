<purpose>

Mark a shipped version (v1.0, v1.1, v2.0) as complete. Creates historical record in MILESTONES.md, performs full PROJECT.md evolution review, reorganizes ROADMAP.md with milestone groupings, and tags the release in git.

</purpose>

<required_reading>

1. `.rihal/templates/milestone.md` (if present — otherwise inline templates below)
2. `.rihal/templates/milestone-archive.md` (if present — otherwise inline templates below)
3. `.planning/ROADMAP.md`
4. `.planning/REQUIREMENTS.md`
5. `.planning/PROJECT.md`

</required_reading>

<output_format>

Open with banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► COMPLETE MILESTONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Per-step banners: `RIHAL ► VERIFY READINESS`, `RIHAL ► ARCHIVE MILESTONE`, `RIHAL ► EVOLVE PROJECT.md`, `RIHAL ► TAG RELEASE`.

Closing banner: `RIHAL ► MILESTONE v[X.Y] COMPLETE 🎉`.

</output_format>

<archival_behavior>

When a milestone completes:

1. Extract full milestone details to `.planning/milestones/v[X.Y]-ROADMAP.md`
2. Archive requirements to `.planning/milestones/v[X.Y]-REQUIREMENTS.md`
3. Update ROADMAP.md — replace milestone details with one-line summary
4. Delete REQUIREMENTS.md (fresh one for next milestone)
5. Perform full PROJECT.md evolution review
6. Offer to create next milestone inline
7. Archive UI artifacts (`*-UI-SPEC.md`, `*-UI-REVIEW.md`) alongside other phase documents
8. Clean up `.planning/ui-reviews/` screenshot files (binary assets, never archived)

**Context Efficiency:** Archives keep ROADMAP.md constant-size and REQUIREMENTS.md milestone-scoped.

**ROADMAP archive** — includes milestone header (status, phases, date), full phase details, milestone summary (decisions, issues, tech debt).

**REQUIREMENTS archive** contains all requirements marked complete with outcomes, traceability table with final status, notes on changed requirements.

</archival_behavior>

<process>

<step name="verify_readiness">

## Step 1 — Verify readiness

Read `.planning/ROADMAP.md` directly and parse phase statuses. Use this to verify:
- Which phases belong to this milestone?
- All phases complete (all plans have summaries)? Check for `SUMMARY.md` in each phase directory.
- progress percent should be 100%.

```bash
ls -1 .planning/phases/*/SUMMARY.md 2>/dev/null | wc -l
ls -1 .planning/phases/*/PLAN.md .planning/phases/*/*-PLAN.md 2>/dev/null | wc -l
```

**Requirements completion check (REQUIRED before presenting):**

Parse REQUIREMENTS.md traceability table:
- Count total v1 requirements vs checked-off (`[x]`) requirements
- Identify any non-Complete rows in the traceability table

Present:

```
Milestone: [Name, e.g., "v1.0 MVP"]

Includes:
- Phase 1: Foundation (2/2 plans complete)
- Phase 2: Authentication (2/2 plans complete)
- Phase 3: Core Features (3/3 plans complete)
- Phase 4: Polish (1/1 plan complete)

Total: {phase_count} phases, {total_plans} plans, all complete
Requirements: {N}/{M} v1 requirements checked off
```

**If requirements incomplete** (N < M):

```
⚠ Unchecked Requirements:

- [ ] {REQ-ID}: {description} (Phase {X})
- [ ] {REQ-ID}: {description} (Phase {Y})
```

MUST present 3 options via AskUserQuestion:
1. **Proceed anyway** — mark milestone complete with known gaps
2. **Run audit first** — `/rihal:audit-milestone` to assess gap severity
3. **Abort** — return to development

If user selects "Proceed anyway": note incomplete requirements in MILESTONES.md under `### Known Gaps` with REQ-IDs and descriptions.

<config-check>

```bash
cat .planning/config.json 2>/dev/null || true
node .rihal/bin/rihal-tools.cjs config 2>/dev/null || true
```

</config-check>

<if mode="yolo">

```
⚡ Auto-approved: Milestone scope verification
[Show breakdown summary without prompting]
Proceeding to stats gathering...
```

Proceed to gather_stats.

</if>

<if mode="interactive" OR="custom with gates.confirm_milestone_scope true">

```
Ready to mark this milestone as shipped?
(yes / wait / adjust scope)
```

Use AskUserQuestion with options:
- "Ship it" — proceed
- "Wait" — stop, user returns when ready
- "Adjust scope" — ask which phases to include

</if>

</step>

<step name="gather_stats">

## Step 2 — Gather stats

Calculate milestone statistics:

```bash
git log --oneline --grep="feat(" | head -20
git diff --stat FIRST_COMMIT..LAST_COMMIT | tail -1
find . -name "*.swift" -o -name "*.ts" -o -name "*.py" -o -name "*.tsx" -o -name "*.js" | xargs wc -l 2>/dev/null || true
git log --format="%ai" FIRST_COMMIT | tail -1
git log --format="%ai" LAST_COMMIT | head -1
```

Present:

```
Milestone Stats:
- Phases: [X-Y]
- Plans: [Z] total
- Tasks: [N] total (from phase summaries)
- Files modified: [M]
- Lines of code: [LOC] [language]
- Timeline: [Days] days ([Start] → [End])
- Git range: feat(XX-XX) → feat(YY-YY)
```

</step>

<step name="extract_accomplishments">

## Step 3 — Extract accomplishments

Extract one-liners from SUMMARY.md files:

```bash
for summary in .planning/phases/*/*-SUMMARY.md .planning/phases/*/SUMMARY.md; do
  [ -e "$summary" ] || continue
  # Read first H1 or one-liner line; fallback to first non-empty paragraph
  head -40 "$summary"
done
```

Extract 4-6 key accomplishments. Present:

```
Key accomplishments for this milestone:
1. [Achievement from phase 1]
2. [Achievement from phase 2]
3. [Achievement from phase 3]
4. [Achievement from phase 4]
5. [Achievement from phase 5]
```

</step>

<step name="create_milestone_entry">

## Step 4 — Create MILESTONES.md entry

Append (or create) `.planning/MILESTONES.md` with an entry for this milestone. Use this structure:

```markdown
## v[X.Y] — [Milestone Name]

**Shipped:** [date]
**Phases:** [count] ([numbers])
**Plans:** [count]
**Tasks:** [count]

### Delivered

[One paragraph summary of what shipped]

### Key Accomplishments
- [Item 1]
- [Item 2]
- [Item 3]
- [Item 4]
- [Item 5]

### Stats
- LOC: [count] ([language])
- Files modified: [count]
- Timeline: [days] days
- Git range: [first] → [last]

### Known Gaps
[Only if requirements incomplete — list REQ-IDs and descriptions]
```

Write with the Write tool (append-preserving — Read MILESTONES.md first if it exists).

</step>

<step name="evolve_project_full_review">

## Step 5 — Evolve PROJECT.md (full review)

Full PROJECT.md evolution review at milestone completion.

Read all phase summaries:

```bash
cat .planning/phases/*/*-SUMMARY.md .planning/phases/*/SUMMARY.md 2>/dev/null
```

**Full review checklist:**

1. **"What This Is" accuracy:**
   - Compare current description to what was built
   - Update if product has meaningfully changed

2. **Core Value check:**
   - Still the right priority? Did shipping reveal a different core value?
   - Update if the ONE thing has shifted

3. **Requirements audit:**

   **Validated section:**
   - All Active requirements shipped this milestone → Move to Validated
   - Format: `- ✓ [Requirement] — v[X.Y]`

   **Active section:**
   - Remove requirements moved to Validated
   - Add new requirements for next milestone
   - Keep unaddressed requirements

   **Out of Scope audit:**
   - Review each item — reasoning still valid?
   - Remove irrelevant items
   - Add requirements invalidated during milestone

4. **Context update:**
   - Current codebase state (LOC, tech stack)
   - User feedback themes (if any)
   - Known issues or technical debt

5. **Key Decisions audit:**
   - Extract all decisions from milestone phase summaries
   - Add to Key Decisions table with outcomes
   - Mark ✓ Good, ⚠️ Revisit, or — Pending

6. **Constraints check:**
   - Any constraints changed during development? Update as needed

Update PROJECT.md inline with the Edit tool. Update "Last updated" footer:

```markdown
---
*Last updated: [date] after v[X.Y] milestone*
```

**Example full evolution (v1.0 → v1.1 prep):**

Before:

```markdown
## What This Is

A real-time collaborative whiteboard for remote teams.

## Core Value

Real-time sync that feels instant.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Canvas drawing tools
- [ ] Real-time sync < 500ms
- [ ] User authentication
- [ ] Export to PNG

### Out of Scope

- Mobile app — web-first approach
- Video chat — use external tools
```

After v1.0:

```markdown
## What This Is

A real-time collaborative whiteboard for remote teams with instant sync and drawing tools.

## Core Value

Real-time sync that feels instant.

## Requirements

### Validated

- ✓ Canvas drawing tools — v1.0
- ✓ Real-time sync < 500ms — v1.0 (achieved 200ms avg)
- ✓ User authentication — v1.0

### Active

- [ ] Export to PNG
- [ ] Undo/redo history
- [ ] Shape tools (rectangles, circles)

### Out of Scope

- Mobile app — web-first approach, PWA works well
- Video chat — use external tools
- Offline mode — real-time is core value

## Context

Shipped v1.0 with 2,400 LOC TypeScript.
Tech stack: Next.js, Supabase, Canvas API.
Initial user testing showed demand for shape tools.
```

**Step complete when:**

- [ ] "What This Is" reviewed and updated if needed
- [ ] Core Value verified as still correct
- [ ] All shipped requirements moved to Validated
- [ ] New requirements added to Active for next milestone
- [ ] Out of Scope reasoning audited
- [ ] Context updated with current state
- [ ] All milestone decisions added to Key Decisions
- [ ] "Last updated" footer reflects milestone completion

</step>

<step name="archive_milestone">

## Step 6 — Archive milestone files

Create archive directory and copy files:

```bash
VERSION="v[X.Y]"
mkdir -p .planning/milestones
cp .planning/ROADMAP.md ".planning/milestones/${VERSION}-ROADMAP.md"
cp .planning/REQUIREMENTS.md ".planning/milestones/${VERSION}-REQUIREMENTS.md"
# Archive milestone audit if present
if [ -f ".planning/MILESTONE-AUDIT.md" ]; then
  mv .planning/MILESTONE-AUDIT.md ".planning/milestones/${VERSION}-MILESTONE-AUDIT.md"
fi
```

Prepend an archive header to each archived file (using Edit):

```markdown
---
archived: [ISO-DATE]
milestone: v[X.Y]
status: completed
---

# [Original Title] (Archived v[X.Y])

```

Verify: `✅ Milestone archived to .planning/milestones/`

**Phase archival (optional):** Ask the user via AskUserQuestion:

- header: "Archive Phases"
- question: "Archive phase directories to milestones/?"
- options:
  - "Yes — move to milestones/v[X.Y]-phases/"
  - "Skip — keep phases in place"

If "Yes": move phase directories to the milestone archive:

```bash
ARCHIVE_DIR=".planning/milestones/${VERSION}-phases"
mkdir -p "$ARCHIVE_DIR"
find .planning/phases -mindepth 1 -maxdepth 1 -type d -exec mv {} "$ARCHIVE_DIR/" \;
```

Verify: `✅ Phase directories archived to .planning/milestones/v[X.Y]-phases/`

If "Skip": Phase directories remain in `.planning/phases/` as raw execution history. Use `/rihal:cleanup` later to archive retroactively.

</step>

<step name="reorganize_roadmap_and_delete_originals">

## Step 7 — Reorganize ROADMAP.md and delete originals

After archival, reorganize ROADMAP.md with milestone groupings, then delete originals.

**Reorganize ROADMAP.md** — group completed milestone phases:

```markdown
# Roadmap: [Project Name]

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped YYYY-MM-DD)
- 🚧 **v1.1 Security** — Phases 5-6 (in progress)
- 📋 **v2.0 Redesign** — Phases 7-10 (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED YYYY-MM-DD</summary>

- [x] Phase 1: Foundation (2/2 plans) — completed YYYY-MM-DD
- [x] Phase 2: Authentication (2/2 plans) — completed YYYY-MM-DD
- [x] Phase 3: Core Features (3/3 plans) — completed YYYY-MM-DD
- [x] Phase 4: Polish (1/1 plan) — completed YYYY-MM-DD

</details>

### 🚧 v[Next] [Name] (In Progress / Planned)

- [ ] Phase 5: [Name] ([N] plans)
- [ ] Phase 6: [Name] ([N] plans)

## Progress

| Phase             | Milestone | Plans Complete | Status      | Completed  |
| ----------------- | --------- | -------------- | ----------- | ---------- |
| 1. Foundation     | v1.0      | 2/2            | Complete    | YYYY-MM-DD |
| 2. Authentication | v1.0      | 2/2            | Complete    | YYYY-MM-DD |
| 3. Core Features  | v1.0      | 3/3            | Complete    | YYYY-MM-DD |
| 4. Polish         | v1.0      | 1/1            | Complete    | YYYY-MM-DD |
| 5. Security Audit | v1.1      | 0/1            | Not started | -          |
| 6. Hardening      | v1.1      | 0/2            | Not started | -          |
```

**Then delete originals** (ROADMAP.md has been reorganized in place above; REQUIREMENTS.md is deleted for a fresh milestone):

```bash
rm .planning/REQUIREMENTS.md
```

(ROADMAP.md is retained in its reorganized form. Do NOT delete it — deletion is reserved for between-milestone resets via `/rihal:new-milestone`.)

</step>

<step name="write_retrospective">

## Step 8 — Write retrospective

**Append to living retrospective:**

Check for existing retrospective:
```bash
ls .planning/RETROSPECTIVE.md 2>/dev/null || true
```

**If exists:** Read the file, append new milestone section before the "## Cross-Milestone Trends" section.

**If doesn't exist:** Create from inline template below.

**Gather retrospective data:**

1. From SUMMARY.md files: Extract key deliverables, one-liners, tech decisions
2. From VERIFICATION.md files: Extract verification scores, gaps found
3. From UAT.md files: Extract test results, issues found
4. From git log: Count commits, calculate timeline
5. From the milestone work: Reflect on what worked and what didn't

**Write the milestone section:**

```markdown
## Milestone: v{version} — {name}

**Shipped:** {date}
**Phases:** {phase_count} | **Plans:** {plan_count}

### What Was Built
{Extract from SUMMARY.md one-liners}

### What Worked
{Patterns that led to smooth execution}

### What Was Inefficient
{Missed opportunities, rework, bottlenecks}

### Patterns Established
{New conventions discovered during this milestone}

### Key Lessons
{Specific, actionable takeaways}

### Cost Observations
- Model mix: {X}% opus, {Y}% sonnet, {Z}% haiku
- Sessions: {count}
- Notable: {efficiency observation}
```

**Update cross-milestone trends:**

If the "## Cross-Milestone Trends" section exists, update the tables with new data from this milestone.

</step>

<step name="update_state">

## Step 9 — Update STATE.md

Update STATE.md to reflect milestone completion using Edit:

**Project Reference:**

```markdown
## Project Reference

See: .planning/PROJECT.md (updated [today])

**Core value:** [Current core value from PROJECT.md]
**Current focus:** [Next milestone or "Planning next milestone"]
```

**Accumulated Context:**
- Clear decisions summary (full log in PROJECT.md)
- Clear resolved blockers
- Keep open blockers for next milestone

Record the milestone completion via decision log:

```bash
node .rihal/bin/rihal-tools.cjs state add-decision "Completed milestone v[X.Y] — [Name]"
```

</step>

<step name="handle_branches">

## Step 10 — Handle branches

Check branching strategy and offer merge options.

```bash
CONFIG=$(node .rihal/bin/rihal-tools.cjs config 2>/dev/null || echo '{}')
# Extract branching_strategy, phase_branch_template, milestone_branch_template, commit_docs from config
BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|^refs/remotes/origin/||')
BASE_BRANCH="${BASE_BRANCH:-main}"
```

**If branching_strategy is "none":** Skip to git_tag.

**For "phase" strategy:**

```bash
BRANCH_PREFIX=$(echo "$PHASE_BRANCH_TEMPLATE" | sed 's/{.*//')
PHASE_BRANCHES=$(git branch --list "${BRANCH_PREFIX}*" 2>/dev/null | sed 's/^\*//' | tr -d ' ')
```

**For "milestone" strategy:**

```bash
BRANCH_PREFIX=$(echo "$MILESTONE_BRANCH_TEMPLATE" | sed 's/{.*//')
MILESTONE_BRANCH=$(git branch --list "${BRANCH_PREFIX}*" 2>/dev/null | sed 's/^\*//' | tr -d ' ' | head -1)
```

**If no branches found:** Skip to git_tag.

**If branches exist:**

```
## Git Branches Detected

Branching strategy: {phase/milestone}
Branches: {list}
```

AskUserQuestion with options:
- "Squash merge (Recommended)"
- "Merge with history"
- "Delete without merging"
- "Keep branches"

**Squash merge:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
git checkout ${BASE_BRANCH}

if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git merge --squash "$branch"
    if [ "$COMMIT_DOCS" = "false" ]; then
      git reset HEAD .planning/ 2>/dev/null || true
    fi
    git commit -m "feat: $branch for v[X.Y]"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git merge --squash "$MILESTONE_BRANCH"
  if [ "$COMMIT_DOCS" = "false" ]; then
    git reset HEAD .planning/ 2>/dev/null || true
  fi
  git commit -m "feat: $MILESTONE_BRANCH for v[X.Y]"
fi

git checkout "$CURRENT_BRANCH"
```

**Merge with history:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
git checkout ${BASE_BRANCH}

if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git merge --no-ff --no-commit "$branch"
    if [ "$COMMIT_DOCS" = "false" ]; then
      git reset HEAD .planning/ 2>/dev/null || true
    fi
    git commit -m "Merge branch '$branch' for v[X.Y]"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git merge --no-ff --no-commit "$MILESTONE_BRANCH"
  if [ "$COMMIT_DOCS" = "false" ]; then
    git reset HEAD .planning/ 2>/dev/null || true
  fi
  git commit -m "Merge branch '$MILESTONE_BRANCH' for v[X.Y]"
fi

git checkout "$CURRENT_BRANCH"
```

**Delete without merging:**

```bash
if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git branch -d "$branch" 2>/dev/null || git branch -D "$branch"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git branch -d "$MILESTONE_BRANCH" 2>/dev/null || git branch -D "$MILESTONE_BRANCH"
fi
```

**Keep branches:** Report "Branches preserved for manual handling".

</step>

<step name="git_tag">

## Step 11 — Git tag

Create git tag:

```bash
git tag -a v[X.Y] -m "v[X.Y] [Name]

Delivered: [One sentence]

Key accomplishments:
- [Item 1]
- [Item 2]
- [Item 3]

See .planning/MILESTONES.md for full details."
```

Confirm: "Tagged: v[X.Y]"

**DO NOT push the tag.** Report instead:

```
Tag created locally: v[X.Y]

To push the tag when ready:
  git push origin v[X.Y]

(Pushes require explicit user approval — see AGENTS.md.)
```

</step>

<step name="git_commit_milestone">

## Step 12 — Commit milestone

Commit milestone completion. Guard against `.planning/` being gitignored:

```bash
VERSION="v[X.Y]"
git add \
  .planning/milestones/${VERSION}-ROADMAP.md \
  .planning/milestones/${VERSION}-REQUIREMENTS.md \
  .planning/milestones/${VERSION}-MILESTONE-AUDIT.md \
  .planning/MILESTONES.md \
  .planning/PROJECT.md \
  .planning/STATE.md \
  .planning/RETROSPECTIVE.md \
  .planning/ROADMAP.md 2>/dev/null \
&& git commit -m "chore: complete ${VERSION} milestone" 2>/dev/null \
|| echo "ℹ .planning/ gitignored — milestone files written, not committed"
```

Confirm: "Committed: chore: complete v[X.Y] milestone" (or the gitignored notice).

</step>

<step name="offer_next">

## Step 13 — Offer next

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► MILESTONE v[X.Y] COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Shipped:
 - [N] phases ([M] plans, [P] tasks)
 - [One sentence of what shipped]

 Archived:
 - milestones/v[X.Y]-ROADMAP.md
 - milestones/v[X.Y]-REQUIREMENTS.md

 Summary: .planning/MILESTONES.md
 Tag: v[X.Y] (local — push when ready)

---

## ▶ Next Up

**Start Next Milestone** — questioning → research → requirements → roadmap

`/clear` then:

`/rihal:new-milestone`

---
```

</step>

</process>

<milestone_naming>

**Version conventions:**
- **v1.0** — Initial MVP
- **v1.1, v1.2** — Minor updates, new features, fixes
- **v2.0, v3.0** — Major rewrites, breaking changes, new direction

**Names:** Short 1-2 words (v1.0 MVP, v1.1 Security, v1.2 Performance, v2.0 Redesign).

</milestone_naming>

<what_qualifies>

**Create milestones for:** Initial release, public releases, major feature sets shipped, before archiving planning.

**Don't create milestones for:** Every phase completion (too granular), work in progress, internal dev iterations (unless truly shipped).

Heuristic: "Is this deployed/usable/shipped?" If yes → milestone. If no → keep working.

</what_qualifies>

<success_criteria>

Milestone completion is successful when:

- [ ] MILESTONES.md entry created with stats and accomplishments
- [ ] PROJECT.md full evolution review completed
- [ ] All shipped requirements moved to Validated in PROJECT.md
- [ ] Key Decisions updated with outcomes
- [ ] ROADMAP.md reorganized with milestone grouping
- [ ] Roadmap archive created (milestones/v[X.Y]-ROADMAP.md)
- [ ] Requirements archive created (milestones/v[X.Y]-REQUIREMENTS.md)
- [ ] REQUIREMENTS.md deleted (fresh for next milestone)
- [ ] STATE.md updated with fresh project reference
- [ ] Git tag created locally (v[X.Y]) — NOT pushed (awaits explicit user approval per AGENTS.md)
- [ ] Milestone commit made (guarded for gitignored `.planning/`)
- [ ] Requirements completion checked against REQUIREMENTS.md traceability table
- [ ] Incomplete requirements surfaced with proceed/audit/abort options
- [ ] Known gaps recorded in MILESTONES.md if user proceeded with incomplete requirements
- [ ] RETROSPECTIVE.md updated with milestone section
- [ ] Cross-milestone trends updated
- [ ] User knows next step (/rihal:new-milestone)

</success_criteria>
</output>
