# Step 2: Extract Major Outcomes from PRD

**Progress: Step 2 of 10** — Next: Milestone Sequencing

## STEP GOAL

Parse the approved PRD, extract every named outcome / success metric / scope item, and present them back to the user for confirmation. No grouping into milestones yet — that's step 3.

## MANDATORY RULES

- 🛑 Do NOT invent outcomes not present in the PRD.
- 🛑 Do NOT skip outcomes you consider "obvious". The user decides what matters.
- ⏸️ HALT at the A/P/C menu at the end of this step.
- 🚷 No autonomous bypass — see `../../../_shared/no-autonomous-bypass.md`.

## SEQUENCE

### 1. Re-read the PRD

Load `{inputFile}` (`{planning_artifacts}/prd.md`). Focus on:

- **Scope** section — every in-scope feature.
- **Success Metrics** / **Goals** — the numbers the product is measured against.
- **Out of scope** — goes to Backlog in step 7, but note it now so we don't accidentally promote later.

### 2. Build the outcome list

For each outcome, capture:

| Field | Example |
|-------|---------|
| ID | O-01 |
| Name | "Paid subscription tier live" |
| Source | "PRD §3 Scope, line 12" |
| Acceptance hint | "Stripe integrated, ≥ 3 paid customers" |
| Dependencies | O-02 (auth must ship first) |

Order by PRD order — the user can reorder in step 3.

### 3. Present for confirmation

Show a compact table:

```
Outcomes extracted from PRD ({count}):

  O-01  Paid subscription tier live            (PRD §3)
  O-02  User authentication                    (PRD §3)
  O-03  Team workspaces                        (PRD §4)
  ...

[A] Accept — these are the outcomes, proceed to sequencing
[P] Propose — I want to add / remove / rename outcomes
[C] Continue to step 3 (same as A)
```

If user picks `P`, re-open the extraction with user-supplied additions / removals, re-present until user picks A or C.

### 4. Persist & advance

On A or C:
- Append the outcomes table to `{outputFile}` under a `## Outcomes (extracted from PRD)` heading.
- Update frontmatter: add `step-02-outcomes` to `stepsCompleted`.
- Load `./step-03-sequencing.md`.
