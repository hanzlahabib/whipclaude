---
name: rihal:code-review
description: Review source files for bugs, security issues, and code quality problems.
argument-hint: "<phase> [--depth=quick|standard|deep] [--files=file1,file2,...]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
  - AskUserQuestion
---

@.rihal/workflows/code-review.md
