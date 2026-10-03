---
name: rihal:next
description: Automatically advance to the next logical step — zero friction, auto-invoke
argument-hint: "[--force]"
allowed-tools: Bash, Read, Grep, Glob
---

<objective>
Detect current project state and automatically invoke the next logical Rihal workflow step. No confirmation — reads state, routes, executes.
</objective>

<execution_context>
@.rihal/workflows/next.md
</execution_context>

<process>
Execute the next workflow from @.rihal/workflows/next.md end-to-end.
Detect state, apply safety gates, determine next action, invoke immediately.
</process>
