---
name: rihal:review-edge-case-hunter
description: Enumerate edge cases by category (input, state, concurrency, network) with severity (critical/high/medium/low). Callable inline during code-review.md. Output feeds into story AC or subtasks.
argument-hint: "[--phase <name>] [--component <name>]"
allowed-tools: Read, Glob, Grep, Agent
---

@.rihal/workflows/review-edge-case-hunter.md
