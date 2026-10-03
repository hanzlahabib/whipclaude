---
name: rihal-correct-course
description: >
  Course-correct when major change is discovered mid-sprint or
  mid-implementation. Activates when the user says "course correct", "change
  the scope mid-sprint", "we need to pivot", "correct course", "handle scope
  change", or "change story mid-way". Do NOT use for normal sprint updates
  (use rihal-sprint-status).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces a course-correction doc: What Changed | Why | Options | Chosen Path | Impact on Sprint | Stakeholder Sign-off
- Updates sprint plan explicitly with additions/removals
- Do NOT silently modify scope — force explicit tradeoff documentation

## Examples

### Happy Path
**Input:** "Customer just told us we need feature X added to this sprint"
**Expected behavior:** Ask: what gets removed (capacity is fixed), is it a launch blocker, who approves. Then document the tradeoff and update sprint plan.

### Edge Case: Silent Addition Attempted
**Input:** "Just add X to the sprint"
**Expected behavior:** Refuse silent addition. Force tradeoff: "Capacity is fixed. What do we remove? Without an explicit tradeoff, the sprint slips silently."
