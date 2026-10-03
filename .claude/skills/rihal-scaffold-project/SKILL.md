---
name: rihal-scaffold-project
description: >
  Scaffold a new project for Rihalians using the official Rihal template repo.
  Activates when the user says "scaffold project", "create project", "new project",
  "initialize project", "setup new project", "scaffold from template", "create from template",
  "rihal new project", or "start a new rihal project". Do NOT use for generating
  project context files (use rihal-generate-project-context) or cloning websites
  (use rihal-clone-website).
---

## Workflow


# Scaffold Project from Rihal Template

## Overview

This skill bootstraps a new Rihalian project by cloning the official Rihal template
repository (`https://github.com/rihal-om/template`) into a target directory.

It always clones fresh from GitHub — nothing is stored locally — so if the template
is updated, the next scaffold automatically picks up the latest version.

The workflow enforces safety: it never overwrites an existing non-empty directory
without explicit user consent.

## On Activation

Load config from `{project-root}/.rihal/config.json` and resolve:
- `{user_name}` for greeting
- `{communication_language}` for all agent communication

Greet the user as `{user_name}` in `{communication_language}`.

Then proceed to `./steps/step-01-target.md`.

## Stages

| # | Stage | Purpose | File |
|---|-------|---------|------|
| 1 | Target Directory | Get + validate destination path | `steps/step-01-target.md` |
| 2 | Safety Check | Verify folder is empty or get new path | `steps/step-02-safety.md` |
| 3 | Clone | Clone template repo fresh from GitHub | `steps/step-03-clone.md` |
| 4 | Post-Setup | Rename, init git, suggest next steps | `steps/step-04-post-setup.md` |

## Design Decisions

- **Always clone fresh** — never cache template locally. Template updates are free.
- **No local template copy** — single source of truth is `https://github.com/rihal-om/template`.
- **Safety first** — never touch a non-empty directory without user approval.
- **Minimal assumptions** — ask before acting on any ambiguity.

## Output Format

- New project directory scaffolded at the specified path
- Fresh git history (template history stripped, new `git init` applied)
- `.rihal/config.json` initialized with project name and user preferences
- Console summary: path created, files scaffolded, next steps

## Examples

### Happy Path
**Input:** "scaffold a new project called my-app"
**Expected:** Ask for target path (default: `./my-app`), verify empty, clone template, strip git history, init fresh repo, summarize.

### Edge Case: Non-empty Directory
**Input:** Target directory already has files
**Expected:** "This folder isn't empty. Should I create a new folder `my-app-1` instead, or would you like to empty it first? (I won't delete anything without your go-ahead.)"

### Edge Case: No Name Given
**Input:** "scaffold project"
**Expected:** Ask for project name before proceeding.

### Negative Test
**Input:** "scaffold my existing repo" (existing non-empty dir provided)
**Expected:** Safety check triggers. Never overwrites. Offers alternatives.
