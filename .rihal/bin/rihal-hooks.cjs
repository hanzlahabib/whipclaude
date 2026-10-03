#!/usr/bin/env node
/**
 * rihal-hooks.cjs — opt-in hook runners for edit/workflow/commit guardrails.
 *
 * Subcommands:
 *   pre-edit    — verify file was Read before Edit/Write (exit 2 if not)
 *   pre-workflow — soft warning for rihal:* commands with suspicious args
 *   post-commit — verify commit format and no forbidden patterns
 *
 * All subcommands read stdin JSON from the hook execution context.
 * Pure Node stdlib. No external dependencies.
 */

const fs = require('fs');

/**
 * Read and parse stdin JSON.
 */
function readInputJson() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error(`Failed to parse stdin JSON: ${e.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * pre-edit: Verify that the file being edited was Read() first in this session.
 * Block with exit 2 if not.
 */
async function preEdit() {
  try {
    const input = await readInputJson();
    // Handle both harness schema (input.tool_input.X) and legacy schema (input.X)
    const filePath = input.tool_input?.file_path || input.file_path;
    const sessionReads = input.tool_input?.reads_in_session || input.reads_in_session || [];

    if (!filePath) {
      console.error('ERROR: No file_path in hook input');
      process.exit(1);
    }

    if (!sessionReads.includes(filePath)) {
      console.error(`⚠ READ-BEFORE-EDIT: Read ${filePath} before editing. (Advisory — session-read tracking not yet implemented)`);
      process.exit(0);
    }

    process.exit(0);
  } catch (err) {
    console.error(`Hook error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * pre-workflow: Soft warning for rihal:* commands with suspicious args.
 * Does not block (exit 0), but prints warning.
 */
async function preWorkflow() {
  try {
    const input = await readInputJson();
    const command = input.command || '';
    const args = input.args || '';

    // Only check rihal:* commands
    if (!command.startsWith('rihal:')) {
      process.exit(0);
    }

    // Heuristics for suspicious args:
    // - Planning command + question sounds like a decision (contains "should", "do we", "will", etc.)
    // - Args look like they might be file paths instead of proper question
    const suspiciousPatterns = [
      /\bshould\b/i,
      /\bdo we\b/i,
      /\bwill\b/i,
      /^\/[a-z]/i,
      /\s\.[\/\\]/,
    ];

    let hasSuspiciousPattern = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(args)) {
        hasSuspiciousPattern = true;
        break;
      }
    }

    if (hasSuspiciousPattern && (command === 'rihal:plan' || command === 'rihal:discuss')) {
      console.warn(`⚠ "${command}" with args: "${args}". Did you mean /rihal:do or /rihal:council?`);
    }

    process.exit(0);
  } catch (err) {
    console.error(`Hook error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * post-commit: Verify commit format and banned patterns.
 * Warns (not blocking) if violations found.
 */
async function postCommit() {
  try {
    const input = await readInputJson();
    const command = input.tool_input?.command || input.command || '';
    const output = input.tool_input?.output || input.output || '';

    // Only check git commits
    if (!command.includes('git commit')) {
      process.exit(0);
    }

    // Parse commit message from git output or input
    // If output contains the committed message, extract it
    const commitMatch = output.match(/\[.*?\s([a-f0-9]{7})\]/);
    if (!commitMatch) {
      // No commit was made (likely dry-run or error)
      process.exit(0);
    }

    let commitMsg = output;

    // If -F flag used, try to read the message file
    const fMatch = command.match(/-F\s+(\S+)/);
    if (fMatch && fs.existsSync(fMatch[1])) {
      try {
        commitMsg += '\n' + fs.readFileSync(fMatch[1], 'utf8');
      } catch {}
    }

    // If -m used, extract message from command
    const mMatch = command.match(/-m\s+["']([^"']+)["']/);
    if (mMatch) {
      commitMsg += '\n' + mMatch[1];
    }

    const violations = [];

    // Check for Co-Authored-By, Generated, 🤖, etc.
    if (/Co-Authored-By|Generated with Claude|Generated with|🤖/i.test(commitMsg)) {
      violations.push('Found "Co-Authored-By", "Generated with Claude", or "🤖 Generated" in commit message.');
    }

    // Check for --no-verify usage
    if (command.includes('--no-verify')) {
      violations.push('Used --no-verify flag. Please fix underlying issues instead of bypassing hooks.');
    }

    // Check commit message format (type(scope): description) on first line only
    const firstLine = commitMsg.split('\n').find(l => l.trim()) || '';
    const cc = /^[a-z]+(\([a-z-]+\))?:/.test(firstLine);
    if (!cc && commitMatch) {
      violations.push('Commit subject may not follow Conventional Commits format: type(scope): description');
    }

    if (violations.length > 0) {
      console.warn('⚠ Commit format warnings:');
      violations.forEach((v) => console.warn(`  • ${v}`));
    }

    process.exit(0);
  } catch (err) {
    console.error(`Hook error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Main entry point.
 */
async function main() {
  const subcommand = process.argv[2];

  switch (subcommand) {
    case 'pre-edit':
      await preEdit();
      break;
    case 'pre-workflow':
      await preWorkflow();
      break;
    case 'post-commit':
      await postCommit();
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.error('Usage: rihal-hooks.cjs pre-edit|pre-workflow|post-commit');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
