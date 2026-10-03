/**
 * Config — dotted-path get/set for .rihal/config.yaml.
 *
 * Supports single-level nested YAML (e.g. `workflow:\n  discuss_mode: adaptive`)
 * in addition to flat `key: value`. Stdlib-only.
 */

const fs = require('fs');
const path = require('path');

function configPathFor(projectRoot) {
  return path.join(projectRoot, '.rihal', 'config.yaml');
}

/** Parse YAML text into a nested object. Supports one level of indentation. */
function parseNestedYaml(text) {
  const out = {};
  const lines = text.split('\n');
  let currentSection = null;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\s+$/, '');
    if (!line.trim()) continue;

    const indent = line.match(/^\s*/)[0].length;
    const colonAt = line.indexOf(':');
    if (colonAt === -1) continue;

    const key = line.slice(indent, colonAt).trim();
    let val = line.slice(colonAt + 1).trim();

    if (indent === 0) {
      if (val === '') {
        // Section header
        currentSection = key;
        out[key] = {};
      } else {
        currentSection = null;
        out[key] = stripQuotes(val);
      }
    } else if (currentSection) {
      if (typeof out[currentSection] !== 'object' || out[currentSection] === null) {
        out[currentSection] = {};
      }
      out[currentSection][key] = stripQuotes(val);
    }
  }
  return out;
}

function stripQuotes(v) {
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  return v;
}

function serialise(config) {
  const lines = [];
  // Emit scalar keys first, then sections (mimics common YAML convention).
  const scalars = [];
  const sections = [];
  for (const [k, v] of Object.entries(config)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) sections.push([k, v]);
    else scalars.push([k, v]);
  }
  for (const [k, v] of scalars) {
    lines.push(`${k}: ${quoteIfNeeded(v)}`);
  }
  for (const [k, v] of sections) {
    lines.push(`${k}:`);
    for (const [sk, sv] of Object.entries(v)) {
      lines.push(`  ${sk}: ${quoteIfNeeded(sv)}`);
    }
  }
  return lines.join('\n') + '\n';
}

function quoteIfNeeded(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[\s:#]/.test(s) && !(s.startsWith('"') && s.endsWith('"'))) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function getAt(config, dottedKey) {
  const parts = String(dottedKey).split('.');
  let cur = config;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function setAt(config, dottedKey, value) {
  const parts = String(dottedKey).split('.');
  let cur = config;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null || Array.isArray(cur[p])) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * config-get <dotted.key>
 * Prints scalar directly (no JSON). Empty output + exit 0 if missing.
 * Returns a string (or null for missing) the caller should print with console.log
 * WITHOUT JSON-wrapping.
 */
function cmdGet(projectRoot, dottedKey) {
  if (!dottedKey) throw new Error('Usage: config-get <dotted.key>');
  const cp = configPathFor(projectRoot);
  if (!fs.existsSync(cp)) return null;
  const config = parseNestedYaml(fs.readFileSync(cp, 'utf8'));
  const val = getAt(config, dottedKey);
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function cmdSet(projectRoot, dottedKey, value) {
  if (!dottedKey) throw new Error('Usage: config-set <dotted.key> <value>');
  if (value === undefined) throw new Error('Usage: config-set <dotted.key> <value>');
  const cp = configPathFor(projectRoot);
  fs.mkdirSync(path.dirname(cp), { recursive: true });
  const existing = fs.existsSync(cp) ? fs.readFileSync(cp, 'utf8') : '';
  const config = parseNestedYaml(existing);
  setAt(config, dottedKey, value);
  const out = serialise(config);
  const tmp = cp + '.tmp';
  fs.writeFileSync(tmp, out, 'utf8');
  fs.renameSync(tmp, cp);
  return { ok: true, key: dottedKey, value, path: cp };
}

module.exports = {
  cmdGet,
  cmdSet,
  parseNestedYaml,
  serialise,
};
