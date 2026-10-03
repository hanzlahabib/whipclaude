# Workflow: rihal:notify-test

<purpose>
Verify a webhook URL is configured and reachable by posting a "test" message. Use this immediately after adding `slack_webhook_url`, `discord_webhook_url`, or `teams_webhook_url` to `.rihal/config.yaml` so you catch typos and permission errors before relying on notifications from `/rihal:execute`.
</purpose>

<output_format>
Open with banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► NOTIFY TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End with a per-platform result table: sent / skipped / failed.
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` contains `--help` / `-h`:

```
/rihal:notify-test [--only slack|discord|teams] [--title "<t>"] [--body "<b>"]

  --only <platform>   Limit the test to one platform
  --title "<t>"       Override test title (default: "Rihal notify test")
  --body "<b>"        Override test body
```

STOP — do not proceed.

## Step 1 — Parse flags

```bash
ONLY=""
TITLE="Rihal notify test"
BODY="If you see this in your channel, webhook wiring works. Sent at $(date -u +%FT%TZ) from project $(basename "$PWD")."

if echo "$ARGUMENTS" | grep -q -- "--only";  then ONLY=$(echo "$ARGUMENTS" | grep -oE -- "--only [a-z]+" | awk '{print $2}'); fi
if echo "$ARGUMENTS" | grep -q -- "--title"; then TITLE=$(echo "$ARGUMENTS" | sed -n 's/.*--title "\([^"]*\)".*/\1/p'); fi
if echo "$ARGUMENTS" | grep -q -- "--body";  then BODY=$(echo  "$ARGUMENTS" | sed -n 's/.*--body "\([^"]*\)".*/\1/p');  fi
```

## Step 2 — Send

```bash
ONLY_FLAG=""
[ -n "$ONLY" ] && ONLY_FLAG="--only $ONLY"

RESULT=$(node .rihal/bin/rihal-tools.cjs notify send \
  --title "$TITLE" \
  --body "$BODY" \
  --event "notify-test" \
  $ONLY_FLAG)
```

Parse the JSON result. Show:

```
| Platform | Result   | Detail                          |
|----------|----------|----------------------------------|
| slack    | sent     | —                                |
| discord  | skipped  | no webhook configured            |
| teams    | failed   | 403: invalid webhook token       |
```

## Step 3 — Guidance

If ALL platforms are `skipped`:

```
No webhooks configured. Add at least one to .rihal/config.yaml:

  slack_webhook_url: "https://hooks.slack.com/services/..."
  discord_webhook_url: "https://discord.com/api/webhooks/..."
  teams_webhook_url: "https://outlook.office.com/webhook/..."

Then re-run /rihal:notify-test.
```

If any platform `failed`, echo the failure detail and list common causes:

- Slack: revoked webhook, channel archived, rate-limited (429)
- Discord: deleted webhook, wrong guild, content over 4000 chars
- Teams: connector removed from the channel, legacy MessageCard rejected by newer tenant policy (if so, switch to Workflow-based connector)

If any platform `sent`, print:

```
✓ Open your channel to confirm the test message appeared.
  Then configure where notifications fire:
    - /rihal:execute runs post-phase notify automatically
    - /rihal:council --notify to ping after a council session
```
</process>

## Success Criteria

- No webhooks configured → clear setup guidance, not a crash
- Per-platform success/failure surfaced individually (one failure doesn't mask others)
- `--only` restricts the test to the chosen platform
- Non-zero HTTP responses from webhooks are reported with their status and first 200 chars of the response body (already handled by the tool)

## On Error

- Missing `fetch` (Node <18) → the tool call will throw; tell the user to upgrade to Node 20+
- Corporate proxy blocks outbound HTTPS → failure body will show a network error; suggest `HTTPS_PROXY` env var or testing from outside the proxy
