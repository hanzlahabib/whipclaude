---
name: rihal-document-project
description: >
  Analyze an existing codebase and produce documentation for both human and
  LLM consumption (brownfield analysis). Activates when the user says
  "document this project", "analyze this codebase", "generate docs for
  existing code", "brownfield analysis", or "create LLM-friendly docs". Do
  NOT use for writing net-new docs (use write-document prompt).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces multi-file documentation: README summary, ARCHITECTURE.md, CONVENTIONS.md, project-context.md
- Scans code to detect actual patterns (not what docs claim)
- Do NOT fabricate patterns not present in code
- Do NOT skip sections — if data is missing, flag it explicitly

## Examples

### Happy Path
**Input:** "Document this repo"
**Expected behavior:** Scan repo structure, detect stack, identify patterns, produce multi-file docs with actual findings.

### Edge Case: Inconsistent Patterns
**Input:** (codebase has multiple competing patterns)
**Expected behavior:** Document each pattern with location and flag the inconsistency for the team to resolve.
