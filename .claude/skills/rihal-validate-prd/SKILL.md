---
name: rihal-validate-prd
description: >
  Validate an existing PRD for comprehensiveness, leanness, organization,
  and internal consistency. Activates when the user says "validate the PRD",
  "review the PRD", "check the PRD", "is the PRD ready", "PRD quality
  check", or "audit the PRD". Do NOT use to create or edit a PRD.
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces a validation report with severity per issue: Critical / Warning / Info
- Report table: Section | Issue | Severity | Suggested Fix
- Final verdict: READY / NEEDS REVISION / REWRITE
- Do NOT silently fix issues — report them for the user to decide

## Examples

### Happy Path
**Input:** "Validate the PRD at .rihal/phases/phase-02/prd.md"
**Expected behavior:** Read PRD, check against rubric (problem clarity, measurable success, explicit scope, kill criteria, owner attribution), produce report, deliver verdict.

### Edge Case: PRD Missing Sections
**Input:** (PRD is missing Kill Criteria section)
**Expected behavior:** Report as Critical: "Missing Kill Criteria section. Without this, the project has no exit strategy. Recommended fix: [template snippet]."
