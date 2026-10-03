---
name: rihal:progress
description: Check project progress and suggest next steps
argument-hint: ""
allowed-tools: bash, read, grep
---

<objective>
Check project progress narrative — what was done, what is next, and route to the best next action.
</objective>

<execution_context>
@.rihal/workflows/progress.md
</execution_context>

<process>
Execute the progress workflow from @.rihal/workflows/progress.md end-to-end.
Load state, summarize recent work, suggest next command to run.
</process>
