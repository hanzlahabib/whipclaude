# Workflow: rihal:dashboard

<purpose>
Start the Diwan view-only dashboard — a local web UI that visualizes .rihal/state.json, .planning/ artifacts, phases, decisions, and council sessions. The dashboard is read-only (no write endpoints) and runs dep-free on Node stdlib.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` contains `--help` or `-h`:

```
/rihal:dashboard [--port <N>] [--no-open]
```

**Examples:**
```
/rihal:dashboard                  # start on port 7717, open browser
/rihal:dashboard --port 8080      # use a different port
/rihal:dashboard --no-open        # don't auto-open the browser
```

STOP — do not proceed.

## Step 1 — Resolve dashboard script

Check for the dashboard server in priority order:

1. `./server/dashboard.js` (when inside the rihal-code source repo)
2. `./.rihal/lib/server/dashboard.js` (installed package copy)
3. `$(npm root -g)/@hanzlahabib/rihal-code/server/dashboard.js` (global install)

Store the resolved path as `$DASHBOARD`.

If none found, print:
```
❌ Dashboard script not found.
Run `npx rihal-code install` to install the package, or check you're inside a project with .rihal/.
```
Exit.

## Step 2 — Parse arguments

- `--port <N>` → set `PORT=$N` (default 7717)
- `--no-open` → skip opening the browser (default: open)

## Step 3 — Start the dashboard

Run in the background:

```bash
PORT=$PORT node "$DASHBOARD" &
```

Wait 1 second for the server to bind.

Verify it's listening:
```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/"
```

If not 200/301/302, print the error and exit.

## Step 4 — Announce

Print:
```
🏛️ Diwan dashboard running at http://localhost:$PORT
    (view-only — browse phases, decisions, council sessions)
    Ctrl+C in the terminal to stop.
```

If `--no-open` not passed, open the default browser:
```bash
# Linux
xdg-open "http://localhost:$PORT" 2>/dev/null &
# macOS
open "http://localhost:$PORT" 2>/dev/null &
```

## Step 5 — Tail

The server runs until the user kills it. The slash command returns after announcing; the user inspects in the browser.

## Output

- Server running on specified port (default 7717)
- Browser opened to dashboard (unless --no-open)
- Confirmation message with URL

## Examples

### Happy Path
**Input:** `/rihal:dashboard`
**Expected:** Server starts on 7717, browser opens, confirmation printed.

### Edge Case: Port in use
**Input:** `/rihal:dashboard` (when 7717 is taken)
**Expected:** Server reports EADDRINUSE. Suggest `--port` flag with alternative.

### Negative Test
**Input:** `/rihal:dashboard --write something`
**Expected:** Dashboard is view-only. Reject unknown write-related flags.
