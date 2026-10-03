# Workflow: rihal:milestone-summary

<purpose>
Generate a human-readable summary of the current or specified milestone, including all phases, decisions, outcomes, and lessons learned. Output can be Markdown (default) or PDF. This creates a narrative view of the entire milestone arc.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` contains only `--help` or `-h`:

```
/rihal:milestone-summary [--format=markdown|pdf] [--include-decisions]
```

**Examples:**
```
/rihal:milestone-summary
/rihal:milestone-summary --format=pdf --include-decisions
```

STOP — do not proceed.

## Step 1 — Parse arguments and locate milestone

Extract flags:
- `--format` → "markdown" (default) or "pdf"
- `--include-decisions` → boolean

Find active milestone (same logic as audit-milestone):
- Check `.planning/current-milestone.txt`
- Fallback to most recent in `.planning/milestones/`

If not found:

```
⚠ No active milestone. Create one:

/rihal:new-milestone <name>
```

STOP. Store path as `$MILESTONE_DIR`.

## Step 2 — Load milestone artifacts

Read:
- `$MILESTONE_DIR/ROADMAP.md` → extract goals, phases, success criteria
- `$MILESTONE_DIR/STATE.md` → extract decisions, blockers, workstreams
- `$MILESTONE_DIR/REQUIREMENTS.md` → extract user stories, technical specs

## Step 3 — Scan all phase summaries

For each phase directory in `$MILESTONE_DIR/phases/`:
- Read the phase name from directory name
- Find and read SUMMARY.md
- Extract: outcomes, metrics, key decisions, blockers
- Store in `$PHASE_DATA` array ordered by phase number

## Step 4 — Build narrative structure

Create a timeline showing:

```
MILESTONE TIMELINE

[Start Date] — Kickoff
  - Initial goals (from ROADMAP)
  - Key assumptions

[Phase 1 Date] — Phase 1 Name
  - Summary text (from SUMMARY.md)
  - Key outcomes
  - Decisions (if --include-decisions)

[Phase 2 Date] — Phase 2 Name
  [...]

[End Date] — Completion
  - Final metrics
  - Overall success assessment
```

## Step 5 — Compile summary document

Generate Markdown (or PDF-source) output:

```markdown
# {MILESTONE_NAME} — Milestone Summary

**Duration:** [start] — [end]
**Status:** [PLANNING | IN_PROGRESS | COMPLETED]

## Overview

{one paragraph overview of what this milestone aimed to accomplish}

## Original Goals

- Goal 1: [text]
- Goal 2: [text]
- Goal 3: [text]

## Milestone Timeline

{timeline structure from Step 4}

## Phase Summaries

### Phase 1: {Name}
**Duration:** [dates] | **Owner:** [person/team]

{summary from SUMMARY.md, first 2-3 paragraphs}

**Key Outcomes:**
- Outcome 1
- Outcome 2

**Decisions Made:**
{if --include-decisions, list from SUMMARY.md}

### Phase 2: {Name}
[...]

## Overall Outcomes

{aggregate achievements from all phases}

## Metrics

- Total phases: {count}
- Duration: {count} days
- Key deliverables: {count}

## Decisions and Trade-offs

{if --include-decisions, comprehensive decision log with rationales}

## Lessons Learned

- Lesson 1 (what went well)
- Lesson 2 (what to improve next time)

## Success Assessment

[Did we meet the original goals? What did we learn?]

## Appendix

- [Link to ROADMAP.md]
- [Link to STATE.md]
- [Link to archive location]
```

## Step 6 — Handle PDF export (if requested)

If `--format=pdf`:

1. Convert Markdown to PDF using a simple text-to-PDF approach
   (or provide instructions for user to use pandoc/wkhtmltopdf if needed)
2. Save as `.planning/milestone-summary-{TIMESTAMP}.pdf`

Otherwise, save as `.planning/milestone-summary-{TIMESTAMP}.md`

## Step 7 — Report

Print:

```
✓ Summary generated
  Format: {format}
  Location: {file_path}
  
View it:
  cat {file_path}
```

## Success Criteria

- Milestone summary created covering all phases
- Narrative structure (timeline, outcomes, decisions)
- Output format matches requested (Markdown or PDF)
- File saved to `.planning/milestone-summary-*.{md|pdf}`
- User can easily read and share the document

## On Error

If no phase summaries found:

```
⚠ No phase summaries in milestone. Execute phases first:

/rihal:plan <phase description>
/rihal:execute <plan-artifact>
```

If ROADMAP.md missing:

```
⚠ ROADMAP.md missing. Cannot generate summary without original goals.
```

If PDF conversion fails:

```
⚠ PDF conversion failed. Saving as Markdown instead:
  {file_path}
```
