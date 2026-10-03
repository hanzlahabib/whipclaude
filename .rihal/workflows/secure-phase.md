<purpose>
Verify threat mitigations for a completed phase. Confirm SPRINT.md threat register dispositions are resolved. Update SECURITY.md.
</purpose>

<required_reading>
@.rihal/references/ui-brand.md
</required_reading>

<available_agent_types>
Valid Rihal subagent types (use exact names — do not fall back to 'general-purpose'):
- rihal-security-auditor — Verifies threat mitigation coverage
</available_agent_types>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:
- Print the usage block below
- STOP — do not proceed

**Usage:**
```
/rihal:secure-phase <phase>
```

**Examples:**
```
/rihal:secure-phase 01
/rihal:secure-phase 02.1
```

<process>

## 0. Initialize

```bash
INIT=$(node ".rihal/bin/rihal-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_AUDITOR=$(node ".rihal/bin/rihal-tools.cjs" agent-skills rihal-security-auditor 2>/dev/null)
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`.

```bash
AUDITOR_MODEL=$(node ".rihal/bin/rihal-tools.cjs" resolve-model rihal-security-auditor --raw)
SECURITY_CFG=$(node ".rihal/bin/rihal-tools.cjs" config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
```

If `SECURITY_CFG` is `false`: exit with "Security enforcement disabled. Enable via /rihal:settings."

Display banner: `Rihal > SECURE PHASE {N}: {name}`

## 1. Detect Input State

```bash
SECURITY_FILE=$(ls "${PHASE_DIR}"/*-SECURITY.md 2>/dev/null | head -1)
PLAN_FILES=$(ls "${PHASE_DIR}"/*-SPRINT.md 2>/dev/null)
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
```

- **State A** (`SECURITY_FILE` non-empty): Audit existing
- **State B** (`SECURITY_FILE` empty, `PLAN_FILES` and `SUMMARY_FILES` non-empty): Run from artifacts
- **State C** (`SUMMARY_FILES` empty): Exit — "Phase {N} not executed. Run /rihal:execute {N} first."

## 2. Discovery

### 2a. Read Phase Artifacts

Read SPRINT.md — extract `<threat_model>` block: trust boundaries, STRIDE register (`threat_id`, `category`, `component`, `disposition`, `mitigation_plan`).

### 2b. Read Summary Threat Flags

Read SUMMARY.md — extract `## Threat Flags` entries.

### 2c. Build Threat Register

Per threat: `{ threat_id, category, component, disposition, mitigation_pattern, files_to_check }`

## 3. Threat Classification

Classify each threat:

| Status | Criteria |
|--------|----------|
| CLOSED | mitigation found OR accepted risk documented in SECURITY.md OR transfer documented |
| OPEN | none of the above |

Build: `{ threat_id, category, component, disposition, status, evidence }`

If `threats_open: 0` → skip to Step 6 directly.

## 4. Present Threat Plan

Call AskUserQuestion with threat table and options:
1. "Verify all open threats" → Step 5
2. "Accept all open — document in accepted risks log" → add to SECURITY.md accepted risks, set all CLOSED, Step 6
3. "Cancel" → exit

## 5. Spawn rihal-security-auditor

```
Task(
  prompt="Read .rihal/agents/rihal-security-auditor.md for instructions.\n\n" +
    "<files_to_read>{PLAN, SUMMARY, impl files, SECURITY.md}</files_to_read>" +
    "<threat_register>{threat register}</threat_register>" +
    "<config>asvs_level: {SECURITY_ASVS}, block_on: {SECURITY_BLOCK_ON}</config>" +
    "<constraints>Never modify implementation files. Verify mitigations exist — do not scan for new threats. Escalate implementation gaps.</constraints>" +
    "${AGENT_SKILLS_AUDITOR}",
  subagent_type="rihal-security-auditor",
  model="{AUDITOR_MODEL}",
  description="Verify threat mitigations for Phase {N}"
)
```

Handle return:
- `## SECURED` → record closures → Step 6
- `## OPEN_THREATS` → record closed + open, present user with accept/block choice → Step 6
- `## ESCALATE` → present to user → Step 6

## 6. Write/Update SECURITY.md

**State B (create):**
1. Read template from `.rihal/templates/SECURITY.md`
2. Fill: frontmatter, threat register, accepted risks, audit trail
3. Write to `${PHASE_DIR}/${PADDED_PHASE}-SECURITY.md`

**State A (update):**
1. Update threat register statuses, append to audit trail:

```markdown
## Security Audit {date}
| Metric | Count |
|--------|-------|
| Threats found | {N} |
| Closed | {M} |
| Open | {K} |
```

**ENFORCING GATE:** If `threats_open > 0` after all options exhausted (user did not accept, not all verified closed):

```
Rihal > PHASE {N} SECURITY BLOCKED
{K} threats open — phase advancement blocked until threats_open: 0
▶ Fix mitigations then re-run: /rihal:secure-phase {N}
▶ Or document accepted risks in SECURITY.md and re-run.
```

Do NOT emit next-phase routing. Stop here.

## 7. Commit

```bash
node ".rihal/bin/rihal-tools.cjs" commit "docs(phase-${PHASE}): add/update security threat verification"
```

## 8. Results + Routing

**Secured (threats_open: 0):**
```
Rihal > PHASE {N} THREAT-SECURE
threats_open: 0 — all threats have dispositions.
▶ /rihal:validate {N}    validate test coverage
▶ /rihal:verify-work {N}       run UAT
```

Display `/clear` reminder.

</process>

<success_criteria>
- [ ] Security enforcement checked — exit if false
- [ ] Input state detected (A/B/C) — state C exits cleanly
- [ ] SPRINT.md threat model parsed, register built
- [ ] SUMMARY.md threat flags incorporated
- [ ] threats_open: 0 → skip directly to Step 6
- [ ] User gate with threat table presented
- [ ] Auditor spawned with complete context
- [ ] All three return formats (SECURED/OPEN_THREATS/ESCALATE) handled
- [ ] SECURITY.md created or updated
- [ ] threats_open > 0 BLOCKS advancement (no next-phase routing emitted)
- [ ] Results with routing presented on success
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

