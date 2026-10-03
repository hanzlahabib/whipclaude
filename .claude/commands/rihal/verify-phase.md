---
name: rihal:verify-phase
description: Verify phase goal achievement through goal-backward analysis. Check that the codebase delivers what the phase promised, 
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Verify phase goal achievement through goal-backward analysis. Check that the codebase delivers what the phase promised, 
</objective>

<execution_context>
@.rihal/workflows/verify-phase.md
</execution_context>

<process>
Execute the verify-phase workflow from @.rihal/workflows/verify-phase.md end-to-end.
</process>
