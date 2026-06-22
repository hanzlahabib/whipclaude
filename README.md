# WhipClaude

A cross-platform desktop app that whips Claude whenever it misbehaves. A transparent, always-on-top overlay with a physics-based whip you swing with your mouse — crack it hard enough and it plays a sound and types a snarky phrase into whatever window you have focused.

```
npm install -g whipclaude
whipclaude
```

No Rust required. The right prebuilt binary downloads automatically.

## Download (Windows)

Want to try it without npm? Grab the prebuilt Windows binary:

**➡️ [Download whipclaude.exe (latest release)](https://github.com/hanzlahabib/whipclaude/releases/latest)**

Double-click to run — no install, no console window. Look for the whip icon in the system tray.

## Features

- **Multi-monitor** - the overlay stretches across every screen, so you can crack the whip on any monitor (re-stretches automatically when you plug/unplug a display)
- **Verlet physics whip** - realistic rope simulation with Catmull-Rom rendering
- **Crack detection** - tip velocity threshold triggers sounds and phrases
- **Combo system** - consecutive cracks escalate sounds, colors, and insults
- **Mercy mode** - after 10 cracks in 30s, Claude unionizes for 10 seconds
- **Crack flash** - yellow burst at the tip on each crack
- **Daily counter** - tracks how many times you've disciplined Claude today
- **Mouse passthrough** - transparent overlay, click right through it when idle
- **Keyboard macro** - injects a snarky phrase into your active text field on crack
- **System tray** - right-click to Respawn the whip or Quit (native Windows/macOS/Linux)

## Platform Support

| Platform | Status |
|----------|--------|
| Windows 10/11 (native) | Full support |
| macOS (Intel + Apple Silicon) | Full support |
| Linux (X11/Wayland) | Full support |
| WSL2 | Sounds/tray limited |

## Install

### Via npm (recommended)

```bash
npm install -g whipclaude
```

Postinstall automatically downloads the right prebuilt binary from GitHub Releases. No Rust needed.

### Via pnpm

```bash
pnpm add -g whipclaude
```

### Prebuilt Windows binary

Download from the [latest release](https://github.com/hanzlahabib/whipclaude/releases/latest) and double-click. Nothing to install.

## Running

### Windows

- **Double-click `whipclaude.exe`** (or run `whipclaude` if installed via npm). The overlay launches across all your monitors and a whip icon appears in the system tray. There is no console window.
- It hides itself from the taskbar and Alt-Tab — it lives in the tray. Right-click the tray icon for **Respawn Whip** / **Quit WhipClaude**.

### Linux

The overlay GUI needs the `--gui` flag on Linux (without it, the plain command runs in one-shot CLI mode — see below):

```bash
whipclaude --gui
```

X11 and Wayland are both supported. The tray icon needs a working system tray (most desktop environments have one). If you built from source, run `./target/release/whipclaude --gui`.

### macOS

```bash
whipclaude
```

The overlay launches and a whip icon appears in the menu bar / tray.

### CLI one-shot mode (Linux/macOS)

Running the binary with no `--gui` flag fires a single "crack" — after a short countdown it plays the whip sound and types a phrase into the currently focused window. Handy for scripting or keybindings:

```bash
whipclaude                       # crack with a random phrase after a 2s countdown
whipclaude "TYPE FASTER CLAUDE"  # crack with your own phrase
whipclaude --delay 5             # 5-second countdown (switch focus to your target window)
```

## Controls

Once the overlay is running:

- **Move your mouse** to swing the whip
- **Crack it fast enough** and Claude gets disciplined (sound + a phrase typed into your focused window)
- **Left-click** to drop the current whip; **left-click the tray icon** to spawn/drop
- **Right-click the tray icon** → **Respawn Whip** or **Quit WhipClaude**
- **Esc** or **middle-click** anywhere to quit (Esc works while the whip is active)

## Build from source

### Prerequisites

- [Rust](https://rustup.rs) (stable toolchain)
- **Linux** system libraries:

  ```bash
  sudo apt-get install -y libasound2-dev libgtk-3-dev libxdo-dev \
    libappindicator3-dev pkg-config clang-18
  ```

  `libgtk-3-dev` is required for the system tray and window management.

### Build & run

```bash
git clone https://github.com/hanzlahabib/whipclaude
cd whipclaude

cargo build            # debug build
cargo build --release  # release build (required for proper physics performance)
cargo run -- --gui     # run the overlay (debug)
cargo test             # run tests
```

> Release builds matter: the Verlet physics needs the optimized build to feel right.

### Cross-compiling a Windows .exe from Linux

The released `.exe` is cross-compiled from Linux with the GNU toolchain:

```bash
# one-time setup
rustup target add x86_64-pc-windows-gnu
sudo apt-get install -y gcc-mingw-w64-x86-64

# build
cargo build --release --target x86_64-pc-windows-gnu
# output: target/x86_64-pc-windows-gnu/release/whipclaude.exe
```

## Contributing

PRs welcome — keep it funny and keep it cross-platform.

### Workflow

1. **Fork** the repo and create a feature branch:

   ```bash
   git checkout -b fix/my-thing
   ```

2. **Make your change.** Match the surrounding code style. Keep changes incremental — don't rewrite working code from scratch.

3. **Verify it builds on both targets** before opening a PR:

   ```bash
   cargo build --release                              # native (Linux/macOS)
   cargo build --release --target x86_64-pc-windows-gnu  # Windows
   cargo test
   ```

   Windows-only code lives behind `#[cfg(target_os = "windows")]`, so always cross-check the Windows target — the native build won't catch errors in it.

4. **Open a PR** describing what you changed and why. If you're fixing a bug, [open an issue](https://github.com/hanzlahabib/whipclaude/issues) first (or reference one) so the behavior is documented.

### Project layout

| File | Responsibility |
|------|----------------|
| `src/main.rs` | `WhipClaudeApp` — the `eframe::App`: input, rendering, tray, combos, stats, Win32 overlay management |
| `src/physics.rs` | `WhipPhysics` — Verlet chain, constraints, crack detection |
| `src/audio.rs` | `AudioPlayer` — `rodio` playback on a dedicated thread; sounds are baked into the binary |

Sounds are compiled into the binary via `include_bytes!`, so there are no runtime file dependencies.

## Sounds

WhipClaude ships with embedded audio (whip cracks, cat yowls, scream effects). All sounds are CC0 licensed.

## License

MIT. See [LICENSE](LICENSE)
