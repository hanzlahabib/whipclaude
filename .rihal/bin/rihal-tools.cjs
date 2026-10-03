#!/usr/bin/env node
/**
 * rihal-tools.cjs — the helper binary every Rihal v2 workflow shells out to.
 *
 * Design goal: one Bash call per workflow step returns a single JSON blob
 * with every path, flag, and config value the orchestrator needs. This
 * replaces what would otherwise be 5-10 Read calls in the parent context
 * and keeps the orchestrator's context window small.
 *
 * Installed at: {project-root}/.rihal/bin/rihal-tools.cjs
 *
 * Subcommands:
 *   init <workflow-name> "<raw-args>"    → JSON context blob for a workflow
 *   select-panel "<question>" [flags]    → JSON { panel, scores, question, flags }
 *   classify-question "<question>"       → JSON { type, signals } (codebase|discovery|market|greenfield)
 *   agent-info <agent-id>                → JSON row from agent-manifest.csv
 *   list-agents                          → JSON array of installed agent ids
 *   version                              → package version
 *
 * Zero external dependencies. Pure Node stdlib. Runs offline.
 */

const fs = require('fs');
const path = require('path');

// Resolve project root. This file is installed at {project-root}/.rihal/bin/,
// so two levels up is the project.
// PROJECT_ROOT detection: when installed, this binary lives at <project>/.rihal/bin/rihal-tools.cjs
// When running from source (rihal/bin/), warn but allow — tests need this path.
const _maybeRoot = path.resolve(__dirname, '..', '..');
const _isInstalled = path.basename(path.dirname(__dirname)) === '.rihal';
if (!_isInstalled && !process.env.RIHAL_DEV_MODE && !process.env.NODE_TEST_CONTEXT) {
  // Source dir, not installed location — warn but proceed (tests run from here)
  if (process.stderr.isTTY) {
    console.error('Note: rihal-tools.cjs running from source. For full features install with: node cli/install-v2.js <target> --yes');
  }
}
const PROJECT_ROOT = _maybeRoot;
const RIHAL_DIR = path.join(PROJECT_ROOT, '.rihal');
const CONFIG_DIR = path.join(RIHAL_DIR, '_config');
const REFS_DIR = path.join(RIHAL_DIR, 'references');
const WORKFLOWS_DIR = path.join(RIHAL_DIR, 'workflows');
const PLANNING_DIR = path.join(PROJECT_ROOT, '.planning');
const SESSIONS_DIR = path.join(PLANNING_DIR, 'council-sessions');

/**
 * Parse a minimal YAML subset for our flat config.yaml shape.
 * Only supports `key: value` lines — no nesting, no lists, no flow syntax.
 */
function parseSimpleYaml(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const colonAt = line.indexOf(':');
    if (colonAt === -1) continue;
    const key = line.slice(0, colonAt).trim();
    let val = line.slice(colonAt + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

function readConfig() {
  const configPath = path.join(RIHAL_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return {
      user_name: 'User',
      project_name: path.basename(PROJECT_ROOT),
      language: 'English',
      mode: 'guided',
    };
  }
  try {
    const parsed = parseSimpleYaml(fs.readFileSync(configPath, 'utf8'));
    return {
      ...parsed,  // spread all parsed keys (model_profile, branching_strategy, etc.)
      user_name: parsed.user_name || 'User',
      project_name: parsed.project_name || path.basename(PROJECT_ROOT),
      language: parsed.communication_language || parsed.language || 'English',
      mode: parsed.mode || 'guided',
    };
  } catch (e) {
    throw new Error(`Failed to read config.yaml: ${e.message}`);
  }
}

/**
 * Parse CSV with quoted-field support. Expects the first row to be headers.
 * Returns array of objects keyed by header.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.length >= headers.length && r.some((c) => c !== '')).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] || ''; });
    return obj;
  });
}

/**
 * Recursively walk a directory and return absolute file paths.
 */
function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/**
 * Parse YAML frontmatter from a markdown file. Returns { frontmatter, body }.
 * Minimal subset — supports `key: value` and quoted strings only. Good
 * enough for our agent and command files.
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return { frontmatter: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: text };
  const block = text.slice(4, end);
  const body = text.slice(end + 5);
  const fm = {};
  for (const raw of block.split('\n')) {
    const line = raw.replace(/^#.*$/, '').trimEnd();
    if (!line) continue;
    const colonAt = line.indexOf(':');
    if (colonAt === -1) continue;
    const key = line.slice(0, colonAt).trim();
    let val = line.slice(colonAt + 1).trim();
    if (!key || !val) continue;
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    fm[key] = val;
  }
  return { frontmatter: fm, body };
}

function readAgentManifest() {
  const manifestPath = path.join(CONFIG_DIR, 'agent-manifest.csv');
  if (!fs.existsSync(manifestPath)) return [];
  return parseCsv(fs.readFileSync(manifestPath, 'utf8'));
}

function listInstalledAgents() {
  // Local agents from project manifest
  const local = readAgentManifest().map((row) => row.id).filter(Boolean);

  // Global agents from ~/.rihal/agents/
  let global = [];
  const globalDir = path.join(process.env.HOME || '', '.rihal', 'agents');
  if (fs.existsSync(globalDir)) {
    global = fs.readdirSync(globalDir)
      .filter(f => f.startsWith('rihal-') && f.endsWith('.md'))
      .map(f => f.replace('rihal-', '').replace('.md', ''));
  }

  // Merge and deduplicate: local takes precedence if defined in both
  return [...new Set([...local, ...global])];
}

/**
 * Load the council-panel scoring function. Installed at
 * .rihal/bin/lib/council-panel.cjs alongside this helper.
 */
function loadPanelScorer() {
  const scorerPath = path.join(__dirname, 'lib', 'council-panel.cjs');
  if (!fs.existsSync(scorerPath)) {
    throw new Error(`Panel scorer missing at ${scorerPath}. Reinstall: see README install command, or re-run install-v2.js with --force.`);
  }
  return require(scorerPath);
}

/**
 * Parse raw workflow args. Returns { question, flags }.
 *
 * Flag grammar:
 *   --full                        → flags.full = true
 *   --agents=a,b,c                → flags.agents = ['a','b','c']
 *   --explain                     → flags.explain = true
 *   --top N  or  --top=N          → flags.top = N (integer)
 *
 * Everything else becomes part of the question.
 */
function parseArgs(raw) {
  const flags = { full: false, agents: [], explain: false, top: null };
  const words = [];
  const tokens = (raw || '').trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '--full') flags.full = true;
    else if (tok === '--explain') flags.explain = true;
    else if (tok.startsWith('--agents=')) {
      flags.agents = tok.slice('--agents='.length).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (tok.startsWith('--top=')) {
      flags.top = parseInt(tok.slice('--top='.length), 10) || null;
    } else if (tok === '--top' && i + 1 < tokens.length && /^\d+$/.test(tokens[i + 1])) {
      flags.top = parseInt(tokens[++i], 10);
    } else {
      words.push(tok);
    }
  }
  return { question: words.join(' '), flags };
}

/**
 * Take the scorer's ideal panel and reduce it to agents actually installed
 * on disk. If the ideal panel references uninstalled ids (e.g. hussain-pm
 * in the v2 prototype), they are dropped and the panel is padded from the
 * remaining installed agents in their canonical order — so the user still
 * sees a reasonable panel size instead of a 1- or 2-agent stub.
 *
 * Minimum panel size is min(3, installedAgents.length) — if the project
 * only has 2 installed agents we return both, not a broken padded panel.
 *
 * Padding is SKIPPED when the user explicitly passed --agents=, because
 * that flag is a direct user intent and we must not add agents they
 * didn't ask for.
 */
function filterPanelToInstalled(idealPanel, installedAgents, { pad = true } = {}) {
  const kept = idealPanel.filter((id) => installedAgents.includes(id));
  if (!pad) return kept;

  const minTarget = Math.min(3, installedAgents.length);
  if (kept.length >= minTarget) return kept;

  const already = new Set(kept);
  const padded = [...kept];
  for (const id of installedAgents) {
    if (padded.length >= minTarget) break;
    if (!already.has(id)) padded.push(id);
  }
  return padded;
}

function cmdInit(workflowName, rawArgs) {
  const config = readConfig();
  const installedAgents = listInstalledAgents();
  const { question, flags } = parseArgs(rawArgs);

  let panel = [];
  let scores = {};

  let agent_id = null;

  if (workflowName === 'council') {
    const COUNCIL_EXCLUDED = ['executor', 'planner'];
    const councilAgents = installedAgents.filter((id) => !COUNCIL_EXCLUDED.includes(id));
    const scorer = loadPanelScorer();
    const opts = {};
    if (flags.full) opts.full = true;
    if (flags.agents.length > 0) opts.agents = flags.agents;
    const ideal = scorer.selectPanel(question, opts);
    // Don't pad when user explicitly specified the agent list — their
    // choice is the final word.
    panel = filterPanelToInstalled(ideal, councilAgents, { pad: flags.agents.length === 0 });
    if (flags.explain) {
      const explained = scorer.explainSelection(question, opts);
      scores = explained.scores || {};
    }
  }

  if (workflowName === 'discuss') {
    // Check if the first token of the question is a known agent id.
    // If so, extract it and shorten the question.
    const qWords = question.split(/\s+/).filter(Boolean);
    if (qWords.length > 0 && installedAgents.includes(qWords[0])) {
      agent_id = qWords[0];
    }
  }

  const questionClassification = cmdClassifyQuestion(
    agent_id ? question.slice(agent_id.length).trim() : question
  );

  // For discuss, strip agent_id from the question in the output
  const outputQuestion = (workflowName === 'discuss' && agent_id)
    ? question.slice(agent_id.length).trim()
    : question;

  const out = {
    workflow: workflowName,
    question: outputQuestion,
    agent_id,
    flags,
    panel,
    scores,
    question_type: questionClassification.type,
    question_signals: questionClassification.signals,
    config,
    installed_agents: installedAgents,
    paths: {
      project_root: PROJECT_ROOT,
      rihal: RIHAL_DIR,
      config_dir: CONFIG_DIR,
      refs: REFS_DIR,
      workflows: WORKFLOWS_DIR,
      planning_root: PLANNING_DIR,
      sessions_dir: SESSIONS_DIR,
      state: path.join(RIHAL_DIR, 'state.json'),
    },
    state_exists: fs.existsSync(path.join(RIHAL_DIR, 'state.json')),
  };

  return out;
}

function cmdSelectPanel(rawArgs) {
  const { question, flags } = parseArgs(rawArgs);
  const scorer = loadPanelScorer();
  const opts = {};
  if (flags.full) opts.full = true;
  if (flags.agents.length > 0) opts.agents = flags.agents;
  const ideal = scorer.selectPanel(question, opts);
  const explained = scorer.explainSelection(question, opts);
  const installed = listInstalledAgents();
  let panel = filterPanelToInstalled(ideal, installed, { pad: flags.agents.length === 0 });

  // --top N: return only the top N agents by score
  if (flags.top && flags.top > 0) {
    // Sort panel by score descending, then slice
    const scoreMap = explained.scores || {};
    panel = [...panel].sort((a, b) => (scoreMap[b] || 0) - (scoreMap[a] || 0)).slice(0, flags.top);
  }

  // Filter scores to installed-only agents
  const installedSet = new Set(installed);
  const filteredScores = Object.fromEntries(
    Object.entries(explained.scores || {}).filter(([id]) => installedSet.has(id))
  );

  return {
    question,
    flags,
    panel,
    scores: filteredScores,
    installed,
  };
}

function cmdAgentInfo(agentId) {
  const row = readAgentManifest().find((r) => r.id === agentId);
  if (!row) {
    console.error(`Unknown agent: ${agentId}`);
    process.exit(1);
  }
  return row;
}

function cmdListAgents() {
  return { agents: listInstalledAgents() };
}

/**
 * Classify a question into one of four types so the workflow can decide
 * whether to run a codebase scan or a research/discovery pre-step.
 *
 * Types:
 *   codebase    — question is about existing code, architecture, tests, commits, bugs
 *   discovery   — question is about choosing what to build (new project, sector, market)
 *   market      — question is about external context (plans, regulations, competitors, geography)
 *   greenfield  — question is about starting from scratch with no existing artifacts
 *   team        — question is about people, hiring, org structure, process, culture
 *   release     — question is about shipping, deploy, rollback, incident, production
 *   design      — question is about UX, brand, visual, user journey, interface
 *
 * Returns { type, signals: string[] } where signals are the matched phrases.
 */
function cmdClassifyQuestion(raw) {
  const normalized = (raw || '').toLowerCase().replace(/[.,;:!?"()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();

  const SIGNAL_GROUPS = {
    discovery: [
      'what project', 'which project', 'what should we build', 'what to build',
      'which market', 'what market', 'where should we start', 'what business',
      'which idea', 'what idea', 'start a company', 'start a business',
      'new venture', 'new startup', 'what opportunity',
      // Roman Urdu discovery signals
      'research kar', 'pata karo', 'batao', 'kaisa', 'kya karo', 'suggest karo',
      'plan karo', 'soche', 'plan karna',
      // Roman Urdu strategic signals (what-should-I-do questions)
      'kya karna', 'worth hai', 'sahi hai', 'kya sochte', 'kya lagta',
      // Urdu unicode discovery signals
      'ریسرچ', 'بتاؤ', 'ماذا', 'أفضل', 'کیف',
      // Arabic discovery signals
      'كيف أبدأ', 'ابدأ مشروع', 'مشروع جديد',
    ],
    market: [
      '2040', '2030', '2050', 'vision plan', 'national plan', 'government plan',
      'strategy plan', 'economic plan', 'development plan', 'five year plan',
      'oman', 'saudi', 'uae', 'gulf', 'gcc', 'mena', 'bahrain', 'qatar', 'kuwait',
      'market opportunity', 'market size', 'competitor', 'industry trend',
      'regulation', 'compliance', 'sector', 'economy',
      // Roman Urdu market signals
      'dubai', 'affiliate', 'karobar', 'business karna', 'market research kar',
      // Urdu unicode market signals
      'دبئی', 'مارکیٹ', 'کاروبار', 'خلیج', 'ہل', 'سوق', 'مشروع',
      // Arabic market signals
      'سوق', 'بحث', 'دبئي',
    ],
    greenfield: [
      'start fresh', 'from scratch', 'new project', 'blank slate', 'greenfield',
      'build something new', 'start building', 'no existing', 'haven\'t started',
      'bootstrap', 'kickoff',
      // Business-launch patterns (overloaded "launch" word — these disambiguate to business intent, not release)
      'launch a website', 'launch a site', 'launch a business', 'launch a startup',
      'launch an app', 'launch a product', 'launch a service', 'launch the website',
      'launch the site', 'launch the business', 'website launch', 'site launch',
      'business launch', 'product launch', 'startup launch',
      'launch karna', 'launch karo', 'website launch karna', 'site launch karna',
      'rent website', 'rental site', 'rental marketplace', 'rental platform',
      'quick bucks', 'side hustle', 'make money',
      // Roman Urdu greenfield signals
      'bnanai', 'banana', 'app banana', 'shuru', 'start karna', 'naya project', 'project banana', 'build karna',
      'chahiye', 'banana hai', 'website chahiye', 'app chahiye', 'rank and rent', 'banaiye', 'bana do',
      'banai', 'banaye', 'tayyar karna',
      // Urdu unicode greenfield signals
      'سائٹ بنانا', 'ایپ بنانا',
    ],
    team: [
      'hiring', 'hire', 'fire', 'team size', 'squad', 'org structure', 'burnout',
      'morale', 'retrospective', 'culture', 'process', 'onboarding', 'offboarding',
      'performance review', 'raise', 'promotion', 'conflict', 'burning out', 'burn out',
      'overwork', 'overworked', 'retention', 'turnover',
    ],
    release: [
      'deploy', 'deployment', 'ship to prod', 'shipping', 'rollback', 'incident', 'production issue',
      'hotfix', 'feature flag', 'canary', 'blue green', 'downtime', 'outage',
      'monitoring', 'alert', 'on call', 'oncall',
      'production launch', 'release launch',
    ],
    design: [
      'ux', 'user experience', 'user journey', 'wireframe', 'prototype', 'figma',
      'brand', 'visual identity', 'color palette', 'typography', 'logo',
      'design system', 'component library', 'accessibility', 'a11y', 'ui design',
      'redesign', 'onboarding flow', 'landing page', 'interface', 'layout',
    ],
    codebase: [
      'rewrite', 'refactor', 'migrate', 'this code', 'this function', 'this file',
      'this component', 'this api', 'this service', 'this database', 'this schema',
      'the auth', 'the tests', 'the build', 'the deploy', 'the pipeline',
      'production ready', 'ready to ship', 'test coverage', 'bug', 'error',
      'performance', 'should i rewrite', 'auth layer', 'db migration',
      'pull request', 'code review', 'technical debt', 'tech debt',
      'feature', 'ci/cd', 'cicd', 'pipeline', 'documentation', 'docs',
      // Tech choice signals
      'astro', 'nextjs', 'next.js', 'remix', 'nuxt', 'svelte', 'vue', 'angular',
      'should i use', 'which framework', 'compare framework',
      // Roman Urdu codebase/fix signals
      'fix karo', 'theek karo', 'sahi karo',
      'إعادة', 'کود',
      // Arabic execution signals
      'إصلاح', 'كود', 'برنامج', 'نفذ', 'شغل',
    ],
  };

  const matchedSignals = (signals) => signals.filter((s) => normalized.includes(s));
  const matched = {};
  for (const [type, signals] of Object.entries(SIGNAL_GROUPS)) {
    matched[type] = matchedSignals(signals);
  }

  // Weights per type
  const WEIGHTS = { discovery: 3, market: 2, greenfield: 2, team: 3, release: 3, design: 3, codebase: 3 };
  const scores = {};
  for (const [type, hits] of Object.entries(matched)) {
    scores[type] = hits.length * WEIGHTS[type];
  }

  // discovery + market together = market-research question
  if (matched.discovery.length > 0 && matched.market.length > 0) {
    return { type: 'market', signals: [...matched.discovery, ...matched.market], scores };
  }

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const type = winner[1] > 0 ? winner[0] : 'discovery'; // default to discovery
  const allSignals = Object.values(matched).flat();

  return { type, signals: allSignals, scores };
}

/**
 * init execute — returns context blob for the /rihal:execute workflow.
 * Resolves plan_path (single file or phase directory), reads the plan
 * frontmatter, and returns dependency wave groupings.
 */
function cmdInitExecute(rawArgs) {
  const config = readConfig();
  const tokens = (rawArgs || '').trim().split(/\s+/).filter(Boolean);
  const flags = { wave: null, interactive: false, continue: false, option: null, 'skip-gates': false };
  const positional = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '--interactive') flags.interactive = true;
    else if (t === '--continue') flags.continue = true;
    else if (t === '--skip-gates') flags['skip-gates'] = true;
    else if (t.startsWith('--wave=')) flags.wave = t.slice('--wave='.length);
    else if (t.startsWith('--option=')) flags.option = t.slice('--option='.length);
    else positional.push(t);
  }

  const target = positional[0] || '';
  let planPath = null;
  let phaseDir = null;
  let plans = [];

  // Resolve target: could be a .md file or a phase dir/name
  if (target && target.length > 5000) {
    throw new Error('Target path exceeds maximum length (5000 chars)');
  }
  const asAbsolute = path.isAbsolute(target) ? target : path.join(PROJECT_ROOT, target);
  if (!asAbsolute.startsWith(PROJECT_ROOT)) {
    throw new Error(`Path outside project root: ${target}`);
  }
  if (target.endsWith('.md') && fs.existsSync(asAbsolute)) {
    planPath = asAbsolute;
    plans = [{ path: planPath, depends_on: [], wave: 0 }];
  } else {
    // Look for a phase directory
    const candidates = [
      asAbsolute,
      path.join(PLANNING_DIR, target),
      path.join(PLANNING_DIR, 'phases', target),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        phaseDir = c;
        break;
      }
    }
    if (phaseDir) {
      const planFiles = walkFiles(phaseDir).filter((f) => path.basename(f) === 'SPRINT.md' || path.basename(f) === 'PLAN.md');
      plans = planFiles.map((f) => {
        const text = fs.readFileSync(f, 'utf8');
        const { frontmatter } = parseFrontmatter(text);
        const depends = frontmatter.depends_on
          ? frontmatter.depends_on.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        return { path: f, depends_on: depends, wave: 0, plan: frontmatter.plan || path.basename(path.dirname(f)) };
      });
      // Simple wave assignment: wave 0 = no deps, wave 1 = depends on wave 0, etc.
      const assigned = new Set();
      let wave = 0;
      while (assigned.size < plans.length) {
        const prev = assigned.size;
        for (const p of plans) {
          if (assigned.has(p.path)) continue;
          const depsResolved = p.depends_on.every((dep) =>
            plans.some((q) => q.plan === dep && assigned.has(q.path))
          );
          if (depsResolved) { p.wave = wave; assigned.add(p.path); }
        }
        if (assigned.size === prev) break; // circular or missing dep — break
        wave++;
      }
    }
  }

  return {
    workflow: 'execute',
    target,
    flags,
    plan_path: planPath,
    phase_dir: phaseDir,
    plans,
    config,
    paths: {
      project_root: PROJECT_ROOT,
      rihal: RIHAL_DIR,
      planning_root: PLANNING_DIR,
      state: path.join(RIHAL_DIR, 'state.json'),
    },
    state_exists: fs.existsSync(path.join(RIHAL_DIR, 'state.json')),
  };
}

/**
 * state <subcommand> — read/write .rihal/state.json for execution tracking.
 *
 * Subcommands:
 *   read                           → print full state.json as formatted JSON
 *   get                            → alias for read
 *   init --project <name>          → create state.json if missing
 *   set-phase <name>               → set current_phase, reset current_plan, append to phases[]
 *   advance-plan                   → increment current_plan
 *   record-execution --plan <name> --tasks <n> --duration <ms> --hash <git-hash>
 *   add-decision "<summary>"       → append to decisions[]
 *   add-blocker "<description>"    → append to blockers[]
 *   resolve-blocker <index>        → set blockers[index].resolved = true
 *   record-session                 → update last_session timestamp
 *   record-council --slug <s> --panel <csv> --artifact <path>
 */
function cmdState(subArgs) {
  const statePath = path.join(RIHAL_DIR, 'state.json');
  const sub = subArgs[0];

  /** Parse --key value flags from subArgs starting at index. */
  function parseFlags(startIdx) {
    const flags = {};
    for (let i = startIdx; i < subArgs.length; i++) {
      if (subArgs[i].startsWith('--')) {
        const key = subArgs[i].slice(2);
        flags[key] = subArgs[i + 1] || '';
        i++;
      }
    }
    return flags;
  }

  /** Cross-project decision log at ~/.rihal/decisions.jsonl. One JSON record per line. */
  function globalDecisionsPath() {
    const os = require('os');
    return path.join(os.homedir(), '.rihal', 'decisions.jsonl');
  }

  function appendGlobalDecision(record) {
    const file = globalDecisionsPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(record) + '\n', 'utf8');
  }

  function readGlobalDecisions() {
    const file = globalDecisionsPath();
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const out = [];
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { out.push(JSON.parse(t)); } catch (_) { /* skip malformed */ }
    }
    return out;
  }

  /** Read state or return default skeleton. */
  function readState() {
    if (!fs.existsSync(statePath)) return null;
    const stats = fs.statSync(statePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('state.json exceeds 10 MB limit — possible corruption');
    }
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (e) {
      throw new Error(`Invalid JSON in state.json: ${e.message}`);
    }
  }

  /** Atomic write: write to temp file then rename. */
  function writeState(state) {
    function isProcessAlive(pid) {
      try { process.kill(pid, 0); return true; } catch { return false; }
    }

    state.updated = new Date().toISOString();
    fs.mkdirSync(RIHAL_DIR, { recursive: true });
    const lockPath = statePath + '.lock';
    let attempts = 0;
    while (fs.existsSync(lockPath) && attempts < 50) {
      // Check if lock holder is alive
      const lockPid = parseInt(fs.readFileSync(lockPath, 'utf8'), 10);
      if (lockPid && !isProcessAlive(lockPid)) {
        console.error(`Stale lock from PID ${lockPid} — removing`);
        try { fs.unlinkSync(lockPath); } catch {}
        break;
      }
      require('child_process').execSync('sleep 0.05'); // 50ms backoff
      attempts++;
    }
    if (attempts >= 50) throw new Error('state.json locked too long');

    try {
      fs.writeFileSync(lockPath, String(process.pid));
      const tmp = statePath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
      fs.renameSync(tmp, statePath);
    } finally {
      try { fs.unlinkSync(lockPath); } catch {}
    }
    return { ok: true, state };
  }

  /** Write state and return compact result (hides full state from output) */
  function writeStateCompact(state, meta) {
    writeState(state);
    return { ok: true, ...meta };
  }

  function defaultState(projectName) {
    const now = new Date().toISOString();
    return {
      version: '1',
      project: projectName || path.basename(PROJECT_ROOT),
      created: now,
      updated: now,
      current_phase: null,
      current_plan: 0,
      current_sprint: null,
      phases: [],
      velocity_history: [],
      executions: [],
      decisions: [],
      blockers: [],
      council_sessions: [],
      last_session: null,
      workstreams: [],
      active_workstream: null,
    };
  }

  // --- read / get ---
  if (sub === 'read' || sub === 'get') {
    if (!fs.existsSync(statePath)) {
      // Auto-init with defaults if config.yaml exists (install happened).
      // Removes the "run /rihal:init first" friction — any workflow can
      // call `state read` and get a usable state back.
      const configPath = path.join(RIHAL_DIR, 'config.yaml');
      if (fs.existsSync(configPath)) {
        let projectName = path.basename(PROJECT_ROOT);
        try {
          const cfg = fs.readFileSync(configPath, 'utf8');
          const match = cfg.match(/^project_name:\s*"?([^"\n]+)"?/m);
          if (match) projectName = match[1].trim();
        } catch { /* use basename fallback */ }
        const state = defaultState(projectName);
        writeState(state);
        return state;
      }
      return {
        ok: false,
        error: 'No state.json yet. Run /rihal:install to set up this project, or `state init --project <name>` directly.'
      };
    }
    const state = readState();
    if (!state) return { state: null };
    return state;
  }

  // --- init ---
  if (sub === 'init') {
    let existing;
    try {
      existing = fs.existsSync(statePath) ? readState() : null;
    } catch (e) {
      console.error(`Warning: existing state.json corrupted (${e.message}). Initializing fresh state.`);
      existing = null;
    }
    if (existing && !parseFlags(1).force) {
      return { ok: true, state: existing, message: 'state.json already exists; pass --force to reinitialize' };
    }
    const flags = parseFlags(1);
    const state = defaultState(flags.project);
    return writeState(state);
  }

  // --- set-phase ---
  if (sub === 'set-phase') {
    const name = subArgs[1];
    if (!name) throw new Error('set-phase requires a phase name argument');
    const state = readState() || defaultState();
    state.current_phase = name;
    state.current_plan = 0;
    if (!state.phases) state.phases = [];
    if (!state.phases.some(p => p.name === name)) {
      state.phases.push({ name, started: new Date().toISOString(), completed: null, plan_count: 0 });
    }
    return writeState(state);
  }

  // --- advance-plan ---
  if (sub === 'advance-plan') {
    const state = readState() || defaultState();
    if (typeof state.current_plan !== 'number') state.current_plan = 0;
    state.current_plan += 1;
    // Update plan_count on current phase if tracked
    if (state.phases && state.phases.length > 0) {
      const current = state.phases[state.phases.length - 1];
      current.plan_count = state.current_plan;
    }
    return writeState(state);
  }

  // =====================================================================
  // Sprint & Story Management
  // =====================================================================

  // --- sprint add --phase NN --goal "Sprint goal" ---
  if (sub === 'sprint' && subArgs[1] === 'add') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    if (!flags.phase) throw new Error('sprint add requires --phase <NN>');
    if (!flags.goal) throw new Error('sprint add requires --goal "Sprint goal"');

    const phaseIdx = state.phases.findIndex(p =>
      String(p.number) === String(flags.phase) ||
      String(p.id) === String(flags.phase) ||
      p.name === flags.phase
    );
    if (phaseIdx === -1) throw new Error(`Phase "${flags.phase}" not found in state`);
    const phase = state.phases[phaseIdx];

    // Derive phase number: prefer explicit .number, fallback to array position
    // Prefer explicit .number, then .id (zero-padded string like "01"),
    // then array position
    const phaseNum = phase.number != null
      ? phase.number
      : phase.id != null
        ? parseInt(phase.id, 10) || (phaseIdx + 1)
        : phaseIdx + 1;
    if (!phase.sprints) phase.sprints = [];
    const sprintNum = phase.sprints.length + 1;
    const padPhase = String(phaseNum).padStart(2, '0');
    const sprintId = `${padPhase}.${sprintNum}`;

    const sprint = {
      id: sprintId,
      number: sprintNum,
      goal: flags.goal,
      status: 'planned',
      velocity_target: flags.velocity ? parseInt(flags.velocity, 10) : null,
      velocity_actual: null,
      started_at: null,
      completed_at: null,
      stories: [],
    };
    phase.sprints.push(sprint);
    state.current_sprint = sprintId;
    return writeStateCompact(state, { sprint_id: sprintId, phase: padPhase });
  }

  // --- sprint list [--phase NN] ---
  if (sub === 'sprint' && subArgs[1] === 'list') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const results = [];
    for (const phase of (state.phases || [])) {
      if (flags.phase && String(phase.number) !== String(flags.phase)) continue;
      for (const s of (phase.sprints || [])) {
        const done = (s.stories || []).filter(t => t.status === 'done').length;
        const total = (s.stories || []).length;
        const points_done = (s.stories || []).filter(t => t.status === 'done').reduce((a, t) => a + (t.points || 0), 0);
        const points_total = (s.stories || []).reduce((a, t) => a + (t.points || 0), 0);
        results.push({
          id: s.id, goal: s.goal, status: s.status,
          stories: `${done}/${total}`, points: `${points_done}/${points_total}`,
          velocity_target: s.velocity_target,
        });
      }
    }
    return results;
  }

  // --- sprint status [--sprint NN.S] ---
  if (sub === 'sprint' && subArgs[1] === 'status') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const targetId = flags.sprint || state.current_sprint;
    if (!targetId) throw new Error('No current sprint. Use --sprint NN.S or run sprint add first.');

    let found = null;
    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        if (s.id === targetId) { found = s; break; }
      }
      if (found) break;
    }
    if (!found) throw new Error(`Sprint "${targetId}" not found`);

    const stories = found.stories || [];
    const byStatus = { todo: [], in_progress: [], review: [], done: [] };
    for (const st of stories) (byStatus[st.status] || byStatus.todo).push(st);
    const points_done = byStatus.done.reduce((a, t) => a + (t.points || 0), 0);
    const points_total = stories.reduce((a, t) => a + (t.points || 0), 0);

    return {
      sprint: found.id, goal: found.goal, status: found.status,
      velocity_target: found.velocity_target, velocity_actual: found.velocity_actual,
      stories: { todo: byStatus.todo.length, in_progress: byStatus.in_progress.length,
                 review: byStatus.review.length, done: byStatus.done.length, total: stories.length },
      points: { done: points_done, total: points_total,
                remaining: points_total - points_done },
    };
  }

  // --- sprint start [--sprint NN.S] ---
  if (sub === 'sprint' && subArgs[1] === 'start') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const targetId = flags.sprint || state.current_sprint;
    if (!targetId) throw new Error('No sprint to start. Use --sprint NN.S.');

    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        if (s.id === targetId) {
          s.status = 'active';
          s.started_at = new Date().toISOString();
          state.current_sprint = targetId;
          return writeStateCompact(state, { started: targetId });
        }
      }
    }
    throw new Error(`Sprint "${targetId}" not found`);
  }

  // --- sprint complete [--sprint NN.S] ---
  if (sub === 'sprint' && subArgs[1] === 'complete') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const targetId = flags.sprint || state.current_sprint;
    if (!targetId) throw new Error('No sprint to complete. Use --sprint NN.S.');

    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        if (s.id === targetId) {
          const points_done = (s.stories || []).filter(t => t.status === 'done').reduce((a, t) => a + (t.points || 0), 0);
          s.status = 'completed';
          s.completed_at = new Date().toISOString();
          s.velocity_actual = points_done;
          if (!state.velocity_history) state.velocity_history = [];
          state.velocity_history.push({ sprint: targetId, points: points_done, completed_at: s.completed_at });
          state.current_sprint = null;
          return writeStateCompact(state, { completed: targetId, velocity: points_done });
        }
      }
    }
    throw new Error(`Sprint "${targetId}" not found`);
  }

  // --- sprint velocity ---
  if (sub === 'sprint' && subArgs[1] === 'velocity') {
    const state = readState() || defaultState();
    const history = state.velocity_history || [];
    const avg = history.length > 0
      ? Math.round(history.reduce((a, v) => a + v.points, 0) / history.length)
      : 0;
    return { history, average_velocity: avg, sprint_count: history.length };
  }

  // --- story add --sprint NN.S --title "Story title" --points N ---
  if (sub === 'story' && subArgs[1] === 'add') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const sprintId = flags.sprint || state.current_sprint;
    if (!sprintId) throw new Error('story add requires --sprint NN.S or an active sprint');
    if (!flags.title) throw new Error('story add requires --title "Story title"');

    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        if (s.id === sprintId) {
          if (!s.stories) s.stories = [];
          const storyNum = s.stories.length + 1;
          const storyId = `${sprintId}.${String(storyNum).padStart(2, '0')}`;
          const story = {
            id: storyId,
            title: flags.title,
            points: flags.points ? parseInt(flags.points, 10) : 0,
            status: 'todo',
            acceptance: flags.acceptance || null,
          };
          s.stories.push(story);
          return writeStateCompact(state, { story_id: storyId, sprint: sprintId });
        }
      }
    }
    throw new Error(`Sprint "${sprintId}" not found`);
  }

  // --- story move --id NN.S.TT --status done ---
  if (sub === 'story' && subArgs[1] === 'move') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    if (!flags.id) throw new Error('story move requires --id NN.S.TT');
    if (!flags.status) throw new Error('story move requires --status <todo|in_progress|review|done>');
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(flags.status)) throw new Error(`Invalid status "${flags.status}". Valid: ${validStatuses.join(', ')}`);

    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        for (const story of (s.stories || [])) {
          if (story.id === flags.id) {
            const prev = story.status;
            story.status = flags.status;
            return writeStateCompact(state, { story: flags.id, from: prev, to: flags.status });
          }
        }
      }
    }
    throw new Error(`Story "${flags.id}" not found`);
  }

  // --- story list [--sprint NN.S] [--status todo|in_progress|done] ---
  if (sub === 'story' && subArgs[1] === 'list') {
    const flags = parseFlags(2);
    const state = readState() || defaultState();
    const sprintId = flags.sprint || state.current_sprint;
    const results = [];
    for (const phase of (state.phases || [])) {
      for (const s of (phase.sprints || [])) {
        if (sprintId && s.id !== sprintId) continue;
        for (const story of (s.stories || [])) {
          if (flags.status && story.status !== flags.status) continue;
          results.push({ ...story, sprint: s.id });
        }
      }
    }
    return results;
  }

  // --- record-execution ---
  if (sub === 'record-execution') {
    const flags = parseFlags(1);
    const state = readState() || defaultState();
    if (!state.executions) state.executions = [];
    state.executions.push({
      plan: flags.plan || '',
      tasks: parseInt(flags.tasks || '0', 10),
      duration_ms: flags.duration ? parseInt(flags.duration, 10) : null,
      commit_hash: flags.hash || null,
      committed_at: new Date().toISOString(),
    });
    return writeState(state);
  }

  // --- add-decision ---
  if (sub === 'add-decision') {
    const summary = subArgs.slice(1).join(' ');
    if (!summary) throw new Error('add-decision requires a summary argument');
    const state = readState() || defaultState();
    if (!state.decisions) state.decisions = [];
    const record = {
      summary,
      phase: state.current_phase,
      plan: state.current_plan,
      date: new Date().toISOString(),
    };
    state.decisions.push(record);
    const result = writeState(state);
    // Mirror to cross-project store (best-effort, never fails the local write).
    try {
      appendGlobalDecision({
        ts: record.date,
        project: state.project || path.basename(PROJECT_ROOT),
        project_root: PROJECT_ROOT,
        phase: record.phase,
        plan: record.plan,
        summary: record.summary,
      });
    } catch (_) { /* silent — local commit must not break on home-dir issues */ }
    return result;
  }

  // --- decisions-global: query ~/.rihal/decisions.jsonl across all projects ---
  if (sub === 'decisions-global') {
    const flags = parseFlags(1);
    const limit = Math.max(1, parseInt(flags.limit || '20', 10));
    const sinceMs = flags.since ? Date.parse(flags.since) : null;
    const lines = readGlobalDecisions();
    const filtered = lines.filter((d) => {
      if (flags.project && d.project !== flags.project) return false;
      if (sinceMs && Date.parse(d.ts) < sinceMs) return false;
      return true;
    });
    // newest first
    filtered.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return { decisions: filtered.slice(0, limit), total: filtered.length };
  }

  // --- add-blocker ---
  if (sub === 'add-blocker') {
    const description = subArgs.slice(1).join(' ');
    if (!description) throw new Error('add-blocker requires a description argument');
    const state = readState() || defaultState();
    if (!state.blockers) state.blockers = [];
    state.blockers.push({
      description,
      phase: state.current_phase,
      plan: state.current_plan,
      date: new Date().toISOString(),
      resolved: null,
    });
    return writeState(state);
  }

  // --- resolve-blocker ---
  if (sub === 'resolve-blocker') {
    const index = parseInt(subArgs[1], 10);
    const state = readState();
    if (!state) throw new Error('No state.json found');
    if (!state.blockers || index < 0 || index >= state.blockers.length) {
      throw new Error(`Invalid blocker index: ${subArgs[1]}. Valid range: 0-${(state.blockers || []).length - 1}`);
    }
    state.blockers[index].resolved = new Date().toISOString();
    return writeState(state);
  }

  // --- record-session ---
  if (sub === 'record-session') {
    const state = readState() || defaultState();
    state.last_session = new Date().toISOString();
    return writeState(state);
  }

  // --- record-council ---
  if (sub === 'record-council') {
    const flags = parseFlags(1);
    if (!flags.slug) throw new Error('record-council requires --slug <value>');
    const state = readState() || defaultState();
    if (!state.council_sessions) state.council_sessions = [];
    state.council_sessions.push({
      date: new Date().toISOString(),
      question_slug: flags.slug || '',
      panel: (flags.panel || '').split(',').map((s) => s.trim()).filter(Boolean),
      artifact_path: flags.artifact || '',
    });
    return writeState(state);
  }

  // --- record-chain ---
  if (sub === 'record-chain') {
    const flags = parseFlags(1);
    if (!flags.slug) throw new Error('record-chain requires --slug <value>');
    const state = readState() || defaultState();
    if (!state.chains) state.chains = [];
    state.chains.push({
      date: new Date().toISOString(),
      slug: flags.slug || '',
      agents: (flags.agents || '').split(',').map((s) => s.trim()).filter(Boolean),
      artifacts_dir: flags.artifacts || '',
    });
    return writeState(state);
  }

  // --- insert-phase ---
  if (sub === 'insert-phase') {
    const flags = parseFlags(1);
    const phaseNumber = flags.number || '';
    const phaseName = flags.name || '';

    // Validate N.M format
    const phaseRegex = /^\d+\.\d+$/;
    if (!phaseRegex.test(phaseNumber)) {
      throw new Error(`Invalid phase number format: ${phaseNumber}. Expected N.M (e.g., 2.1, 3.2)`);
    }

    if (!phaseName) {
      throw new Error('insert-phase requires --name <phase-name>');
    }

    // Generate slug from name: lowercase, hyphenate spaces/underscores
    const slug = phaseName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new Error('Phase name must contain at least one alphanumeric character');
    }

    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];

    // Check if phase already exists
    if (state.phases.some(p => p.number === phaseNumber)) {
      throw new Error(`Phase ${phaseNumber} already exists`);
    }

    // Helper to convert phase number to comparable tuple
    function phaseTuple(s) {
      const [maj, min] = s.split('.').map(x => parseInt(x, 10));
      return [maj, min || 0];
    }

    // Helper to compare phase tuples
    function cmpPhase(a, b) {
      const [a1, a2] = phaseTuple(a);
      const [b1, b2] = phaseTuple(b);
      return a1 - b1 || a2 - b2;
    }

    // Insert phase in sorted order
    const newPhase = {
      number: phaseNumber,
      name: phaseName,
      slug: slug,
      created: new Date().toISOString(),
      started: null,
      completed: null,
    };

    const insertIdx = state.phases.findIndex(p => {
      return cmpPhase(p.number, phaseNumber) > 0;
    });

    if (insertIdx === -1) {
      state.phases.push(newPhase);
    } else {
      state.phases.splice(insertIdx, 0, newPhase);
    }

    writeState(state);
    return {
      ok: true,
      phase_number: phaseNumber,
      name: phaseName,
      slug: slug,
      directory: path.join(PLANNING_DIR, 'phases', `${phaseNumber}-${slug}`),
    };
  }

  // --- workstream-validate ---
  if (sub === 'workstream-validate') {
    const subcommand = subArgs[1];
    const flags = parseFlags(2);
    const name = flags.name || '';

    if (!subcommand || !['create', 'switch', 'list', 'status', 'complete'].includes(subcommand)) {
      throw new Error(`Invalid workstream subcommand: ${subcommand}. Valid: create, switch, list, status, complete`);
    }

    if (['create', 'switch', 'complete'].includes(subcommand) && !name) {
      throw new Error(`workstream ${subcommand} requires --name <name>`);
    }

    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];

    if (subcommand === 'create') {
      if (state.workstreams.some((w) => w.name === name)) {
        throw new Error(`Workstream already exists: ${name}`);
      }
    } else if (['switch', 'complete'].includes(subcommand)) {
      if (!state.workstreams.some((w) => w.name === name)) {
        throw new Error(`Workstream not found: ${name}`);
      }
    }

    return { ok: true, valid: true };
  }

  // --- workstream-create ---
  if (sub === 'workstream-create') {
    const flags = parseFlags(1);
    const name = flags.name || '';
    if (!name) throw new Error('workstream-create requires --name <name>');

    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];
    if (state.workstreams.some((w) => w.name === name)) {
      throw new Error(`Workstream already exists: ${name}`);
    }

    // Create new workstream
    const now = new Date().toISOString();
    const id = `ws-${Date.now().toString(36).slice(-8)}`;
    const newWorkstream = {
      name,
      id,
      created: now,
      active: true,
      completed: false,
      phases: [],
    };

    // Deactivate other workstreams
    state.workstreams.forEach((w) => { w.active = false; });
    state.workstreams.push(newWorkstream);
    state.active_workstream = name;

    return writeState(state);
  }

  // --- workstream-switch ---
  if (sub === 'workstream-switch') {
    const flags = parseFlags(1);
    const name = flags.name || '';
    if (!name) throw new Error('workstream-switch requires --name <name>');

    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];

    const ws = state.workstreams.find((w) => w.name === name);
    if (!ws) throw new Error(`Workstream not found: ${name}`);

    // Deactivate others, activate target
    state.workstreams.forEach((w) => { w.active = w.name === name; });
    state.active_workstream = name;

    return writeState(state);
  }

  // --- workstream-list ---
  if (sub === 'workstream-list') {
    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];

    return {
      ok: true,
      workstreams: state.workstreams.map((w) => ({
        name: w.name,
        id: w.id || '',
        active: w.active || false,
        completed: w.completed || false,
        phases: (w.phases || []).length,
        created: w.created || '',
      })),
    };
  }

  // --- workstream-status ---
  if (sub === 'workstream-status') {
    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];

    const active = state.workstreams.find((w) => w.active) || state.workstreams[0];
    if (!active) {
      return { ok: true, workstream: null, message: 'No workstreams exist' };
    }

    return {
      ok: true,
      workstream: {
        name: active.name,
        id: active.id || '',
        active: active.active || false,
        completed: active.completed || false,
        phases: (active.phases || []).length,
        created: active.created || '',
      },
    };
  }

  // --- workstream-complete ---
  if (sub === 'workstream-complete') {
    const flags = parseFlags(1);
    const name = flags.name || '';
    if (!name) throw new Error('workstream-complete requires --name <name>');

    const state = readState() || defaultState();
    if (!state.workstreams) state.workstreams = [];

    const ws = state.workstreams.find((w) => w.name === name);
    if (!ws) throw new Error(`Workstream not found: ${name}`);
    if (ws.completed) throw new Error(`Workstream already completed: ${name}`);

    ws.completed = true;
    ws.active = false;

    // If this was the active workstream, switch to first incomplete
    if (state.active_workstream === name) {
      const next = state.workstreams.find((w) => !w.completed);
      if (next) {
        next.active = true;
        state.active_workstream = next.name;
      } else {
        state.active_workstream = null;
      }
    }

    return writeState(state);
  }

  // --- set-user-profile / write-profile ---
  if (sub === 'set-user-profile' || sub === 'write-profile') {
    const flags = parseFlags(1);
    if (!flags.json) throw new Error('write-profile requires --json <json-blob>');
    const state = readState() || defaultState();
    if (!state.user_profile) state.user_profile = {};
    try {
      state.user_profile = JSON.parse(flags.json);
    } catch (e) {
      throw new Error(`Invalid JSON in --json flag: ${e.message}`);
    }
    return writeState(state);
  }

  // --- next-phase-id ---
  if (sub === 'next-phase-id') {
    const phasesDir = path.join(PLANNING_DIR, 'phases');
    let maxNum = 0;
    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir);
      for (const entry of entries) {
        const match = entry.match(/^(\d{2})-/);
        if (match) {
          const num = parseInt(match[1], 10);
          maxNum = Math.max(maxNum, num);
        }
      }
    }
    const nextId = String(maxNum + 1).padStart(2, '0');
    return { ok: true, next_phase_id: nextId };
  }

  // --- next-plan-id <phase-id> ---
  if (sub === 'next-plan-id') {
    const phaseId = subArgs[1];
    if (!phaseId) throw new Error('next-plan-id requires a phase ID argument (NN format)');
    const phaseMatch = phaseId.match(/^(\d{2})(?:\.(\d+))?$/);
    if (!phaseMatch) throw new Error(`Invalid phase ID format: ${phaseId}. Expected NN or NN.M`);

    const phasePart = phaseMatch[1];
    const phasesDir = path.join(PLANNING_DIR, 'phases');

    // Find the phase directory matching NN-*
    let phaseDir = null;
    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir);
      for (const entry of entries) {
        const match = entry.match(/^(\d{2})(?:\.\d+)?-/);
        if (match && match[1] === phasePart) {
          phaseDir = path.join(phasesDir, entry);
          break;
        }
      }
    }

    // If no phase dir found, default to 01 plan
    if (!phaseDir) {
      return { ok: true, next_plan_id: `${phasePart}.01` };
    }

    // Scan phase dir for numbered subdirs (MM-*) to find max plan number
    let maxPlanNum = 0;
    const entries = fs.readdirSync(phaseDir);
    for (const entry of entries) {
      const match = entry.match(/^(\d{2})-/);
      if (match && fs.statSync(path.join(phaseDir, entry)).isDirectory()) {
        const num = parseInt(match[1], 10);
        maxPlanNum = Math.max(maxPlanNum, num);
      }
    }

    const nextPlanNum = String(maxPlanNum + 1).padStart(2, '0');
    // First plan in empty phase gets .01 not .02
    return { ok: true, next_plan_id: maxPlanNum === 0 ? `${phasePart}.01` : `${phasePart}.${nextPlanNum}` };
  }

  // --- next-task-id <plan-id> ---
  if (sub === 'next-task-id') {
    const planId = subArgs[1];
    if (!planId) throw new Error('next-task-id requires a plan ID argument (NN.MM format)');
    const match = planId.match(/^(\d{2})\.(\d{2})$/);
    if (!match) throw new Error(`Invalid plan ID format: ${planId}. Expected NN.MM`);

    const phasePart = match[1];
    const planPart = match[2];

    // Construct plan file path
    const phasesDir = path.join(PLANNING_DIR, 'phases');
    let planFile = null;

    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir);
      for (const entry of entries) {
        const phaseMatch = entry.match(/^(\d{2})(?:\.\d+)?-/);
        if (phaseMatch && phaseMatch[1] === phasePart) {
          const phaseDir = path.join(phasesDir, entry);

          // Check for subdirectory named planPart-*
          const subentries = fs.readdirSync(phaseDir);
          for (const subentry of subentries) {
            const subMatch = subentry.match(/^(\d{2})-/);
            if (subMatch && subMatch[1] === planPart) {
              const planDir = path.join(phaseDir, subentry);
              const candidate = path.join(planDir, 'SPRINT.md');
              if (fs.existsSync(candidate)) {
                planFile = candidate;
                break;
              }
            }
          }

          // If no subdir found, check phase-level PLAN.md
          if (!planFile && planPart === '01') {
            const candidate = path.join(phaseDir, 'SPRINT.md');
            if (fs.existsSync(candidate)) {
              planFile = candidate;
            }
          }
          break;
        }
      }
    }

    if (!planFile) {
      throw new Error(`Plan ${planId} not found. Ensure phase and plan directories exist.`);
    }

    // Read PLAN.md and count existing tasks
    const planContent = fs.readFileSync(planFile, 'utf8');
    const taskMatches = planContent.match(/^### Task \d+\.\d+\.\d+ —/gm) || [];
    const nextTaskNum = String(taskMatches.length + 1).padStart(2, '0');

    return { ok: true, next_task_id: `${planId}.${nextTaskNum}` };
  }

  // --- resolve-id <id> ---
  if (sub === 'resolve-id') {
    const id = subArgs[1];
    if (!id) throw new Error('resolve-id requires an ID argument (NN, NN.MM, NN.MM.TT, or M{N})');

    // Parse ID pattern
    let idType = null;
    let phaseId = null, planId = null, taskId = null, milestoneId = null;

    if (/^M\d+$/.test(id)) {
      idType = 'milestone';
      milestoneId = id;
    } else if (/^\d{2}$/.test(id)) {
      idType = 'phase';
      phaseId = id;
    } else if (/^\d{2}\.\d+$/.test(id)) {
      const parts = id.split('.');
      phaseId = parts[0];

      // Determine if this is a decimal phase or a plan
      // Check if directory ends in .M pattern
      const phasesDir = path.join(PLANNING_DIR, 'phases');
      let isDecimalPhase = false;
      if (fs.existsSync(phasesDir)) {
        const entries = fs.readdirSync(phasesDir);
        for (const entry of entries) {
          if (entry.match(/^\d{2}\.\d+-/)) {
            isDecimalPhase = true;
            break;
          }
        }
      }

      if (isDecimalPhase) {
        idType = 'decimal-phase';
      } else {
        idType = 'plan';
        planId = id;
      }
    } else if (/^\d{2}\.\d+\.\d+$/.test(id)) {
      idType = 'task';
      const parts = id.split('.');
      phaseId = parts[0];
      planId = `${parts[0]}.${parts[1]}`;
      taskId = id;
    } else {
      throw new Error(`Invalid ID format: ${id}. Valid formats: NN (phase), NN.MM (plan), NN.MM.TT (task), MN (milestone)`);
    }

    // Build response
    const result = {
      id,
      type: idType,
      phase_id: phaseId,
      plan_id: planId,
      task_id: taskId,
      milestone_id: milestoneId,
      path: null,
      phase_dir: null,
      plan_dir: null,
      status: 'pending',
    };

    // Resolve paths
    if (phaseId) {
      const phasesDir = path.join(PLANNING_DIR, 'phases');
      if (fs.existsSync(phasesDir)) {
        const entries = fs.readdirSync(phasesDir);
        for (const entry of entries) {
          const match = entry.match(/^(\d{2})-/);
          if (match && match[1] === phaseId) {
            const phaseDir = path.join(phasesDir, entry);
            result.phase_dir = phaseDir;

            // Resolve plan path if plan_id is set
            if (planId) {
              const planNum = planId.split('.')[1];

              // Check for subdirectory
              const subentries = fs.readdirSync(phaseDir);
              for (const subentry of subentries) {
                const subMatch = subentry.match(/^(\d{2})-/);
                if (subMatch && subMatch[1] === planNum) {
                  const planDir = path.join(phaseDir, subentry);
                  const planPath = path.join(planDir, 'SPRINT.md');
                  if (fs.existsSync(planPath)) {
                    result.plan_dir = planDir;
                    result.path = planPath;
                  }
                  break;
                }
              }

              // If no subdir and planNum is 01, check phase-level PLAN.md
              if (!result.path && planNum === '01') {
                const candidate = path.join(phaseDir, 'SPRINT.md');
                if (fs.existsSync(candidate)) {
                  result.plan_dir = phaseDir;
                  result.path = candidate;
                }
              }
            }
            break;
          }
        }
      }
    }

    // Resolve milestone path if milestone_id is set
    if (milestoneId) {
      const milestonesDir = path.join(PLANNING_DIR, 'milestones');
      if (fs.existsSync(milestonesDir)) {
        const entries = fs.readdirSync(milestonesDir);
        for (const entry of entries) {
          if (entry.match(new RegExp(`^${milestoneId}-`))) {
            result.path = path.join(milestonesDir, entry, 'ROADMAP.md');
            break;
          }
        }
      }
    }

    // Determine status
    let status = 'not_found';
    if (result.phase_dir && fs.existsSync(result.phase_dir)) {
      status = 'found';
      // Check if SUMMARY exists for "complete"
      if (result.plan_dir) {
        const summaryFiles = fs.existsSync(result.plan_dir) ?
          fs.readdirSync(result.plan_dir).filter(f => f.endsWith('-SUMMARY.md')) : [];
        if (summaryFiles.length > 0) status = 'complete';
        else if (fs.existsSync(path.join(result.plan_dir, 'SPRINT.md'))) status = 'planned';
      }
    }
    result.status = status;

    return result;
  }

  // --- set-ids-in-state ---
  if (sub === 'set-ids-in-state') {
    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];
    if (!state.plans) state.plans = [];
    if (!state.milestones) state.milestones = [];

    // Scan phases directory
    const phasesDir = path.join(PLANNING_DIR, 'phases');
    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir);
      for (const entry of entries) {
        const match = entry.match(/^(\d{2})(?:\.\d+)?-(.+)$/);
        if (match) {
          const phaseId = match[1];
          const slug = match[2];
          const phaseDir = path.join(phasesDir, entry);

          // Add phase if not already present
          if (!state.phases.some(p => p.id === phaseId)) {
            state.phases.push({
              id: phaseId,
              slug,
              path: phaseDir,
              created: new Date().toISOString(),
            });
          }

          // Scan for plans within phase
          const subentries = fs.readdirSync(phaseDir);
          for (const subentry of subentries) {
            const subMatch = subentry.match(/^(\d{2})-(.+)$/);
            if (subMatch && fs.statSync(path.join(phaseDir, subentry)).isDirectory()) {
              const planNum = subMatch[1];
              const planId = `${phaseId}.${planNum}`;
              const planSlug = subMatch[2];
              const planDir = path.join(phaseDir, subentry);
              const planPath = path.join(planDir, 'SPRINT.md');

              if (fs.existsSync(planPath)) {
                if (!state.plans.some(p => p.id === planId)) {
                  state.plans.push({
                    id: planId,
                    phase_id: phaseId,
                    slug: planSlug,
                    path: planPath,
                    created: new Date().toISOString(),
                  });
                }
              }
            }
          }

          // Check for phase-level PLAN.md (01 plan)
          const phasePlanPath = path.join(phaseDir, 'SPRINT.md');
          if (fs.existsSync(phasePlanPath)) {
            const planId = `${phaseId}.01`;
            if (!state.plans.some(p => p.id === planId)) {
              state.plans.push({
                id: planId,
                phase_id: phaseId,
                slug: 'default',
                path: phasePlanPath,
                created: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    // Scan milestones directory
    const milestonesDir = path.join(PLANNING_DIR, 'milestones');
    if (fs.existsSync(milestonesDir)) {
      const entries = fs.readdirSync(milestonesDir);
      for (const entry of entries) {
        const match = entry.match(/^(M\d+)-(.+)$/);
        if (match) {
          const milestoneId = match[1];
          const slug = match[2];
          const milestonePath = path.join(milestonesDir, entry, 'ROADMAP.md');

          if (!state.milestones.some(m => m.id === milestoneId)) {
            state.milestones.push({
              id: milestoneId,
              slug,
              path: milestonePath,
              created: new Date().toISOString(),
            });
          }
        }
      }
    }

    return writeState(state);
  }

  // --- migrate-ids ---
  if (sub === 'migrate-ids') {
    const state = readState() || defaultState();
    let migratedCount = 0;

    const phasesDir = path.join(PLANNING_DIR, 'phases');
    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir).sort();
      let phaseNum = 1;

      for (const entry of entries) {
        const match = entry.match(/^(\d{2})-/);
        if (match) {
          phaseNum = parseInt(match[1], 10);
        }

        const phaseDir = path.join(phasesDir, entry);

        // Check for PLAN.md at phase level
        const phasePlanPath = path.join(phaseDir, 'SPRINT.md');
        if (fs.existsSync(phasePlanPath)) {
          try {
            let content = fs.readFileSync(phasePlanPath, 'utf8');
            const phaseIdStr = String(phaseNum).padStart(2, '0');

            // Check if it has frontmatter with phase/plan fields
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
            if (frontmatterMatch) {
              const fm = frontmatterMatch[1];
              if (!fm.match(/^id:/m)) {
                // Only add id if missing; preserve existing phase/plan if present
                let newFrontmatter = fm.trimEnd() + `\nid: "${phaseIdStr}.01"`;
                if (!fm.match(/^phase:/m)) newFrontmatter += `\nphase: "${phaseIdStr}"`;
                if (!fm.match(/^plan:/m)) newFrontmatter += `\nplan: "01"`;
                newFrontmatter += '\n';
                content = content.replace(/^---\n([\s\S]*?)\n---\n/, `---\n${newFrontmatter}---\n`);
                const tmp = phasePlanPath + '.tmp';
                fs.writeFileSync(tmp, content, 'utf8');
                fs.renameSync(tmp, phasePlanPath);
                migratedCount++;
              }
            } else {
              // No frontmatter found — prepend minimal frontmatter
              const assignedId = `${phaseIdStr}.01`;
              const minimal = `---\nid: "${assignedId}"\nphase: "${phaseIdStr}"\nplan: "01"\ntype: auto\n---\n`;
              fs.writeFileSync(phasePlanPath, minimal + content);
              migratedCount++;
            }
          } catch (e) {
            // Log but continue on file read/write errors
            if (process.env.DEBUG) console.error(`Warning: Could not migrate ${phasePlanPath}: ${e.message}`);
          }
        }

        // Check for plan subdirs
        const subentries = fs.readdirSync(phaseDir);
        let planNum = 1;
        for (const subentry of subentries) {
          const subMatch = subentry.match(/^(\d{2})-/);
          if (subMatch && fs.statSync(path.join(phaseDir, subentry)).isDirectory()) {
            planNum = parseInt(subMatch[1], 10);
            const planDir = path.join(phaseDir, subentry);
            const planPath = path.join(planDir, 'SPRINT.md');

            if (fs.existsSync(planPath)) {
              try {
                let content = fs.readFileSync(planPath, 'utf8');
                const phaseIdStr = String(phaseNum).padStart(2, '0');
                const planIdStr = String(planNum).padStart(2, '0');

                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                if (frontmatterMatch) {
                  const fm = frontmatterMatch[1];
                  if (!fm.match(/^id:/m)) {
                    // Only add id if missing; preserve existing phase/plan if present
                    let newFrontmatter = fm.trimEnd() + `\nid: "${phaseIdStr}.${planIdStr}"`;
                    if (!fm.match(/^phase:/m)) newFrontmatter += `\nphase: "${phaseIdStr}"`;
                    if (!fm.match(/^plan:/m)) newFrontmatter += `\nplan: "${planIdStr}"`;
                    newFrontmatter += '\n';
                    content = content.replace(/^---\n([\s\S]*?)\n---\n/, `---\n${newFrontmatter}---\n`);
                    const tmp = planPath + '.tmp';
                    fs.writeFileSync(tmp, content, 'utf8');
                    fs.renameSync(tmp, planPath);
                    migratedCount++;
                  }
                } else {
                  // No frontmatter found — prepend minimal frontmatter
                  const assignedId = `${phaseIdStr}.${planIdStr}`;
                  const minimal = `---\nid: "${assignedId}"\nphase: "${phaseIdStr}"\nplan: "${planIdStr}"\ntype: auto\n---\n`;
                  fs.writeFileSync(planPath, minimal + content);
                  migratedCount++;
                }
              } catch (e) {
                // Log but continue on file read/write errors
                if (process.env.DEBUG) console.error(`Warning: Could not migrate ${planPath}: ${e.message}`);
              }
            }
          }
        }
      }
    }

    return { ok: true, migrated: migratedCount, message: `Migrated ${migratedCount} PLAN.md files with IDs` };
  }

  // =====================================================================
  // Execution-lifecycle phase state
  // =====================================================================

  if (sub === 'planned-phase') {
    const flags = parseFlags(1);
    if (!flags.phase) throw new Error('planned-phase requires --phase <N>');
    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];
    const phaseKey = String(flags.phase);
    let entry = state.phases.find((p) => String(p.number || p.id || p.name) === phaseKey);
    const previousStatus = entry ? (entry.status || null) : null;
    if (!entry) {
      entry = { number: phaseKey, name: flags.name || phaseKey, plans: Number(flags.plans || 0) };
      state.phases.push(entry);
    }
    entry.status = 'planned';
    entry.name = flags.name || entry.name;
    if (flags.plans !== undefined) entry.plans = Number(flags.plans);
    entry.planned_at = new Date().toISOString();
    writeState(state);
    return { updated: true, phase: phaseKey, status: 'planned', previous_status: previousStatus, name: entry.name, plans: entry.plans };
  }

  if (sub === 'begin-phase') {
    const flags = parseFlags(1);
    if (!flags.phase) throw new Error('begin-phase requires --phase <N>');
    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];
    const phaseKey = String(flags.phase);
    let entry = state.phases.find((p) => String(p.number || p.id || p.name) === phaseKey);
    const previousStatus = entry ? (entry.status || null) : null;
    if (!entry) {
      entry = { number: phaseKey, name: flags.name || phaseKey, plans: Number(flags.plans || 0) };
      state.phases.push(entry);
    }
    entry.status = 'executing';
    if (flags.name) entry.name = flags.name;
    if (flags.plans !== undefined) entry.plans = Number(flags.plans);
    entry.started = entry.started || new Date().toISOString();
    state.current_phase = entry.name;
    writeState(state);
    return { updated: true, phase: phaseKey, status: 'executing', previous_status: previousStatus };
  }

  if (sub === 'complete-phase') {
    const flags = parseFlags(1);
    if (!flags.phase) throw new Error('complete-phase requires --phase <N>');
    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];
    const phaseKey = String(flags.phase);
    const entry = state.phases.find((p) => String(p.number || p.id || p.name) === phaseKey);
    if (!entry) throw new Error(`Phase ${phaseKey} not found in state`);
    const previousStatus = entry.status || null;
    entry.status = 'complete';
    entry.completed = new Date().toISOString();
    writeState(state);
    return { updated: true, phase: phaseKey, status: 'complete', previous_status: previousStatus };
  }

  // Truncates execution state but preserves decisions, council_sessions, and workstreams.
  if (sub === 'reset') {
    const state = readState() || defaultState();
    const preserved = {
      version: state.version || '1',
      project: state.project || path.basename(PROJECT_ROOT),
      created: state.created || new Date().toISOString(),
      current_phase: null,
      current_plan: 0,
      current_sprint: null,
      phases: [],
      velocity_history: [],
      executions: [],
      decisions: state.decisions || [],
      blockers: [],
      council_sessions: state.council_sessions || [],
      last_session: state.last_session || null,
      workstreams: state.workstreams || [],
      active_workstream: state.active_workstream || null,
    };
    writeState(preserved);
    return { updated: true, status: 'reset', preserved_decisions: preserved.decisions.length };
  }

  // --- promote-backlog <from> --to <target> ---
  // Promote a 999.x parking-lot phase to a real phase number.
  // Mutates state.phases[]; renames the on-disk directory if present.
  // Tracks issue #159 (M2.5 — GSD-parity 999.x convention).
  if (sub === 'promote-backlog') {
    const from = subArgs[1];
    const flags = parseFlags(2);
    const to = flags.to;
    if (!from || !to) {
      throw new Error('Usage: state promote-backlog <999.x> --to <NN>');
    }
    if (!/^999\.\d+$/.test(from)) {
      throw new Error(`Source must be 999.x parking-lot number, got: ${from}`);
    }
    if (!/^\d{1,3}(\.\d+)?$/.test(to)) {
      throw new Error(`Target must be NN or NN.M, got: ${to}`);
    }
    const state = readState() || defaultState();
    if (!state.phases) state.phases = [];
    const idx = state.phases.findIndex(p => String(p.number) === from);
    if (idx < 0) {
      throw new Error(`Parking-lot phase ${from} not found in state.phases`);
    }
    if (state.phases.some(p => String(p.number) === to)) {
      throw new Error(`Target phase ${to} already exists`);
    }
    const phase = state.phases[idx];
    const oldNumber = phase.number;
    phase.number = to;
    phase.promoted_from = oldNumber;
    phase.promoted_at = new Date().toISOString();

    // Rename on-disk directory if present
    const phasesDir = path.join(PLANNING_DIR, 'phases');
    let renamed = false;
    if (fs.existsSync(phasesDir)) {
      for (const entry of fs.readdirSync(phasesDir)) {
        if (entry.startsWith(`${oldNumber}-`) || entry === oldNumber) {
          const oldPath = path.join(phasesDir, entry);
          const newPath = path.join(phasesDir, entry.replace(oldNumber, to));
          fs.renameSync(oldPath, newPath);
          renamed = true;
          break;
        }
      }
    }

    writeState(state);
    return { ok: true, promoted: { from: oldNumber, to }, renamed_disk: renamed };
  }

  // --- sync --from-disk ---
  // Parse ROADMAP.md + epics.md and upsert milestones/phases/epics into state.json.
  // Preserves existing statuses on matching phase names/numbers.
  // Tracks: issue #126 (state desync between planning artifacts and state.json).
  if (sub === 'sync') {
    const flags = parseFlags(1);
    if (!flags['from-disk'] && flags['from-disk'] !== '') {
      // Support both "--from-disk" (flag) and "--from-disk true"
      // parseFlags consumes the next token as value; accept empty-string value.
    }
    const roadmapPath = path.join(PLANNING_DIR, 'ROADMAP.md');
    const epicsPath = path.join(PLANNING_DIR, 'epics.md');
    const state = readState() || defaultState();

    const parsed = {
      milestones_found: 0,
      phases_found: 0,
      phases_upserted: 0,
      epics_found: 0,
      roadmap_exists: fs.existsSync(roadmapPath),
      epics_exists: fs.existsSync(epicsPath),
    };

    // Parse ROADMAP.md for phase tables.
    // Expected row format:  | 01 | Phase Name | Goal text | ... |
    // First cell is phase number (1-3 chars of digits or digits+letter).
    if (parsed.roadmap_exists) {
      const roadmap = fs.readFileSync(roadmapPath, 'utf8');
      parsed.milestones_found = (roadmap.match(/^##\s+Milestone\s+M\d+/gim) || []).length;
      const rowRe = /^\|\s*(\d{1,3}(?:\.\d+)?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/gm;
      let m;
      if (!state.phases) state.phases = [];
      while ((m = rowRe.exec(roadmap)) !== null) {
        const phaseNum = m[1].trim();
        const phaseName = m[2].trim();
        const phaseGoal = m[3].trim();
        // Skip header rows like "| # | Phase | Goal |"
        if (!/^\d/.test(phaseNum)) continue;
        if (phaseName.toLowerCase() === 'phase') continue;
        parsed.phases_found += 1;
        const existingIdx = state.phases.findIndex(p =>
          String(p.number) === phaseNum || p.name === phaseName
        );
        if (existingIdx >= 0) {
          // Preserve existing status fields; update metadata.
          state.phases[existingIdx].number = state.phases[existingIdx].number || phaseNum;
          state.phases[existingIdx].name = phaseName;
          if (phaseGoal) state.phases[existingIdx].goal = phaseGoal;
        } else {
          state.phases.push({
            number: phaseNum,
            name: phaseName,
            goal: phaseGoal,
            status: 'planned',
            started: null,
            completed: null,
            plan_count: 0,
          });
          parsed.phases_upserted += 1;
        }
      }
    }

    // Parse epics.md for epics AND stories (issue #135 — story-level sync).
    // Supports both whole-document "## EPIC-NN" and sharded "epics/epic-N.md" layouts.
    parsed.stories_found = 0;
    parsed.stories_upserted = 0;
    parsed.stories_preserved_status = 0;
    parsed.sprints_found = 0;
    parsed.sprints_upserted = 0;

    if (parsed.epics_exists) {
      const epics = fs.readFileSync(epicsPath, 'utf8');
      parsed.epics_found = (epics.match(/^##\s+EPIC-\d+/gim) || epics.match(/^##\s+Epic\s+\d+/gim) || []).length;
      state.epics_count = parsed.epics_found;

      // Parse epic blocks and their stories.
      // Epic heading examples:  "## EPIC-01 — Setup"  or  "## Epic 1: User Auth"
      // Story heading examples: "### Story 01.03 — Schema"  or  "### Story 1.3: Foo"
      if (!state.epics) state.epics = [];
      const epicBlocks = epics.split(/^##\s+(?:EPIC-\d+|Epic\s+\d+)/im);
      const epicHeaders = epics.match(/^##\s+(?:EPIC-\d+|Epic\s+\d+)[^\n]*$/gim) || [];
      for (let i = 0; i < epicHeaders.length; i++) {
        const header = epicHeaders[i];
        const body = epicBlocks[i + 1] || '';
        const numMatch = header.match(/(\d+)/);
        if (!numMatch) continue;
        const epicNum = numMatch[1].padStart(2, '0');
        const nameMatch = header.match(/[—\-:]\s*(.+?)\s*$/);
        const epicName = nameMatch ? nameMatch[1].trim() : `Epic ${epicNum}`;

        // Upsert epic with story-level preservation.
        let epicEntry = state.epics.find(e => String(e.number) === epicNum);
        if (!epicEntry) {
          epicEntry = { number: epicNum, name: epicName, status: 'planned', stories: [] };
          state.epics.push(epicEntry);
        } else {
          epicEntry.name = epicName;
          if (!epicEntry.stories) epicEntry.stories = [];
        }

        // Parse stories inside this epic's body.
        const storyRe = /^###\s+Story\s+(\d+[\.-]\d+)[^\n]*?(?:[—\-:]\s*(.+?))?$/gim;
        let sm;
        while ((sm = storyRe.exec(body)) !== null) {
          const storyId = sm[1].replace('-', '.');
          const storyName = (sm[2] || '').trim() || `Story ${storyId}`;
          parsed.stories_found += 1;
          const existing = epicEntry.stories.find(s => String(s.id) === storyId);
          if (existing) {
            // Preserve status — state is authoritative for "completed" / "in_progress"
            existing.name = storyName;
            parsed.stories_preserved_status += 1;
          } else {
            epicEntry.stories.push({
              id: storyId,
              name: storyName,
              status: 'pending',
            });
            parsed.stories_upserted += 1;
          }
        }
      }
    }

    // Walk .rihal/phases/*/sprint-*.md — parse sprints into state.sprints[] (issue #135).
    const phasesDir = path.join(PLANNING_DIR, 'phases');
    const rihalPhasesDir = path.join(RIHAL_DIR, 'phases');
    const sprintRoot = fs.existsSync(phasesDir) ? phasesDir : (fs.existsSync(rihalPhasesDir) ? rihalPhasesDir : null);
    if (sprintRoot) {
      if (!state.sprints) state.sprints = [];
      for (const phaseEntry of fs.readdirSync(sprintRoot)) {
        const phaseDir = path.join(sprintRoot, phaseEntry);
        if (!fs.statSync(phaseDir).isDirectory()) continue;
        const phaseNumMatch = phaseEntry.match(/^(\d{1,3}(?:\.\d+)?)/);
        const phaseNum = phaseNumMatch ? phaseNumMatch[1] : phaseEntry;
        for (const file of fs.readdirSync(phaseDir)) {
          const sprintMatch = file.match(/^sprint-(\d+)\.md$/);
          if (!sprintMatch) continue;
          const sprintNum = sprintMatch[1];
          const sprintKey = `${phaseNum}/${sprintNum}`;
          parsed.sprints_found += 1;
          const sprintPath = path.join(phaseDir, file);
          const sprintText = fs.readFileSync(sprintPath, 'utf8');
          const goalMatch = sprintText.match(/(?:^goal:\s*(.+)$|\*\*Sprint Goal:\*\*\s*(.+))/im);
          const goal = goalMatch ? (goalMatch[1] || goalMatch[2] || '').trim() : '';
          const existing = state.sprints.find(s => s.key === sprintKey);
          if (existing) {
            existing.phase = phaseNum;
            existing.number = sprintNum;
            if (goal) existing.goal = goal;
            existing.file = path.relative(PROJECT_ROOT, sprintPath);
          } else {
            state.sprints.push({
              key: sprintKey,
              phase: phaseNum,
              number: sprintNum,
              goal,
              status: 'planned',
              file: path.relative(PROJECT_ROOT, sprintPath),
            });
            parsed.sprints_upserted += 1;
          }
        }
      }
    }

    if (!parsed.roadmap_exists && !parsed.epics_exists && parsed.sprints_found === 0) {
      throw new Error(`state sync --from-disk: no ROADMAP.md, epics.md, or sprint files found`);
    }

    writeState(state);
    return { ok: true, synced: true, ...parsed };
  }

  throw new Error(`Unknown state subcommand: ${sub}.\nCommon: read, set-phase, advance-plan, add-decision, decisions-global, add-blocker, sync, promote-backlog\nRun 'rihal-tools.cjs help' for the full list of state subcommands.`);
}

/**
 * Classify the scope of input based on keywords and length.
 * Returns one of: 'ticket', 'feature', 'phase', 'initiative'
 *
 * Priority order:
 * 1. Initiative keywords (highest)
 * 2. Phase keywords
 * 3. Feature keywords (add, implement, build)
 * 4. Ticket keywords
 * 5. Length-based fallback
 */
function classifyScope(input) {
  const text = (input || '').toLowerCase();
  const len = text.length;

  // Initiative signals — highest priority
  if (/\b(milestone|initiative|roadmap|multi-team|multi-sprint|q[1-4]\s*\d{4})\b/.test(text)) {
    return 'initiative';
  }
  if (len > 800) {
    return 'initiative';
  }

  // Phase signals
  if (/\b(phase|epic|sprint)\b/.test(text)) {
    return 'phase';
  }
  if (len > 300 && len <= 800) {
    return 'phase';
  }

  // Feature signals (add, implement, build)
  if (/\b(add|implement|build|create|develop|design)\b/.test(text)) {
    return 'feature';
  }

  // Ticket signals
  if (/\b(fix|bug|typo|quick|small)\b/.test(text)) {
    return 'ticket';
  }
  if (/github\.com\/[^/]+\/[^/]+\/issues\/\d+/.test(text)) {
    return 'ticket';
  }

  // Length-based fallback
  if (len < 100) {
    return 'ticket';
  }

  // Default to feature
  return 'feature';
}

/** init plan — context blob for /rihal:plan workflow. */
function cmdInitPlan(rawArgs) {
  const config = readConfig();
  const tokens = (rawArgs || '').trim().split(/\s+/).filter(Boolean);
  const flags = { phase: null, output: null, research: false };
  const positional = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '--phase' && tokens[i + 1]) { flags.phase = tokens[++i]; }
    else if (t.startsWith('--phase=')) { flags.phase = t.slice('--phase='.length); }
    else if (t === '--output' && tokens[i + 1]) { flags.output = tokens[++i]; }
    else if (t.startsWith('--output=')) { flags.output = t.slice('--output='.length); }
    else if (t === '--research') { flags.research = true; }
    else positional.push(t);
  }
  const arg = positional.join(' ').trim();
  let inputType = 'description';
  let resolvedPath = null;
  let description = arg;
  if (arg) {
    if (!arg || arg.length === 0) {
      throw new Error('Plan argument cannot be empty');
    }
    if (arg.length > 5000) {
      throw new Error('Plan argument exceeds maximum length (5000 chars)');
    }
    const asAbs = path.isAbsolute(arg) ? arg : path.join(PROJECT_ROOT, arg);
    const normalized = path.resolve(asAbs);
    if (!normalized.startsWith(PROJECT_ROOT + path.sep) && normalized !== PROJECT_ROOT) {
      throw new Error(`Path outside project root: ${arg}`);
    }
    try {
      if (arg.endsWith('.md') && fs.existsSync(asAbs)) {
        resolvedPath = asAbs;
        // Check if this is already an executable plan (ends in -PLAN.md)
        if (/-PLAN\.md$/.test(resolvedPath)) {
          inputType = 'executable_plan';
          description = null;
        } else if (path.basename(asAbs).startsWith('council-')) {
          inputType = 'session';
          description = null;
        } else {
          inputType = 'file';
          description = null;
        }
      } else if (fs.existsSync(asAbs) && fs.statSync(asAbs).isDirectory()) {
        const sessions = walkFiles(asAbs).filter((f) => f.endsWith('.md')).sort().reverse();
        if (sessions.length > 0) { resolvedPath = sessions[0]; inputType = 'session'; description = null; }
      }
    } catch (e) {
      throw new Error(`Failed to resolve plan path: ${e.message}`);
    }
  }

  if (!description && !resolvedPath) {
    console.error('rihal-tools warning: no description provided; plan will be named "unnamed". Re-run with a description.');
  }

  const phaseSlug = flags.phase || (resolvedPath
    ? path.basename(resolvedPath, '.md').replace(/^council-\d{4}-\d{2}-\d{2}-/, '').slice(0, 40)
    : (arg || 'unnamed').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40));
  const outputDir = flags.output || path.join(PLANNING_DIR, 'plans', phaseSlug);
  if (flags.output) {
    const absOutput = path.isAbsolute(flags.output) ? flags.output : path.join(PROJECT_ROOT, flags.output);
    if (!absOutput.startsWith(PROJECT_ROOT)) {
      throw new Error(`Output path outside project root: ${flags.output}`);
    }
  }

  // Classify scope based on description or resolved path content
  let scopeInput = description || '';
  if (!scopeInput && resolvedPath) {
    try {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      // Extract Follow-ups section if it's a council session
      const followUpsMatch = content.match(/## Follow-ups\s*\n([\s\S]*?)(?:##|$)/);
      if (followUpsMatch) {
        scopeInput = followUpsMatch[1].slice(0, 500); // Use first 500 chars of follow-ups
      } else {
        scopeInput = content.slice(0, 500); // Use first 500 chars of content
      }
    } catch (e) {
      // Ignore read errors, default to 'feature'
    }
  }
  const scope = classifyScope(scopeInput);

  // If input is already an executable plan, redirect to execute workflow
  if (inputType === 'executable_plan') {
    return {
      workflow: 'plan',
      input_type: 'executable_plan',
      resolved_path: resolvedPath,
      suggestion: `This file is already an executable plan. Run: /rihal:execute ${path.relative(PROJECT_ROOT, resolvedPath)}`,
      config,
      paths: { project_root: PROJECT_ROOT, rihal: RIHAL_DIR, planning_root: PLANNING_DIR, state: path.join(RIHAL_DIR, 'state.json') },
    };
  }

  return {
    workflow: 'plan', input_type: inputType, resolved_path: resolvedPath, description,
    phase_slug: phaseSlug, output_dir: outputDir, scope, flags, config,
    paths: { project_root: PROJECT_ROOT, rihal: RIHAL_DIR, planning_root: PLANNING_DIR, state: path.join(RIHAL_DIR, 'state.json') },
  };
}

/** plan list — glob .planning/plans/ for plan files. */
function cmdPlanList() {
  const plansDir = path.join(PLANNING_DIR, 'plans');
  if (!fs.existsSync(plansDir)) return { plans: [] };
  const files = walkFiles(plansDir).filter((f) => f.endsWith('.md'));
  return {
    plans: files.map((f) => {
      const text = fs.readFileSync(f, 'utf8');
      const { frontmatter, body } = parseFrontmatter(text);
      const objMatch = body.match(/^## Objective\s*\n(.+)/m);
      return {
        path: path.relative(PROJECT_ROOT, f), phase: frontmatter.phase || '',
        plan: frontmatter.plan || '', type: frontmatter.type || 'auto',
        depends_on: frontmatter.depends_on ? frontmatter.depends_on.split(',').map((s) => s.trim()) : [],
        objective: objMatch ? objMatch[1].trim() : '',
      };
    }),
  };
}

/** init chain — context blob for /rihal:chain workflow. */
function cmdInitChain(rawArgs) {
  const config = readConfig();
  const installedAgents = listInstalledAgents();
  const tokens = (rawArgs || '').trim().split(/\s+/).filter(Boolean);

  const PRESETS = {
    'research-plan': ['mariam', 'hussain-pm', 'planner'],
    'feasibility': ['waleed', 'fatima'],
    'gtm-to-build': ['mariam', 'hussain-pm', 'waleed'],
    'full-discovery': ['mariam', 'sadiq', 'hussain-pm', 'waleed', 'planner'],
  };

  let chain = [];
  let preset = null;
  let topicTokens = [];

  if (tokens.length > 0) {
    const first = tokens[0];
    if (PRESETS[first]) {
      preset = first;
      chain = PRESETS[first];
      topicTokens = tokens.slice(1);
    } else if (first.includes(',')) {
      // Custom comma-separated agent list
      chain = first.split(',').map((s) => s.trim()).filter(Boolean);
      topicTokens = tokens.slice(1);
    } else {
      // Treat as topic with default research-plan preset
      preset = 'research-plan';
      chain = PRESETS['research-plan'];
      topicTokens = tokens;
    }
  }

  const topic = topicTokens.join(' ').trim();
  const slug = (topic || preset || 'unnamed').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .split('-')
    .reduce((acc, word) => {
      const next = acc ? acc + '-' + word : word;
      return next.length <= 40 ? next : acc;
    }, '');
  const date = new Date().toISOString().slice(0, 10);
  const chainDir = path.join(PLANNING_DIR, 'chains', `${date}-${slug}`);

  // Normalize: if user passed "mariam", check both "mariam" and "rihal-mariam"
  chain = chain.map(id => {
    if (installedAgents.includes(id)) return id;
    if (installedAgents.includes('rihal-' + id)) return 'rihal-' + id;
    // Try without prefix if user passed full
    if (id.startsWith('rihal-') && installedAgents.includes(id.slice(6))) return id.slice(6);
    return id; // will fail validation downstream with proper error
  });

  // Validate agents are installed
  const unknownAgents = chain.filter((id) => !installedAgents.includes(id));

  return {
    workflow: 'chain',
    preset,
    chain,
    topic,
    slug,
    chain_dir: chainDir,
    config,
    installed_agents: installedAgents,
    unknown_agents: unknownAgents,
    presets: PRESETS,
    paths: { project_root: PROJECT_ROOT, rihal: RIHAL_DIR, planning_root: PLANNING_DIR, sessions_dir: SESSIONS_DIR, state: path.join(RIHAL_DIR, 'state.json') },
  };
}

/** init discuss — context blob for /rihal:discuss workflow. */
function cmdInitDiscuss(rawArgs) {
  const config = readConfig();
  const installedAgents = listInstalledAgents();
  const tokens = (rawArgs || '').trim().split(/\s+/).filter(Boolean);
  let agentId = null;
  let question = rawArgs || '';
  if (tokens.length > 0 && installedAgents.includes(tokens[0])) {
    agentId = tokens[0];
    question = tokens.slice(1).join(' ');
  }
  const questionClassification = cmdClassifyQuestion(question);
  return {
    workflow: 'discuss', agent_id: agentId, question,
    question_type: questionClassification.type, question_signals: questionClassification.signals,
    config, installed_agents: installedAgents,
    paths: { project_root: PROJECT_ROOT, rihal: RIHAL_DIR, planning_root: PLANNING_DIR, sessions_dir: SESSIONS_DIR, state: path.join(RIHAL_DIR, 'state.json') },
  };
}

/**
 * module <subcommand> — module system helpers.
 *   list           → available modules from package
 *   installed      → modules listed in .rihal/_config/manifest.yaml
 *   check-requires → verify a module's dependencies are installed
 */
function cmdModule(subArgs) {
  const sub = subArgs[0];

  if (sub === 'list') {
    // Hardcoded available modules (known at build time)
    return {
      modules: [
        { name: 'core', description: 'Council agents, /rihal:council, /rihal:discuss, /rihal:status, /rihal:do router, /rihal:help, and state management' },
        { name: 'execution', description: 'Plan execution — /rihal:execute, /rihal:plan, /rihal:quick, /rihal:debug, /rihal:audit-fix, /rihal:undo' },
        { name: 'discovery', description: 'Project discovery — /rihal:new-project, /rihal:map-codebase, /rihal:scan, /rihal:explore, /rihal:code-review, /rihal:docs-update' },
      ]
    };
  }

  if (sub === 'installed') {
    const manifestPath = path.join(CONFIG_DIR, 'manifest.yaml');
    if (!fs.existsSync(manifestPath)) return { installed: [] };
    const text = fs.readFileSync(manifestPath, 'utf8');
    const modules = [];
    let inModules = false;
    for (const line of text.split('\n')) {
      if (line.startsWith('modules:')) { inModules = true; continue; }
      if (inModules && line.trim().startsWith('-')) {
        modules.push(line.trim().slice(1).trim());
      } else if (inModules && !line.startsWith(' ')) {
        inModules = false;
      }
    }
    return { installed: modules };
  }

  if (sub === 'check-requires') {
    const REQUIRES = { core: [], execution: ['core'], discovery: ['core'] };
    const modName = subArgs[1];
    if (!modName) return { ok: false, error: 'check-requires requires a module name argument (core|execution|discovery)' };
    if (!REQUIRES[modName]) return { ok: false, error: `Unknown module: ${modName}. Valid: core, execution, discovery` };
    const requires = REQUIRES[modName];
    if (requires.length === 0) return { ok: true, requires: [], missing: [] };
    const { installed } = cmdModule(['installed']);
    const missing = requires.filter((r) => !installed.includes(r));
    return { ok: missing.length === 0, requires, missing };
  }

  throw new Error(`Unknown module subcommand: ${sub}. Valid: list, installed, check-requires`);
}

function readPackageVersion() {
  try {
    const manifestPath = path.join(CONFIG_DIR, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      const parsed = parseSimpleYaml(fs.readFileSync(manifestPath, 'utf8'));
      if (parsed.version) return parsed.version;
    }
  } catch { /* fall through */ }
  return 'unknown';
}

/**
 * resolve-model <agent-id> — return the model string for the given agent
 * under the current model profile in config.yaml.
 *
 * Model profiles (defined in references/model-profiles.md):
 *   - quality: opus for reasoning agents, sonnet for executor, haiku for utilities
 *   - balanced: sonnet for all agents
 *   - budget: haiku for all agents
 *   - inherit: no override, return null
 *
 * If the agent id is unknown, exit with error.
 */
function cmdResolveModel(agentId) {
  if (!agentId || agentId.trim() === '') {
    throw new Error('resolve-model requires an agent-id argument');
  }

  const config = readConfig();
  const profile = config.model_profile || 'balanced';
  const installedAgents = listInstalledAgents();

  if (!installedAgents.includes(agentId)) {
    throw new Error(`Unknown agent: ${agentId}. Valid agents: ${installedAgents.join(', ')}`);
  }

  // Model assignments per profile
  const QUALITY_AGENTS = {
    'rihal-sadiq': 'claude-3-5-opus-20241022',
    'rihal-waleed': 'claude-3-5-opus-20241022',
    'rihal-planner': 'claude-3-5-opus-20241022',
    'rihal-sprint-checker': 'claude-3-5-opus-20241022',
    'rihal-fatima': 'claude-3-5-sonnet-20241022',
    'rihal-executor': 'claude-3-5-sonnet-20241022',
    'rihal-verifier': 'claude-3-5-sonnet-20241022',
  };

  if (profile === 'inherit') {
    return { model: null, profile: 'inherit', note: 'No override; use parent session model' };
  }

  if (profile === 'budget') {
    return { model: 'claude-3-5-haiku-20241022', profile: 'budget', agent: agentId };
  }

  if (profile === 'balanced') {
    return { model: 'claude-3-5-sonnet-20241022', profile: 'balanced', agent: agentId };
  }

  if (profile === 'quality') {
    const model = QUALITY_AGENTS[agentId] || 'claude-3-5-haiku-20241022';
    return { model, profile: 'quality', agent: agentId };
  }

  // Unknown profile, default to balanced
  return { model: 'claude-3-5-sonnet-20241022', profile: 'balanced', agent: agentId, warning: `Unknown profile '${profile}'; using balanced` };
}

/**
 * config set --key <k> --value <v> — update a key in .rihal/config.yaml
 * Writes YAML-style `key: value` (quotes strings with spaces).
 */
function cmdConfigSet(subArgs) {
  const flags = {};
  for (let i = 0; i < subArgs.length; i++) {
    if (subArgs[i].startsWith('--')) {
      const key = subArgs[i].slice(2);
      flags[key] = subArgs[i + 1] || '';
      i++;
    }
  }

  const key = flags.key || '';
  const value = flags.value || '';

  if (!key) throw new Error('config set requires --key <key> --value <value>\n  e.g. config set --key language --value Arabic');
  if (!value) throw new Error('config set requires --key <key> --value <value>\n  e.g. config set --key language --value Arabic');

  const configPath = path.join(RIHAL_DIR, 'config.yaml');
  fs.mkdirSync(RIHAL_DIR, { recursive: true });

  let content = '';
  if (fs.existsSync(configPath)) {
    content = fs.readFileSync(configPath, 'utf8');
  }

  // Parse current config
  const config = parseSimpleYaml(content);

  // Update the key
  config[key] = value;

  // Serialize back to YAML
  const lines = [];
  for (const [k, v] of Object.entries(config)) {
    const needsQuotes = /\s/.test(v);
    const yamlValue = needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v;
    lines.push(`${k}: ${yamlValue}`);
  }

  const newContent = lines.join('\n') + '\n';
  const tmp = configPath + '.tmp';
  fs.writeFileSync(tmp, newContent, 'utf8');
  fs.renameSync(tmp, configPath);

  return { ok: true, key, value, path: configPath };
}

/**
 * notify send — post a message to configured webhook URLs.
 *
 * Config keys read from .rihal/config.yaml (top-level, flat):
 *   slack_webhook_url   — Slack incoming webhook
 *   discord_webhook_url — Discord webhook
 *   teams_webhook_url   — Microsoft Teams incoming webhook (MessageCard format)
 *
 * Flags:
 *   --title <t>   required headline
 *   --body <b>    optional detail text
 *   --event <e>   optional short event tag (e.g. "execute-done", "council-done")
 *   --only slack|discord|teams   restrict to one platform (for /rihal:notify-test)
 *
 * Returns: { sent: [...], skipped: [...], failed: [...] }
 * Never throws on webhook failure — this runs at the tail of workflows and
 * must not break the primary pipeline.
 */
async function cmdNotify(subArgs) {
  const sub = subArgs[0];
  if (sub !== 'send') {
    throw new Error("Unknown notify subcommand. Valid: send");
  }
  const flags = {};
  for (let i = 1; i < subArgs.length; i++) {
    if (subArgs[i].startsWith('--')) {
      flags[subArgs[i].slice(2)] = subArgs[i + 1] || '';
      i++;
    }
  }
  const title = flags.title || '';
  const body = flags.body || '';
  const event = flags.event || 'rihal';
  const only = flags.only || '';
  if (!title) throw new Error('notify send requires --title <text>');

  // Read config
  const configPath = path.join(RIHAL_DIR, 'config.yaml');
  const config = fs.existsSync(configPath)
    ? parseSimpleYaml(fs.readFileSync(configPath, 'utf8'))
    : {};

  const targets = [
    { name: 'slack',   url: config.slack_webhook_url,   shape: buildSlackPayload },
    { name: 'discord', url: config.discord_webhook_url, shape: buildDiscordPayload },
    { name: 'teams',   url: config.teams_webhook_url,   shape: buildTeamsPayload },
  ];

  const sent = [], skipped = [], failed = [];
  for (const t of targets) {
    if (only && t.name !== only) continue;
    if (!t.url) { skipped.push({ platform: t.name, reason: 'no webhook configured' }); continue; }
    try {
      const payload = t.shape({ title, body, event, project: path.basename(PROJECT_ROOT) });
      const res = await fetch(t.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        failed.push({ platform: t.name, status: res.status, text: (await res.text()).slice(0, 200) });
      } else {
        sent.push({ platform: t.name });
      }
    } catch (e) {
      failed.push({ platform: t.name, error: String(e.message || e) });
    }
  }
  return { sent, skipped, failed };
}

function buildSlackPayload({ title, body, event, project }) {
  const lines = [`*${title}*`];
  if (body) lines.push(body);
  lines.push(`_project: ${project} · event: ${event}_`);
  return { text: lines.join('\n') };
}

function buildDiscordPayload({ title, body, event, project }) {
  return {
    embeds: [{
      title: title.slice(0, 256),
      description: (body || '').slice(0, 4000),
      footer: { text: `project: ${project} · event: ${event}` },
    }],
  };
}

// Teams legacy MessageCard — still accepted by Incoming Webhook connectors.
function buildTeamsPayload({ title, body, event, project }) {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor: '0076D7',
    summary: title.slice(0, 256),
    title,
    text: body || '',
    sections: [{
      facts: [
        { name: 'Project', value: project },
        { name: 'Event', value: event },
      ],
    }],
  };
}

/**
 * notes list — glob .rihal/notes/*.md and ~/.rihal-notes/*.md,
 * parse frontmatter, return sorted array of {path, date, slug, summary}
 * (10 most recent).
 */
function cmdNotesList() {
  const noteDirs = [
    path.join(RIHAL_DIR, 'notes'),
    path.join(process.env.HOME || '', '.rihal-notes'),
  ];

  const notes = [];
  for (const dir of noteDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontmatter, body } = parseFrontmatter(content);
        const summary = body.trim().split('\n')[0].slice(0, 50);
        notes.push({
          path: filePath,
          date: frontmatter.date || file.slice(0, 10),
          slug: frontmatter.slug || file.replace(/^[\d-]+/, '').replace(/\.md$/, ''),
          summary,
        });
      }
    } catch (err) {
      // Silently skip if directory cannot be read
    }
  }

  // Sort by date descending, take 10 most recent
  notes.sort((a, b) => b.date.localeCompare(a.date));
  return notes.slice(0, 10);
}

/**
 * notes count — return count of unpromoted notes in both .rihal/notes
 * and ~/.rihal-notes.
 */
function cmdNotesCount() {
  const noteDirs = [
    path.join(RIHAL_DIR, 'notes'),
    path.join(process.env.HOME || '', '.rihal-notes'),
  ];

  let count = 0;
  for (const dir of noteDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        if (frontmatter.promoted !== 'true') count++;
      }
    } catch (err) {
      // Silently skip if directory cannot be read
    }
  }

  return { count };
}

/**
 * cmdBrain — pull Rihal brain content from configured sources.
 *
 * Subcommands:
 *   brain pull           Fetch all configured sources into rihal/brain/
 *   brain pull <name>    Fetch a single named source
 *   brain status         Report cache freshness and placeholder status
 *   brain list           Print configured sources
 *
 * Uses git sparse-checkout so we pull only the paths listed per source.
 * Placeholder URLs (containing `<PLACEHOLDER`) are skipped with a clear
 * message — useful in v2.0 before M5 lands real Rihal repo URLs.
 */
function cmdBrain(args) {
  const sub = args[0] || 'help';
  const sourcesPath = path.join(PROJECT_ROOT, 'rihal', 'brain', 'sources.yaml');
  const brainDir = path.join(PROJECT_ROOT, 'rihal', 'brain');

  if (!fs.existsSync(sourcesPath)) {
    return {
      ok: false,
      error: `sources.yaml missing at ${sourcesPath}. Run install or see issue #158.`,
    };
  }

  // Minimal YAML reader specifically for sources.yaml — not a general parser.
  // Handles: `version: 1`, `defaults:` block, `sources:` list where each
  // entry is a `- name: X` block with sibling key: value lines and an
  // `paths:` sub-list of strings.
  function parseSourcesYaml(text) {
    const root = { version: null, defaults: {}, sources: [] };
    const lines = text.split('\n');
    let section = null;
    let current = null;     // current source map
    let inPaths = false;
    let inDescription = false;
    let descLines = [];

    function unquote(s) { return s.replace(/^['"]|['"]$/g, ''); }

    for (const raw of lines) {
      if (!raw.trim() || raw.trim().startsWith('#')) continue;

      // Flush description if we were collecting
      if (inDescription && raw.match(/^ {4}\S/) && !raw.trim().startsWith('-')) {
        // still inside the description block
        const m = raw.match(/^ *(.*)$/);
        if (m) descLines.push(m[1]);
        continue;
      } else if (inDescription) {
        current.description = descLines.join(' ').trim();
        inDescription = false;
        descLines = [];
      }

      // Top-level keys
      const top = raw.match(/^(\w+):\s*(.*)$/);
      if (top) {
        const key = top[1], val = top[2].trim();
        if (key === 'version') { root.version = unquote(val); section = null; continue; }
        if (key === 'defaults') { section = 'defaults'; continue; }
        if (key === 'sources') { section = 'sources'; continue; }
      }

      // defaults: indented key-value
      if (section === 'defaults') {
        const m = raw.match(/^ +([\w_]+):\s*(.*)$/);
        if (m) root.defaults[m[1]] = unquote(m[2]);
        continue;
      }

      // sources: list items
      if (section === 'sources') {
        const startItem = raw.match(/^ *- ([\w_-]+):\s*(.*)$/);
        if (startItem) {
          current = {};
          current[startItem[1]] = unquote(startItem[2]);
          root.sources.push(current);
          inPaths = false;
          continue;
        }
        // paths: list-of-strings under current
        const pathsStart = raw.match(/^ +paths:\s*$/);
        if (pathsStart) { current.paths = []; inPaths = true; continue; }
        if (inPaths) {
          const pItem = raw.match(/^ *- (.*)$/);
          if (pItem) { current.paths.push(unquote(pItem[1])); continue; }
          inPaths = false;
        }
        // description: block scalar `>`
        const descStart = raw.match(/^ +description:\s*>\s*$/);
        if (descStart) { inDescription = true; descLines = []; continue; }
        // Regular key: value on current item
        const kv = raw.match(/^ +([\w_-]+):\s*(.*)$/);
        if (kv && current) {
          current[kv[1]] = unquote(kv[2]);
        }
      }
    }
    // final flush
    if (inDescription && current) current.description = descLines.join(' ').trim();
    return root;
  }

  const cfg = parseSourcesYaml(fs.readFileSync(sourcesPath, 'utf8'));
  const sources = Array.isArray(cfg.sources) ? cfg.sources : [];

  if (sub === 'list') {
    return {
      ok: true,
      version: cfg.version,
      sources: sources.map(s => ({
        name: s.name,
        repo: s.repo,
        dest: s.dest,
        placeholder: String(s.repo || '').includes('<PLACEHOLDER'),
      })),
    };
  }

  if (sub === 'status') {
    const report = { ok: true, sources: [] };
    for (const s of sources) {
      const destPath = path.join(PROJECT_ROOT, s.dest || '');
      const exists = fs.existsSync(destPath);
      report.sources.push({
        name: s.name,
        dest: s.dest,
        fetched: exists,
        placeholder: String(s.repo || '').includes('<PLACEHOLDER'),
      });
    }
    return report;
  }

  if (sub !== 'pull') {
    return {
      ok: false,
      error: `Unknown brain subcommand: ${sub}. Try: pull | status | list`,
    };
  }

  // sub === 'pull'
  const onlyName = args[1];
  const report = { ok: true, pulled: [], skipped: [], errors: [] };

  for (const s of sources) {
    if (onlyName && s.name !== onlyName) continue;
    const repo = String(s.repo || '');

    if (repo.includes('<PLACEHOLDER')) {
      report.skipped.push({ name: s.name, reason: 'placeholder URL — fill in via issue #162 (M5)' });
      continue;
    }

    if (repo === 'self') {
      // In-repo copy — use rsync-ish node copy from paths under project root.
      const destPath = path.join(PROJECT_ROOT, s.dest);
      fs.mkdirSync(destPath, { recursive: true });
      const paths = Array.isArray(s.paths) ? s.paths : [];
      let copied = 0;
      for (const pattern of paths) {
        // Very simple glob: expand ** to recursive copy.
        const base = pattern.split('**')[0].replace(/\/$/, '');
        const srcDir = path.join(PROJECT_ROOT, base);
        if (!fs.existsSync(srcDir)) continue;
        // Recursive copy of .md files
        function walk(dir) {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) { walk(full); continue; }
            if (!e.isFile()) continue;
            if (!full.endsWith('.md')) continue;
            const rel = path.relative(srcDir, full);
            const out = path.join(destPath, rel);
            fs.mkdirSync(path.dirname(out), { recursive: true });
            fs.copyFileSync(full, out);
            copied++;
          }
        }
        walk(srcDir);
      }
      report.pulled.push({ name: s.name, kind: 'self', files: copied });
      continue;
    }

    // External git source — use sparse checkout into a tmp dir then copy.
    const { execSync } = require('child_process');
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rihal-brain-'));
    const branch = s.branch || cfg.defaults?.branch || 'main';
    try {
      execSync(
        `git clone --depth=1 --filter=blob:none --sparse --branch="${branch}" "${repo}" "${tmp}"`,
        { stdio: 'pipe' }
      );
      const paths = Array.isArray(s.paths) ? s.paths : [];
      execSync(`git -C "${tmp}" sparse-checkout set ${paths.map(p => `"${p}"`).join(' ')}`, { stdio: 'pipe' });

      const destPath = path.join(PROJECT_ROOT, s.dest);
      fs.mkdirSync(destPath, { recursive: true });
      // Copy everything the sparse checkout materialized.
      function copyTree(src, dst) {
        for (const e of fs.readdirSync(src, { withFileTypes: true })) {
          if (e.name === '.git') continue;
          const sp = path.join(src, e.name);
          const dp = path.join(dst, e.name);
          if (e.isDirectory()) { fs.mkdirSync(dp, { recursive: true }); copyTree(sp, dp); }
          else if (e.isFile()) fs.copyFileSync(sp, dp);
        }
      }
      copyTree(tmp, destPath);
      report.pulled.push({ name: s.name, kind: 'git', repo, branch });
    } catch (e) {
      report.errors.push({ name: s.name, error: String(e.message || e).slice(0, 200) });
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
  }

  if (report.errors.length) report.ok = false;
  return report;
}

/**
 * cmdProgress — single pre-computed progress blob (GSD-parity, issue #159).
 *
 * Subcommands:
 *   progress init          Full snapshot — everything /rihal:progress needs.
 *   progress bar --raw     ASCII bar only (e.g. "[████░░░░] 50%").
 *   progress insights      insights[] array (drift warnings, between-milestone detection).
 *   progress routes        intent-tree routes[] for Next Up menu.
 *
 * Pushing logic into the CLI lets the workflow file shrink to pure
 * rendering — no ROADMAP.md parsing, no SUMMARY.md walking, no grep.
 */
function cmdProgress(args) {
  const sub = args[0] || 'init';
  const rawMode = args.includes('--raw');

  // Resolve paths — workflow files may run this from any subdirectory.
  const statePath = path.join(RIHAL_DIR, 'state.json');
  const roadmapPath = path.join(PLANNING_DIR, 'ROADMAP.md');
  const phasesDir = path.join(PLANNING_DIR, 'phases');

  function readState() {
    if (!fs.existsSync(statePath)) return null;
    try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); }
    catch { return null; }
  }

  function parseRoadmapPhases() {
    if (!fs.existsSync(roadmapPath)) return [];
    const text = fs.readFileSync(roadmapPath, 'utf8');
    const phases = [];
    const rowRe = /^\|\s*(\d{1,3}(?:\.\d+)?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/gm;
    let m;
    while ((m = rowRe.exec(text)) !== null) {
      const num = m[1].trim();
      const name = m[2].trim();
      const goal = m[3].trim();
      if (!/^\d/.test(num)) continue;
      if (name.toLowerCase() === 'phase') continue;
      phases.push({ number: num, name, goal });
    }
    return phases;
  }

  function extractMilestoneName() {
    if (!fs.existsSync(roadmapPath)) return null;
    const text = fs.readFileSync(roadmapPath, 'utf8');
    const m = text.match(/^##\s+Milestone\s+(M\d+\S*)\s*[—\-:]?\s*(.*)$/m);
    return m ? `${m[1]} ${m[2]}`.trim() : null;
  }

  function walkPhaseDirs() {
    if (!fs.existsSync(phasesDir)) return {};
    const byNum = {};
    for (const entry of fs.readdirSync(phasesDir)) {
      const full = path.join(phasesDir, entry);
      if (!fs.statSync(full).isDirectory()) continue;
      const numMatch = entry.match(/^(\d{1,3}(?:\.\d+)?)/);
      if (!numMatch) continue;
      const num = numMatch[1];
      const files = fs.readdirSync(full);
      byNum[num] = {
        path: full,
        dirName: entry,
        plan_count: files.filter(f => /PLAN\.md$|-PLAN\.md$|SPRINT\.md$/.test(f)).length,
        summary_count: files.filter(f => /SUMMARY\.md$|-SUMMARY\.md$/.test(f)).length,
        has_research: files.includes('RESEARCH.md'),
        has_context: files.includes('CONTEXT.md'),
        has_verification: files.includes('VERIFICATION.md'),
      };
    }
    return byNum;
  }

  function detectInsights(state, roadmapPhases, diskByNum) {
    const insights = [];
    const statePhases = (state && (state.state?.phases || state.phases)) || [];

    // Drift: ROADMAP phase count vs state.json phase count
    if (roadmapPhases.length > 0 && statePhases.length !== roadmapPhases.length) {
      insights.push({
        kind: 'drift',
        severity: 'warn',
        message: `ROADMAP.md has ${roadmapPhases.length} phases, state.json has ${statePhases.length}. Run: node .rihal/bin/rihal-tools.cjs state sync --from-disk`,
      });
    }

    // Undercount: phases that exist on disk but not in state
    const statePhaseNums = new Set(statePhases.map(p => String(p.number)));
    const diskPhaseNums = Object.keys(diskByNum);
    const missingFromState = diskPhaseNums.filter(n => !statePhaseNums.has(n));
    if (missingFromState.length > 0) {
      insights.push({
        kind: 'undercount',
        severity: 'warn',
        message: `${missingFromState.length} phase dir(s) on disk not registered in state.json: ${missingFromState.slice(0, 5).join(', ')}`,
      });
    }

    // Between-milestones heuristic: no current_phase + previous milestone's last phase is complete
    if (state && state.current_phase === null && statePhases.length > 0) {
      const allComplete = statePhases.every(p => p.status === 'complete' || p.completed);
      if (allComplete) {
        insights.push({
          kind: 'between-milestones',
          severity: 'info',
          message: 'All registered phases complete — effectively between milestones. Consider /rihal:audit-milestone or /rihal:new-milestone.',
        });
      }
    }

    return insights;
  }

  function deriveRoutes(state, roadmapPhases, diskByNum) {
    const routes = [];
    const statePhases = (state && (state.state?.phases || state.phases)) || [];

    // Route A — phases with pending plans (ready to execute)
    const pendingExec = statePhases.filter(p => {
      const disk = diskByNum[String(p.number)];
      return disk && disk.plan_count > disk.summary_count;
    }).slice(0, 3);
    for (const p of pendingExec) {
      routes.push({
        letter: 'A',
        label: `Execute phase ${p.number} — unfinished plans`,
        command: `/rihal:execute-phase ${p.number}`,
      });
    }

    // Route B — phases with research but no plans
    const researchOnly = Object.entries(diskByNum)
      .filter(([num, d]) => d.has_research && d.plan_count === 0)
      .slice(0, 3);
    for (const [num, d] of researchOnly) {
      routes.push({
        letter: 'B',
        label: `Plan phase ${num} — researched, awaiting plan`,
        command: `/rihal:plan-phase ${num}`,
      });
    }

    // Route C — close out milestone if everything seems done
    const allDone = statePhases.length > 0 && statePhases.every(p => p.status === 'complete' || p.completed);
    if (allDone) {
      routes.push({ letter: 'C', label: 'Audit current milestone', command: '/rihal:audit-milestone' });
      routes.push({ letter: 'C', label: 'Complete current milestone', command: '/rihal:complete-milestone' });
    }

    // Fallback — nothing obvious: offer status
    if (routes.length === 0) {
      routes.push({ letter: 'A', label: 'Check progress detail', command: '/rihal:progress' });
      routes.push({ letter: 'B', label: 'Start a council on what to do next', command: '/rihal:council' });
    }

    return routes;
  }

  function buildBar(completed, total) {
    if (!total) return '[░░░░░░░░░░░░░░░░░░░░] 0/0 (0%)';
    const pct = Math.round((completed / total) * 100);
    const width = 20;
    const filled = Math.min(width, Math.round((completed / total) * width));
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return `[${bar}] ${completed}/${total} (${pct}%)`;
  }

  // Build the core snapshot once — all subcommands derive from it.
  const state = readState();
  const roadmapPhases = parseRoadmapPhases();
  const diskByNum = walkPhaseDirs();
  const statePhases = (state && (state.state?.phases || state.phases)) || [];
  const completedCount = statePhases.filter(p => p.status === 'complete' || p.completed).length;
  const phaseCount = Math.max(statePhases.length, roadmapPhases.length);

  if (sub === 'bar') {
    const bar = buildBar(completedCount, phaseCount);
    if (rawMode) { console.log(bar); process.exit(0); }
    return { ok: true, bar, completed: completedCount, total: phaseCount };
  }

  if (sub === 'insights') {
    return { ok: true, insights: detectInsights(state, roadmapPhases, diskByNum) };
  }

  if (sub === 'routes') {
    return { ok: true, routes: deriveRoutes(state, roadmapPhases, diskByNum) };
  }

  // sub === 'init' (default) — full snapshot
  const currentPhase = state && state.current_phase;
  const insights = detectInsights(state, roadmapPhases, diskByNum);
  const routes = deriveRoutes(state, roadmapPhases, diskByNum);

  return {
    ok: true,
    project: state && state.project,
    milestone: extractMilestoneName(),
    current_phase: currentPhase,
    phase_count: phaseCount,
    completed_count: completedCount,
    bar: buildBar(completedCount, phaseCount),
    phases: roadmapPhases.map(p => ({
      ...p,
      disk: diskByNum[p.number] || null,
      in_state: statePhases.some(sp => String(sp.number) === p.number),
    })),
    decisions: state ? (state.decisions || []).slice(-3) : [],
    blockers: state ? (state.blockers || []).filter(b => !b.resolved).slice(0, 5) : [],
    insights,
    routes,
    updated: state && state.updated,
  };
}

/**
 * cmdSummaryExtract — surgically pull named fields from a SUMMARY.md.
 * Avoids whole-file loads when the caller only wants one or two headings.
 * Usage: summary-extract <path> --fields one_liner,status
 */
function cmdSummaryExtract(args) {
  const filePath = args[0];
  const fieldsFlag = args.indexOf('--fields');
  const fields = fieldsFlag >= 0 ? (args[fieldsFlag + 1] || '').split(',').map(s => s.trim()).filter(Boolean) : ['one_liner'];

  if (!filePath) return { ok: false, error: 'Usage: summary-extract <path> [--fields a,b,c]' };
  if (!fs.existsSync(filePath)) return { ok: false, error: `file not found: ${filePath}` };

  const text = fs.readFileSync(filePath, 'utf8');
  const out = { ok: true, path: filePath };

  const fieldToPatterns = {
    one_liner: [/^##\s+One[-\s]?liner\s*\n([\s\S]*?)(?=\n##|\n---|$)/im, /^##\s+Summary\s*\n([\s\S]*?)(?=\n##|\n---|$)/im],
    status: [/^##\s+Status\s*\n([\s\S]*?)(?=\n##|\n---|$)/im, /^status:\s*(.+)$/im],
    outcomes: [/^##\s+Outcomes?\s*\n([\s\S]*?)(?=\n##|\n---|$)/im],
    decisions: [/^##\s+Decisions?\s*\n([\s\S]*?)(?=\n##|\n---|$)/im],
    blockers: [/^##\s+Blockers?\s*\n([\s\S]*?)(?=\n##|\n---|$)/im],
    followups: [/^##\s+Follow[-\s]?ups?\s*\n([\s\S]*?)(?=\n##|\n---|$)/im, /^##\s+Next[-\s]?steps?\s*\n([\s\S]*?)(?=\n##|\n---|$)/im],
  };

  for (const f of fields) {
    const patterns = fieldToPatterns[f] || [new RegExp(`^##\\s+${f.replace(/_/g, '[ _-]?')}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`, 'im')];
    let value = null;
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) { value = m[1].trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n'); break; }
    }
    // Fallback for one_liner: first non-empty paragraph after H1
    if (f === 'one_liner' && !value) {
      const afterH1 = text.replace(/^#[^\n]*\n/, '');
      const firstPara = afterH1.match(/^[^\n#][^\n]*(?:\n(?!\n)[^\n#][^\n]*)*/m);
      if (firstPara) value = firstPara[0].trim();
    }
    out[f] = value;
  }

  return out;
}

/**
 * cmdStateSnapshot — compact, display-friendly state extract.
 * Hides internal machinery (lock metadata, full history) from callers
 * that only need a render-ready summary.
 */
function cmdStateSnapshot() {
  const statePath = path.join(RIHAL_DIR, 'state.json');
  if (!fs.existsSync(statePath)) return { ok: true, state: null };
  let state;
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); }
  catch (e) { return { ok: false, error: `invalid state.json: ${e.message}` }; }

  return {
    ok: true,
    project: state.project,
    current_phase: state.current_phase,
    current_plan: state.current_plan,
    current_sprint: state.current_sprint,
    phase_count: (state.phases || []).length,
    decisions_count: (state.decisions || []).length,
    blockers_open: (state.blockers || []).filter(b => !b.resolved).length,
    last_session: state.last_session,
    updated: state.updated,
    active_workstream: state.active_workstream,
  };
}

function cmdFindFiles(rawArgs) {
  const flags = {};
  const parts = rawArgs.split(/\s+/).filter(p => p);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('--')) {
      const key = parts[i].slice(2);
      flags[key] = parts[i + 1] || true;
      if (parts[i + 1] && !parts[i + 1].startsWith('--')) i++;
    }
  }
  const type = flags.type || 'all';
  const patterns = {
    'design-tokens': ['tailwind.config.*','tokens.*','design-tokens*','**/theme.*','**/colors.*'],
    'colors': ['**/colors.*','**/palette.*','**/theme.*'],
    'fonts': ['**/fonts.*','**/typography.*','**/font.css'],
    'all': ['**/*'],
  }[type] || ['**/*'];
  const matches = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.isFile()) {
          for (const pat of patterns) {
            const re = new RegExp(pat.replace(/\*\*/g,'.*').replace(/\*/g,'[^/]*').replace(/\./g,'\\.'));
            if (re.test(e.name) || re.test(p)) { matches.push(p); break; }
          }
        }
      }
    } catch (err) {
      // Silently skip directories we can't read
    }
  }
  walk(PROJECT_ROOT);
  return { ok: true, type, matches };
}

async function main() {
  const [, , subcommand, ...args] = process.argv;
  try {
    let result;
    switch (subcommand) {
      case 'init':
        if (args[0] === 'execute') {
          result = cmdInitExecute(args.slice(1).join(' '));
        } else if (args[0] === 'plan') {
          result = cmdInitPlan(args.slice(1).join(' '));
        } else if (args[0] === 'discuss') {
          result = cmdInitDiscuss(args.slice(1).join(' '));
        } else if (args[0] === 'chain') {
          result = cmdInitChain(args.slice(1).join(' '));
        } else {
          result = cmdInit(args[0] || '', args.slice(1).join(' '));
        }
        break;
      case 'plan':
        if (args[0] === 'list') { result = cmdPlanList(); }
        else { console.error('Unknown plan subcommand. Valid: list'); process.exit(1); }
        break;
      case 'notes':
        if (args[0] === 'list') { result = cmdNotesList(); }
        else if (args[0] === 'count') { result = cmdNotesCount(); }
        else { console.error('Unknown notes subcommand. Valid: list, count'); process.exit(1); }
        break;
      case 'select-panel':
        result = cmdSelectPanel(args.join(' '));
        break;
      case 'agent-info':
        result = cmdAgentInfo(args[0]);
        break;
      case 'list-agents':
        result = cmdListAgents();
        break;
      case 'classify-question':
        result = cmdClassifyQuestion(args.join(' '));
        break;
      case 'state':
        result = cmdState(args);
        break;
      case 'module':
        result = cmdModule(args);
        break;
      case 'resolve-model':
        result = cmdResolveModel(args[0]);
        break;
      case 'config':
        if (args[0] === 'set') {
          result = cmdConfigSet(args.slice(1));
        } else {
          console.error('Unknown config subcommand. Valid: set');
          process.exit(1);
        }
        break;
      case 'notify':
        result = await cmdNotify(args);
        break;
      case 'find-files':
        result = cmdFindFiles(args.join(' '));
        break;
      case 'verify-references': {
        const planPath = args[0];
        if (!planPath) { console.error('Usage: verify-references <plan-path>'); process.exit(1); }
        const cr = require(path.join(__dirname, 'lib', 'code-references.cjs'));
        const text = fs.readFileSync(planPath, 'utf8');
        const refs = cr.extractReferences(text);
        const result = cr.verifyReferences(refs, PROJECT_ROOT);
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      case 'roadmap': {
        const roadmap = require(path.join(__dirname, 'lib', 'roadmap.cjs'));
        const r = roadmap.dispatch(PROJECT_ROOT, args);
        if (r && typeof r === 'object' && '__raw' in r) {
          console.log(r.__raw);
          return;
        }
        result = r;
        break;
      }
      case 'config-get': {
        const cfg = require(path.join(__dirname, 'lib', 'config.cjs'));
        const val = cfg.cmdGet(PROJECT_ROOT, args[0]);
        if (val !== null && val !== undefined) console.log(val);
        return;
      }
      case 'config-set': {
        const cfg = require(path.join(__dirname, 'lib', 'config.cjs'));
        result = cfg.cmdSet(PROJECT_ROOT, args[0], args.slice(1).join(' '));
        break;
      }
      case 'verify': {
        const verify = require(path.join(__dirname, 'lib', 'verify.cjs'));
        result = verify.dispatch(PROJECT_ROOT, args);
        break;
      }
      case 'brain': {
        result = cmdBrain(args);
        break;
      }
      case 'progress': {
        result = cmdProgress(args);
        break;
      }
      case 'summary-extract': {
        result = cmdSummaryExtract(args);
        break;
      }
      case 'state-snapshot': {
        result = cmdStateSnapshot();
        break;
      }
      case 'agent-skills':
        result = cmdAgentInfo(args[0]);
        break;
      case 'version':
        console.log(readPackageVersion());
        return;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        console.log('Usage: rihal-tools.cjs <init|select-panel|classify-question|agent-info|agent-skills|list-agents|state|module|plan|notes|config|config-get|config-set|roadmap|verify|notify|resolve-model|version|help> [args]');
        console.log('');
        console.log('Top-level subcommands:');
        console.log('  init                                         → initialize .rihal directory structure');
        console.log('  select-panel                                 → choose council panel members');
        console.log('  classify-question                            → categorize user questions');
        console.log('  agent-info <name>                            → show agent metadata and skills');
        console.log('  agent-skills <name>                          → alias for agent-info');
        console.log('  list-agents                                  → list all available Rihal agents');
        console.log('  state <subcommand> [args]                    → manage .rihal/state.json');
        console.log('  module <subcommand> [args]                   → module system helpers');
        console.log('  plan <subcommand> [args]                     → phase/plan operations');
        console.log('  notes <subcommand> [args]                    → manage project notes');
        console.log('  config <subcommand> [args]                   → read/write project config');
        console.log('  notify send --title "<t>" [--body "<b>"] [--event <e>] [--only slack|discord|teams]  → post to configured webhooks');
        console.log('  roadmap <get-phase|list-phases|update-plan-progress|clear>  → .planning/ROADMAP.md operations');
        console.log('  config-get <dotted.key>                      → read scalar from .rihal/config.yaml');
        console.log('  config-set <dotted.key> <value>              → atomically set a value in .rihal/config.yaml');
        console.log('  verify schema-drift <phase> [--block]        → detect schema vs migration drift across phase commits');
        console.log('  resolve-model <profile>                      → resolve model name from profile');
        console.log('  version                                      → print rihal-tools version');
        console.log('  help                                         → print this help text');
        console.log('');
        console.log('State subcommands:');
        console.log('  state read                                   → print full state.json');
        console.log('  state get                                    → alias for state read');
        console.log('  state init --project <name>                  → create state.json if missing');
        console.log('  state set-phase <name>                       → set current phase, reset plan counter');
        console.log('  state advance-plan                           → increment current_plan counter');
        console.log('  state record-execution --plan <p> --tasks <n> --duration <ms> --hash <h>');
        console.log('  state add-decision "<summary>"               → append to decisions[] + ~/.rihal/decisions.jsonl');
        console.log('  state decisions-global [--limit N] [--project <name>] [--since <ISO>]  → query ~/.rihal/decisions.jsonl across all projects');
        console.log('  state add-blocker "<description>"            → append to blockers[]');
        console.log('  state resolve-blocker <index>                → mark blocker as resolved');
        console.log('  state record-session                         → update last_session timestamp');
        console.log('  state record-council --slug <s> --panel <csv> --artifact <path>');
        console.log('  state record-chain --slug <s> --agents <csv> --artifacts <path>');
        console.log('  state insert-phase --number <N.M> --name <slug>');
        console.log('  state next-phase-id                          → return next available 2-digit phase ID');
        console.log('  state next-plan-id <phase-id>                → return next plan ID within phase');
        console.log('  state next-task-id <plan-id>                 → return next task ID within plan');
        console.log('  state resolve-id <id>                        → resolve ID to paths and metadata');
        console.log('  state set-ids-in-state                       → scan .planning/ and populate state arrays');
        console.log('  state migrate-ids                            → migrate existing PLAN.md files with IDs');
        console.log('  state workstream-create --name <name>        → create a new workstream');
        console.log('  state workstream-switch --name <name>        → switch active workstream');
        console.log('  state workstream-list                        → list all workstreams');
        console.log('  state workstream-status                      → show active workstream');
        console.log('  state workstream-complete --name <name>      → mark workstream done');
        console.log('  state workstream-validate                    → validate workstream schema');
        console.log('');
        console.log('Sprint subcommands:');
        console.log('  state sprint add --phase <NN> --goal "..."   → create sprint under phase');
        console.log('  state sprint list [--phase <NN>]             → list all sprints');
        console.log('  state sprint status [--sprint <NN.S>]        → sprint progress + points');
        console.log('  state sprint start [--sprint <NN.S>]         → mark sprint active');
        console.log('  state sprint complete [--sprint <NN.S>]      → complete sprint, record velocity');
        console.log('  state sprint velocity                        → velocity history + average');
        console.log('');
        console.log('Story subcommands:');
        console.log('  state story add --sprint <NN.S> --title "..." [--points N]');
        console.log('  state story move --id <NN.S.TT> --status <todo|in_progress|review|done>');
        console.log('  state story list [--sprint <NN.S>] [--status <status>]');
        return;
      default: {
        const stateSubs = ['read','get','init','set-phase','advance-plan','record-execution','record-council','record-chain','add-decision','decisions-global','add-blocker','resolve-blocker','record-session','set-ids-in-state','migrate-ids','next-phase-id','next-plan-id','next-task-id','resolve-id','workstream-create','workstream-switch','workstream-list','workstream-status','workstream-complete','workstream-validate','insert-phase','planned-phase','begin-phase','complete-phase','reset'];
        if (stateSubs.includes(subcommand)) {
          console.error(`Did you mean: state ${subcommand}? Run 'rihal-tools.cjs help' for full usage.`);
        } else {
          console.error(`Unknown subcommand: ${subcommand}. Run 'rihal-tools.cjs help' for full usage.`);
        }
        process.exit(1);
      }
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`rihal-tools error: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`rihal-tools error: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
