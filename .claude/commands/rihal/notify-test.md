---
name: rihal:notify-test
description: Verify configured webhooks (Slack / Discord / MS Teams) by posting a test message
argument-hint: "[--only slack|discord|teams] [--title \"<t>\"] [--body \"<b>\"]"
allowed-tools:
  - Read
  - Bash
---

@.rihal/workflows/notify-test.md
