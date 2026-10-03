# Workflow: rihal:health

<purpose>
Run 6-point compliance check on rihal installation. Each check is pass/fail. Summary at the end.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:health <argument-here>
```

**Examples:**
```
/rihal:health example 1
/rihal:health example 2
```

STOP — do not proceed.

## Step 0 — Verify .rihal/ directory exists and is writable

**Action:** Check if `.rihal/` directory exists and current user can write to it.

```bash
test -d .rihal && test -w .rihal
```

**PASS if:**
- `.rihal/` exists
- Current user can write to it

**Output on pass:**
```
✅ PASS — .rihal/ directory exists and is writable
```

**Output on fail:**
```
❌ FAIL — .rihal/ does not exist or is not writable. Run: /rihal:update to repair
```

## Step 1 — Verify file manifest exists and is valid CSV

**Action:** Check `.rihal/_config/files-manifest.csv` and parse as CSV.

```bash
test -f .rihal/_config/files-manifest.csv
```

Verify:
- File exists
- Header row: `rel,sha256,size`
- At least 1 data row
- All rows have exactly 3 columns

**Output on pass:**
```
✅ PASS — files-manifest.csv is valid (N files tracked)
```

**Output on fail:**
```
❌ FAIL — files-manifest.csv is missing or corrupted. Run: /rihal:update to repair
```

## Step 2 — Verify all manifest files exist and hashes match

**Action:** For each row in files-manifest.csv, check file exists and hash matches.

For each file:
- Extract: `rel`, `sha256`, `size`
- Verify file at `./{rel}` exists
- Compute SHA256 hash of actual file
- Compare against manifest entry

Detect drift: files that exist but hash doesn't match.

**Output on pass:**
```
✅ PASS — All files match manifest (no drift detected)
```

**Output on fail (drift found):**
```
❌ FAIL — File drift detected: N files changed or missing
  Modified: file1.md, file2.js
  Missing: file3.md
Run: /rihal:update to repair
```

## Step 3 — Verify state.json exists and is valid

**Action:** Check `.rihal/state.json` and validate JSON structure.

```bash
test -f .rihal/state.json
```

Parse as JSON. Verify top-level keys present:
- `version`
- `project`
- `created`
- `updated`
- `phases` (array)
- `executions` (array)
- `decisions` (array)
- `blockers` (array)
- `council_sessions` (array)

**Output on pass:**
```
✅ PASS — state.json is valid and initialized
```

**Output on fail:**
```
❌ FAIL — state.json is missing or invalid. Run: /rihal:update to repair
```

## Step 4 — Verify agent-manifest.csv is present and populated

**Action:** Check `.rihal/_config/agent-manifest.csv` for header and at least one agent.

```bash
test -f .rihal/_config/agent-manifest.csv
```

Verify:
- File exists
- Header row present
- At least 1 data row (one agent installed)

**Output on pass:**
```
✅ PASS — agent-manifest.csv is valid (N agents installed)
```

**Output on fail:**
```
❌ FAIL — agent-manifest.csv is missing or empty. Run: /rihal:update to repair
```

## Step 5 — Verify rihal-tools.cjs is executable and responsive

**Action:** Check rihal-tools.cjs exists, is executable, and responds to version command.

```bash
test -f .rihal/bin/rihal-tools.cjs && test -x .rihal/bin/rihal-tools.cjs
node .rihal/bin/rihal-tools.cjs version
```

**Output on pass:**
```
✅ PASS — rihal-tools.cjs is executable and responsive
```

**Output on fail:**
```
❌ FAIL — rihal-tools.cjs is missing or broken. Run: /rihal:update to repair
```

## Step 6 — Count results and print final summary

**Action:** Count all pass/fail results and display overall status.

Total: `{N}/6 checks passed`

If all 6 pass:
```
✅ All systems nominal — rihal is healthy
```

If fewer than 6 pass:
```
⚠️ {N}/6 checks passed — {M} issue(s) found
Run: /rihal:update to repair
```

## Success Criteria

- [ ] All 6 checks executed
- [ ] Each check result printed clearly
- [ ] Final summary shows pass/fail count
- [ ] Repair instructions shown if any checks fail

## On Error

- **Directory not readable:** Print error and suggest filesystem check
- **CSV parsing fails:** Print error and suggest re-running update
- **JSON corruption:** Print error and suggest state.json reset
