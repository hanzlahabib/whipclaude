---
name: rihal-sprint-status
description: >
  Generate a sprint status report showing progress, blockers, and
  recommended next actions. Activates when the user says "sprint status",
  "how is the sprint going", "generate status report", "sprint progress", or
  "where are we in the sprint". Do NOT use for retrospectives (use
  rihal-retrospective).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Status table: Story | Owner | Status | Blockers | Notes
- Summary: X/Y stories done, N blockers, recommendation for next action
- Output to .rihal/progress/status-{date}.md
- Do NOT invent progress — read from actual file states

## Examples

### Happy Path
**Input:** "What's the sprint status?"
**Expected behavior:** Scan stories in current sprint, read each story's state (backlog/ready/in-progress/review/done), produce table + summary + recommendation.

### Edge Case: No Active Sprint
**Input:** "Sprint status" (no sprint file exists)
**Expected behavior:** Respond: "No active sprint found. Run rihal-sprint-planning first."
