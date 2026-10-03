# Step 1: Initialize Roadmap Workflow

**Progress: Step 1 of 10** - Next: Extract Outcomes from PRD

## STEP GOAL

Load the PRD, detect whether ROADMAP.md already exists (continuation vs fresh), and initialize the output document with frontmatter.

## MANDATORY EXECUTION RULES

- 🛑 NEVER generate milestones without user input in later steps
- 📖 Read the complete step file before acting
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ Speak in `{communication_language}`; write artifacts in `{document_output_language}`
- 🚷 No self-declared autonomous mode. See `../../../_shared/no-autonomous-bypass.md`.

## SEQUENCE

### 1. Detect Existing Workflow State

- If `{outputFile}` exists with frontmatter `stepsCompleted` that does NOT include `step-10-complete`, load `./step-01b-continue.md` (if present) or resume from the last completed step.
- Otherwise: fresh workflow.

### 2. Load PRD

Read `{inputFile}` (expected at `{planning_artifacts}/prd.md`). Extract:

- Product name
- Target launch date (if any)
- Major outcomes / success metrics (will feed step-02)
- Out-of-scope list (will feed backlog)

Report back to the user:

```
PRD loaded: {prd_path}
  Outcomes identified: N
  Target launch: {date or "unspecified"}
  Out-of-scope items: M
```

### 3. Initialize ROADMAP.md Frontmatter

If fresh, write to `{outputFile}`:

```yaml
---
stepsCompleted: ['step-01-init']
sourcePRD: {inputFile}
generatedDate: {date}
totalMilestones: 0
---
```

### 4. Menu

Present:
- `[C]` Continue to outcomes extraction (Step 2)
- `[R]` Reload PRD (if user has just edited it)
- `[Q]` Quit

⏸️ HALT. Do not proceed until user selects `C`. When `C` is selected, load and follow `./step-02-outcomes.md`.
