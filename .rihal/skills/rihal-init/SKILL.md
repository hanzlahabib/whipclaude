---
name: rihal-init
internal: true
description: "INTERNAL config loader — called by other skills, not by users directly. Loads module config vars from .rihal/. Install puts this in .rihal/skills/, not .claude/skills/."
argument-hint: "[--module=module_code] [--vars=var1:default1,var2] [--skill-path=/path/to/calling/skill]"
---

## Overview

This skill is the configuration entry point for all Rihal skills. It has two modes:

- **Fast path**: Config exists for the requested module — returns vars as JSON. Done.
- **Init path**: Config is missing — walks the user through configuration, writes config files, then returns vars.

Every Rihal skill should call this on activation to get its config vars. The caller never needs to know whether init happened — they just get their config back.

The script `rihal_init.py` is located in this skill's `scripts/` directory. Locate and run it using python for all commands below.

## On Activation — Fast Path

Run the `rihal_init.py` script with the `load` subcommand. Pass `--project-root` set to the project root directory.

- If a module code was provided by the calling skill, include `--module {module_code}`
- To load all vars, include `--all`
- To request specific variables with defaults, use `--vars var1:default1,var2`
- If no module was specified, omit `--module` to get core vars only

**If the script returns JSON vars** — store them as `{var-name}` and return to the calling skill. Done.

**If the script returns an error or `init_required`** — proceed to the Init Path below.

## Init Path — First-Time Setup

When the fast path fails (config missing for a module), run this init flow.

### Step 1: Check what needs setup

Run `rihal_init.py` with the `check` subcommand, passing `--module {module_code}`, `--skill-path {calling_skill_path}`, and `--project-root`.

The response tells you what's needed:

- `"status": "ready"` — Config is fine. Re-run load.
- `"status": "no_project"` — Can't find project root. Ask user to confirm the project path.
- `"status": "core_missing"` — Core config doesn't exist. Must ask core questions first.
- `"status": "module_missing"` — Core exists but module config doesn't. Ask module questions.

The response includes:
- `core_module` — Core module.yaml questions (when core setup needed)
- `target_module` — Target module.yaml questions (when module setup needed, discovered from `--skill-path` or `_rihal/{module}/`)
- `core_vars` — Existing core config values (when core exists but module doesn't)

### Step 2: Ask core questions (if `core_missing`)

The check response includes `core_module` with header, subheader, and variable definitions.

1. Show the `header` and `subheader` to the user
2. For each variable, present the `prompt` and `default`
3. For variables with `single-select`, show the options as a numbered list
4. For variables with multi-line `prompt` (array), show all lines
5. Let the user accept defaults or provide values

### Step 3: Ask module questions (if module was requested)

The check response includes `target_module` with the module's questions. Variables may reference core answers in their defaults (e.g., `{output_folder}`).

1. Resolve defaults by running `rihal_init.py` with the `resolve-defaults` subcommand, passing `--module {module_code}`, `--core-answers '{core_answers_json}'`, and `--project-root`
2. Show the module's `header` and `subheader`
3. For each variable, present the prompt with resolved default
4. For `single-select` variables, show options as a numbered list

### Step 4: Write config

Collect all answers and run `rihal_init.py` with the `write` subcommand, passing `--answers '{all_answers_json}'` and `--project-root`.

The `--answers` JSON format:

```json
{
  "core": {
    "user_name": "Rihal",
    "communication_language": "English",
    "document_output_language": "English",
    "output_folder": "_rihal-output"
  },
  "bmb": {
    "rihal_builder_output_folder": "_rihal-output/skills",
    "rihal_builder_reports": "_rihal-output/reports"
  }
}
```

Note: Pass the **raw user answers** (before result template expansion). The script applies result templates and `{project-root}` expansion when writing.

The script:
- Creates `_rihal/core/config.yaml` with core values (if core answers provided)
- Creates `_rihal/{module}/config.yaml` with core values + module values (result-expanded)
- Creates any directories listed in the module.yaml `directories` array

### Step 5: Return vars

After writing, re-run `rihal_init.py` with the `load` subcommand (same as the fast path) to return resolved vars. Store returned vars as `{var-name}` and return them to the calling skill.

## Output Format

JSON config vars returned to the calling skill. When init path runs, interactive Q&A with the user, then config files written to `_rihal/`.

## Examples

### Happy path (fast path)
**Calling skill:** invokes rihal-init with `--module bmb`
**Result:** Config exists → returns `{"output_folder": "_rihal-output", ...}` instantly

### Edge case (init path)
**Calling skill:** invokes rihal-init, no config exists
**Result:** Asks core questions → asks module questions → writes config → returns vars

### Negative boundary
**User:** "initialize my project"
**Result:** rihal-init is internal — user should use `rihal-scaffold-project` or `/rihal:install` instead
