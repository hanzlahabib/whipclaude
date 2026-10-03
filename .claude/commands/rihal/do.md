---
name: rihal:do
description: "[ROUTER] Interactive picker — describe what you want and rihal picks the command"
argument-hint: "[optional question or task description]"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<objective>
Analyze freeform natural language input and dispatch to the most appropriate rihal command. Acts as a smart dispatcher — never does the work itself. Matches intent to the best /rihal:* command, confirms the match, then hands off.
</objective>

<execution_context>
@.rihal/workflows/do.md
</execution_context>

<process>
Execute the do workflow from @.rihal/workflows/do.md end-to-end.
Route user intent to the best rihal command and invoke it.
</process>
