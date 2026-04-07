# WhipClaude

A cross-platform desktop app that whips Claude whenever it misbehaves. Physics-based whip simulation with crack sounds, combo system, mercy mode, and viral features.

```
npm install -g whipclaude
whipclaude
```

No Rust required. The right prebuilt binary downloads automatically.

## Features

- **Verlet physics whip** - realistic rope simulation with Catmull-Rom rendering
- **Crack detection** - tip velocity threshold triggers sounds and phrases
- **Combo system** - consecutive cracks escalate sounds, colors, and insults
- **Mercy mode** - after 10 cracks in 30s, Claude unionizes for 10 seconds
- **Crack flash** - yellow burst at tip on each crack
- **Daily counter** - tracks how many times you've disciplined Claude today
- **Mouse passthrough** - transparent overlay, click right through when idle
- **Keyboard macro** - injects a snarky phrase into your active text field on crack
- **System tray** - right-click to spawn/quit (native Windows/macOS)

## Platform Support

| Platform | Status |
|----------|--------|
| Windows 10/11 (native) | ✅ Full support |
| macOS (Intel + Apple Silicon) | ✅ Full support |
| Linux (X11/Wayland) | ✅ Full support |
| WSL2 | ⚠️ Sounds/tray limited |

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

### Build from source

Requires [Rust](https://rustup.rs) and on Linux:

```bash
sudo apt-get install -y libasound2-dev libgtk-3-dev libxdo-dev libappindicator3-dev pkg-config clang-18
```

Then:

```bash
git clone https://github.com/hanzlahabib/whipclaude
cd whipclaude
cargo build --release
./target/release/whipclaude
```

## Usage

```
whipclaude          # launch (spawns whip immediately)
```

- Move your mouse to swing the whip
- Crack it fast enough and Claude gets disciplined
- Right-click tray icon → Spawn Whip / Quit

## Sounds

WhipClaude ships with embedded audio (whip cracks, cat yowls, scream effects). All sounds are CC0 licensed.

## Contributing

PRs welcome. Please:
- Keep it funny
- Keep it cross-platform
- No crypto miners (see [#3](https://github.com/hanzlahabib/whipclaude/issues/3))
- Stream deck integration welcome (see [#2](https://github.com/hanzlahabib/whipclaude/issues/2))

## License

MIT — see [LICENSE](LICENSE)
