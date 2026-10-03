# Workflow: rihal:replay

<purpose>
Re-run a past council session with the same question for a fresh panel round. Useful when:

- The first council was inconclusive and you want a second pass
- Facts or context have shifted and the original question deserves re-evaluation
- You want to see how a different panel composition answers the same question

This is NOT `--resume` (which asks a follow-up question with prior context). Replay re-asks the original question from a clean slate, then links the new artifact back to the original for comparison.
</purpose>

<output_format>
Open with banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► REPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End with a single-line redirect (per `command-redirect-format.md`) so the user copy-pastes the resulting `/rihal:council` invocation.
</output_format>

<required_reading>
@.rihal/references/command-redirect-format.md
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` / `-h`:

```
/rihal:replay <session-path-or-slug> [--agents a,b,c]

  <session-path-or-slug>   Full path to .planning/council-sessions/council-YYYY-MM-DD-<slug>.md
                           OR just the slug (e.g. "should-i-ship-v2") — the first matching
                           file, newest-first, will be used.
  --agents a,b,c           Override the panel for the replay (otherwise council auto-selects)
```

STOP — do not proceed.

## Step 1 — Resolve the session file

Parse `$ARGUMENTS` — first positional token is the session identifier, remaining tokens pass through.

```bash
SESSIONS_DIR=".planning/council-sessions"
ARG="${1}"

# Full path: use as-is
if [ -f "$ARG" ]; then
  SESSION_FILE="$ARG"
# Slug: find newest matching file
elif ls "${SESSIONS_DIR}" >/dev/null 2>&1; then
  SESSION_FILE=$(ls -t "${SESSIONS_DIR}"/council-*"${ARG}"*.md 2>/dev/null | head -1)
fi

if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
  echo "No session matched \"$ARG\". Available:"
  ls -t "${SESSIONS_DIR}"/council-*.md 2>/dev/null | head -10
  exit 0
fi
```

If no sessions directory exists at all:

```
No council sessions on disk yet. Run /rihal:council "<question>" to create the first one.
```

STOP.

## Step 2 — Extract the original question

Read `SESSION_FILE` and pull the text block under the `## Question` heading (until the next `##` heading or EOF). Trim leading/trailing whitespace. Strip surrounding blank lines.

```bash
QUESTION=$(awk '/^## Question$/{flag=1;next} /^## /{flag=0} flag' "$SESSION_FILE" | sed '/./,$!d' | awk 'NF{found=1} found')
```

If the extracted question is empty:

```
Could not extract "## Question" heading from $SESSION_FILE. The artifact may be malformed. Open it and copy the question manually:

/rihal:council <question>
```

STOP.

Also capture the original slug for the replay annotation:

```bash
ORIGINAL_SLUG=$(basename "$SESSION_FILE" .md | sed 's/^council-[0-9-]*-//')
ORIGINAL_DATE=$(basename "$SESSION_FILE" .md | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
```

## Step 3 — Show the replay preview

Print a short summary so the user can confirm before the redirect:

```
Replaying session: {SESSION_FILE}
Original date:    {ORIGINAL_DATE}
Original slug:    {ORIGINAL_SLUG}

Question to re-ask:
  {QUESTION}
```

If `--agents` was passed, also print:
```
Panel override:   {agents_csv}
```

## Step 4 — Emit the redirect

Per `command-redirect-format.md`, one line, copy-pastable:

```
Re-running the council with a fresh panel on the original question.

Copy-paste this:

/rihal:council {QUESTION}{agents_suffix}
```

Where `{agents_suffix}` is `  --agents=a,b,c` if `--agents` was passed, else empty.

## Step 5 — Record the replay intent

Append a lightweight replay record so history is traceable even before council runs:

```bash
node .rihal/bin/rihal-tools.cjs state add-decision \
  "Replay of council session ${ORIGINAL_SLUG} (${ORIGINAL_DATE}) — re-asking: ${QUESTION:0:80}" \
  2>/dev/null || true
```

The subsequent `/rihal:council` run will attach its own artifact; pairing the two by date + slug lets `/rihal:decisions` and state readers show the replay chain.
</process>

## Success Criteria

- Slug argument resolves to the newest matching session file
- Full path argument works as-is
- `## Question` text is extracted verbatim, including any multi-line body
- Malformed or empty question artifacts produce a clear error (not a crash)
- Redirect is a single line, in the copy-paste format required by the command-redirect reference
- `--agents` override passes through to the council invocation unchanged

## On Error

- Missing session directory → tell the user to run `/rihal:council` first
- Slug ambiguity → list the top 10 newest matches so the user can paste a fuller path
- Extraction returns empty → print the path and ask the user to copy the question manually
