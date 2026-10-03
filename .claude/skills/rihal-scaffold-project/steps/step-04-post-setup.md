# Step 4: Post-Setup

## Goal
Finalize the scaffolded project and guide the user on next steps.

## Actions

### 1. Rename placeholders (if template has them)
- Check if template has a placeholder project name (e.g., `my-app`, `project-name`, `template` in package.json, README, etc.)
- If found: offer to replace with `{project_name}` automatically.
- Ask: "I found placeholder names in package.json and README.md. Want me to replace them with `{project_name}`?"
- Only replace if user confirms.

### 2. Install dependencies (if applicable)
- Check if `package.json` exists.
- If yes, ask: "Should I run `pnpm install` to install dependencies?"
- Use **pnpm** always (never npm or yarn).
- Run only if user confirms.

### 3. Summary
Print a clean summary:

```
✅ Project scaffolded successfully!

📁 Location:  {target_path}
📦 Template:  github.com/rihal-om/template (latest)
🔀 Git:       Fresh repo initialized with initial commit

Next steps:
  cd {target_path}
  pnpm install       ← if not done already
  pnpm dev           ← to start development server
```

### 4. Suggest next rihal skills
Offer relevant follow-up actions:
> "What would you like to do next?
> - **Generate project context** → `rihal-generate-project-context`
> - **Create a PRD** → `rihal-create-prd`
> - **Set up architecture** → `rihal-create-architecture`"

## Done
Skill execution complete.
