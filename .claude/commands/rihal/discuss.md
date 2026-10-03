---
name: rihal:discuss
description: Quick sync with one Rihal agent. Lighter than /rihal:council — one agent, no cross-talk, optional save.
argument-hint: "[agent-name] <question>"
allowed-tools:
  - Read
  - Bash
  - Agent
  - AskUserQuestion
---

<objective>
Quick sync with one Rihal agent — lighter than council. One agent answers, no cross-talk, optional artifact save.
</objective>

<execution_context>
@.rihal/workflows/discuss.md
</execution_context>

<process>
Execute the discuss workflow from @.rihal/workflows/discuss.md end-to-end.
Identify the right agent from the question, spawn it, return focused answer.
</process>
