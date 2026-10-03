<purpose>
Start a new milestone cycle for an existing project. Loads project context, gathers milestone goals interactively, updates PROJECT.md and STATE.md in-place, optionally runs parallel research, defines scoped requirements with REQ-IDs, spawns rihal-roadmapper to create the phased execution plan, and commits all artifacts. Brownfield equivalent of new-project.
</purpose>

<required_reading>
@.rihal/references/output-format.md
@.rihal/references/commit-conventions.md
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
Valid rihal subagent types (use exact names — do not fall back to 'general-purpose'):
- rihal-project-researcher — Researches project-level technical decisions
- rihal-research-synthesizer — Synthesizes findings from parallel research agents
- rihal-roadmapper — Creates phased execution roadmaps
</available_agent_types>

<process>

## 1. Parse arguments and load context

Parse `$ARGUMENTS` before anything else:
- `--reset-phase-numbers` flag → restart roadmap phase numbering at `1`
- `--dry-run` flag → show what would be written, do not commit
- Remaining text → milestone name (optional)

If the flag is absent, continue phase numbering from the previous milestone.

Read these files in parallel:
- `.planning/PROJECT.md` — existing project, validated requirements, decisions
- `.planning/MILESTONES.md` — what shipped previously (may not exist on first milestone)
- `.planning/STATE.md` — pending todos, blockers
- `.planning/MILESTONE-CONTEXT.md` — if it exists (from a prior `/rihal:discuss` about the next milestone)

If `.planning/PROJECT.md` does not exist, STOP and redirect:

```
⚠ No project initialized. Run /rihal:new-project first.
```

## 2. Gather milestone goals

**If `MILESTONE-CONTEXT.md` exists:**
- Summarize its features + scope
- Present for confirmation via AskUserQuestion: "Use this context?" → Yes / Revise

**If no context file:**
- Read `MILESTONES.md` (or tail of PROJECT.md history) and present a summary of what shipped last:

```
Here's what shipped in the last milestone:

---
v[X.Y] [Name] (shipped [date])
- [feature 1]
- [feature 2]
- [feature 3]
---

What do you want to build next?
```

- Wait for freeform user reply (NOT AskUserQuestion for the open-ended "what next" — raw text is higher signal). Then probe specifics with AskUserQuestion where needed.

## 3. Determine milestone version

- Parse the last version from `MILESTONES.md` (or PROJECT.md history section).
- Suggest the next version (v1.7 → v1.8 for minor; v1.x → v2.0 for major — ask the user which).
- Confirm via AskUserQuestion:
  - "v[X.Y+1] (minor)" — default
  - "v[X+1].0 (major)"
  - "Custom" → ask plain text

## 3.5 Verify milestone understanding (mandatory — loop until confirmed)

Before writing any files, present a summary and require explicit confirmation:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► MILESTONE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Milestone v[X.Y]: [Name]**

**Goal:** [one sentence]

**Target features:**
- [feature 1]
- [feature 2]
- [feature 3]

**Key context:** [constraints, decisions, notes from questioning]
```

AskUserQuestion:
- header: "Confirm?"
- question: "Does this capture what you want to build in this milestone?"
- options:
  - "Looks good" → proceed to Step 4
  - "Adjust" → collect changes and re-present

**If "Adjust":** ask for the delta as plain text, fold it in, re-present the summary. Loop until "Looks good".

## 4. Update PROJECT.md

Edit `.planning/PROJECT.md` in place. Add or update the `## Current Milestone` section:

```markdown
## Current Milestone: v[X.Y] [Name]

**Goal:** [one sentence]

**Target features:**
- [feature 1]
- [feature 2]
- [feature 3]
```

Update the "Last updated" footer to today's date and milestone name.

Ensure the `## Evolution` section exists. If missing, insert before the footer:

```markdown
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → move to Out of Scope with reason
2. Requirements validated? → move to Validated with phase reference
3. New requirements emerged? → add to Active
4. Decisions to log? → add to Key Decisions
5. "What This Is" still accurate? → update if drifted

**After each milestone (via `/rihal:complete-milestone`):**
1. Full review of all sections
2. Core Value check
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
```

## 5. Update STATE.md

Edit `.planning/STATE.md` in place. Set header + Current Position:

```yaml
---
rihal_state_version: 1.0
milestone: v[X.Y]
milestone_name: [Name]
status: defining_requirements
stopped_at: —
last_updated: "[ISO timestamp]"
last_activity: [YYYY-MM-DD]
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---
```

Current Position block:

```markdown
## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: [YYYY-MM-DD] — Milestone v[X.Y] started
```

Keep the Accumulated Context section from the previous milestone intact.

## 6. Cleanup and commit

Delete `MILESTONE-CONTEXT.md` if it exists (consumed):

```bash
rm -f .planning/MILESTONE-CONTEXT.md
```

Clear leftover phase directories from the previous milestone only if the previous milestone was archived (check `.planning/archive/` exists and contains the prior milestone's dir). If not archived, do NOT delete — prompt user to run `/rihal:complete-milestone` on the prior milestone first.

Load commit conventions (see `@.rihal/references/commit-conventions.md` — run the project-local scan before writing the commit message):

```bash
git add .planning/PROJECT.md .planning/STATE.md
git commit -m "docs: start milestone v[X.Y] [Name]"
```

If `.planning/` is gitignored (common case), print:

```
ℹ .planning/ is gitignored — state updated locally, no commit made.
```

and continue.

## 7. Load context and resolve models

```bash
INIT=$(node ".rihal/bin/rihal-tools.cjs" init new-milestone 2>/dev/null)
AGENT_SKILLS_RESEARCHER=$(node ".rihal/bin/rihal-tools.cjs" agent-info rihal-project-researcher 2>/dev/null)
AGENT_SKILLS_SYNTHESIZER=$(node ".rihal/bin/rihal-tools.cjs" agent-info rihal-research-synthesizer 2>/dev/null)
AGENT_SKILLS_ROADMAPPER=$(node ".rihal/bin/rihal-tools.cjs" agent-info rihal-roadmapper 2>/dev/null)
```

Extract from `INIT` JSON (where available): `research_enabled`, `current_milestone`, `project_exists`, `roadmap_exists`, `latest_completed_milestone`, `phase_dir_count`.

Resolve models per agent:

```bash
RESEARCHER_MODEL=$(node ".rihal/bin/rihal-tools.cjs" resolve-model rihal-project-researcher 2>/dev/null)
SYNTHESIZER_MODEL=$(node ".rihal/bin/rihal-tools.cjs" resolve-model rihal-research-synthesizer 2>/dev/null)
ROADMAPPER_MODEL=$(node ".rihal/bin/rihal-tools.cjs" resolve-model rihal-roadmapper 2>/dev/null)
```

## 7.5 Reset-phase safety (only when `--reset-phase-numbers`)

If `--reset-phase-numbers` is active:

1. Set starting phase number to `1` for the upcoming roadmap.
2. If `.planning/phases/` still contains directories from the previous milestone, archive them before roadmapping so new `01-*` / `02-*` directories cannot collide:

```bash
ARCHIVE_DIR=".planning/archive/v[prev-version]"
if [ -d .planning/phases ] && [ "$(ls -A .planning/phases 2>/dev/null)" ]; then
  mkdir -p "$ARCHIVE_DIR"
  find .planning/phases -mindepth 1 -maxdepth 1 -type d -exec mv {} "$ARCHIVE_DIR/" \;
fi
```

If the previous milestone has not been completed/archived, STOP:

```
⚠ Prior milestone not archived. Run /rihal:complete-milestone v[prev] before --reset-phase-numbers.
```

## 8. Research decision

Check `research_enabled` from init JSON.

AskUserQuestion: "Research the domain ecosystem for new features before defining requirements?"

If `research_enabled=true`:
- "Research first (recommended)" — discover patterns, features, architecture for NEW capabilities
- "Skip research for this milestone" — go straight to requirements (does not change project default)

If `research_enabled=false`:
- "Skip research (current default)" — go straight to requirements
- "Research first" — discover patterns, features, architecture for NEW capabilities

**Do NOT persist this choice.** To change the default, the user runs `/rihal:settings`.

**If "Research first":**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► RESEARCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning 4 researchers in parallel...
  → Stack, Features, Architecture, Pitfalls
```

```bash
mkdir -p .planning/research
```

Spawn 4 parallel `rihal-project-researcher` Task calls in a single assistant response. Each produces one file in `.planning/research/`.

Per-researcher prompt template:

```
<research_type>Project Research — {DIMENSION} for [milestone features].</research_type>

<milestone_context>
SUBSEQUENT MILESTONE — Adding [target features] to existing app.
{EXISTING_CONTEXT}
Focus ONLY on what's needed for the NEW features.
</milestone_context>

<question>{QUESTION}</question>

<files_to_read>
- .planning/PROJECT.md
- .planning/MILESTONES.md (if exists)
</files_to_read>

${AGENT_SKILLS_RESEARCHER}

<downstream_consumer>{CONSUMER}</downstream_consumer>

<quality_gate>{GATES}</quality_gate>

<output>
Write to: .planning/research/{FILE}
</output>
```

Dimension-specific fields:

| Field | Stack | Features | Architecture | Pitfalls |
|-------|-------|----------|--------------|----------|
| EXISTING_CONTEXT | Existing validated stack (DO NOT re-research): [from PROJECT.md] | Existing features already built: [from PROJECT.md] | Existing architecture: [from PROJECT.md or codebase map] | Common mistakes when ADDING these features to existing system |
| QUESTION | What stack additions/changes are needed for [new features]? | How do [target features] typically work? Expected behavior? | How do [target features] integrate with existing architecture? | Common mistakes when adding [target features] to [domain]? |
| CONSUMER | Libraries w/ versions for NEW capabilities, integration points, what NOT to add | Table stakes vs differentiators vs anti-features, complexity, dependencies on existing | Integration points, new components, data-flow changes, suggested build order | Warning signs, prevention strategy, which phase should address it |
| GATES | Versions current (verify via Context7), rationale WHY, integration considered | Categories clear, complexity noted, deps identified | Integration points identified, new vs modified explicit, build order considers deps | Pitfalls specific to these features, integration pitfalls covered, prevention actionable |
| FILE | STACK.md | FEATURES.md | ARCHITECTURE.md | PITFALLS.md |

After all 4 complete, spawn `rihal-research-synthesizer`:

```
Task(prompt="
Synthesize research outputs into SUMMARY.md.

<files_to_read>
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</files_to_read>

${AGENT_SKILLS_SYNTHESIZER}

Write to: .planning/research/SUMMARY.md
", subagent_type='rihal-research-synthesizer', model='${SYNTHESIZER_MODEL}', description='Synthesize research')
```

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Stack additions:** [from SUMMARY.md]
**Feature table stakes:** [from SUMMARY.md]
**Watch out for:** [from SUMMARY.md]
```

**If "Skip research":** continue to Step 9.

## 9. Define requirements

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► DEFINING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Read PROJECT.md: core value, current milestone goal, validated requirements (what exists).

**If research exists:** read `FEATURES.md`, extract categories. Present:

```
## [Category 1]
**Table stakes:** Feature A, Feature B
**Differentiators:** Feature C, Feature D
**Research notes:** [any]
```

**If no research:** gather through conversation. Ask:

```
What are the main things users need to do with [new features]?
```

Clarify, probe for related capabilities, group into categories.

**Scope each category** via AskUserQuestion (`multiSelect: true`, header ≤12 chars):

- "[Feature 1]" — [brief]
- "[Feature 2]" — [brief]
- "None for this milestone" — defer whole category

Track: selected → this milestone. Unselected table stakes → Future. Unselected differentiators → Out of Scope.

**Identify gaps** via AskUserQuestion:
- "No, research covered it" — proceed
- "Yes, let me add some" — capture additions

**Generate `.planning/REQUIREMENTS.md`** with this structure:

```markdown
# Requirements — v[X.Y] [Name]

**Source:** [origin — e.g. roadmap doc name or "Conversation with Hanzla on [date]"]
**Scope:** [one-line scope statement]

**Quality constraint (applies to all requirements):** [any cross-cutting constraint the user named, e.g. "Every change must add value without degrading existing UX."]

---

## [Category 1] ([PREFIX])

- [ ] **[PREFIX]-01**: User can do X
- [ ] **[PREFIX]-02**: User can do Y

## [Category 2] ([PREFIX2])

- [ ] **[PREFIX2]-01**: User can do Z

---

## Future (Deferred)

- [item carried forward]

## Out of Scope

- [explicit exclusion with reason]

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| [PREFIX]-01 | TBD | Pending |
| [PREFIX]-02 | TBD | Pending |
| [PREFIX2]-01 | TBD | Pending |

**Total:** [N] requirements across [M] categories — 0/[N] mapped ✓
```

**REQ-ID format:** `[CATEGORY-PREFIX]-[NUMBER]`. Pick a short, distinct prefix per category (SRV = Sequence Recipient Visibility, RNV = Record Navigation, AUTH = Auth, etc.). Do NOT reuse prefixes from a prior milestone.

**Requirement quality criteria:**
- **Specific + testable:** "User can reset password via email link" ≠ "Handle password reset"
- **User-centric:** "User can X" — not "System does Y"
- **Atomic:** one capability per line
- **Independent:** minimal cross-requirement deps

Present the FULL list for confirmation:

```
## Milestone v[X.Y] Requirements

### [Category 1]
- [ ] **CAT1-01**: User can do X
- [ ] **CAT1-02**: User can do Y

### [Category 2]
- [ ] **CAT2-01**: User can do Z

Does this capture what you're building? (yes / adjust)
```

If "adjust": return to scoping loop.

**Commit requirements:**

```bash
git add .planning/REQUIREMENTS.md 2>/dev/null && \
  git commit -m "docs: define milestone v[X.Y] requirements" 2>/dev/null || \
  echo "ℹ .planning/ gitignored — REQUIREMENTS.md written, not committed"
```

## 10. Create roadmap

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► CREATING ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning rihal-roadmapper...
```

**Starting phase number:**
- If `--reset-phase-numbers` is active, start at **Phase 1**
- Otherwise, continue from the previous milestone's last phase number (v1.7 ended at phase 67 → v1.8 starts at phase 68)

Spawn `rihal-roadmapper` via Task tool:

```
<planning_context>
<files_to_read>
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/research/SUMMARY.md (if exists)
- .planning/MILESTONES.md (if exists)
- .rihal/config.yaml
</files_to_read>

${AGENT_SKILLS_ROADMAPPER}
</planning_context>

<instructions>
Create roadmap for milestone v[X.Y]:
1. Respect the selected numbering mode:
   - `--reset-phase-numbers` → start at Phase 1
   - default → continue from the previous milestone's last phase number ([N])
2. Derive phases from THIS MILESTONE's requirements only
3. Map every requirement to exactly one phase
4. Derive 2-5 success criteria per phase (observable user behaviors)
5. Validate 100% requirement coverage
6. Write files immediately:
   - .planning/ROADMAP.md
   - .planning/STATE.md (update with new phase count)
   - .planning/REQUIREMENTS.md (fill traceability matrix)
7. Return "## ROADMAP CREATED" with summary, OR "## ROADMAP BLOCKED" with reason.

Write files first, then return.
</instructions>
```

**Handle return:**

**If `## ROADMAP BLOCKED`:** present the blocker, collect resolution from user, re-spawn the roadmapper with revision context.

**If `## ROADMAP CREATED`:** read ROADMAP.md, present inline:

```
## Proposed Roadmap

**[N] phases** | **[X] requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| [N] | [Name] | [Goal] | [REQ-IDs] | [count] |

### Phase Details

**Phase [N]: [Name]**
Goal: [goal]
Requirements: [REQ-IDs]
Success criteria:
1. [criterion]
2. [criterion]
```

Ask for approval via AskUserQuestion:
- "Approve" → commit and continue
- "Adjust phases" → collect notes, re-spawn
- "Review full file" → print raw ROADMAP.md, re-ask

**If "Adjust":** capture the delta as plain text, re-spawn roadmapper with revision context, loop.
**If "Review":** cat ROADMAP.md, re-ask.

**Commit roadmap (after approval):**

```bash
git add .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md 2>/dev/null && \
  git commit -m "docs: create milestone v[X.Y] roadmap ([N] phases)" 2>/dev/null || \
  echo "ℹ .planning/ gitignored — roadmap written, not committed"
```

Also record the milestone start in state:

```bash
node ".rihal/bin/rihal-tools.cjs" state add-decision \
  --summary "Started milestone v[X.Y] [Name]: [N] phases, [X] requirements" 2>/dev/null || true
```

## 11. Done

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► MILESTONE INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Milestone v[X.Y]: [Name]**

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |

**[N] phases** | **[X] requirements** | Ready to build ✓

## ▶ Next Up

**Phase [N]: [Phase Name]** — [Goal]

`/clear` then:

`/rihal:discuss-phase [N]` — gather context and clarify approach
or
`/rihal:plan [N]` — skip discussion, plan directly
```

</process>

<success_criteria>
- [ ] PROJECT.md updated in-place with Current Milestone section
- [ ] STATE.md reset for new milestone (status = defining_requirements)
- [ ] MILESTONE-CONTEXT.md consumed and deleted (if existed)
- [ ] Version number determined (v[X.Y+1] or v[X+1].0)
- [ ] Milestone-summary confirmation loop ran until "Looks good"
- [ ] Research completed (if selected) — 4 parallel researchers + synthesizer
- [ ] Requirements gathered and scoped per category
- [ ] REQUIREMENTS.md created with category-prefixed REQ-IDs
- [ ] rihal-roadmapper spawned with correct phase numbering context
- [ ] Roadmap files written immediately (not draft)
- [ ] User approval captured before commit
- [ ] Phase numbering mode respected (continued or reset)
- [ ] All commits made (or gracefully skipped if .planning/ gitignored)
- [ ] User shown next command: `/rihal:discuss-phase [N]`
</success_criteria>

<on_error>
- **Empty `$ARGUMENTS` with no conversational context:** ask for milestone name; do not invent one.
- **No `.planning/PROJECT.md`:** redirect to `/rihal:new-project`.
- **Prior milestone not archived + `--reset-phase-numbers`:** stop, tell user to run `/rihal:complete-milestone` first.
- **Roadmapper returns ROADMAP BLOCKED:** surface the blocker, collect resolution, re-spawn.
- **`rihal-tools.cjs state` fails:** continue — state tracking is optional, file artifacts are mandatory.
- **`.planning/` is gitignored:** write files, print ℹ notice, do not error.
</on_error>
</content>
</invoke>
