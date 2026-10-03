# Workflow: rihal:audit-milestone

<purpose>
Cross-phase audit of milestone completion. Reads all SUMMARY.md files from completed phases, compares their outcomes to the original ROADMAP goals, flags gaps, and generates an audit report showing completion percentage and decision traceability.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` contains only `--help` or `-h`:

```
/rihal:audit-milestone [--strict] [--report]
```

**Examples:**
```
/rihal:audit-milestone
/rihal:audit-milestone --strict --report
```

STOP — do not proceed.

## Step 1 — Locate milestone context

Determine the active milestone. Check:

1. Is there a `.planning/current-milestone.txt` file?
2. If not, find the most recent directory in `.planning/milestones/`

If neither exists:

```
⚠ No active milestone found. Start a new one:

/rihal:new-milestone <name>
```

STOP.

Store path as `$MILESTONE_DIR`.

## Step 2 — Load original goals

Read `$MILESTONE_DIR/ROADMAP.md` and extract the Goals section.

Parse into array `$ORIGINAL_GOALS` (just the text of each goal).

## Step 3 — Scan all phases

List all directories in `$MILESTONE_DIR/phases/` and find every SUMMARY.md file.

For each SUMMARY.md:
- Extract the phase name (from the phase directory name or filename)
- Extract the "Outcomes" or "Summary" section
- Extract "Decisions Made" section if present
- Store in array `$PHASE_SUMMARIES`

## Step 4 — Audit completeness

For each `$ORIGINAL_GOALS`:

1. Search all phase SUMMARY.md files for text matching the goal
2. If found, mark as ✓ COMPLETED
3. If partially addressed, mark as ◐ PARTIAL
4. If not addressed, mark as ✗ NOT ADDRESSED

Create audit report showing coverage percentage:

```
Goal Coverage:
  ✓ Goal 1: COMPLETED
  ◐ Goal 2: PARTIAL (addressed in Phase 2, not Phase 3)
  ✗ Goal 3: NOT ADDRESSED

Coverage: 67% (2/3 goals fully addressed)
```

## Step 5 — Check for scope creep

Count total phases and compare to original phase count in ROADMAP. If actual > planned:

```
⚠ Scope creep: Planned {planned} phases, executed {actual}. Review ROADMAP updates.
```

## Step 6 — Trace decisions

If `--strict` flag set:

- For each decision in any SUMMARY.md, verify it's documented in STATE.md under "Decisions Made"
- Flag undocumented decisions

```
Decision Traceability (--strict mode):
  ✓ Decision in Phase 1 documented in STATE
  ⚠ Decision in Phase 2 NOT in STATE.md
```

## Step 7 — Generate report

Create `.planning/audit-{TIMESTAMP}.md`:

```markdown
# Audit Report: {MILESTONE_NAME}

**Date:** ISO-DATE
**Milestone:** {MILESTONE_DIR}

## Executive Summary

{coverage_percentage}% of original goals completed.

## Goal Coverage

{detailed goal audit}

## Scope

- Planned phases: {count}
- Executed phases: {count}
- Variance: {+/- count}

## Decision Traceability

{decision_audit, if --strict}

## Recommendations

[Auto-generated based on gaps]
```

If `--report` flag set, also print the report to stdout. Otherwise, just save to file.

## Success Criteria

- Audit report created with goal coverage assessment
- All phases scanned for outcomes
- Original goals compared to actual outcomes
- Report saved to `.planning/audit-*.md`

## On Error

If no SUMMARY.md files found:

```
⚠ No phase summaries found. Have phases been executed?
  Check: {MILESTONE_DIR}/phases/
```

If ROADMAP missing:

```
⚠ ROADMAP.md missing. Cannot audit without original goals.
  Create one: /rihal:new-milestone
```
