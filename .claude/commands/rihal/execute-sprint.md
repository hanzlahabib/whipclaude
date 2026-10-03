---
name: rihal:execute-sprint
description: "Internal — Execute a sprint's SPRINT.md. Wrapper over rihal:execute for sprint-specific dispatch."
argument-hint: "<sprint-file.md | phase-dir>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Agent
---

@.rihal/workflows/execute-sprint.md
