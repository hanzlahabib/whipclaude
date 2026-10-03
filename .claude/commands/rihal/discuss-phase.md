---
name: rihal:discuss-phase
description: Gather context through adaptive questioning before sprint planning. Creates CONTEXT.md with decisions, discretion areas, deferred ideas.
argument-hint: "<phase-number> [--auto] [--chain]"
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion
---

<objective>
Gather phase context through adaptive questioning before planning. Produces CONTEXT.md that locks decisions and boundaries for the planner. Use --auto to skip questions, --chain for discuss→plan→execute pipeline.
</objective>

<execution_context>
@.rihal/workflows/discuss-phase.md
</execution_context>

<process>
Execute the discuss-phase workflow from @.rihal/workflows/discuss-phase.md end-to-end.
Ask adaptive questions, produce CONTEXT.md with locked decisions and deferred ideas.
</process>
