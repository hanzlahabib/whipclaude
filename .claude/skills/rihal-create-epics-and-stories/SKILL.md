---
name: rihal-create-epics-and-stories
description: >
  Break a PRD into epics and user stories that drive development. Activates
  when the user says "create epics", "break this into stories", "generate
  the epic list", "epic and story breakdown", "decompose the PRD", or
  "create the backlog". Do NOT use to prepare a single story for dev (use
  rihal-create-story).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces .rihal/phases/{phase}/epics.md with hierarchical structure
- Each epic has: Title | Goal | Stories (list) | Priority | Estimate
- Each story is independently testable and under 4-hour estimate
- Do NOT create epics larger than 10 stories — split further

## Examples

### Happy Path
**Input:** "Break the PRD into epics and stories"
**Expected behavior:** Read PRD, identify 3-6 epics aligned with requirements, decompose each into 3-8 stories with clear acceptance criteria. Save to epics.md.

### Edge Case: PRD Missing
**Input:** "Create epics" (no PRD exists)
**Expected behavior:** Refuse. Respond: "No PRD found. Run rihal-create-prd first. I cannot invent requirements."
