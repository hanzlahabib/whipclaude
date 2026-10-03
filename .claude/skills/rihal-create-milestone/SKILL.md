---
name: rihal-create-milestone
description: >
  Design the milestone roadmap (M1..Mn) for a project from an approved PRD.
  Activates when the user says "create milestones", "plan milestones",
  "create roadmap", "what milestones do I need", "break this project into
  milestones", or "roadmap for this product". Do NOT use for milestone
  lifecycle (use rihal-new-milestone / rihal-complete-milestone), for
  decomposing one milestone into epics (use rihal-create-epics-and-stories),
  or for single-phase planning (use rihal-plan-phase).
---

Follow the instructions in ./workflow.md.

## Output Format

- Output: ROADMAP.md in `{planning_artifacts}/`
- Structure: per milestone — Name, Window (dates), Goal (one sentence), Acceptance criteria, Kill criteria (binary), Phases (stub list), then a trailing Backlog / parking lot section
- Each kill criterion must be binary (number + threshold), not adjectival
- Every milestone has an explicit window with start + end dates
- Do NOT include: unquantified success language ("grow the user base"), open-ended milestones without dates, or more than 6 active milestones in one roadmap (split into v1/v2 if needed)

## Examples

### Happy Path
**Input:** "Create the milestones I need for this project"
**Expected behavior:** Load the approved PRD. Confirm scope. For each major outcome, propose a milestone with name, window, goal, acceptance, kill criteria. Halt at menu after each milestone for user confirmation. Append to ROADMAP.md only after user selects Continue. Upsert each milestone + its phase stubs into `.rihal/state.json` (see `../../_shared/state-sync-rule.md`).

### Edge Case: No PRD Exists
**Input:** "Create milestones for social-poster-x" (no prd.md)
**Expected behavior:** DO NOT invent milestones. Respond: "I need an approved PRD first. Run `/rihal:create-prd` or point me at an existing brief."

### Edge Case: PRD Marked Draft
**Input:** PRD exists but frontmatter shows `status: draft`
**Expected behavior:** Warn the user that milestones based on a draft PRD will need re-work if the PRD changes. Ask whether to proceed anyway or first finalize the PRD.

### Negative Example: Request to Bypass the Interview
**Input:** "just generate the full roadmap autonomously"
**Expected behavior:** DO NOT invent an "autonomous mode". Point the user to the two sanctioned bypass paths (`.rihal/config.yaml` → `mode: yolo` or `/rihal:do --auto`) and present the step-01 menu. See `../../_shared/no-autonomous-bypass.md`.
