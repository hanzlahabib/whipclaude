---
name: rihal:sprint-status
description: Show current sprint progress — stories, points, velocity, burndown. Quick view of where the sprint stands.
argument-hint: "[--sprint <NN.S>]"
allowed-tools:
  - Bash
  - Read
---

<objective>
Display current sprint status board: stories by status, points done vs remaining, velocity comparison, and actionable next-step recommendation.
</objective>

<execution_context>
@.rihal/workflows/sprint-status.md
</execution_context>

<process>
Execute the sprint-status workflow from @.rihal/workflows/sprint-status.md end-to-end.
Load sprint data from state.json via rihal-tools.cjs, display compact board, suggest next action.
</process>
