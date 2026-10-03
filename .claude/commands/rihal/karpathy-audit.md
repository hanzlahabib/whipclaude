---
name: rihal:karpathy-audit
description: Audit recent code changes against Karpathy's 4 LLM coding principles. Identifies violations and suggests improvements.
argument-hint: "<phase|git-ref> [--files=path1,path2]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

@.rihal/workflows/karpathy-audit.md
