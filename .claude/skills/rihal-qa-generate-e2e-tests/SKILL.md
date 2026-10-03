---
name: rihal-qa-generate-e2e-tests
description: >
  Generate end-to-end tests for an existing feature using the project's
  standard test framework. Activates when the user says "generate e2e
  tests", "write e2e tests for", "add end-to-end test coverage", "qa this
  feature", or "generate integration tests". Do NOT use for unit test
  generation or code review (use rihal-code-review).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Tests use the project's detected test framework (Playwright/Cypress/pytest/etc.)
- Test file structure: happy path first, then alternative paths, error paths, edge cases
- All generated tests MUST be run to verify they pass
- Do NOT generate tests without running them
- Do NOT use external test utilities — standard framework APIs only

## Examples

### Happy Path
**Input:** "Generate e2e tests for the checkout flow"
**Expected behavior:** Scan checkout files, detect framework, generate tests covering happy path + 3-5 error paths + edge cases, run suite, report results.

### Edge Case: No Test Framework Detected
**Input:** (project has no test setup)
**Expected behavior:** Report: "No test framework detected. Install Playwright/Jest/Vitest first, or tell me which framework to scaffold." Do NOT invent a framework.
