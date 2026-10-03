---
name: rihal:audit-uat
description: Cross-phase audit of all UAT and verification files. Finds every outstanding item (pending, skipped, blocked, human_need
argument-hint: ""
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Agent
---

<objective>
Cross-phase audit of all UAT and verification files. Finds every outstanding item (pending, skipped, blocked, human_need
</objective>

<execution_context>
@.rihal/workflows/audit-uat.md
</execution_context>

<process>
Execute the audit-uat workflow from @.rihal/workflows/audit-uat.md end-to-end.
</process>
