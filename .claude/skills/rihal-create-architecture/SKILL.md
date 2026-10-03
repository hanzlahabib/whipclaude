---
name: rihal-create-architecture
description: >
  Write an Architecture Decision Record (ADR) to lock a significant
  technical decision. Activates when the user says "write an ADR", "create
  architecture decision", "document this architectural choice", "write an
  architecture record", "lock this technical decision", or "record the
  decision to use X". Do NOT use for implementation code (use
  rihal-dev-story) or sprint planning (use rihal-sprint-planning).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- ADR file structure is fixed: Title | Status | Date | Decider | Context | Decision | Consequences | Alternatives Considered
- Saved to .rihal/decisions/{NNN}-{slug}.md with sequential numbering
- Status values: Proposed / Accepted / Deprecated / Superseded
- At least 2 alternatives considered, each with explicit rejection reason
- Do NOT skip the Alternatives section — it's the most important part

## Examples

### Happy Path
**Input:** "Create an ADR for choosing Postgres over MongoDB"
**Expected behavior:** Ask for context (what project, constraints). Produce ADR with Context, Decision (Postgres), Consequences (trade-offs both ways), Alternatives (MongoDB rejected because X, SQLite rejected because Y).

### Edge Case: Insufficient Justification
**Input:** "ADR: we're using React"
**Expected behavior:** Refuse to write a one-liner ADR. Ask: "What did you reject (Vue, Svelte, Angular)? What trade-offs did you weigh? An ADR without alternatives is a note, not a decision record."
