# Checklist: Story Definition of Done

Use this checklist when **completing a user story** — all acceptance criteria met, code written, tests passing.

A story is "Done" only when all these items are checked:

## Acceptance Criteria Verification

- [ ] **All acceptance criteria met** — Each criterion tested and passing
  - For UI: User can perform the action and see expected result
  - For API: Endpoint returns correct status and response shape
  - For Data: Stored/retrieved data is accurate
- [ ] **Edge cases handled** — Empty states, errors, boundary conditions work correctly
- [ ] **No known stubs** — No TODO comments, empty function bodies, or placeholder values left in code

## Testing

- [ ] **Tests written** — Unit tests for logic, integration tests for workflows
- [ ] **All tests passing** — No failures, flaky tests fixed
- [ ] **Coverage adequate** — Critical paths have test coverage (aim for 80%+ on modified code)

## Code Quality

- [ ] **No lint errors** — Code style follows project conventions (from CLAUDE.md or equivalent)
- [ ] **No console.log left** — Debug logs removed from production code (tests may have logging)
- [ ] **Follows project patterns** — Uses existing architecture, naming, folder structure
- [ ] **Imports correct** — All dependencies exist and are installed

## Documentation

- [ ] **Code commented** — Complex logic explained; edge cases documented
- [ ] **API documented** — Endpoints have request/response examples (if API story)
- [ ] **UI behavior documented** — States and interactions clear for maintainers

## Commits

- [ ] **Conventional Commits format** — `type(scope): description` (e.g., `feat(auth): add JWT refresh rotation`)
- [ ] **No AI attribution** — No "Generated with Claude Code", no "Co-Authored-By: Claude"
- [ ] **Meaningful messages** — Why the change, not just what changed
- [ ] **One logical change per commit** — Not mixing unrelated work

## State & Handoff

- [ ] **Story summary written** — Brief recap of what was built (for PR or SUMMARY.md)
- [ ] **State updated** — If this is part of a plan, SUMMARY.md created
- [ ] **No blockers recorded** — If blockers exist, they're documented for team

## Definition of Done Template

```markdown
## Acceptance Criteria Verification
- [x] All 5 criteria tested and passing
- [x] Edge cases: empty posts list, network error, 404 user

## Testing
- [x] 12 new tests written (POST, GET, error cases)
- [x] All tests passing locally and in CI
- [x] Coverage: auth module at 87%

## Code Quality
- [x] Zero lint errors
- [x] Follows existing .../api/routes pattern
- [x] Using existing jwt library (jose)

## Commits
- [x] feat(auth): add JWT refresh token rotation
- [x] test(auth): add refresh token tests
```

## When NOT All Items Are Checked

If any item cannot be checked:
1. **Add a blocker:** Record why it's blocked (missing dependency, design uncertainty, etc.)
2. **Split the story:** If too much work remains, move non-critical acceptance criteria to a new story
3. **Flag for review:** Bring to team (council/standup) before merging
