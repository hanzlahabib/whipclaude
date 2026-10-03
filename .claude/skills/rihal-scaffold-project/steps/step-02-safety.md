# Step 2: Safety Check

## Goal
Ensure the target directory is safe to scaffold into.

## Check: Does the directory exist?

### Case A — Directory does not exist
- Safe to proceed.
- Inform user: "Folder doesn't exist yet — I'll create it."
- Proceed to `step-03-clone.md`.

### Case B — Directory exists and is EMPTY
- Safe to proceed.
- Inform user: "Folder exists and is empty — proceeding."
- Proceed to `step-03-clone.md`.

### Case C — Directory exists and is NOT EMPTY
- **STOP. Do not touch anything.**
- Present the user with two options:

  > "The folder `{target_path}` already has files in it. For safety I won't touch it.
  >
  > What would you like to do?
  > **A)** Create a new folder called `{project_name}-new` instead
  > **B)** Give me a different folder name
  > **C)** Empty the folder yourself first, then tell me when it's ready"

- Wait for user response. Do NOT proceed until user explicitly confirms.
- If user chooses **A**: set `{target_path}` = `{cwd}/{project_name}-new`, proceed to step-03-clone.md.
- If user chooses **B**: ask for new name, loop back to step-01-target.md logic.
- If user chooses **C**: wait. When user says "ready" or "done", re-check the folder. Only proceed if it is now empty.

## Security Note
**NEVER delete, move, or modify files in an existing directory.** The user must take that action themselves. This skill only creates new content.
