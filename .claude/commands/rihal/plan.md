---
name: rihal:plan
description: Convert council follow-ups or task descriptions into executable SPRINT.md files. Spawns rihal-planner to produce structured plans that /rihal:execute can run.
argument-hint: "<list | show <id> | <description>> [--phase <name>] [--output <dir>]"
allowed-tools: Read, Write, Glob, Grep, Bash, Agent
---

<objective>
Convert scope or task description into executable SPRINT.md files with story breakdown, dependencies, and acceptance criteria.
</objective>

<execution_context>
@.rihal/workflows/plan.md
</execution_context>

<process>
Execute the plan workflow from @.rihal/workflows/plan.md end-to-end.
Spawn rihal-planner to produce SPRINT.md. Run rihal-sprint-checker to verify quality before execution.
</process>
