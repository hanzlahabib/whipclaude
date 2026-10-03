---
name: rihal:correct-course
description: Load original PRD/architecture, compare to current codebase. Classify deviation (scope drift / wrong architecture / missing AC / tech debt). Produce ordered remediation plan + updated story file.
argument-hint: "[--prd <path>] [--architecture <path>]"
allowed-tools: Read, Glob, Grep, Bash, Agent
---

@.rihal/workflows/correct-course.md
