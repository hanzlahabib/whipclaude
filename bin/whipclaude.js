#!/usr/bin/env node
/**
 * bin/whipclaude.js — thin launcher that finds and runs the compiled binary
 */

const { spawnSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');

const ROOT = path.join(__dirname, '..');
const BIN  = path.join(ROOT, 'target', 'release', os.platform() === 'win32' ? 'whipclaude.exe' : 'whipclaude');

if (!fs.existsSync(BIN)) {
  console.error('\x1b[31m✗ WhipClaude binary not found.\x1b[0m');
  console.error('  The build may have failed during install. Try reinstalling:');
  console.error('\n    npm install -g whipclaude\n');
  process.exit(1);
}

const result = spawnSync(BIN, process.argv.slice(2), {
  stdio: 'inherit',
  detached: true,  // let it run as a background tray app
});

// Only exit with non-zero if it immediately crashed (not normal for a tray app)
if (result.status !== null && result.status !== 0) {
  process.exit(result.status);
}
