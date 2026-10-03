---
name: rihal:plan-milestone-gaps
description: Create all phases necessary to close gaps identified by `/rihal:audit-milestone`. Reads MILESTONE-AUDIT.md, groups gaps 
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Create all phases necessary to close gaps identified by `/rihal:audit-milestone`. Reads MILESTONE-AUDIT.md, groups gaps 
</objective>

<execution_context>
@.rihal/workflows/plan-milestone-gaps.md
</execution_context>

<process>
Execute the plan-milestone-gaps workflow from @.rihal/workflows/plan-milestone-gaps.md end-to-end.
</process>
