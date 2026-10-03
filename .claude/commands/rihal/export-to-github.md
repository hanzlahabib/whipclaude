---
name: rihal:export-to-github
description: Push phases/stories/decisions to GitHub — thin wrapper over rihal-code github-sync, plus a decisions export mode
argument-hint: "[target] [--execute] [--repo owner/name] [--with-labels] [--decisions [--since ISO]]"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

@.rihal/workflows/export-to-github.md
