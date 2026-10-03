# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cargo build              # debug build
cargo build --release    # release build (required for proper physics performance)
cargo run                # run in debug mode
cargo test               # run tests
```

**Linux system dependencies:**
```bash
sudo apt install libgtk-3-dev   # required for system tray and window management
```

## Architecture

WhipClaude is a Rust desktop overlay app that renders a physics-simulated whip on top of all windows and types phrases into the focused window when the whip cracks.

### Crates
- `eframe`/`egui` — transparent, always-on-top, click-through overlay window
- `rodio` — audio playback (sounds baked into binary via `include_bytes!`)
- `enigo` — OS-level keyboard input simulation
- `tray-icon` — system tray icon

### Key Modules

**`src/main.rs` — `WhipClaudeApp`**
Implements `eframe::App`. Owns the physics, audio player, tray icon, Mercy Mode state, combo counter, and daily stats. Each frame: reads mouse input → updates physics → checks for crack → triggers visual flash + audio + typed phrase if cracked. Renders whip as Catmull-Rom splines over the raw physics points.

**`src/physics.rs` — `WhipPhysics`**
Verlet integration chain of 28 segments with length/bending constraints. Crack detection: if the tip segment velocity exceeds `CRACK_SPEED` (180.0 units/frame), returns `true` to the caller.

**`src/audio.rs` — `AudioPlayer`**
Wraps `rodio` behind an `mpsc` channel on a dedicated thread so audio never blocks the render loop. Sounds are compiled into the binary — no runtime file dependencies.

### Crack Event Flow
Mouse move → `WhipPhysics::update()` → crack detected → parallel:
1. Visual flash + combo increment (`main.rs`)
2. `AudioPlayer` channel message (whip crack or cat scream sound)
3. Spawned thread using `enigo` types a random phrase + `Enter` into the focused window
