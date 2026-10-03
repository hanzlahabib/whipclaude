---
name: rihal:audit-fix
description: Autonomous audit-to-fix pipeline — find issues, classify, fix, test, commit.
argument-hint: "[--max N] [--severity high|medium|all] [--dry-run] [--source <audit>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
  - AskUserQuestion
---

@.rihal/workflows/audit-fix.md
