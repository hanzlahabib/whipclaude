---
name: rihal-create-story
description: >
  Prepare a dev-ready user story with full implementation context. Activates
  when the user says "create the next story", "prepare a story", "create
  story {id}", "write the story for", "get next story ready for dev", or
  "assemble story context". Do NOT use to execute a story (use
  rihal-dev-story).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Story file at .rihal/phases/{phase}/stories/story-{id}.md
- Fixed sections: Goal | Context | Tasks (checklist) | Acceptance Criteria | Dependencies | File List (empty) | Dev Agent Record (empty)
- Each task is ≤4 hours, in execution order
- Acceptance criteria in Given/When/Then
- Do NOT include implementation details in the story — those emerge during dev

## Examples

### Happy Path
**Input:** "Create the next story from the backlog"
**Expected behavior:** Read epics.md, identify next unstarted story, populate all sections, save.

### Edge Case: Story Dependencies Missing
**Input:** Next story depends on story-003, which isn't done
**Expected behavior:** Report: "story-{id} depends on story-003 (not yet done). Options: (1) work on story-003 first, (2) skip to next independent story. Which?"
