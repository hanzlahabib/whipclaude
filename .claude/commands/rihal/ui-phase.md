---
name: rihal:ui-phase
description: Produce UI-SPEC.md with color tokens, typography, component inventory, interaction states, and accessibility guidelines. Detects frontend keywords and suggests this command early in plan.md if UI-SPEC.md is absent.
argument-hint: "[--existing-ui <path>] [--design-system <path>]"
allowed-tools: Agent, Read, Glob, Grep, Write
---

@.rihal/workflows/ui-phase.md
