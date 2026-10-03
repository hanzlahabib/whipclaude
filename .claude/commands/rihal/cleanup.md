---
name: rihal:cleanup
description: Execute cleanup workflow
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Execute cleanup workflow
</objective>

<execution_context>
@.rihal/workflows/cleanup.md
</execution_context>

<process>
Execute the cleanup workflow from @.rihal/workflows/cleanup.md end-to-end.
</process>
