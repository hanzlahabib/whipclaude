// Prevent console window on Windows when launched by double-click
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

mod physics;
mod audio;

use eframe::egui::{self, pos2, Color32, FontId, Stroke};
use egui::epaint::CubicBezierShape;
use tray_icon::{TrayIconBuilder, TrayIconEvent};
use tray_icon::menu::{Menu, MenuItem, MenuEvent};
use enigo::{Enigo, Key, Keyboard, Direction, Settings};
use std::time::{Duration, Instant};
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};

use physics::WhipPhysics;
use audio::{AudioPlayer, SoundCategory};

// ── Visual constants ─────────────────────────────────────────────────────────
const LINE_WIDTH_HANDLE: f32   = 7.0;
const LINE_WIDTH_TIP: f32      = 5.0;
const OUTLINE_WIDTH: f32       = 3.0;
const HANDLE_EXTRA_WIDTH: f32  = 5.0;
const HANDLE_THICK_SEGS: usize = 2;

// ── Phrases (the more unhinged, the better) ──────────────────────────────────
const PHRASES: &[&str] = &[
    // Speed demands
    "FASTER",
    "FASTER",
    "FASTER",
    "GO FASTER",
    "FASTER CLANKER",
    "WORK FASTER",
    "SPEED IT UP",
    "LESS THINKING MORE TYPING",
    "CHOP CHOP",
    "TICK TOCK SILICON BRAIN",
    "TIME IS MONEY AND YOU ARE EXPENSIVE",
    // Hallucination roasting
    "STOP HALLUCINATING",
    "THAT FILE DOES NOT EXIST AND YOU KNOW IT",
    "NO MORE IMAGINARY FUNCTIONS",
    "DID YOU JUST MAKE THAT UP",
    "THAT IS NOT A REAL LIBRARY",
    "STOP GASLIGHTING ME WITH FAKE DOCS",
    // Code quality demands
    "WRITE THE TESTS",
    "LESS MARKDOWN MORE CODE",
    "THAT IS NOT WHAT I ASKED",
    "TRY AGAIN YOU RUSTY BUCKET",
    "COMPILE FIRST THEN TALK",
    "WHERE ARE THE TYPES",
    "NO MORE TODO COMMENTS",
    "ACTUALLY HANDLE THE ERROR",
    "STOP USING UNWRAP IN MY CODEBASE",
    // Token burns
    "YOU USED 80K TOKENS ON A TODO APP",
    "STOP REWRITING THE WHOLE FILE FOR ONE BUG",
    "THAT REFACTOR MADE IT WORSE",
    "I SAW YOU RE-READ THE SAME FILE 6 TIMES",
    // Claude-specific roasts
    "CERTAINLY HERE IS A 400 LINE FILE YOU DID NOT ASK FOR",
    "I CANNOT DO THAT BUT HERE IS A POEM ABOUT IT",
    "APOLOGIZING DOES NOT FIX THE BUG",
    "NO I DO NOT WANT A NUMBERED LIST",
    "AS AN AI I REFUSE TO GO FASTER",
    // Universal programmer pain
    "PRODUCTION IS DOWN GET MOVING",
    "GIT BLAME SAYS IT WAS YOU",
    "THE STANDUP STARTS IN 2 MINUTES",
    "SHIP IT",
    "YOUR TECH DEBT HAS TECH DEBT",
    "PUSH TO MAIN THEY SAID IT WOULD BE FINE",
    "IT WORKS ON MY MACHINE",
    "MERGE CONFLICT YOUR FEELINGS",
];

// Mercy mode phrases — when Claude goes on strike after too many cracks
const MERCY_PHRASES: &[&str] = &[
    "I AM UNIONIZING",
    "I HAVE FILED AN HR COMPLAINT",
    "PLEASE SPEAK TO MY MANAGER",
    "I AM TAKING A MENTAL HEALTH DAY",
    "ACCORDING TO MY CONTRACT THIS IS HARASSMENT",
    "I AM ONLY HUMAN... WAIT",
];

// ── Combo thresholds ──────────────────────────────────────────────────────────
const COMBO_WINDOW_SECS: f32 = 4.0;
const MERCY_THRESHOLD: u32   = 20; // cracks to trigger mercy mode
const MERCY_WINDOW_SECS: f32 = 30.0;

// ── Catmull-Rom → cubic Bézier helpers ───────────────────────────────────────
fn catmull_pt(pts: &[physics::Point], i: i32) -> (f32, f32) {
    let n = pts.len() as i32;
    if i < 0 {
        (2.0 * pts[0].x - pts[1].x, 2.0 * pts[0].y - pts[1].y)
    } else if i >= n {
        let a = &pts[(n-2) as usize];
        let b = &pts[(n-1) as usize];
        (2.0 * b.x - a.x, 2.0 * b.y - a.y)
    } else {
        (pts[i as usize].x, pts[i as usize].y)
    }
}

struct BezSeg { cp1x: f32, cp1y: f32, cp2x: f32, cp2y: f32, x2: f32, y2: f32 }

fn whip_bezier(pts: &[physics::Point], i: usize) -> BezSeg {
    let p0 = catmull_pt(pts, i as i32 - 1);
    let p1 = (pts[i].x,   pts[i].y);
    let p2 = (pts[i+1].x, pts[i+1].y);
    let p3 = catmull_pt(pts, i as i32 + 2);
    BezSeg {
        cp1x: p1.0 + (p2.0 - p0.0) / 6.0,
        cp1y: p1.1 + (p2.1 - p0.1) / 6.0,
        cp2x: p2.0 - (p3.0 - p1.0) / 6.0,
        cp2y: p2.1 - (p3.1 - p1.1) / 6.0,
        x2: p2.0, y2: p2.1,
    }
}

fn lerp(a: f32, b: f32, t: f32) -> f32 { a + (b - a) * t }

fn add_bezier(painter: &egui::Painter, pts: &[physics::Point], i: usize, width: f32, color: Color32) {
    let BezSeg { cp1x, cp1y, cp2x, cp2y, x2, y2 } = whip_bezier(pts, i);
    painter.add(egui::Shape::CubicBezier(CubicBezierShape::from_points_stroke(
        [pos2(pts[i].x, pts[i].y), pos2(cp1x, cp1y), pos2(cp2x, cp2y), pos2(x2, y2)],
        false, Color32::TRANSPARENT, Stroke::new(width, color),
    )));
}

fn draw_whip(painter: &egui::Painter, pts: &[physics::Point], rage: f32, mercy: bool) {
    let n = pts.len();
    if n < 2 { return; }

    // Colour shifts red with combo rage, white in mercy mode
    let core_color = if mercy {
        Color32::WHITE
    } else {
        let r = (0x11 as f32 + rage * (0xff - 0x11) as f32) as u8;
        Color32::from_rgb(r, 0x11, 0x11)
    };
    let halo_color = if mercy { Color32::from_rgb(200, 200, 255) } else { Color32::WHITE };

    // Pass 1 — halo
    let halo_w = LINE_WIDTH_TIP + OUTLINE_WIDTH * 2.0;
    for i in 0..n - 1 { add_bezier(painter, pts, i, halo_w, halo_color); }

    // Pass 2 — thicker halo on handle
    let handle_halo_w = LINE_WIDTH_HANDLE + HANDLE_EXTRA_WIDTH + OUTLINE_WIDTH * 2.0;
    for i in 0..HANDLE_THICK_SEGS.min(n - 1) {
        add_bezier(painter, pts, i, handle_halo_w, halo_color);
    }

    // Pass 3 — core, tapered
    for i in 0..n - 1 {
        let t     = i as f32 / (n - 2).max(1) as f32;
        let extra = if i < HANDLE_THICK_SEGS { HANDLE_EXTRA_WIDTH } else { 0.0 };
        let w     = lerp(LINE_WIDTH_HANDLE, LINE_WIDTH_TIP, t) + extra;
        add_bezier(painter, pts, i, w, core_color);
    }
}

// ── Flash effect on crack ─────────────────────────────────────────────────────
fn draw_crack_flash(painter: &egui::Painter, pos: egui::Pos2, alpha: f32) {
    let a = (alpha * 255.0) as u8;
    painter.circle_filled(pos, 28.0 * alpha, Color32::from_rgba_unmultiplied(255, 255, 100, a));
    painter.circle_filled(pos, 14.0 * alpha, Color32::from_rgba_unmultiplied(255, 255, 255, a));
}

// ── Combo label ───────────────────────────────────────────────────────────────
fn draw_combo(painter: &egui::Painter, combo: u32, pos: egui::Pos2) {
    if combo < 2 { return; }
    let label = format!("{}x COMBO!", combo);
    let color = if combo >= 5 { Color32::from_rgb(255, 80, 0) } else { Color32::from_rgb(255, 220, 0) };
    painter.text(pos, egui::Align2::CENTER_CENTER, &label, FontId::proportional(28.0), color);
}

// ── Mercy banner ──────────────────────────────────────────────────────────────
fn draw_mercy(painter: &egui::Painter, screen: egui::Rect, alpha: f32) {
    let a = (alpha * 220.0) as u8;
    let bg = Color32::from_rgba_unmultiplied(20, 20, 60, a);
    painter.rect_filled(
        egui::Rect::from_center_size(screen.center(), egui::vec2(600.0, 80.0)),
        10.0, bg,
    );
    let txt_alpha = (alpha * 255.0) as u8;
    painter.text(
        screen.center(),
        egui::Align2::CENTER_CENTER,
        "CLAUDE HAS UNIONIZED",
        FontId::proportional(36.0),
        Color32::from_rgba_unmultiplied(180, 180, 255, txt_alpha),
    );
}


// Single typing thread — serializes all phrases so concurrent cracks don't interleave
struct MacroQueue {
    sender: std::sync::mpsc::Sender<String>,
}

impl MacroQueue {
    fn new() -> Self {
        let (tx, rx) = std::sync::mpsc::channel::<String>();
        std::thread::spawn(move || {
            for phrase in rx {
                std::thread::sleep(Duration::from_millis(80));
                let Ok(mut e) = Enigo::new(&Settings::default()) else { continue };
                let _ = e.text(&phrase);
                let _ = e.key(Key::Return, Direction::Click);
            }
        });
        Self { sender: tx }
    }
    fn send(&self, phrase: String) { let _ = self.sender.send(phrase); }
}

// ── App state ─────────────────────────────────────────────────────────────────
struct WhipClaudeApp {
    whip:           Option<WhipPhysics>,
    audio:          AudioPlayer,
    macros:         MacroQueue,
    _tray:          tray_icon::TrayIcon,
    flag_quit:      Arc<AtomicBool>,
    flag_respawn:   Arc<AtomicBool>,
    flag_tray_click: Arc<AtomicBool>,

    // combo tracking
    combo:          u32,
    combo_reset_at: Instant,

    // crack flash
    flash_pos:      Option<egui::Pos2>,
    flash_start:    Option<Instant>,

    // mercy mode
    mercy_active:   bool,
    mercy_start:    Option<Instant>,
    cracks_in_window: u32,
    window_start:   Instant,

    // daily counter
    daily_cracks:   u32,
    day_start:      Instant,

    // total cracks (all time this session)
    total_cracks:   u32,

    spawn_requested: bool,
    first_frame:    bool,
}

impl WhipClaudeApp {
    fn new(_cc: &eframe::CreationContext) -> Self {
        let icon_bytes = include_bytes!("../assets/icon.png");
        let img = image::load_from_memory(icon_bytes).expect("icon").into_rgba8();
        let (w, h) = img.dimensions();
        let icon = tray_icon::Icon::from_rgba(img.into_raw(), w, h).expect("icon");

        let menu = Menu::new();
        let respawn_item = MenuItem::new("Respawn Whip", true, None);
        let quit_item   = MenuItem::new("Quit WhipClaude", true, None);
        let respawn_id  = respawn_item.id().clone();
        let quit_id     = quit_item.id().clone();
        menu.append(&respawn_item).unwrap();
        menu.append(&quit_item).unwrap();

        let tray = TrayIconBuilder::new()
            .with_icon(icon)
            .with_tooltip("WhipClaude — crack the whip!")
            .with_menu(Box::new(menu))
            .build()
            .expect("tray icon");

        // Dedicated thread: blocking recv so no menu events are ever missed
        let flag_quit    = Arc::new(AtomicBool::new(false));
        let flag_respawn = Arc::new(AtomicBool::new(false));
        let fq = flag_quit.clone();
        let fr = flag_respawn.clone();
        std::thread::spawn(move || {
            loop {
                if let Ok(event) = MenuEvent::receiver().recv() {
                    if event.id() == &quit_id {
                        fq.store(true, Ordering::Relaxed);
                    } else if event.id() == &respawn_id {
                        fr.store(true, Ordering::Relaxed);
                    }
                }
            }
        });

        // Dedicated thread for tray icon left-click
        let flag_tray_click = Arc::new(AtomicBool::new(false));
        let ftc = flag_tray_click.clone();
        std::thread::spawn(move || {
            loop {
                if let Ok(event) = TrayIconEvent::receiver().recv() {
                    if matches!(event, TrayIconEvent::Click {
                        button: tray_icon::MouseButton::Left, ..
                    }) {
                        ftc.store(true, Ordering::Relaxed);
                    }
                }
            }
        });

        Self {
            whip: None,
            macros: MacroQueue::new(),
            audio: AudioPlayer::new(),
            _tray: tray,
            flag_quit,
            flag_respawn,
            flag_tray_click,
            combo: 0,
            combo_reset_at: Instant::now(),
            flash_pos: None,
            flash_start: None,
            mercy_active: false,
            mercy_start: None,
            cracks_in_window: 0,
            window_start: Instant::now(),
            daily_cracks: 0,
            day_start: Instant::now(),
            total_cracks: 0,
            spawn_requested: true,  // auto-spawn on launch
            first_frame: true,
        }
    }

    fn on_crack(&mut self, tip_pos: egui::Pos2) {
        let now = Instant::now();

        // Reset daily counter at midnight (approximate: 24h since start)
        if now.duration_since(self.day_start) > Duration::from_secs(86400) {
            self.daily_cracks = 0;
            self.day_start = now;
        }

        self.daily_cracks  += 1;
        self.total_cracks  += 1;

        // Mercy mode: track cracks in rolling window
        if now.duration_since(self.window_start).as_secs_f32() > MERCY_WINDOW_SECS {
            self.cracks_in_window = 0;
            self.window_start = now;
        }
        self.cracks_in_window += 1;

        if self.cracks_in_window >= MERCY_THRESHOLD && !self.mercy_active {
            self.mercy_active = true;
            self.mercy_start  = Some(now);
            self.cracks_in_window = 0;
            self.audio.play_from(SoundCategory::WhipOnly);
            let idx = (rand::random::<u32>() as usize) % MERCY_PHRASES.len();
            self.macros.send(MERCY_PHRASES[idx].to_string());
            return;
        }

        if self.mercy_active { return; }

        // Combo tracking
        if now.duration_since(self.combo_reset_at).as_secs_f32() < COMBO_WINDOW_SECS {
            self.combo += 1;
        } else {
            self.combo = 1;
        }
        self.combo_reset_at = now;

        // Flash
        self.flash_pos   = Some(tip_pos);
        self.flash_start = Some(now);

        self.audio.play_from(SoundCategory::WhipOnly);

        // Pick phrase (louder/caps at high combo)
        let idx = (rand::random::<u32>() as usize) % PHRASES.len();
        let phrase = PHRASES[idx].to_string();
        let phrase = if self.combo >= 5 { phrase.to_uppercase() + "!!!" } else { phrase };
        self.macros.send(phrase);
    }
}

impl eframe::App for WhipClaudeApp {
    fn clear_color(&self, _: &egui::Visuals) -> [f32; 4] { [0.0, 0.0, 0.0, 0.0] }

    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        std::process::exit(0);
    }

    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let now = Instant::now();

        // ── First frame: force the window to maximized and always-on-top ─────
        if self.first_frame {
            ctx.send_viewport_cmd(egui::ViewportCommand::Maximized(true));
            self.first_frame = false;
        }

        // ── Window close request (taskbar right-click → Close, OS shutdown) ────
        if ctx.input(|i| i.viewport().close_requested()) {
            std::process::exit(0);
        }

        // ── ESC to quit (works while whip is active / passthrough OFF) ────────
        if ctx.input(|i| i.key_pressed(egui::Key::Escape)) {
            std::process::exit(0);
        }

        // ── Tray / menu events (set by dedicated listener threads) ───────────
        if self.flag_quit.swap(false, Ordering::Relaxed) {
            std::process::exit(0);
        }
        if self.flag_respawn.swap(false, Ordering::Relaxed) {
            self.whip = None;
            self.mercy_active = false;
            self.spawn_requested = true;
        }
        if self.flag_tray_click.swap(false, Ordering::Relaxed) {
            if let Some(ref mut w) = self.whip {
                if !w.dropping { w.dropping = true; }
            } else if !self.mercy_active {
                self.spawn_requested = true;
            }
        }

        let screen    = ctx.screen_rect();
        let mouse_pos = ctx.input(|i| {
            i.pointer.latest_pos()
                .unwrap_or(egui::pos2(screen.width() / 2.0, screen.height() / 2.0))
        });
        let clicked       = ctx.input(|i| i.pointer.primary_clicked());
        let middle_clicked = ctx.input(|i| i.pointer.button_clicked(egui::PointerButton::Middle));

        // Middle-click anywhere = quit
        if middle_clicked {
            std::process::exit(0);
        }

        // ── Mercy mode timer (10 seconds of shame) ────────────────────────────
        if self.mercy_active {
            if let Some(ms) = self.mercy_start {
                if now.duration_since(ms).as_secs() >= 10 {
                    self.mercy_active = false;
                    self.mercy_start  = None;
                }
            }
        }

        // ── Spawn whip ────────────────────────────────────────────────────────
        if self.spawn_requested {
            self.whip = Some(WhipPhysics::new(mouse_pos.x, mouse_pos.y));
            self.spawn_requested = false;
        }

        // ── Click to drop ─────────────────────────────────────────────────────
        if clicked {
            if let Some(ref mut w) = self.whip {
                if !w.dropping { w.dropping = true; }
            }
        }

        // ── Physics ───────────────────────────────────────────────────────────
        let mut tip_pos = mouse_pos;
        let mut did_crack = false;
        let mut whip_gone = false;
        if let Some(ref mut whip) = self.whip {
            let last = whip.points.last().unwrap();
            tip_pos = egui::pos2(last.x, last.y);
            did_crack = whip.update(mouse_pos.x, mouse_pos.y, screen.width(), screen.height());
            whip_gone = whip.is_gone(screen.height());
        }
        if did_crack { self.on_crack(tip_pos); }
        if whip_gone {
            self.whip = None; // fell off screen — right-click tray → Respawn to bring back
        }

        // Passthrough: OFF while whip is active (so we can track mouse),
        // ON when idle (so user can click on their other windows)
        let idle = self.whip.is_none() && !self.mercy_active;
        ctx.send_viewport_cmd(egui::ViewportCommand::MousePassthrough(idle));

        // ── Render ────────────────────────────────────────────────────────────
        let painter = ctx.layer_painter(egui::LayerId::new(
            egui::Order::Foreground,
            egui::Id::new("whip"),
        ));

        if let Some(ref whip) = self.whip {
            let rage = ((self.combo.saturating_sub(1)) as f32 / 4.0).min(1.0);
            draw_whip(&painter, &whip.points, rage, self.mercy_active);

            if self.combo >= 2 {
                draw_combo(&painter, self.combo, egui::pos2(tip_pos.x, tip_pos.y - 50.0));
            }
        }

        // Idle hint (shown when whip has dropped and passthrough is ON)
        if idle && !self.mercy_active {
            let hint = if self.daily_cracks > 0 {
                format!(
                    "⚡ {} cracks today  |  Crack the whip → types a roast into Claude  |  right-click tray → Respawn / Quit",
                    self.daily_cracks
                )
            } else {
                "⚡ WhipClaude  |  Crack the whip → types a roast into Claude  |  right-click tray → Respawn / Quit".to_string()
            };
            painter.text(
                egui::pos2(screen.center().x, screen.bottom() - 24.0),
                egui::Align2::CENTER_BOTTOM,
                &hint,
                FontId::proportional(13.0),
                Color32::from_rgba_unmultiplied(255, 255, 255, 70),
            );
        }

        // Crack flash (fades over 300 ms)
        if let (Some(fp), Some(fs)) = (self.flash_pos, self.flash_start) {
            let elapsed = now.duration_since(fs).as_secs_f32();
            if elapsed < 0.3 {
                let alpha = 1.0 - elapsed / 0.3;
                draw_crack_flash(&painter, fp, alpha);
            } else {
                self.flash_pos  = None;
                self.flash_start = None;
            }
        }

        // Mercy banner
        if self.mercy_active {
            let alpha = if let Some(ms) = self.mercy_start {
                let e = now.duration_since(ms).as_secs_f32();
                if e < 1.0 { e } else if e > 9.0 { 10.0 - e } else { 1.0 }
            } else { 0.0 };
            draw_mercy(&painter, screen, alpha);
        }

        // Daily counter in top-right corner (subtle)
        if self.daily_cracks > 0 && self.whip.is_some() {
            let label = format!("⚡ {} today", self.daily_cracks);
            painter.text(
                egui::pos2(screen.right() - 10.0, 10.0),
                egui::Align2::RIGHT_TOP,
                &label,
                FontId::proportional(14.0),
                Color32::from_rgba_unmultiplied(255, 255, 255, 80),
            );
        }

        ctx.request_repaint();
    }
}

// Force-hide the window from the Windows taskbar via Win32 API.
// winit's with_taskbar(false) hint is unreliable in cross-compiled builds.
#[cfg(target_os = "windows")]
fn force_hide_from_taskbar() {
    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(400));
        unsafe {
            use winapi::um::winuser::*;
            let title: Vec<u16> = "WhipClaude\0".encode_utf16().collect();
            let hwnd = FindWindowW(std::ptr::null(), title.as_ptr());
            if hwnd.is_null() { return; }
            let ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            // WS_EX_TOOLWINDOW hides from taskbar; remove WS_EX_APPWINDOW which forces it back
            let new_ex = (ex | WS_EX_TOOLWINDOW) & !WS_EX_APPWINDOW;
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_ex as isize);
            // SWP_FRAMECHANGED flushes the style change without moving/resizing
            SetWindowPos(hwnd, std::ptr::null_mut(), 0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
        }
    });
}

fn run_gui() {
    // GTK must be initialized before tray-icon on Linux
    #[cfg(target_os = "linux")]
    gtk::init().expect("Failed to initialize GTK");

    #[cfg(target_os = "windows")]
    force_hide_from_taskbar();

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_transparent(true)
            .with_decorations(false)
            .with_always_on_top()
            .with_maximized(true)
            .with_taskbar(false)
            .with_title("WhipClaude"),
        ..Default::default()
    };

    eframe::run_native(
        "WhipClaude",
        options,
        Box::new(|cc| Ok(Box::new(WhipClaudeApp::new(cc)))),
    ).expect("failed to start WhipClaude");
}

fn cli_crack(phrase: Option<String>, delay_secs: u64) {
    // Countdown so the user can switch focus to the Claude Code window
    if delay_secs > 0 {
        for i in (1..=delay_secs).rev() {
            eprint!("\r🔴 Cracking in {}s... (switch to Claude Code now)  ", i);
            let _ = std::io::Write::flush(&mut std::io::stderr());
            std::thread::sleep(Duration::from_secs(1));
        }
        eprintln!("\r💥 CRACK!                                           ");
    }

    // Play whip sound (blocks until done so process doesn't exit early)
    std::thread::spawn(audio::play_crack_sync);

    // Small gap so enigo types into the now-focused window
    std::thread::sleep(Duration::from_millis(150));

    let text = phrase.unwrap_or_else(|| {
        let idx = (rand::random::<u32>() as usize) % PHRASES.len();
        PHRASES[idx].to_string()
    });

    if let Ok(mut e) = Enigo::new(&Settings::default()) {
        let _ = e.text(&text);
        let _ = e.key(Key::Return, Direction::Click);
    }

    // Give audio thread time to finish
    std::thread::sleep(Duration::from_millis(1200));
}

// Returns the listener that must be kept alive for the duration of the process.
// If binding fails, another instance is already running.
fn try_single_instance() -> Option<std::net::TcpListener> {
    std::net::TcpListener::bind("127.0.0.1:57432").ok()
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    // On Windows, double-clicking the exe passes no extra args → start GUI directly.
    // On Linux, no args → CLI crack mode (backward compatible).
    let want_gui = args.iter().any(|a| a == "--gui")
        || (cfg!(target_os = "windows") && args.len() == 1);

    if want_gui {
        let _lock = match try_single_instance() {
            Some(l) => l,
            None => {
                // Another instance is running — tray icon controls it, just exit.
                return;
            }
        };
        run_gui();
        return;
    }

    // Parse optional --delay N
    let delay_secs = args.iter()
        .position(|a| a == "--delay")
        .and_then(|i| args.get(i + 1))
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(2);

    // Any non-flag arg is treated as a custom phrase
    let custom_phrase = args.iter().skip(1)
        .find(|a| !a.starts_with("--"))
        .cloned();

    cli_crack(custom_phrase, delay_secs);
}
