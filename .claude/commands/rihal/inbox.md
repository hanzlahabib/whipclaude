---
name: rihal:inbox
description: Triage incoming issues and PRs against contribution templates
argument-hint: "[--issues] [--prs] [--label] [--close-incomplete]"
allowed-tools:
  - Read
  - Grep
  - Bash
  - AskUserQuestion
---

@.rihal/workflows/inbox.md
