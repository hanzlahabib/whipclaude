# Checklist: Story Draft

Use this checklist when **writing the first draft of a user story** — before it enters the backlog or gets assigned.

## Story Structure

- [ ] **User persona named** — Not "user", but "Mariam (Marketing Lead)" or "Waleed (CTO)" or "Agent deploying to production"
- [ ] **Action/outcome specified** — Clear verb: "view", "export", "validate", "retry", not vague "manage" or "handle"
- [ ] **Acceptance criteria (3+ bullets)** — Each criterion is testable, not subjective
  - Good: "Users can filter by date range using calendar widget, showing only posts from selected dates"
  - Bad: "System should be fast"
- [ ] **Out-of-scope explicitly listed** — What the story does NOT do (prevents scope creep)
- [ ] **Effort estimate (S/M/L)** — Story points or t-shirt size for capacity planning
  - S = 1-2 days, M = 3-5 days, L = 1+ weeks

## Template

```markdown
# Story: [Action for Persona]

**Persona:** [Name, role, context]

**Action:** As a [persona], I want to [action] so that [outcome/benefit].

## Acceptance Criteria

- [ ] [Testable condition 1]
- [ ] [Testable condition 2]
- [ ] [Testable condition 3]

## Out of Scope

- [What this story does NOT do]
- [What will be in a future story]

## Effort

**Estimate:** [S | M | L]
**Rationale:** [why this size]

## Notes

[Any research, design decisions, or open questions]
```

## Passing the Draft Check

A story is ready to move forward when:
1. Persona is named and rooted in the actual team
2. Acceptance criteria are independently verifiable
3. Out-of-scope list prevents misunderstanding
4. Estimate is realistic (check with implementer if uncertain)
5. Story fits in one sprint/phase (if L estimate, consider splitting)
