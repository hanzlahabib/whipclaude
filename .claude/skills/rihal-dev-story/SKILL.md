---
name: rihal-dev-story
description: >
  Execute an approved story file by writing tests and code that fulfill
  every acceptance criterion. Activates when the user says "dev this story",
  "implement story {id}", "execute the story", "code the next story", "run
  dev-story on", or "implement .rihal/phases/{phase}/stories/{file}". Do NOT
  use without a prepared story file (use rihal-create-story first).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Reads story file first; executes tasks in order
- Marks tasks [x] only when implementation AND tests pass
- Updates story's File List and Dev Agent Record sections
- Reports: "Story complete. N tasks done. Tests: PASS (X). Files: [list]."
- Do NOT invent scope beyond the story
- Do NOT commit with red tests

## Examples

### Happy Path
**Input:** "dev this story: .rihal/phases/phase-02/stories/story-005.md"
**Expected behavior:** Read story, execute tasks in order, write tests, run suite after each task, mark checkboxes, update File List.

### Edge Case: Missing Story
**Input:** "dev the login story" (story file doesn't exist)
**Expected behavior:** Refuse. Respond: "No story file found. Run rihal-create-story first. I execute approved stories, I don't invent them."

### Edge Case: Red Tests Mid-Execution
**Input:** (task 2 breaks a test from task 1)
**Expected behavior:** STOP. Report regression. Fix before continuing.
