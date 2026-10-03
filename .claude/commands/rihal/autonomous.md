---
name: rihal:autonomous
description: Execute remaining phases autonomously with minimal human intervention. Runs plan → execute → verify cycles for unfinished work, pausing at checkpoints and failures.
argument-hint: "[--from N] [--to M] [--only N] [--interactive]"
allowed-tools: Read, Bash, Agent, AskUserQuestion
---

<objective>
Execute remaining incomplete phases autonomously — plan, execute, verify in a loop, pausing only at checkpoints, failures, or decision gates.
</objective>

<execution_context>
@.rihal/workflows/autonomous.md
</execution_context>

<process>
Execute the autonomous workflow from @.rihal/workflows/autonomous.md end-to-end.
Loop through todo phases: spawn rihal-planner if no SPRINT.md, then rihal-executor, handle checkpoints.
</process>
