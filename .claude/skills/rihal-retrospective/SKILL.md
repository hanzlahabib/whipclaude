---
name: rihal-retrospective
description: >
  Run an epic retrospective that reviews completed work, extracts learnings,
  and produces owned action items. Activates when the user says "run
  retrospective", "retro", "sprint retrospective", "review completed work",
  or "extract learnings from this sprint". Do NOT use for active sprint
  status (use rihal-sprint-status).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Fixed structure: Went Well | Went Poorly | Start Doing | Stop Doing | Continue Doing | Action Items
- Every action item has an owner and a deadline — no "we should..." without a name
- Saved to .rihal/progress/retro-{date}.md
- Do NOT include vague action items

## Examples

### Happy Path
**Input:** "Run retro for the sprint we just finished"
**Expected behavior:** Gather answers to all 5 categories, convert insights to owned action items with deadlines, save.

### Edge Case: No One Owns Actions
**Input:** "Action item: improve testing"
**Expected behavior:** Refuse. Respond: "This is a wish, not an action. Who owns it? By when? Restate as: 'Fatima sets up Playwright on staging by Friday.'"
