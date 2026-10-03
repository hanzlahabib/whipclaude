---
name: rihal-code-review
description: >
  Review code changes using parallel adversarial review layers and produce
  actionable findings. Activates when the user says "review this code", "run
  code review", "do a PR review", "review the diff", "critique this
  implementation", or "CR". Do NOT use for documentation review (use
  rihal-validate-prd or editorial skills).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces review report with severity per finding: Critical / High / Medium / Low
- Report table: File:Line | Severity | Issue | Suggested Fix
- Final verdict: APPROVE / REQUEST CHANGES / BLOCK
- Saved to .rihal/artifacts/reviews/{pr-id}.md
- Do NOT silently fix issues — the author must decide

## Examples

### Happy Path
**Input:** "Run code review on this PR diff"
**Expected behavior:** Load diff, run parallel reviews (blind hunter, edge case hunter, acceptance auditor), triage findings, produce verdict.

### Edge Case: Diff Too Large
**Input:** (diff is 2000+ lines)
**Expected behavior:** Report: "Diff is too large for a single review (2000+ lines). Split into smaller PRs, or pick 3-4 focus areas to review first."
