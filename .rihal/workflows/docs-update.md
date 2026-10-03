# Workflow: rihal:docs-update

<purpose>
Generate, update, and verify project documentation — both canonical doc types and existing hand-written docs. The orchestrator detects the project's doc structure, assembles a work manifest tracking every item, dispatches parallel doc-writer and doc-verifier agents across waves, reviews existing docs for accuracy, identifies documentation gaps, and fixes inaccuracies via a bounded fix loop. All state is persisted in a work manifest so no work item is lost between steps. Output: Complete, structure-aware documentation verified against the live codebase.
</purpose>

<available_agent_types>
Valid Rihal subagent types (use exact names — do not fall back to 'general-purpose'):
- rihal-tech-writer — Writes and updates project documentation files
- rihal-docs-auditor — Verifies factual claims in docs against the live codebase
</available_agent_types>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:
- Print the usage block below
- STOP — do not proceed

**Usage:**
```
/rihal:docs-update [phase]
```

**Examples:**
```
/rihal:docs-update
/rihal:docs-update 02
```

<process>

## Step 1: Initialize context

Initialize docs-update context by scanning the project:

```bash
# Create docs directory if needed
test -d docs || mkdir -p docs

# Read agent manifest to get model for doc writers
AGENT_MANIFEST=".rihal/_config/agent-manifest.csv"
if [[ -f "$AGENT_MANIFEST" ]]; then
  DOC_WRITER_MODEL=$(grep -i "rihal-tech-writer" "$AGENT_MANIFEST" | cut -d',' -f3)
else
  DOC_WRITER_MODEL="claude-opus"  # fallback
fi
```

Extract from project analysis:
- `doc_writer_model` — model string from agent manifest (never hardcode a model name)
- `commit_docs` — whether to commit generated files when done (read from `.planning/config.json` if exists)
- `existing_docs` — find all existing Markdown files with `find docs -name "*.md" 2>/dev/null`
- `project_type` — detect from: `package.json`, `src/pages/api` or `pages/api`, `bin/` or `cli/`, `LICENSE`, `vercel.json` or `netlify.toml`, `lerna.json` or `pnpm-workspace.yaml`, `test/` or `__tests__/`
- `doc_tooling` — detect from: `docusaurus.config.js`, `vitepress.config.js`, `mkdocs.yml`, `storybook.js`
- `project_root` — `$(pwd)`

## Step 2: Classify project

Map the `project_type` boolean signals from the init JSON to a primary type label and collect conditional doc signals.

**Primary type classification (first match wins):**

| Condition | primary_type |
|-----------|-------------|
| `is_monorepo` is true | `"monorepo"` |
| `has_cli_bin` is true AND `has_api_routes` is false | `"cli-tool"` |
| `has_api_routes` is true AND `is_open_source` is false | `"saas"` |
| `is_open_source` is true AND `has_api_routes` is false | `"open-source-library"` |
| (none of the above) | `"generic"` |

**Conditional doc signals (check independently after primary classification):**

After determining primary_type, check each signal independently. A CLI tool that is also open source with API routes still gets all three conditional docs.

| Signal | Conditional Doc |
|--------|----------------|
| `has_api_routes` is true | Queue API.md |
| `is_open_source` is true | Queue CONTRIBUTING.md |
| `has_deploy_config` is true | Queue DEPLOYMENT.md |

Present the classification result:
```
Project type: {primary_type}
Conditional docs queued: {list or "none"}
```

## Step 3: Build doc queue

Assemble the complete doc queue from always-on docs plus conditional docs from Step 2.

**Always-on docs (queued for every project):**
1. README
2. ARCHITECTURE
3. GETTING-STARTED
4. DEVELOPMENT
5. TESTING
6. CONFIGURATION

**Conditional docs (add only if signal matched):**
- API (if `has_api_routes`)
- CONTRIBUTING (if `is_open_source`)
- DEPLOYMENT (if `has_deploy_config`)

**IMPORTANT: CHANGELOG.md is NEVER queued.** The doc queue is built exclusively from the 9 known doc types listed above.

**Doc queue limit:** Maximum 9 docs. Always-on (6) + up to 3 conditional = at most 9.

**CONTRIBUTING.md confirmation (new file only):**

If CONTRIBUTING.md is in the conditional queue AND does NOT exist in `existing_docs`:

1. If `--force` is present in `$ARGUMENTS`: skip confirmation, include CONTRIBUTING.md.
2. Otherwise, use AskUserQuestion:

```
AskUserQuestion([{
  question: "This project appears to be open source. CONTRIBUTING.md does not exist yet. Create it?",
  header: "Contributing",
  multiSelect: false,
  options: [
    { label: "Yes, create it", description: "Generate CONTRIBUTING.md with project guidelines" },
    { label: "No, skip it", description: "This project does not need a CONTRIBUTING.md" }
  ]
}])
```

If user selects "No": remove CONTRIBUTING.md from the queue.

## Step 4: Present queue and confirm

Present the assembled doc queue to the user with confirmation:

```
AskUserQuestion([{
  question: "Doc queue assembled ({N} docs). Proceed with generation?",
  header: "Doc queue",
  multiSelect: false,
  options: [
    { label: "Proceed", description: "Generate all {N} docs in the queue" },
    { label: "Abort", description: "Cancel doc generation" }
  ]
}])
```

If user selects "Abort": exit the workflow.

## Step 5: Spawn doc writers in waves

Create output directories:
```bash
mkdir -p docs
```

For each doc in the queue, spawn a `rihal-tech-writer` agent in parallel waves (up to 3 agents in parallel per wave):

```
Task(
  subagent_type="rihal-tech-writer",
  prompt="
Generate documentation for {doc_type}.
Output path: {resolved_path}
Project type: {primary_type}
Mode: {create|update}

${EXISTING_CONTENT:+Existing content:\n${EXISTING_CONTENT}}

Write the doc to: {resolved_path}
Do NOT commit — the orchestrator will handle that.
  "
)
```

## Step 6: Verify generated docs

After all doc writers complete, spawn `rihal-docs-auditor` agents to cross-check all generated content against the live codebase.

For each generated doc:
```
Task(
  subagent_type="rihal-docs-auditor",
  prompt="
Verify this documentation file against the live codebase:
Path: {resolved_path}

Check for:
- Outdated/incorrect information
- References to non-existent files/modules
- Version mismatches
- API changes not reflected in docs

Report any inaccuracies found. Do NOT fix — just report.
  "
)
```

## Step 7: Persist work manifest and close

Write all work items to `.planning/tmp/docs-work-manifest.json`:

```bash
mkdir -p .planning/tmp
# Write manifest with all generated docs, verification results, and any fixes needed
```

If `commit_docs` is enabled:
```bash
# Stage generated docs and commit
git add docs/*.md
git commit -m "docs: regenerate and verify project documentation"
```

```
## Docs Update Complete

**Project type:** {primary_type}
**Docs generated:** {count}
**Docs verified:** {count}
**Issues found:** {count or "none"}

Generated docs:
{list with line counts}

${ISSUES:+
Issues to fix:
{list}

Run /rihal:docs-update --fix to auto-correct found issues.
}

Next: Review docs in your editor or run verification again with /rihal:docs-update
```

</process>

<success_criteria>
- [ ] Project type correctly classified
- [ ] Doc queue assembled with always-on + conditional docs
- [ ] CONTRIBUTING.md confirmation shown when appropriate
- [ ] User confirmed queue before generation
- [ ] Doc writers spawned in parallel waves
- [ ] All docs generated and written to correct paths
- [ ] Doc verifiers run and report inaccuracies
- [ ] Work manifest persisted
- [ ] Docs committed if enabled
- [ ] Results presented with next steps
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

