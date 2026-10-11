import timeline from '../public/capture/timeline.json';

export { timeline };
export const { layout } = timeline;

export const FPS = 30;
export const HOOK = 2.6;
export const END = 3.6;
export const CROSSFADE = 0.45;
/**
 * The capture time to show for a time t: inside a hold, the moment it began,
 * so a style lands only once its fonts have loaded.
 */
// A frame is stamped when its screenshot starts, and taking one can last a
// few hundred ms, so a hold goes back far enough to use a frame that finished
// before the change began.
const SHOT = 300;

export const heldTime = t => {
  const hold = timeline.holds?.find(h => t >= h.from - SHOT && t < h.to);
  return hold ? hold.from - SHOT : t;
};

// The edit: everything that happens plays in real time, and stretches where
// nothing changes are cut down to a short pause, longer after the page changes
// or Claude says something, so there's time to look.
const PAUSE = 450;
// Everything that does play runs a little faster than it was captured.
const SPEED = 1.2;
const events = new Map();
const add = (t, pause) => events.set(t, Math.max(events.get(t) ?? 0, pause));
let lastCursor = null;
for (const c of timeline.cursor) {
  if (!lastCursor || c.x !== lastCursor.x || c.y !== lastCursor.y) {
    add(c.t, PAUSE);
  }
  lastCursor = c;
}
for (const c of timeline.clicks) {
  add(c.t, PAUSE);
}
for (const k of timeline.keys ?? []) {
  add(k, PAUSE);
}
for (const c of timeline.captions) {
  add(c.t, 700);
}
for (const e of [...timeline.popup, ...timeline.panel]) {
  add(e.t, 700);
}
for (const f of timeline.frames.popup) {
  add(f.t, PAUSE);
}
for (const f of timeline.frames.site) {
  if (heldTime(f.t) === f.t) {
    add(f.t, 1100);
  }
}
for (const h of timeline.holds ?? []) {
  add(h.to, 1300);
}
for (const e of timeline.terminal) {
  add(e.t, e.kind === 'say' ? 2200 : PAUSE);
}
for (const m of timeline.marks) {
  add(m.t, PAUSE);
}
add(timeline.duration, 0);

// Cuts: nothing between a cutStart mark and the cutEnd after it is shown.
const starts = timeline.marks.filter(m => m.name === 'cutStart').map(m => m.t);
const ends = timeline.marks.filter(m => m.name === 'cutEnd').map(m => m.t);
const cuts = starts
  .map((start, i) => ({ start, end: ends[i] }))
  .filter(c => c.end > c.start);
for (const { start, end } of cuts) {
  for (const t of [...events.keys()]) {
    if (t > start && t < end) {
      events.delete(t);
    }
  }
  events.set(start, 0);
  events.set(end, PAUSE);
}

const segments = [];
let edited = 0;
const times = [...events.keys()].sort((a, b) => a - b);
let prev = 0;
let prevPause = PAUSE;
for (const t of times) {
  // Pauses are in edited time, so they last as long at any speed.
  const len = Math.min(t - prev, prevPause * SPEED);
  if (len > 0) {
    segments.push({ e: edited, t: prev, len });
    edited += len / SPEED;
  }
  prev = t;
  prevPause = events.get(t);
}
segments.push({ e: edited, t: prev, len: 0 });

/**
 * The capture time (ms) shown at edited time e (ms).
 */
export const toCapture = e => {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segments[mid].e <= e) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const seg = segments[lo];
  return seg.t + Math.min((e - seg.e) * SPEED, seg.len);
};

export const editedSeconds = edited / 1000;
export const totalSeconds = HOOK + editedSeconds + END;

// Browser window geometry on the 1920×1080 canvas.
export const TABS_H = 40;
export const TOOLBAR_H = 44;
export const CHROME_H = TABS_H + TOOLBAR_H;
export const SCALE = 1.24;
export const WIN = {
  w: layout.width,
  h: layout.height + CHROME_H,
};
WIN.left = (1920 - WIN.w * SCALE) / 2;
WIN.top = (1080 - WIN.h * SCALE) / 2 + 6;

const mark = name => timeline.marks.find(m => m.name === name)?.t ?? 0;
export const marks = Object.fromEntries(timeline.marks.map(m => [m.name, m.t]));
export { mark };

/**
 * The newest item at or before time t (ms) in a list sorted by t.
 */
export const latest = (list, t) => {
  let lo = 0;
  let hi = list.length - 1;
  let found = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].t <= t) {
      found = list[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
};

/**
 * Whether a show/hide track is showing at t, and since when it last changed.
 */
export const toggleAt = (track, t) => {
  const e = latest(track, t);
  return { show: !!e?.show, since: e ? t - e.t : Infinity };
};

/**
 * The cursor position at t, interpolated between samples.
 */
export const cursorAt = t => {
  const list = timeline.cursor;
  let lo = 0;
  let hi = list.length - 1;
  if (t <= list[0].t) {
    return list[0];
  }
  if (t >= list[hi].t) {
    return list[hi];
  }
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (list[mid].t <= t) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const a = list[lo];
  const b = list[hi];
  const k = (t - a.t) / (b.t - a.t || 1);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
};

const terminalShowing = t => {
  const shows = timeline.terminal.filter(
    e => e.kind === 'show' || e.kind === 'hide'
  );
  const e = latest(shows, t);
  return { show: e?.kind === 'show', since: e ? t - e.t : Infinity };
};
export { terminalShowing };

const ease = x => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};
export { ease };

/**
 * How far the browser has stepped aside for the terminal, 0 to 1.
 */
export const asideAt = t => {
  const { show, since } = terminalShowing(t);
  const k = ease(since / 650);
  return show ? k : 1 - k;
};

/**
 * Where the browser window sits: its offset and scale on the canvas.
 */
export const windowAt = t => {
  const a = asideAt(t);
  const s = SCALE * (1 - 0.14 * a);
  const w = WIN.w * s;
  const h = WIN.h * s;
  const left = WIN.left + (1920 - 48 - w - WIN.left) * a;
  const top = (1080 - h) / 2 + 6 * (1 - a);
  return { left, top, s };
};

/**
 * A point in content coordinates (the page area, y < 0 is the toolbar) on the
 * canvas, at time t.
 */
export const toCanvas = (p, t) => {
  const w = windowAt(t);
  return { x: w.left + p.x * w.s, y: w.top + (CHROME_H + p.y) * w.s };
};

// The camera eases toward each target with a soft exponential follow,
// simulated once for every frame so any frame renders on its own.
/**
 * The first video frame after each cut.
 */
export const cutFrames = (() => {
  const total = Math.ceil(totalSeconds * FPS);
  return cuts.map(({ end }) => {
    for (let i = 0; i < total; i++) {
      if (toCapture(Math.max(0, (i / FPS - HOOK) * 1000)) >= end) {
        return i;
      }
    }
    return -1;
  });
})();

const cameraFrames = (() => {
  const total = Math.ceil(totalSeconds * FPS) + 1;
  const out = new Array(total);
  let cam = { x: 960, y: 540, z: 1 };
  for (let i = 0; i < total; i++) {
    const t = toCapture(Math.max(0, (i / FPS - HOOK) * 1000));
    let target = { x: 960, y: 540, z: 1 };
    const e = i / FPS >= HOOK ? latest(timeline.camera, t) : null;
    // Wide while the terminal is up, so it and the page both stay in frame.
    if (e && e.zoom > 1.001 && asideAt(t) === 0) {
      const p = toCanvas({ x: e.x, y: e.y }, t);
      target = { x: p.x, y: p.y, z: e.zoom };
    }
    const k = 1 - Math.exp(-(1 / FPS) * 2.6);
    // Across the cut the camera is simply where it should be.
    if (cutFrames.includes(i)) {
      cam = target;
    }
    cam = {
      x: cam.x + (target.x - cam.x) * k,
      y: cam.y + (target.y - cam.y) * k,
      z: cam.z + (target.z - cam.z) * k,
    };
    const halfW = 960 / cam.z;
    const halfH = 540 / cam.z;
    out[i] = {
      z: cam.z,
      x: Math.min(Math.max(cam.x, halfW), 1920 - halfW),
      y: Math.min(Math.max(cam.y, halfH), 1080 - halfH),
    };
  }
  return out;
})();
export const cameraAt = frame =>
  cameraFrames[Math.min(frame, cameraFrames.length - 1)];
