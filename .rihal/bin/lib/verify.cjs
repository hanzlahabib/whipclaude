/**
 * Verify — schema drift detection.
 *
 * Scans git commits whose subject matches the NNN- prefix for the supplied
 * phase. For each commit that touches schema.prisma (or *.sql), we check
 * whether prisma/migrations/ gained a new directory in the same or a later
 * commit on the same branch. Missing migration directories → drift.
 */

const { execSync } = require('child_process');
const path = require('path');

function git(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return '';
  }
}

function commitsForPhase(projectRoot, phaseNum) {
  // Look for commit subjects starting with NN- or NNN- matching the phase.
  const log = git(`log --pretty=format:%H%x09%s`, projectRoot);
  if (!log) return [];
  const prefix = String(phaseNum).padStart(2, '0');
  const re = new RegExp(`(^|[^0-9])${prefix}-\\d+`);
  const commits = [];
  for (const line of log.split('\n')) {
    const [hash, ...rest] = line.split('\t');
    const subject = rest.join('\t');
    if (re.test(subject)) commits.push({ hash, subject });
  }
  return commits.reverse(); // oldest-first
}

function filesChanged(projectRoot, hash) {
  const out = git(`show --name-only --pretty=format: ${hash}`, projectRoot);
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

function migrationsAddedIn(projectRoot, hash) {
  // List added files under prisma/migrations/ for this commit, then extract
  // unique migration directory names.
  const out = git(`show --name-status --pretty=format: ${hash}`, projectRoot);
  const dirs = new Set();
  for (const line of out.split('\n')) {
    const parts = line.split(/\s+/);
    const status = parts[0];
    const file = parts[parts.length - 1];
    if (!file) continue;
    if (status.startsWith('A') && file.startsWith('prisma/migrations/')) {
      const seg = file.split('/')[2];
      if (seg) dirs.add(seg);
    }
  }
  return [...dirs];
}

function cmdSchemaDrift(projectRoot, phaseNum, opts = {}) {
  if (!phaseNum) throw new Error('Usage: verify schema-drift <phase> [--block]');
  const commits = commitsForPhase(projectRoot, phaseNum);

  const driftFiles = [];
  const missingMigrations = [];
  let migrationsAvailable = new Set();

  // First pass: collect all migration dirs that exist across all phase commits
  // plus any that exist on disk currently.
  for (const c of commits) {
    for (const d of migrationsAddedIn(projectRoot, c.hash)) migrationsAvailable.add(d);
  }

  for (const c of commits) {
    const files = filesChanged(projectRoot, c.hash);
    const schemaTouched = files.filter((f) => f === 'schema.prisma' || f.endsWith('/schema.prisma') || f.endsWith('.sql'));
    if (schemaTouched.length === 0) continue;

    // Any migration added in this commit OR any later phase commit?
    const added = migrationsAddedIn(projectRoot, c.hash);
    const laterIdx = commits.findIndex((x) => x.hash === c.hash);
    let laterAdded = [...added];
    for (let i = laterIdx + 1; i < commits.length; i++) {
      laterAdded.push(...migrationsAddedIn(projectRoot, commits[i].hash));
    }
    if (laterAdded.length === 0) {
      for (const f of schemaTouched) {
        driftFiles.push({ commit: c.hash.slice(0, 10), file: f, subject: c.subject });
      }
      missingMigrations.push({ commit: c.hash.slice(0, 10), subject: c.subject });
    }
  }

  const driftDetected = driftFiles.length > 0;
  return {
    drift_detected: driftDetected,
    blocking: Boolean(opts.block) && driftDetected,
    drift_files: driftFiles,
    missing_migrations: missingMigrations,
    commits_scanned: commits.length,
    phase: String(phaseNum),
  };
}

function dispatch(projectRoot, subArgs) {
  const sub = subArgs[0];
  const rest = subArgs.slice(1);
  switch (sub) {
    case 'schema-drift': {
      const phase = rest[0];
      const block = rest.includes('--block');
      return cmdSchemaDrift(projectRoot, phase, { block });
    }
    default:
      throw new Error(`Unknown verify subcommand: ${sub}. Valid: schema-drift`);
  }
}

module.exports = { dispatch, cmdSchemaDrift };
