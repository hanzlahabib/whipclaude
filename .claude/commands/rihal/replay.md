---
name: rihal:replay
description: Re-run a past council session with the same question — fresh panel round, linked to the original
argument-hint: "<session-path-or-slug> [--agents a,b,c]"
allowed-tools:
  - Read
  - Bash
  - Glob
---

@.rihal/workflows/replay.md
