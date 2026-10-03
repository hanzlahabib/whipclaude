---
name: rihal:status
description: Print current project state — phase, plan progress, recent decisions, blockers, last council session
argument-hint: ""
allowed-tools:
  - Read
  - Bash
---

<objective>
Print current project state dashboard — phase, sprint progress, recent decisions, blockers, last council session.
</objective>

<execution_context>
@.rihal/workflows/status.md
</execution_context>

<process>
Execute the status workflow from @.rihal/workflows/status.md end-to-end.
Read state.json and display formatted dashboard.
</process>
