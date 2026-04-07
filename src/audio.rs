use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;

// ── Sound categories ──────────────────────────────────────────────────────────
//
// All sounds are baked into the binary via include_bytes!.
// To add a sound: drop the file in assets/sounds/, add an entry below, recompile.
//
// DOWNLOAD INSTRUCTIONS (all CC0 — no attribution required):
//
// WHIP SOUNDS:
//   whip_scifi.m4a  ← CC0 freesound #529925 by SciFiSounds
//     https://freesound.org/people/SciFiSounds/sounds/529925/
//
// CAT SCREAMS (Tom-style):
//   cat_queen.wav   ← CC0 freesound #222590 by queen_westeros
//     https://freesound.org/people/queen_westeros/sounds/222590/
//   cat_storm.aiff  ← CC0 freesound #191938 by StormMiguel
//     https://freesound.org/people/StormMiguel/sounds/191938/
//   cat_sadique.wav ← CC0 freesound #766726 by Sadiquecat
//     https://freesound.org/people/Sadiquecat/sounds/766726/
//
// OW / REACTION SOUNDS:
//   yeowch.mp3      ← CC0 freesound #699910 by doctorsex (Tom & Jerry yelp pack)
//     https://freesound.org/people/doctorsex/sounds/699910/
//   ouchie.mp3      ← CC0 freesound #332451 by ryandeschamps
//     https://freesound.org/s/332451/download/332451__ryandeschamps__ouchie.mp3
//   cartoon_scream.wav ← CC0 freesound #416840 by tonsil5 ("Kindof loony!")
//     https://freesound.org/people/tonsil5/sounds/416840/
//   comical_scream.wav ← CC0 freesound #577972 by Boxwell
//     https://freesound.org/people/Boxwell/sounds/577972/
//   weirdo_scream.wav  ← CC0 freesound #353086 by GreatNate98
//     https://freesound.org/people/GreatNate98/sounds/353086/

// Whip crack sounds — kept in one bank so the original A–E still work
static WHIP_SOUNDS: &[&[u8]] = &[
    include_bytes!("../assets/sounds/A.mp3"),
    include_bytes!("../assets/sounds/B.mp3"),
    include_bytes!("../assets/sounds/C.mp3"),
    include_bytes!("../assets/sounds/D.mp3"),
    include_bytes!("../assets/sounds/E.mp3"),
    // ↓ Add newly downloaded whip sounds here, e.g.:
    // include_bytes!("../assets/sounds/whip_scifi.m4a"),
];

// Cat / cartoon scream sounds — Tom-style yowls
// ↓ Uncomment after downloading the files listed above
static CAT_SOUNDS: &[&[u8]] = &[
    // include_bytes!("../assets/sounds/cat_queen.wav"),
    // include_bytes!("../assets/sounds/cat_storm.aiff"),
    // include_bytes!("../assets/sounds/cat_sadique.wav"),

    // Fallback to whip sounds until cat files are downloaded
    include_bytes!("../assets/sounds/A.mp3"),
];

// "Ow / yeowch" reaction sounds
// ↓ Uncomment after downloading
static OW_SOUNDS: &[&[u8]] = &[
    // include_bytes!("../assets/sounds/yeowch.mp3"),
    // include_bytes!("../assets/sounds/ouchie.mp3"),
    // include_bytes!("../assets/sounds/cartoon_scream.wav"),
    // include_bytes!("../assets/sounds/comical_scream.wav"),
    // include_bytes!("../assets/sounds/weirdo_scream.wav"),

    // Fallback until ow files are downloaded
    include_bytes!("../assets/sounds/B.mp3"),
];

// ── Category enum ─────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq)]
pub enum SoundCategory {
    /// Only sharp whip crack sounds
    WhipOnly,
    /// Only cat / cartoon screams
    CatOnly,
    /// Only "ow/yeowch" reactions
    OwOnly,
    /// Randomly pick any category each crack (default — most fun)
    Random,
}

// ── Player ────────────────────────────────────────────────────────────────────

pub struct AudioPlayer {
    pub category: SoundCategory,
    /// Master volume, 0.0–2.0  (1.0 = unity gain)
    pub volume: f32,
}

impl Default for AudioPlayer {
    fn default() -> Self {
        Self {
            category: SoundCategory::Random,
            volume: 1.0,
        }
    }
}

impl AudioPlayer {
    pub fn new() -> Self {
        Self::default()
    }

    /// Play a random sound, respecting the current category setting.
    pub fn play_random(&self) {
        let bank = self.pick_bank();
        if bank.is_empty() {
            return;
        }
        let idx = (rand::random::<u32>() as usize) % bank.len();
        let data = bank[idx].to_vec();
        let vol = self.volume;
        std::thread::spawn(move || {
            let Ok((_stream, handle)) = OutputStream::try_default() else {
                return;
            };
            let Ok(sink) = Sink::try_new(&handle) else {
                return;
            };
            sink.set_volume(vol);
            let cursor = Cursor::new(data);
            let Ok(dec) = Decoder::new(cursor) else {
                return;
            };
            sink.append(dec);
            sink.sleep_until_end();
        });
    }

    /// Play from a specific category, ignoring the global setting.
    pub fn play_from(&self, category: SoundCategory) {
        let bank = Self::bank_for(category);
        if bank.is_empty() {
            return;
        }
        let idx = (rand::random::<u32>() as usize) % bank.len();
        let data = bank[idx].to_vec();
        let vol = self.volume;
        std::thread::spawn(move || {
            let Ok((_stream, handle)) = OutputStream::try_default() else {
                return;
            };
            let Ok(sink) = Sink::try_new(&handle) else {
                return;
            };
            sink.set_volume(vol);
            let cursor = Cursor::new(data);
            let Ok(dec) = Decoder::new(cursor) else {
                return;
            };
            sink.append(dec);
            sink.sleep_until_end();
        });
    }

    // ── internals ─────────────────────────────────────────────────────────────

    fn pick_bank(&self) -> &'static [&'static [u8]] {
        match self.category {
            SoundCategory::WhipOnly => WHIP_SOUNDS,
            SoundCategory::CatOnly => CAT_SOUNDS,
            SoundCategory::OwOnly => OW_SOUNDS,
            SoundCategory::Random => {
                // 40 % whip, 30 % cat, 30 % ow  — tuned to feel natural
                match rand::random::<u32>() % 10 {
                    0..=3 => WHIP_SOUNDS,
                    4..=6 => CAT_SOUNDS,
                    _ => OW_SOUNDS,
                }
            }
        }
    }

    fn bank_for(category: SoundCategory) -> &'static [&'static [u8]] {
        match category {
            SoundCategory::WhipOnly | SoundCategory::Random => WHIP_SOUNDS,
            SoundCategory::CatOnly => CAT_SOUNDS,
            SoundCategory::OwOnly => OW_SOUNDS,
        }
    }
}
