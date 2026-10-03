# Workflow: rihal:note

<purpose>
Capture inline notes instantly without friction. Appends text to a dated note file with YAML frontmatter. No subagents, no user questions, no bash chains — single Write operation.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:note <argument-here>
```

**Examples:**
```
/rihal:note example 1
/rihal:note example 2
```

STOP — do not proceed.

## Step 1 — Parse arguments and flags

Extract from `$ARGUMENTS`:
- `--global` flag: write to `~/.rihal-notes/` instead of `.rihal/notes/`
- Text content: everything else is the note text

```bash
GLOBAL_MODE=false
NOTE_TEXT="$ARGUMENTS"
if [[ "$ARGUMENTS" == *"--global"* ]]; then
  GLOBAL_MODE=true
  NOTE_TEXT=$(echo "$ARGUMENTS" | sed 's/--global[[:space:]]*//' | xargs)
fi
```

If `NOTE_TEXT` is empty:
```
❌ Usage: /rihal:note <text>
   Example: /rihal:note refactor auth module to use async/await
   
   Flags:
   --global  Save to ~/.rihal-notes/ instead of .rihal/notes/
```

Exit.

## Step 2 — Generate slug and filename

From NOTE_TEXT, create a URL-safe slug (lowercase, hyphens, max 50 chars):
- "refactor auth module to use async/await" → "refactor-auth-module"

Create filename: `YYYY-MM-DD-{slug}.md`
- Example: `2026-04-12-refactor-auth-module.md`

Determine target directory:
- If GLOBAL_MODE: `~/.rihal-notes/`
- Else: `.rihal/notes/`

## Step 3 — Build note content with YAML frontmatter

Create YAML frontmatter:
```yaml
---
date: YYYY-MM-DD
slug: {slug}
promoted: false
---
```

Append note text:
```
{NOTE_TEXT}
```

Final content:
```
---
date: 2026-04-12
slug: refactor-auth-module
promoted: false
---

refactor auth module to use async/await
```

## Step 4 — Write note file (single operation, no chains)

Write the complete note to target file. Create parent directory if needed.

One operation only:
```bash
mkdir -p {target_dir}
cat > {target_dir}/{filename} << 'EOF'
{note content}
EOF
```

Print:
```
✅ Note saved: {target_dir}/{filename}

---
date: 2026-04-12
slug: refactor-auth-module
promoted: false
---

refactor auth module to use async/await
```

## Step 5 — List subcommand: /rihal:note list

If ARGUMENTS contains `list`:

Call node helper:
```bash
node .rihal/bin/rihal-tools.cjs notes list
```

Expected output format: JSON array of recent notes:
```json
[
  { "path": ".rihal/notes/2026-04-12-refactor-auth.md", "date": "2026-04-12", "slug": "refactor-auth", "summary": "refactor auth module..." },
  { "path": ".rihal/notes/2026-04-11-api-design.md", "date": "2026-04-11", "slug": "api-design", "summary": "design new API endpoint..." }
]
```

Parse and display (10 most recent):
```
## Recent Notes

1. 2026-04-12 — refactor-auth
   refactor auth module...

2. 2026-04-11 — api-design
   design new API endpoint...
```

## Success Criteria

- [ ] Note saved with YAML frontmatter
- [ ] File created in `.rihal/notes/` or `~/.rihal-notes/`
- [ ] Filename follows YYYY-MM-DD-{slug}.md pattern
- [ ] `promoted` field set to false
- [ ] Output confirms save location and content
- [ ] `--global` flag switches to home directory
- [ ] `list` subcommand returns 10 most recent notes

## On Error

- **Empty note text:** print usage and exit
- **Cannot create directory:** print error, suggest checking permissions
- **File write fails:** print error, suggest checking disk space
