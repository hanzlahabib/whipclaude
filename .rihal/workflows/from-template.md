# Workflow: rihal:from-template

<purpose>
Seed a fresh project's `.planning/` directory from a canonical starter template (saas-b2b, api-backend, mobile-app). Replaces the blank-page moment after `rihal init` with a PROJECT.md skeleton, a ROADMAP.md with typical phases for this kind of project, and a REQUIREMENTS.md of common REQ-IDs.

Templates are a starting point, not a prescription. Every section is meant to be edited. The goal is to have something concrete to react to instead of an empty file.
</purpose>

<output_format>
Open with banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► FROM TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End with a file summary and Next Up routing.
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` is empty, contains `--help`, `-h`, or `list` — print the catalog:

```
/rihal:from-template <template-name> [--project-name "<name>"] [--force]

Available templates:
  saas-b2b      Multi-tenant B2B SaaS — auth, orgs, billing, RBAC, admin
  api-backend   Headless API service — auth, contract, SDK, docs, SLOs
  mobile-app    iOS + Android app — onboarding, offline, push, store launch

Flags:
  --project-name "<name>"   Name substituted into PROJECT.md / ROADMAP.md placeholders (default: basename of cwd)
  --force                   Overwrite .planning/ files that already exist (destructive)
```

STOP.

## Step 1 — Resolve the template

```bash
TEMPLATE="${1}"
TEMPLATE_DIR=".rihal/templates/projects/${TEMPLATE}"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Unknown template: ${TEMPLATE}"
  echo "Run: /rihal:from-template --help  for the catalog."
  exit 0
fi
```

Read `${TEMPLATE_DIR}/template.yaml` to show the user what will be seeded:

```
Template: {display}
  {description}

Phases that will be seeded:
  - {phase_1}
  - {phase_2}
  ...

Recommended modules: {modules}
```

## Step 2 — Safety check

```bash
PLANNING=".planning"
EXISTING=()
for f in PROJECT.md ROADMAP.md REQUIREMENTS.md; do
  [ -f "${PLANNING}/${f}" ] && EXISTING+=("${f}")
done
```

If `EXISTING` is non-empty and `--force` was NOT passed:

```
.planning/ already contains:
  - {each existing file}

Refusing to overwrite. Options:
  - Pass --force to overwrite (destructive)
  - Delete the existing files first, then re-run
  - Use /rihal:new-project for the interactive discovery flow instead
```

STOP.

## Step 3 — Substitute placeholders

Compute substitutions:

```bash
PROJECT_NAME="${PROJECT_NAME_FLAG:-$(basename "$PWD")}"
DATE="$(date -u +%Y-%m-%d)"
```

Placeholders supported in template files:
- `{{project_name}}` → `$PROJECT_NAME`
- `{{date}}` → `$DATE`

All other `{{...}}` tokens are left in place intentionally — they're prompts for the user to fill in.

## Step 4 — Copy + substitute

```bash
mkdir -p "${PLANNING}"

for f in PROJECT.md ROADMAP.md REQUIREMENTS.md; do
  SRC="${TEMPLATE_DIR}/${f}"
  DEST="${PLANNING}/${f}"
  [ -f "$SRC" ] || continue
  # Substitute only the two known placeholders; leave all other {{...}} for the user to edit.
  sed -e "s|{{project_name}}|${PROJECT_NAME//|/\\|}|g" \
      -e "s|{{date}}|${DATE}|g" \
      "$SRC" > "$DEST"
done
```

## Step 5 — Record the seeding

```bash
node .rihal/bin/rihal-tools.cjs state add-decision \
  "Seeded .planning/ from template '${TEMPLATE}' (project: ${PROJECT_NAME})" 2>/dev/null || true
```

This surfaces the seeding both in local state AND `/rihal:decisions` cross-project memory.

## Step 6 — Commit

Suggest (do not execute without confirmation) a baseline commit:

```
git add .planning/PROJECT.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
git commit -m "docs(planning): seed from template — ${TEMPLATE}"
```

## Step 7 — Summary + Next Up

```
✓ Seeded .planning/ from template '${TEMPLATE}'
  - .planning/PROJECT.md       ({size})
  - .planning/ROADMAP.md       ({size})
  - .planning/REQUIREMENTS.md  ({size})

Next Up (from template.yaml.next_steps):
  {next_steps_block}

Also consider:
  /rihal:discuss-phase 01   — adapt phase 01 to your specifics
  /rihal:council            — sanity-check the starter phases before committing to them
```
</process>

## Success Criteria

- Unknown template name → catalog is printed, not a crash
- Existing `.planning/` files → refused unless `--force`
- `{{project_name}}` and `{{date}}` are substituted; other `{{...}}` tokens remain for the user to edit
- Seeded files are exactly the template files with only the two substitutions applied
- Seeding is recorded via `state add-decision` for traceability

## On Error

- Missing `.rihal/templates/projects/` directory → tell the user their install is missing the module; suggest `rihal:install`
- `sed` substitution failure (unusual characters in project name) → fall back to literal-string `awk` substitution, or ask the user to pass a simpler name via `--project-name`
