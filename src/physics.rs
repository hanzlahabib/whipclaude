use std::time::Instant;

#[derive(Clone, Debug)]
pub struct Point {
    pub x: f32,
    pub y: f32,
    pub px: f32,
    pub py: f32,
}

// ── Physics constants (mirrors badclaude's P object) ──────────────────────────
const SEGMENTS: usize = 28;
const SEGMENT_LENGTH: f32 = 25.0;
const TAPER: f32 = 0.6;
const GRAVITY: f32 = 1.2;
const DROP_GRAVITY: f32 = 0.95;
const DAMPING: f32 = 0.96;
const CONSTRAINT_ITERS: usize = 20;
const MAX_STRETCH_RATIO: f32 = 1.2;
const BASE_TARGET_ANGLE: f32 = -1.12;
const HANDLE_AIM_BY_MOUSE_X: f32 = 0.4;
const HANDLE_AIM_BY_MOUSE_Y: f32 = 0.2;
const HANDLE_AIM_CLAMP: f32 = 2.0;
const HANDLE_SPRING: f32 = 0.7;
const HANDLE_ANGULAR_DAMPING: f32 = 0.078;
const BASE_POSE_SEGMENTS: usize = 2;
const BASE_POSE_STIFF_START: f32 = 0.9;
const BASE_POSE_STIFF_END: f32 = 0.8;
const HANDLE_MAX_BEND_DEG: f32 = 16.0;
const TIP_MAX_BEND_DEG: f32 = 130.0;
const BEND_RIGIDITY_START: f32 = 0.8;
const BEND_RIGIDITY_END: f32 = 0.12;
const WALL_BOUNCE: f32 = 0.42;
const WALL_FRICTION: f32 = 0.86;
pub const CRACK_SPEED: f32 = 180.0;
const CRACK_COOLDOWN_MS: u128 = 200;
const FIRST_CRACK_GRACE_MS: u128 = 350;
const ARC_WIDTH: f32 = 260.0;
const ARC_HEIGHT: f32 = 185.0;

pub struct WhipPhysics {
    pub points: Vec<Point>,
    pub dropping: bool,
    spawn_time: Instant,
    last_crack_time: Instant,
    handle_angle: f32,
    handle_ang_vel: f32,
    prev_mouse_x: f32,
    prev_mouse_y: f32,
}

impl WhipPhysics {
    pub fn new(mx: f32, my: f32) -> Self {
        let mut points = Vec::with_capacity(SEGMENTS);
        for i in 0..SEGMENTS {
            let t = i as f32 / (SEGMENTS - 1) as f32;
            let x = mx + t * ARC_WIDTH;
            let y = my - (t * std::f32::consts::PI * 0.75).sin() * ARC_HEIGHT;
            points.push(Point { x, y, px: x, py: y });
        }
        let far_past = Instant::now().checked_sub(std::time::Duration::from_secs(10))
            .unwrap_or_else(Instant::now);
        Self {
            points,
            dropping: false,
            spawn_time: Instant::now(),
            last_crack_time: far_past,
            handle_angle: BASE_TARGET_ANGLE,
            handle_ang_vel: 0.0,
            prev_mouse_x: mx,
            prev_mouse_y: my,
        }
    }

    fn seg_len(i: usize) -> f32 {
        let t = i as f32 / (SEGMENTS - 1) as f32;
        SEGMENT_LENGTH * (1.0 - t * (1.0 - TAPER))
    }

    #[inline] fn clamp(v: f32, lo: f32, hi: f32) -> f32 { v.max(lo).min(hi) }
    #[inline] fn lerp(a: f32, b: f32, t: f32) -> f32 { a + (b - a) * t }

    fn wrap_pi(mut a: f32) -> f32 {
        use std::f32::consts::PI;
        while a > PI  { a -= PI * 2.0; }
        while a < -PI { a += PI * 2.0; }
        a
    }

    fn update_handle_aim(&mut self, mx: f32, my: f32) {
        if self.dropping { return; }
        let mvx = mx - self.prev_mouse_x;
        let mvy = my - self.prev_mouse_y;
        let delta = Self::clamp(
            mvx * HANDLE_AIM_BY_MOUSE_X + mvy * HANDLE_AIM_BY_MOUSE_Y,
            -HANDLE_AIM_CLAMP, HANDLE_AIM_CLAMP,
        );
        let target = BASE_TARGET_ANGLE + delta;
        let err = Self::wrap_pi(target - self.handle_angle);
        self.handle_ang_vel += err * HANDLE_SPRING;
        self.handle_ang_vel *= HANDLE_ANGULAR_DAMPING;
        self.handle_angle = Self::wrap_pi(self.handle_angle + self.handle_ang_vel);
    }

    fn apply_base_pose(&mut self) {
        if self.dropping { return; }
        let dx = self.handle_angle.cos();
        let dy = self.handle_angle.sin();
        let guided = BASE_POSE_SEGMENTS.min(self.points.len() - 1);
        for i in 1..=guided {
            let t = if guided <= 1 { 0.0 } else { (i - 1) as f32 / (guided - 1) as f32 };
            let stiff = Self::lerp(BASE_POSE_STIFF_START, BASE_POSE_STIFF_END, t);
            let target_len = Self::seg_len(i - 1);
            let (px, py) = (self.points[i - 1].x, self.points[i - 1].y);
            let (tx, ty) = (px + dx * target_len, py + dy * target_len);
            self.points[i].x = Self::lerp(self.points[i].x, tx, stiff);
            self.points[i].y = Self::lerp(self.points[i].y, ty, stiff);
        }
    }

    fn apply_bend_limits(&mut self) {
        let n = self.points.len();
        if n < 3 { return; }
        for i in 1..n - 1 {
            let (ax, ay) = (self.points[i-1].x, self.points[i-1].y);
            let (bx, by) = (self.points[i].x,   self.points[i].y);
            let (cx, cy) = (self.points[i+1].x, self.points[i+1].y);

            let (v1x, v1y) = (ax - bx, ay - by);
            let (v2x, v2y) = (cx - bx, cy - by);
            let l1 = v1x.hypot(v1y).max(1e-4);
            let l2 = v2x.hypot(v2y).max(1e-4);
            let (n1x, n1y) = (v1x / l1, v1y / l1);
            let (n2x, n2y) = (v2x / l2, v2y / l2);

            let dot   = Self::clamp(n1x*n2x + n1y*n2y, -1.0, 1.0);
            let angle = dot.acos();
            let t     = i as f32 / (n - 2) as f32;
            let max_bend = Self::lerp(HANDLE_MAX_BEND_DEG, TIP_MAX_BEND_DEG, t).to_radians();
            let bend = std::f32::consts::PI - angle;
            if bend <= max_bend { continue; }

            let sign = if n1x*n2y - n1y*n2x >= 0.0 { 1.0f32 } else { -1.0 };
            let ta   = n1y.atan2(n1x) + sign * (std::f32::consts::PI - max_bend);
            let (tx, ty)   = (bx + ta.cos() * l2, by + ta.sin() * l2);
            let rigidity   = Self::lerp(BEND_RIGIDITY_START, BEND_RIGIDITY_END, t);
            self.points[i+1].x = Self::lerp(self.points[i+1].x, tx, rigidity);
            self.points[i+1].y = Self::lerp(self.points[i+1].y, ty, rigidity);
        }
    }

    fn cap_segment_stretch(&mut self) {
        let n = self.points.len();
        for i in 0..n - 1 {
            let (ax, ay) = (self.points[i].x, self.points[i].y);
            let (dx, dy) = (self.points[i+1].x - ax, self.points[i+1].y - ay);
            let dist = dx.hypot(dy).max(1e-4);
            let max_len = Self::seg_len(i) * MAX_STRETCH_RATIO;
            if dist > max_len {
                let k = max_len / dist;
                self.points[i+1].x = ax + dx * k;
                self.points[i+1].y = ay + dy * k;
            }
        }
    }

    fn apply_wall_collisions(&mut self, w: f32, h: f32) {
        if self.dropping { return; }
        for i in 1..self.points.len() {
            let p = &mut self.points[i];
            let (mut vx, mut vy) = (p.x - p.px, p.y - p.py);

            if p.x < 0.0        { p.x = 0.0; if vx < 0.0 { vx = -vx * WALL_BOUNCE; } vy *= WALL_FRICTION; }
            else if p.x > w     { p.x = w;   if vx > 0.0 { vx = -vx * WALL_BOUNCE; } vy *= WALL_FRICTION; }
            if p.y < 0.0        { p.y = 0.0; if vy < 0.0 { vy = -vy * WALL_BOUNCE; } vx *= WALL_FRICTION; }
            else if p.y > h     { p.y = h;   if vy > 0.0 { vy = -vy * WALL_BOUNCE; } vx *= WALL_FRICTION; }

            p.px = p.x - vx;
            p.py = p.y - vy;
        }
    }

    /// Returns true if the whip cracked this frame.
    pub fn update(&mut self, mx: f32, my: f32, w: f32, h: f32) -> bool {
        let g = if self.dropping { DROP_GRAVITY } else { GRAVITY };
        self.update_handle_aim(mx, my);

        let start = if self.dropping { 0 } else { 1 };
        for i in start..self.points.len() {
            let p = &mut self.points[i];
            let (vx, vy) = ((p.x - p.px) * DAMPING, (p.y - p.py) * DAMPING);
            p.px = p.x; p.py = p.y;
            p.x += vx; p.y += vy + g;
        }

        if !self.dropping {
            self.points[0] = Point { x: mx, y: my, px: mx, py: my };
        }

        self.cap_segment_stretch();
        self.apply_wall_collisions(w, h);
        self.apply_base_pose();

        for _ in 0..CONSTRAINT_ITERS {
            let n = self.points.len();
            for i in 0..n - 1 {
                let (ax, ay) = (self.points[i].x,   self.points[i].y);
                let (bx, by) = (self.points[i+1].x, self.points[i+1].y);
                let (dx, dy) = (bx - ax, by - ay);
                let dist   = (dx*dx + dy*dy).sqrt().max(1e-4);
                let target = Self::seg_len(i);
                let diff   = (dist - target) / dist * 0.5;
                let (ox, oy) = (dx * diff, dy * diff);
                if i == 0 && !self.dropping {
                    self.points[1].x -= ox * 2.0;
                    self.points[1].y -= oy * 2.0;
                } else {
                    self.points[i].x   += ox; self.points[i].y   += oy;
                    self.points[i+1].x -= ox; self.points[i+1].y -= oy;
                }
            }
            self.apply_bend_limits();
            if !self.dropping { self.apply_base_pose(); }
            self.cap_segment_stretch();
            self.apply_wall_collisions(w, h);
        }

        let tip = &self.points[self.points.len() - 1];
        let tip_vel = (tip.x - tip.px).hypot(tip.y - tip.py);
        let mut cracked = false;
        if !self.dropping && tip_vel > CRACK_SPEED {
            let now = Instant::now();
            let since_spawn  = now.duration_since(self.spawn_time).as_millis();
            let since_crack  = now.duration_since(self.last_crack_time).as_millis();
            if since_spawn >= FIRST_CRACK_GRACE_MS && since_crack > CRACK_COOLDOWN_MS {
                self.last_crack_time = now;
                cracked = true;
            }
        }

        self.prev_mouse_x = mx;
        self.prev_mouse_y = my;
        cracked
    }

    /// True once all points have fallen off the bottom of screen.
    pub fn is_gone(&self, h: f32) -> bool {
        self.dropping && self.points.iter().all(|p| p.y > h + 60.0)
    }
}
