# Workflow: rihal:document-project

<purpose>
Load documentation-requirements.csv, audit current documentation for coverage and staleness, identify missing or outdated docs, and file them as SPRINT.md subtasks or separate plan phases.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:document-project <argument-here>
```

**Examples:**
```
/rihal:document-project example 1
/rihal:document-project example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-docs-auditor` — documentation compliance auditor
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init document-project "$ARGUMENTS")
```

Parse:
- `flags.csv` — path to documentation-requirements.csv (default: `.rihal/documentation-requirements.csv`)
- `flags.auto_file_tasks` — auto-create SPRINT.md for missing docs (default: false)
- `csv_path` — resolved CSV path
- `audit_output_path` — `.rihal/DOCS-AUDIT.md` (output)

## Step 1 — Load or Create Documentation Requirements

**If `csv_path` exists:**
Load CSV and parse:

```csv
Document,Required,Priority,Audience,Last Updated,Status
README.md,yes,high,all,2026-04-01,current
API.md,yes,high,developers,2026-03-15,stale
CONTRIBUTING.md,yes,medium,contributors,2026-02-01,missing
DEPLOYMENT.md,yes,high,devops,2026-04-01,current
ARCHITECTURE.md,yes,high,architects,2026-01-01,outdated
```

**If missing:** Create template at `.rihal/documentation-requirements.csv`:

```bash
cat > .rihal/documentation-requirements.csv << 'EOF'
Document,Required,Priority,Audience,Last Updated,Status
README.md,yes,high,all,,
API.md,yes,high,developers,,
CONTRIBUTING.md,yes,medium,contributors,,
DEPLOYMENT.md,yes,high,devops,,
ARCHITECTURE.md,yes,high,architects,,
DEVELOPMENT.md,yes,medium,developers,,
EOF
```

## Step 2 — Audit Current Documentation

For each row in CSV, check if document exists and assess staleness:

```bash
for doc in $(cut -d',' -f1 .rihal/documentation-requirements.csv | tail -n +2); do
  if [ -f "$doc" ]; then
    MTIME=$(stat -c %Y "$doc")
    NOW=$(date +%s)
    AGE_DAYS=$(( ($NOW - $MTIME) / 86400 ))
    if [ $AGE_DAYS -gt 90 ]; then echo "STALE"; fi
  else
    echo "MISSING"
  fi
done
```

## Step 3 — Spawn Docs Auditor

Spawn `rihal-docs-auditor` subagent:

```
Task tool call:
  subagent_type: "rihal-docs-auditor"
  description: "Audit documentation coverage and staleness"
  prompt: |
    Audit project documentation against requirements.
    
    **Requirements CSV:**
    {csv_contents}
    
    **Audit findings:**
    {per_doc_status}
    
    For each doc, determine:
    - Status: Missing, Current, Stale (>90 days old), Outdated (references removed features)
    - Priority: high/medium/low (from CSV)
    - Estimated effort: 1-4 hours
    - Who should write: audience from CSV
    
    Output format: DOCS-AUDIT.md with:
    1. Summary table (doc, status, priority, effort)
    2. Per-doc assessment and recommendations
    3. Suggested documentation plan
    
    Write to: {audit_output_path}
```

## Step 4 — File Missing Docs as Tasks

**If `flags.auto_file_tasks` is true:**

For each missing or stale doc (status=Missing or Stale):

Create task subtask in state:

```bash
node .rihal/bin/rihal-tools.cjs state add-task \
  --title "Write {doc_name}: {purpose}" \
  --description "Audience: {audience}, Priority: {priority}" \
  --effort {effort_hours} \
  --component documentation
```

Create SPRINT.md if multiple docs needed:

File: `.planning/plans/documentation-updates/SPRINT.md`

```markdown
# Plan: Documentation Updates

{doc_1_task}
{doc_2_task}
...
```

Print:
```
📋 Documentation audit complete: {audit_output_path}

Summary:
  • {current_count} current
  • {stale_count} stale (>90 days)
  • {missing_count} missing

Missing docs filed as tasks. Run:

/rihal:plan .planning/plans/documentation-updates/SPRINT.md
```

## Step 5 — Auto-inject into Resume-Work

After audit, if resume-work.md exists, prepend to Step 2:

```
If .rihal/DOCS-AUDIT.md exists, check for missing/stale docs:

@.rihal/DOCS-AUDIT.md
```

## Success Criteria

- CSV loaded or created
- All docs in CSV audited for presence/staleness
- DOCS-AUDIT.md generated with per-doc assessment
- Missing/stale docs categorized by priority
- (Optional) Tasks filed in state or SPRINT.md created

## On Error

- If CSV malformed: use template
- If audit agent fails: provide manual audit template
- If state write fails: skip task filing, report audit only
