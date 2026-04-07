#!/usr/bin/env node
/**
 * postinstall.js
 *
 * 1. Try to download a prebuilt binary from GitHub Releases (fast, no Rust needed)
 * 2. Fall back to `cargo build --release` if no prebuilt exists yet
 */

const { spawnSync } = require('child_process');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ROOT    = path.join(__dirname, '..');
const REPO    = 'hanzlahabib/whipclaude';
const isWin   = os.platform() === 'win32';
const isMac   = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';
const BIN     = path.join(ROOT, 'target', 'release', isWin ? 'whipclaude.exe' : 'whipclaude');

function log(msg)  { console.log('\x1b[36m' + msg + '\x1b[0m'); }
function warn(msg) { console.warn('\x1b[33m⚠  ' + msg + '\x1b[0m'); }
function run(cmd)  { return spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: ROOT }); }

// ── Already built? Done. ──────────────────────────────────────────────────────
if (fs.existsSync(BIN)) {
  log('✅ WhipClaude already installed.');
  process.exit(0);
}

// ── Detect platform artifact name ─────────────────────────────────────────────
function artifactName() {
  const arch = os.arch(); // x64, arm64
  if (isWin)   return `whipclaude-win32-${arch}.exe`;
  if (isMac)   return `whipclaude-darwin-${arch}`;
  if (isLinux) return `whipclaude-linux-${arch}`;
  return null;
}

// ── Download helper ───────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'whipclaude-installer' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          get(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

async function tryPrebuilt() {
  const artifact = artifactName();
  if (!artifact) return false;

  // Get latest release tag from GitHub API
  const apiUrl = `https://api.github.com/repos/${REPO}/releases/latest`;
  const tag = await new Promise((resolve) => {
    https.get(apiUrl, { headers: { 'User-Agent': 'whipclaude-installer' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.tag_name || null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });

  if (!tag) return false;

  const url = `https://github.com/${REPO}/releases/download/${tag}/${artifact}`;
  log(`⬇️  Downloading prebuilt binary (${tag})...`);

  const tmpPath = path.join(os.tmpdir(), artifact);
  try {
    await download(url, tmpPath);
    fs.mkdirSync(path.dirname(BIN), { recursive: true });
    fs.copyFileSync(tmpPath, BIN);
    if (!isWin) fs.chmodSync(BIN, 0o755);
    fs.unlinkSync(tmpPath);
    log(`✅ WhipClaude installed!\n\nRun it: whipclaude\n`);
    return true;
  } catch (e) {
    warn(`Prebuilt download failed: ${e.message}`);
    return false;
  }
}

async function buildFromSource() {
  const hasCargo = spawnSync('cargo', ['--version'], { shell: true, stdio: 'pipe' }).status === 0;
  if (!hasCargo) {
    warn('No prebuilt binary available and Rust/cargo not found.');
    console.log('\nInstall Rust: https://rustup.rs  then re-run: npm install -g whipclaude\n');
    process.exit(0);
  }

  log('🦀 No prebuilt binary found — building from source (~2 min)...');

  if (isLinux) {
    const deps = ['libasound2-dev','libgtk-3-dev','libxdo-dev','libappindicator3-dev','pkg-config','clang-18'];
    const missing = deps.filter(d => spawnSync('dpkg',['-s',d],{shell:true,stdio:'pipe'}).status !== 0);
    if (missing.length) {
      log(`📦 Installing system deps: ${missing.join(' ')}`);
      if (run(`sudo apt-get install -y ${missing.join(' ')}`).status !== 0) {
        warn(`Please install manually:\n  sudo apt-get install -y ${missing.join(' ')}`);
        process.exit(1);
      }
      if (!fs.existsSync('/usr/local/bin/clang')) {
        run('sudo ln -sf /usr/bin/clang-18 /usr/local/bin/clang');
        run('sudo ln -sf /usr/bin/clang++-18 /usr/local/bin/clang++');
      }
    }
  }

  if (run('cargo build --release').status !== 0) {
    warn('Build failed. See errors above.');
    process.exit(1);
  }

  log(`✅ WhipClaude built!\n\nRun it: whipclaude\n`);
}

(async () => {
  const downloaded = await tryPrebuilt();
  if (!downloaded) await buildFromSource();
})();
