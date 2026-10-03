# Workflow: rihal:install

<purpose>
Install a Rihal module into the current project. Modules are capability bundles (agents + workflows + commands + references). This workflow validates the module exists, checks dependencies, runs the installer, and updates the manifest.
</purpose>

## Step 0 — Validate module name

```bash
MODULES=$(node .rihal/bin/rihal-tools.cjs module list)
```

Parse JSON. If the requested module is not in the available list, print:
```
Unknown module: {name}
Available modules: core, execution
```
And stop.

## Step 1 — Check if already installed

```bash
INSTALLED=$(node .rihal/bin/rihal-tools.cjs module installed)
```

If the requested module is already in the installed list:
```
Module '{name}' is already installed.
```
And stop.

## Step 2 — Check dependencies

```bash
CHECK=$(node .rihal/bin/rihal-tools.cjs module check-requires {name})
```

If `ok` is false:
```
Module '{name}' requires '{missing_module}' to be installed first.
Run: /rihal:install {missing_module}
```
And stop.

## Step 3 — Run installer

The installer needs to be called with the `--module` flag. Detect the rihal-code package location:

```bash
# Try local dev first, then global
if [ -f ./cli/install-v2.js ]; then
  node ./cli/install-v2.js . --module {name} --force --yes
elif [ -f "$(npm root -g)/@hanzlahabib/rihal-code/cli/install-v2.js" ]; then
  node "$(npm root -g)/@hanzlahabib/rihal-code/cli/install-v2.js" . --module {name} --force --yes
else
  echo "Cannot find rihal-code package. Install it globally or run from the repo."
  exit 1
fi
```

## Step 4 — Print summary

```
✅ Module installed: {name}
   {description from module manifest}

New commands available:
  /rihal:{command} — {description}
```

## Success Criteria

- [ ] Module name is validated against available modules
- [ ] Module is not already installed
- [ ] Dependencies are checked and satisfied
- [ ] Installer runs without errors
- [ ] User sees confirmation with new commands available

## On Error

- **Unknown module:** list available modules.
- **Already installed:** inform user, no-op.
- **Missing dependencies:** list missing modules, tell user to install them first.
- **Installer not found:** tell user to install rihal-code package.
- **Installation fails:** report the specific error and suggest manual installation steps
