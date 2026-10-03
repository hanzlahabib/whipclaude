# Workflow: rihal:config

<purpose>
View or interactively edit Rihal project configuration (language, mode, model profile, branching strategy).
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:config [show | set <key> <value>]
```

**Examples:**
```
/rihal:config show
/rihal:config set communication_language Arabic
/rihal:config set mode yolo
```

If no arguments provided, enter interactive mode (Step 2).

## Step 1 — Parse input

- If first argument is `show` (or no args): proceed to Step 1.5 (display current config)
- If first argument is `set`: proceed to Step 2 (update value)
- Otherwise: treat as interactive mode

## Step 1.5 — Display current config

Read `.rihal/config.yaml` and print in formatted table:

```
Current Rihal Configuration:
  user_name              : {value}
  project_name           : {value}
  communication_language : {value}
  mode                   : {value}
  model_profile          : {value}
  branching_strategy     : {value}
```

STOP — do not proceed further.

## Step 2 — Interactive or set mode

### If `set <key> <value>`:

Validate key is one of: `communication_language`, `mode`, `model_profile`, `branching_strategy`.

If invalid, print error and STOP:
```
Unknown config key: {key}
Allowed keys: communication_language, mode, model_profile, branching_strategy
```

Call:
```bash
node .rihal/bin/rihal-tools.cjs config set --key {key} --value {value}
```

Print success:
```
✓ Updated: {key} = {value}
```

STOP.

### If no arguments (interactive mode):

Use AskUserQuestion for each setting:

1. Ask: "Communication language?" (show current value)
   - Options: English, Arabic, Spanish, French, Chinese, etc.
2. Ask: "Mode?" (guided or yolo?)
   - guided = confirm at gates
   - yolo = autonomous execution
3. Ask: "Model profile?" (balanced, fast, or thorough?)
4. Ask: "Branching strategy?" (none, auto-branch, feature-branch, trunk-based?)

After each selection, call the config set command from Step 2.

Print summary:
```
✓ Configuration updated:
  communication_language : {value}
  mode                   : {value}
  model_profile          : {value}
  branching_strategy     : {value}
```

STOP.

## Success Criteria

- [ ] Current config displayed or updated successfully
- [ ] No validation errors
- [ ] .rihal/config.yaml reflects changes

## On Error

- **Invalid key:** print allowed keys and stop.
- **.rihal/config.yaml missing:** print "No config found. Run /rihal:init first."
- **rihal-tools.cjs missing:** tell user to run `rihal-code install-v2`.
