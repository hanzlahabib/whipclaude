# Step 3: Sequence Outcomes into Milestones

**Progress: Step 3 of 10** — Next: Assign Date Windows

## STEP GOAL

Group the outcome list from step 2 into coherent milestones (M1, M2, M3, ...) and agree the cut lines with the user.

## MANDATORY RULES

- ⏸️ HALT at menu; every milestone grouping is user-confirmed.
- 🛑 Maximum 6 active milestones per roadmap. If the user insists on more, split into v1/v2 and stop at M6 for v1.
- 🛑 Every milestone MUST have at least 2 outcomes. A single-outcome milestone is a phase, not a milestone — suggest merging.

## SEQUENCE

### 1. Propose an initial grouping

Based on outcome dependencies and natural clusters (same surface area, same user persona, same delivery cadence):

```
Proposed milestones:

M1 — MVP (foundation)
  O-02  User authentication
  O-04  Basic project CRUD
  O-07  Single-tenant data model

M2 — Team collaboration
  O-03  Team workspaces
  O-05  Roles & permissions
  O-09  Activity feed

M3 — Monetization
  O-01  Paid subscription tier
  O-06  Usage metering
  O-08  Billing portal

[A] Accept this grouping
[P] Propose changes (move, split, merge)
[C] Continue to step 4
```

### 2. Explain your reasoning

One sentence per milestone:
- M1 is the tech foundation — everything else depends on it.
- M2 turns a single-user tool into a team tool.
- M3 lets Rihal charge money — depends on stable M1 + M2.

### 3. Handle user proposals

If user picks `P`, ask what to change:
- Move O-X from M_Y to M_Z
- Split M_X into two milestones
- Merge M_X + M_Y
- Rename milestone

Re-present the updated grouping until user picks A or C.

### 4. Persist & advance

- Append the confirmed grouping to `{outputFile}` under `## Milestones (proposed)` heading.
- Update `stepsCompleted`.
- Load `./step-04-windows.md`.
