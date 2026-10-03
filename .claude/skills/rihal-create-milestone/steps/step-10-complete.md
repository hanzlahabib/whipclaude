# Step 10: Completion Summary & Handoff

**Progress: Step 10 of 10** — Final step

## STEP GOAL

Summarize what was produced, mark the workflow complete in frontmatter, and point the user at the next natural command.

## SEQUENCE

### 1. Final frontmatter update

Append `step-10-complete` to `stepsCompleted`. Add `completedAt: {ISO date}`.

### 2. Completion summary to user

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► ROADMAP CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source PRD:     {inputFile}
Roadmap:        {outputFile}
State:          .rihal/state.json (synced)

Shipped:
  {N} milestones: M1..M{N}
  {M} phases:     01..{NN}
  {K} backlog items: 999.1..999.{K}

Hard deadline:  {deadline or "none specified"}

[{completedAt}]
```

### 3. Next-step menu (intent-based, mirrors the GSD /progress Route A/B/C pattern)

```
What's next?

  [A] Decompose M1 into epics + stories
      → /rihal:create-epics-and-stories

  [B] Plan the first phase in detail
      → /rihal:plan-phase 01

  [C] Review the roadmap with the team
      → /rihal:council "Is this roadmap realistic?"

  [D] Park and review later
      → Roadmap is saved; pick up with /rihal:progress anytime
```

### 4. HALT

This is the terminal step. Do NOT load another step file. The workflow is complete.
