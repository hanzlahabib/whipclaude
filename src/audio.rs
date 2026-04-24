use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use std::sync::mpsc;

// ── Sound banks (baked into binary) ──────────────────────────────────────────

static WHIP_SOUNDS: &[&[u8]] = &[
    include_bytes!("../assets/sounds/A.mp3"),
    include_bytes!("../assets/sounds/B.mp3"),
    include_bytes!("../assets/sounds/C.mp3"),
    include_bytes!("../assets/sounds/D.mp3"),
    include_bytes!("../assets/sounds/E.mp3"),
];


// ── Category enum ─────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq)]
pub enum SoundCategory {
    WhipOnly,
}

// ── Synchronous one-shot play for CLI mode ────────────────────────────────────

pub fn play_crack_sync() {
    let bank = WHIP_SOUNDS;
    if bank.is_empty() { return; }
    let idx = (rand::random::<u32>() as usize) % bank.len();
    let data = bank[idx].to_vec();

    let Ok((_stream, handle)) = OutputStream::try_default() else { return };
    let Ok(sink) = Sink::try_new(&handle) else { return };
    sink.set_volume(1.0);
    let cursor = Cursor::new(data);
    let Ok(dec) = Decoder::new(cursor) else { return };
    sink.append(dec);
    sink.sleep_until_end(); // block until sound finishes
}

// ── Player — keeps a persistent audio thread so OutputStream stays alive ──────

pub struct AudioPlayer {
    sender: mpsc::Sender<Vec<u8>>,
}

impl AudioPlayer {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Vec<u8>>();

        std::thread::spawn(move || {
            // Keep OutputStream alive for the entire app lifetime
            let Ok((_stream, handle)) = OutputStream::try_default() else {
                return;
            };

            for data in rx {
                let Ok(sink) = Sink::try_new(&handle) else { continue };
                sink.set_volume(1.0);
                let cursor = Cursor::new(data);
                let Ok(dec) = Decoder::new(cursor) else { continue };
                sink.append(dec);
                sink.detach(); // play without blocking the channel
            }
        });

        Self { sender: tx }
    }

    pub fn play_from(&self, category: SoundCategory) {
        let bank = Self::bank_for(category);
        if bank.is_empty() { return; }
        let idx = (rand::random::<u32>() as usize) % bank.len();
        let data = bank[idx].to_vec();
        let _ = self.sender.send(data);
    }

    fn bank_for(_category: SoundCategory) -> &'static [&'static [u8]] {
        WHIP_SOUNDS
    }
}
