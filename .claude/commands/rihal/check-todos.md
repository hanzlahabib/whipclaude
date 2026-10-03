---
name: rihal:check-todos
description: List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action.
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action.
</objective>

<execution_context>
@.rihal/workflows/check-todos.md
</execution_context>

<process>
Execute the check-todos workflow from @.rihal/workflows/check-todos.md end-to-end.
</process>
