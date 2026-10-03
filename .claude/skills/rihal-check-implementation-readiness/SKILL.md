---
name: rihal-check-implementation-readiness
description: >
  Verify that PRD, UX designs, architecture decisions, and epics/stories are
  all aligned and ready for implementation. Activates when the user says
  "check implementation readiness", "is this ready for dev", "verify
  alignment", "readiness check", "IR check", or "can we start building". Do
  NOT use during active implementation (use rihal-correct-course instead).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces an alignment report with checklist format
- Each artifact checked: PRD exists? | UX exists? | ADR exists? | Stories exist? | Cross-references match?
- Final verdict: READY / BLOCKED (with explicit blockers)
- Do NOT declare ready if any artifact is missing or references are stale

## Examples

### Happy Path
**Input:** "Check if phase-03 is ready for implementation"
**Expected behavior:** Read all artifacts in .rihal/phases/phase-03/. Cross-check references. Produce table with READY/MISSING per artifact. Final verdict with any blockers.

### Edge Case: Stale Cross-References
**Input:** (PRD mentions a feature that has no corresponding story)
**Expected behavior:** Report as BLOCKED: "PRD section 3.2 references 'admin panel' but no story exists. Either create the story or remove from PRD scope."
