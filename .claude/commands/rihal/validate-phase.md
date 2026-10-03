---
name: rihal:validate-phase
description: Audit Nyquist validation gaps for a completed phase. Generate missing tests. Update VALIDATION.md.
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Audit Nyquist validation gaps for a completed phase. Generate missing tests. Update VALIDATION.md.
</objective>

<execution_context>
@.rihal/workflows/validate-phase.md
</execution_context>

<process>
Execute the validate-phase workflow from @.rihal/workflows/validate-phase.md end-to-end.
</process>
