/**
 * code-references.cjs — Extract and verify file/symbol references in text.
 *
 * Pure Node stdlib module. No external dependencies.
 *
 * Usage:
 *   const cr = require('./code-references.cjs');
 *   const refs = cr.extractReferences(planText);
 *   const result = cr.verifyReferences(refs, projectRoot);
 *
 * Exports:
 *   - extractReferences(text) → { files, symbols, fileLines }
 *   - verifyReferences(refs, projectRoot) → { verified, missing, summary }
 *
 * Detection patterns:
 *   - Files: \b[\w/.-]+\.(py|ts|tsx|js|jsx|md|yaml|yml|json|sh|cjs|mjs|rs|go|java|rb)\b
 *   - Symbols (snake_case): \b[a-z_][a-z0-9_]+\( → strip the (
 *   - Symbols (CamelCase): \b[A-Z][A-Za-z0-9]+\b (filter common English words)
 *   - File:line: \b([\w/.-]+\.\w+):(\d+)\b
 *
 * Verification uses fs.existsSync for files, grep for symbols.
 * Returns summary with { total, verified, missing, ratio }.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common English words to filter when detecting CamelCase symbols
const COMMON_ENGLISH = new Set([
  'The', 'A', 'An', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For',
  'From', 'With', 'By', 'As', 'Is', 'Are', 'Was', 'Were', 'Be', 'Been',
  'Have', 'Has', 'Had', 'Do', 'Does', 'Did', 'Can', 'Could', 'Will',
  'Would', 'Should', 'May', 'Might', 'Must', 'Shall', 'If', 'Then',
  'Else', 'Not', 'No', 'Yes', 'So', 'This', 'That', 'These', 'Those',
  'I', 'You', 'He', 'She', 'It', 'We', 'They', 'Me', 'Him', 'Her',
  'Us', 'Them', 'What', 'Which', 'Who', 'Whom', 'Whose', 'Where',
  'When', 'Why', 'How', 'Get', 'Set', 'Make', 'Take', 'Put', 'Let',
  'Call', 'Find', 'Use', 'Build', 'Create', 'Add', 'Remove', 'Delete',
  'Update', 'Read', 'Write', 'Check', 'Verify', 'Test', 'Run', 'Start',
  'Stop', 'Send', 'Receive', 'Process', 'Handle', 'Return', 'Export',
  'Import', 'Module', 'Class', 'Function', 'Method', 'Property',
  // Common markdown/documentation headers and structure
  'Objective', 'Tasks', 'Task', 'Files', 'Action', 'Done', 'Step', 'Steps',
  'Section', 'Sections', 'Example', 'Examples', 'Note', 'Notes', 'Warning',
  'Warnings', 'Description', 'Descriptions', 'Process', 'Processes',
]);

/**
 * Extract candidate file paths and symbol names from text.
 *
 * Returns:
 *   {
 *     files: [ "src/auth.ts", "package.json", ... ],
 *     symbols: [ "handle_login", "ClassName", ... ],
 *     fileLines: [ { file: "src/auth.ts", line: 42 }, ... ]
 *   }
 */
function extractReferences(text) {
  const files = new Set();
  const symbols = new Set();
  const fileLines = [];

  if (!text) return { files: [], symbols: [], fileLines: [] };

  // Pattern 1: Files — matches file paths with known extensions
  // \b[\w/.-]+\.(py|ts|tsx|js|jsx|md|yaml|yml|json|sh|cjs|mjs|rs|go|java|rb)\b
  const filePattern = /\b([\w/.-]+\.(py|ts|tsx|js|jsx|md|yaml|yml|json|sh|cjs|mjs|rs|go|java|rb))\b/gi;
  let match;
  while ((match = filePattern.exec(text)) !== null) {
    files.add(match[1]);
  }

  // Pattern 2: File:line references — matches "path.ext:NN"
  // \b([\w/.-]+\.\w+):(\d+)\b
  const fileLinePattern = /\b([\w/.-]+\.\w+):(\d+)\b/g;
  while ((match = fileLinePattern.exec(text)) !== null) {
    fileLines.push({ file: match[1], line: parseInt(match[2], 10) });
    files.add(match[1]); // also collect as a file reference
  }

  // Pattern 3: Snake_case function names — matches "function_name("
  // \b[a-z_][a-z0-9_]+\(
  const snakeCasePattern = /\b([a-z_][a-z0-9_]+)\(/g;
  while ((match = snakeCasePattern.exec(text)) !== null) {
    symbols.add(match[1]);
  }

  // Pattern 4: CamelCase class/type names (filter common words)
  // \b[A-Z][A-Za-z0-9]+\b
  const camelCasePattern = /\b([A-Z][A-Za-z0-9]+)\b/g;
  while ((match = camelCasePattern.exec(text)) !== null) {
    const word = match[1];
    // Skip common English words, very short names, and known common types
    if (
      !COMMON_ENGLISH.has(word) &&
      word.length > 2 &&
      !['String', 'Number', 'Boolean', 'Array', 'Object', 'Error', 'Promise',
        'Map', 'Set', 'Date', 'Math', 'Json', 'Regex', 'Node', 'Error'].includes(word)
    ) {
      symbols.add(word);
    }
  }

  return {
    files: Array.from(files),
    symbols: Array.from(symbols),
    fileLines: fileLines,
  };
}

/**
 * Verify references against the project root.
 *
 * Returns:
 *   {
 *     verified: { files: [...], symbols: [...] },
 *     missing: { files: [...], symbols: [...] },
 *     summary: { total: N, verified: M, missing: K, ratio: 0.X }
 *   }
 */
function verifyReferences(refs, projectRoot) {
  const verified = { files: [], symbols: [] };
  const missing = { files: [], symbols: [] };

  if (!refs || (!refs.files && !refs.symbols)) {
    return {
      verified,
      missing,
      summary: { total: 0, verified: 0, missing: 0, ratio: 1.0 },
    };
  }

  // Verify files
  if (refs.files && Array.isArray(refs.files)) {
    for (const file of refs.files) {
      const fullPath = path.join(projectRoot, file);
      if (fs.existsSync(fullPath)) {
        verified.files.push(file);
      } else {
        missing.files.push(file);
      }
    }
  }

  // Verify symbols — check if symbol appears in any source file
  if (refs.symbols && Array.isArray(refs.symbols)) {
    const verifiedSymbols = new Set();
    const missingSymbols = new Set();

    for (const symbol of refs.symbols) {
      // Try grep to find symbol in the project
      try {
        // Search for the symbol as a whole word (with word boundaries)
        // Pattern: \bsymbol\b or \bsymbol\( to catch function definitions or calls
        const cmd = `grep -r "\\b${symbol}\\b" "${projectRoot}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.go" --include="*.rs" 2>/dev/null | head -1`;
        const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
        if (output && output.trim()) {
          verifiedSymbols.add(symbol);
        } else {
          missingSymbols.add(symbol);
        }
      } catch {
        // grep failed or found nothing
        missingSymbols.add(symbol);
      }
    }

    verified.symbols = Array.from(verifiedSymbols);
    missing.symbols = Array.from(missingSymbols);
  }

  // Calculate summary
  const totalFiles = refs.files ? refs.files.length : 0;
  const totalSymbols = refs.symbols ? refs.symbols.length : 0;
  const total = totalFiles + totalSymbols;
  const verifiedCount = verified.files.length + verified.symbols.length;
  const missingCount = missing.files.length + missing.symbols.length;
  const ratio = total > 0 ? verifiedCount / total : 1.0;

  return {
    verified,
    missing,
    summary: {
      total,
      verified: verifiedCount,
      missing: missingCount,
      ratio: Math.round(ratio * 100) / 100,
    },
  };
}

module.exports = {
  extractReferences,
  verifyReferences,
};
