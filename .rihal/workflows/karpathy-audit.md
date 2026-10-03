<purpose>
Audit source code changes against Andrej Karpathy's 4 LLM coding principles. Identifies violations (Principle 1: unclear assumptions, Principle 2: overengineering, Principle 3: surgical violations, Principle 4: stubs/incomplete code) and returns structured findings.
</purpose>

<required_reading>
@.rihal/references/karpathy-guidelines.md
</required_reading>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:
- Print the usage block below
- STOP — do not proceed

**Usage:**
```
/rihal:karpathy-audit <phase> [--files=path1,path2]
/rihal:karpathy-audit <git-ref>..HEAD
```

**Examples:**
```
/rihal:karpathy-audit 03
/rihal:karpathy-audit 02 --files=src/
/rihal:karpathy-audit HEAD~5..HEAD
```

<process>

<step name="parse_input">
Parse the argument. It can be:

1. **Phase number** (e.g., "03", "02.1") — audit all changes in that phase
2. **Git ref range** (e.g., "HEAD~5..HEAD", "main..HEAD") — audit commits in range
3. **File override** (e.g., --files=src/,lib/) — scope to specific paths

If phase number format:
```bash
INIT=$(node "$PROJECT_ROOT/.rihal/bin/rihal-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse: `phase_found`, `phase_dir`, `phase_number`, `padded_phase`.

If phase_found is false:
```
Error: Phase ${PHASE_ARG} not found. Try /rihal:karpathy-audit HEAD~5..HEAD to audit recent commits instead.
```

If git ref format (contains ".." or has no digit at start):
```bash
GIT_RANGE="$ARGUMENTS"
```

Parse optional --files override:
```bash
FILES_OVERRIDE=""
for arg in "$@"; do
  if [[ "$arg" == --files=* ]]; then
    FILES_OVERRIDE="${arg#--files=}"
  fi
done
```
</step>

<step name="compute_diff">
Compute git diff based on input type:

**If phase mode:**
```bash
# Find commits for this phase
PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)
if [ -n "$PHASE_COMMITS" ]; then
  DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^
else
  DIFF_BASE="HEAD~10"  # Fallback to last 10 commits if grep finds nothing
fi

GIT_DIFF=$(git diff ${DIFF_BASE}..HEAD --name-only)
```

**If git ref mode:**
```bash
GIT_DIFF=$(git diff ${GIT_RANGE} --name-only)
```

**If --files override:**
```bash
# Scope to specific paths
if [ -n "$FILES_OVERRIDE" ]; then
  IFS=',' read -ra PATHS_TO_CHECK <<< "$FILES_OVERRIDE"
  FILTERED_DIFF=""
  for file in $GIT_DIFF; do
    for path in "${PATHS_TO_CHECK[@]}"; do
      if [[ "$file" == ${path}* ]]; then
        FILTERED_DIFF+="$file "
        break
      fi
    done
  done
  GIT_DIFF="$FILTERED_DIFF"
fi
```

**Filter out non-source files:**
```bash
SOURCE_FILES=""
for file in $GIT_DIFF; do
  if [[ "$file" == *.md || "$file" == *.json || "$file" == *.yaml ]] && [[ ! "$file" == *-SPRINT.md ]] && [[ ! "$file" == *-SUMMARY.md ]]; then
    continue
  fi
  if [[ "$file" == *.ts || "$file" == *.tsx || "$file" == *.js || "$file" == *.jsx || "$file" == *.py || "$file" == *.go || "$file" == *.rs ]]; then
    SOURCE_FILES+="$file "
  fi
done
```

If SOURCE_FILES is empty:
```
No source code changes found in the specified range. Nothing to audit.
```
Exit workflow.
</step>

<step name="audit_principle_1">
**Think Before Coding** — Check for hidden assumptions and unclear intent.

Scan modified files for:

**Lack of documentation:**
```bash
# Functions without comments/docstrings
grep -n "^function\|^const.*=.*=>\|^async function\|^def " $SOURCE_FILES | while read -r line; do
  file="${line%%:*}"
  lineno="${line%%:*}"; lineno="${lineno##*:}"
  nextline=$((lineno + 1))
  if ! sed -n "${lineno}p;${nextline}p" "$file" | grep -q "//\|/\*\|'''"; then
    echo "PRINCIPLE-1-WARN: $file:$lineno Missing comment on function definition"
  fi
done
```

**Magic numbers/strings without explanation:**
```bash
grep -n "= [0-9]\{3,\}\|= \"[^\"]\{10,\}\"" $SOURCE_FILES | while read -r line; do
  if ! grep -q "//\|#" <<< "$line"; then
    echo "PRINCIPLE-1-INFO: ${line%%:*} Magic constant without comment"
  fi
done
```

**TODO/FIXME comments indicating unresolved assumptions:**
```bash
grep -n "TODO\|FIXME\|HACK" $SOURCE_FILES | while read -r line; do
  echo "PRINCIPLE-1-WARN: $line"
done
```
</step>

<step name="audit_principle_2">
**Simplicity First** — Check for overengineered, speculative, or unnecessary code.

Scan for:

**Dead code (imported but unused):**
```bash
# For JavaScript/TypeScript
for file in $(echo "$SOURCE_FILES" | grep -E "\.(ts|tsx|js|jsx)$"); do
  # Extract all imports
  IMPORTS=$(grep -oE "from ['\"].*['\"]|import.*from" "$file" | sort -u)
  for import in $IMPORTS; do
    # Check if imported name is used in file
    IMPORTED_NAME=$(echo "$import" | grep -oE "[a-zA-Z_][a-zA-Z0-9_]*" | head -1)
    if [ -n "$IMPORTED_NAME" ] && ! grep -q "$IMPORTED_NAME" "$file"; then
      echo "PRINCIPLE-2-WARN: $file Unused import: $IMPORTED_NAME"
    fi
  done
done
```

**Unused variables and functions:**
```bash
# Pattern: declared but never read after declaration
grep -n "const\|let\|var\|def " $SOURCE_FILES | while read -r line; do
  file="${line%%:*}"
  varname=$(echo "$line" | grep -oE "[a-zA-Z_][a-zA-Z0-9_]*" | head -1)
  # Simple check: if variable declared in file, grep for usage
  if [ -n "$varname" ]; then
    count=$(grep -c "$varname" "$file" || echo "0")
    if [ "$count" -eq 1 ]; then
      echo "PRINCIPLE-2-WARN: $file Possibly unused variable: $varname"
    fi
  fi
done
```

**Speculative abstractions (utility functions used only once):**
```bash
# Functions defined in utils but called once
grep -n "^export function\|^export const.*=.*=>\|^def " $SOURCE_FILES | while read -r line; do
  file="${line%%:*}"
  funcname=$(echo "$line" | grep -oE "[a-zA-Z_][a-zA-Z0-9_]*" | head -1)
  # Count usages across ALL source files
  count=$(grep -r "$funcname" $SOURCE_FILES 2>/dev/null | wc -l)
  if [ "$count" -eq 2 ]; then  # 2 = definition + one usage
    echo "PRINCIPLE-2-INFO: $file Function '$funcname' used only once (may be speculative)"
  fi
done
```
</step>

<step name="audit_principle_3">
**Surgical Changes** — Check for unnecessary style changes or refactoring of unrelated code.

Scan for:

**Whitespace-only changes in unrelated files:**
```bash
git diff ${DIFF_BASE}..HEAD --ignore-all-space --stat $SOURCE_FILES | while read -r line; do
  file=$(echo "$line" | awk '{print $1}')
  # Check if file has non-whitespace changes
  if ! git diff ${DIFF_BASE}..HEAD -- "$file" | grep -q "^[+-][^ ]"; then
    echo "PRINCIPLE-3-WARN: $file Whitespace-only changes (surgical violation)"
  fi
done
```

**Reformatting in files not related to the task:**
```bash
# Check for files with only style changes (semicolons, spacing, bracket style)
git diff ${DIFF_BASE}..HEAD --unified=0 $SOURCE_FILES | grep -E "^@@.*@@" | while read -r hunk; do
  file=$(echo "$hunk" | awk '{print $1}')
  # Count line changes
  additions=$(echo "$hunk" | grep "^+" | wc -l)
  deletions=$(echo "$hunk" | grep "^-" | wc -l)
  # If addition/deletion ratio is very high (refactoring), warn
  if [ "$additions" -gt 20 ] && [ "$deletions" -gt 20 ]; then
    echo "PRINCIPLE-3-INFO: $file Large reformatting (${additions}+ / ${deletions}-) in non-request file"
  fi
done
```
</step>

<step name="audit_principle_4">
**Goal-Driven Execution** — Check for stubs, incomplete implementations, and missing success criteria.

Scan for:

**TODO/FIXME/XXX stubs:**
```bash
grep -n "TODO\|FIXME\|XXX" $SOURCE_FILES | while read -r line; do
  echo "PRINCIPLE-4-WARN: ${line%%:*} Contains stub"
done
```

**Not-implemented errors:**
```bash
grep -n "throw.*not implemented\|raise NotImplementedError\|panic.*not implemented" $SOURCE_FILES | while read -r line; do
  echo "PRINCIPLE-4-CRIT: $line Not-implemented placeholder"
done
```

**Mock/placeholder data:**
```bash
grep -n "placeholder\|mock\|MOCK_\|test_data\|fake_\|YOUR_API_KEY\|REPLACE_ME" $SOURCE_FILES | while read -r line; do
  echo "PRINCIPLE-4-WARN: ${line%%:*} Placeholder/mock data in non-test file"
done
```

**Empty function bodies:**
```bash
grep -n "return null\|return undefined\|return \[\]\|return {}\|pass  *$" $SOURCE_FILES | while read -r line; do
  echo "PRINCIPLE-4-WARN: ${line%%:*} Empty function body (incomplete implementation)"
done
```

**console.log in non-test files:**
```bash
for file in $SOURCE_FILES; do
  if [[ ! "$file" == *.test.* ]] && [[ ! "$file" == *.spec.* ]]; then
    grep -n "console\.\(log\|error\|warn\|debug\)" "$file" | while read -r line; do
      echo "PRINCIPLE-4-INFO: ${line%%:*} Debug logging in production code"
    done
  fi
done
```
</step>

<step name="compile_report">
Aggregate all findings into a structured report:

**Report format:**

```markdown
# Karpathy Audit Report

**Scope:** Phase {phase} | Git range {ref}
**Date:** {ISO date}
**Files audited:** {count}

## Summary

| Principle | Violations | Severity |
|-----------|-----------|----------|
| 1. Think Before Coding | {count} | {max severity} |
| 2. Simplicity First | {count} | {max severity} |
| 3. Surgical Changes | {count} | {max severity} |
| 4. Goal-Driven Execution | {count} | {max severity} |
| **TOTAL** | **{count}** | **{severity}** |

**Overall Status:** PASS | PASS_WITH_WARNINGS | FAIL

---

## Principle 1: Think Before Coding

{findings with file:line}

...

## Principle 2: Simplicity First

{findings with file:line}

...

## Principle 3: Surgical Changes

{findings with file:line}

...

## Principle 4: Goal-Driven Execution

{findings with file:line}

...

## Recommendations

- {actionable fix for each critical issue}

---

**Generated:** {date}
**Run:** /rihal:karpathy-audit {original_arguments}
```

Write report to stdout and optionally to file `{phase_dir}/{padded_phase}-KARPATHY-AUDIT.md` if phase mode.
</step>

<step name="present_results">
Display summary to user:

If PASS:
```
✓ Code passes all Karpathy principles. Well done!
```

If PASS_WITH_WARNINGS:
```
⚠ Code mostly adheres to Karpathy principles but has {count} warning(s).
Review the report above and address them before merging.
```

If FAIL:
```
✗ Code violates {count} principles. Critical issues found:

{list top 3 critical findings}

Review the full report above. Use /rihal:code-review-fix to auto-fix some issues.
```

**Next steps:**
```
View full report: {report file path}
Rerun: /rihal:karpathy-audit {arguments}
Auto-fix some issues: /rihal:code-review-fix {phase}
```
</step>

</process>

<success_criteria>
- [ ] Input parsed correctly (phase, git ref, or file override)
- [ ] Source files filtered from non-code files
- [ ] All 4 principles audited with specific rules
- [ ] Findings include file:line references
- [ ] Severity levels assigned (critical/warning/info)
- [ ] Report written with summary table and details
- [ ] User receives actionable recommendations
- [ ] Report saved to phase dir if phase mode
</success_criteria>

## Success Criteria

- [ ] Task completed as requested
- [ ] Output saved or reported
- [ ] State updated if necessary
- [ ] No errors encountered

## On Error

If arguments are invalid, missing files, or subagent fails:
- Validate inputs match expected format
- Check that required files exist
- Retry with clearer arguments or report the specific error to the user

