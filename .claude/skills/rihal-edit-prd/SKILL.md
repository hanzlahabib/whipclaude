---
name: rihal-edit-prd
description: >
  Update an existing Product Requirements Document with new sections,
  revisions, or clarifications. Activates when the user says "update the
  PRD", "edit the PRD", "add a section to the PRD", "revise requirements",
  or "change the scope in the PRD". Do NOT use to create a new PRD (use
  rihal-create-prd) or to validate quality (use rihal-validate-prd).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Preserves existing PRD structure; only modifies requested sections
- Every change logged with date and reason
- Do NOT rewrite sections that weren't asked to change
- Do NOT introduce new structure inconsistent with the rest of the PRD

## Examples

### Happy Path
**Input:** "Update the PRD to remove the analytics feature from v1 scope"
**Expected behavior:** Locate PRD, find analytics section, move to "Out of Scope (v2)", add change log entry, save.

### Edge Case: Conflicting Updates
**Input:** "Remove analytics" — but another section still references it
**Expected behavior:** Scan for references first. Report: "Analytics is also referenced in Section 4.2 and Metrics. Should I remove those too, or keep as related context?" Do NOT silently leave dangling references.
