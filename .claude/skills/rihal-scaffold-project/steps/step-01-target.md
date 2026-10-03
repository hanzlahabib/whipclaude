# Step 1: Target Directory

## Goal
Determine the target directory for the new project.

## Rules
- If the user already provided a project name or path when invoking the skill, use it.
- If not, ask: **"What should the project be called? I'll create a folder with that name in the current directory."**
- Accept either a bare name (`my-app`) or a full path (`/home/user/projects/my-app`).
- If bare name: resolve to `{cwd}/{name}` where `{cwd}` is the directory the user is currently in.
- Store resolved path as `{target_path}` and project name as `{project_name}`.

## Output
Confirm back to the user:
> "Got it — I'll scaffold into `{target_path}`. Let me check if that folder is ready..."

Then proceed to `step-02-safety.md`.
