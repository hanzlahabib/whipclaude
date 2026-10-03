---
name: rihal-generate-project-context
description: >
  Generate a project-context.md file that summarizes project standards,
  conventions, tech stack, and key patterns for AI agents to reference.
  Activates when the user says "generate project context", "create context
  file", "document project conventions", "setup AI context", or "create
  project-context.md". Do NOT use for full project documentation (use
  rihal-document-project).
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Produces .rihal/project-context.md
- Sections: Tech Stack | Conventions | Key Patterns | Testing Approach | Folder Structure | Common Commands
- Keep under 2000 tokens for efficient context loading
- Do NOT include: historical changes, deprecated sections, or full architecture details

## Examples

### Happy Path
**Input:** "Generate project context for this repo"
**Expected behavior:** Scan repo, identify stack from package.json/requirements.txt, detect conventions from existing code, produce compact project-context.md.

### Edge Case: Mixed Conventions
**Input:** (codebase has both camelCase and snake_case files)
**Expected behavior:** Report inconsistency: "Mixed conventions detected. Pick one for project-context.md so agents don't compound the mess."
