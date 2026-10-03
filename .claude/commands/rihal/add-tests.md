---
name: rihal:add-tests
description: Generate unit and E2E tests for a completed phase based on its SUMMARY.md, CONTEXT.md, and implementation. Classifies ea
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Generate unit and E2E tests for a completed phase based on its SUMMARY.md, CONTEXT.md, and implementation. Classifies ea
</objective>

<execution_context>
@.rihal/workflows/add-tests.md
</execution_context>

<process>
Execute the add-tests workflow from @.rihal/workflows/add-tests.md end-to-end.
</process>
