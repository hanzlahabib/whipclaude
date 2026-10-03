---
name: rihal:sprint-planning
description: Plan the next sprint — compute capacity, prioritize stories, create SPRINT.md, register in state.
argument-hint: "[--phase <NN>] [--velocity <points>] [--goal 'Sprint goal']"
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion
---

<objective>
Plan a sprint end-to-end: load phase scope, compute capacity from velocity history, curate stories with user, create SPRINT.md, register sprint + stories in state.json, start the sprint.
</objective>

<execution_context>
@.rihal/workflows/sprint-planning.md
</execution_context>

<process>
Execute the sprint-planning workflow from @.rihal/workflows/sprint-planning.md end-to-end.
Use rihal-tools.cjs for state operations (sprint add, story add, sprint start, sprint velocity).
Present story table to user for confirmation before committing to sprint.
</process>
