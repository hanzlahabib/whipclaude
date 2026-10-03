---
name: rihal:verify-work
description: Conversational acceptance testing — verify sprint stories against acceptance criteria
argument-hint: "[--phase <NN>]"
allowed-tools: Read, Bash, Grep, Glob, AskUserQuestion
---

<objective>
Run conversational UAT against completed sprint stories. Verify each story's acceptance criteria are met in the actual codebase. Closes the plan→execute→VERIFY loop.
</objective>

<execution_context>
@.rihal/workflows/verify-work.md
</execution_context>

<process>
Execute the verify-work workflow from @.rihal/workflows/verify-work.md end-to-end.
Load sprint stories, check acceptance criteria against codebase, report pass/fail per story.
</process>
