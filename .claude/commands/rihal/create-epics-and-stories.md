---
name: rihal:create-epics-and-stories
description: Parse a PRD or project document to generate numbered epic files in .planning/epics/. Each epic contains user stories with acceptance criteria and development notes.
argument-hint: "<prd-path|project-path> [--prefix <name>]"
allowed-tools: Read, Write, Glob, Grep, Bash, Agent
---

@.rihal/workflows/create-epics-and-stories.md
