---
name: rihal:execute
description: Execute one or more SPRINT.md files. Spawns rihal-executor subagents in parallel per dependency wave. Pauses at checkpoints and waits for human verification or decisions.
argument-hint: "<plan-file.md | phase-dir> [--wave N] [--interactive] [--continue] [--option=A]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
---

<objective>
Execute one or more SPRINT.md files with atomic commits per story, checkpoint handling, and state updates.
</objective>

<execution_context>
@.rihal/workflows/execute.md
</execution_context>

<process>
Execute the execute workflow from @.rihal/workflows/execute.md end-to-end.
Spawn rihal-executor subagents per dependency wave. Pause at checkpoints. Update story status via rihal-tools.cjs.
</process>
