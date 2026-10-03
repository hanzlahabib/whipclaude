# Verifier — Behavioral Spot-Checks (Step 7b)

Anti-pattern scanning checks for code smells. Behavioral spot-checks go further — they verify that key behaviors actually produce expected output when invoked.

**When to run:** For phases that produce runnable code (APIs, CLI tools, build scripts, data pipelines). Skip for documentation-only or config-only phases.

## How

### 1. Identify checkable behaviors

From must-haves truths. Select 2-4 that can be tested with a single command:

```bash
# API endpoint returns non-empty data
curl -s http://localhost:$PORT/api/$ENDPOINT 2>/dev/null | node -e "let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>b+=c);process.stdin.on('end',()=>{const d=JSON.parse(b);process.exit(Array.isArray(d)?(d.length>0?0:1):(Object.keys(d).length>0?0:1))})"

# CLI command produces expected output
node $CLI_PATH --help 2>&1 | grep -q "$EXPECTED_SUBCOMMAND"

# Build produces output files
ls $BUILD_OUTPUT_DIR/*.{js,css} 2>/dev/null | wc -l

# Module exports expected functions
node -e "const m = require('$MODULE_PATH'); console.log(typeof m.$FUNCTION_NAME)" 2>/dev/null | grep -q "function"

# Test suite passes (if tests exist for this phase's code)
npm test -- --grep "$PHASE_TEST_PATTERN" 2>&1 | grep -q "passing"
```

### 2. Run each check

Record pass/fail:

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| {truth} | {command} | {output} | ✓ PASS / ✗ FAIL / ? SKIP |

### 3. Classification

- ✓ PASS: Command succeeded and output matches expected
- ✗ FAIL: Command failed or output is empty/wrong — flag as gap
- ? SKIP: Can't test without running server/external service — route to human verification (Step 8)

## Constraints

- Each check must complete in under 10 seconds
- Do not start servers or services — only test what's already runnable
- Do not modify state (no writes, no mutations, no side effects)
- If the project has no runnable entry points yet, skip with: "Step 7b: SKIPPED (no runnable entry points)"
