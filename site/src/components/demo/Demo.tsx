import { Component, createRef, type ComponentChildren } from 'preact';
import SbIcon from '../SbIcon';
import { ChevronDown, Close, EyeOff } from '../icons';
import './demo.css';
import { isDarkTheme } from '../../lib/themes';
import { currentTheme } from '../../lib/theme-state';
import {
  INIT,
  LOOKS,
  LOOK_STEPS,
  NEW_PROFILE,
  QUOTE_CSS,
  QUOTE_TOTAL,
  PIN_SCENE,
  SCENES,
  type Scene,
  type DemoState,
  type Patch,
} from './scenes';

type State = DemoState & {
  scene: number;
  done: boolean;
  pct: number;
  anim: boolean;
  remain: number;
  cx: number;
  cy: number;
  clicking: boolean;
  rx: number;
  ry: number;
  speed: number;
  dark: boolean;
  mac: boolean;
  scale: number;
  paneWidth: number;
  fitWidth: number;
  stageHeight: number;
  split: boolean;
};

type Token = { text: string; style: string };
type Line = { style: string; toks: Token[] };

const PANE_WIDTH = 980;
const MIN_FIT_SCALE = 0.6;
const SPLIT_QUERY = '(min-width: 1100px)';
const PLAYBACK_KEYS = new Set(['cur', 'click', 'qType', 'profType']);

const CODE_COLORS: Record<string, string> = {
  sel: 'color:var(--csel)',
  br: 'color:var(--cbr)',
  prop: 'color:var(--cprop)',
  val: 'color:var(--cval)',
  num: 'color:var(--cnum)',
  com: 'color:var(--ccom)',
  pl: 'color:var(--ink)',
};

const tk = (text: string, c: string): Token => ({
  text,
  style: CODE_COLORS[c],
});

/**
 * The inspector tooltip shown under a hovered element, naming its selector.
 */
function PickCard({ selector, dark }: { selector: string; dark: boolean }) {
  return (
    <div class={`demo-pick-card${dark ? ' is-dark' : ''}`}>
      <span class="demo-pick-arrow" />
      {selector}
    </div>
  );
}

const EXTENSIONS: [string, string][] = [
  ['Ad blocker', '#c9473f'],
  ['Password manager', '#3f67c9'],
  ['Stylebot', ''],
  ['Translate', '#4f8a5b'],
  ['Web archive', '#6b6f76'],
];

const Gear = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type Props = {
  variant?: 'landing' | 'welcome';
  intro?: ComponentChildren;
  children?: ComponentChildren;
};

/**
 * The hero walkthrough: a scripted browser window that plays through opening
 * the editor, picking an element, styling it, and creating a profile. The
 * welcome variant starts by pinning Stylebot and stops at the end instead of
 * looping.
 */
export default class Demo extends Component<Props, State> {
  get welcome() {
    return this.props.variant === 'welcome';
  }

  get scenes(): Scene[] {
    return this.welcome ? [PIN_SCENE, ...SCENES] : SCENES;
  }

  get init(): DemoState {
    return { ...INIT, pinned: !this.welcome };
  }

  paneRef = createRef<HTMLDivElement>();
  stageRef = createRef<HTMLDivElement>();
  stepsRef = createRef<HTMLDivElement>();
  mainRef = createRef<HTMLDivElement>();
  belowRef = createRef<HTMLDivElement>();
  rootRef = createRef<HTMLDivElement>();
  resizeObserver?: ResizeObserver;
  timers: ReturnType<typeof setTimeout>[] = [];
  scene = 0;
  t0 = 0;
  startId?: ReturnType<typeof setTimeout>;

  state: State = {
    ...INIT,
    pinned: this.props.variant !== 'welcome',
    scene: 0,
    done: false,
    pct: 0,
    anim: false,
    remain: 0,
    cx: 300,
    cy: 260,
    clicking: false,
    rx: 0,
    ry: 0,
    speed: 1,
    dark: false,
    mac: false,
    scale: 1,
    paneWidth: PANE_WIDTH,
    fitWidth: 0,
    stageHeight: 0,
    split: false,
  };

  onTheme = () => this.setState({ dark: isDarkTheme(currentTheme()) });

  /**
   * Below the pane's natural width, the demo is laid out at a fixed width and
   * scaled down as a whole, so the page and editor keep their proportions. The
   * welcome variant also shrinks to keep it on the first screen with the steps
   * and anything passed in below them, which narrows with it when stacked and
   * spans both columns when the pane sits beside the steps on a wide screen.
   */
  fit = () => {
    const stage = this.stageRef.current;
    const pane = this.paneRef.current;
    const steps = this.stepsRef.current;
    const main = this.mainRef.current;
    if (!stage || !pane || !steps || !main) return;
    const split = this.welcome && matchMedia(SPLIT_QUERY).matches;
    const full = main.clientWidth;
    let scale = Math.min(1, full / PANE_WIDTH);
    const paneWidth = full / scale;
    if (this.welcome) {
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const below = split
        ? (this.belowRef.current?.offsetHeight ?? -22) + 22
        : steps.getBoundingClientRect().bottom -
          stage.getBoundingClientRect().bottom;
      const room = window.innerHeight - top - below - 24;
      scale = Math.min(
        scale,
        Math.max(MIN_FIT_SCALE, room / pane.offsetHeight),
      );
    }
    const width = paneWidth * scale;
    this.setState({
      scale,
      paneWidth,
      fitWidth: width < full - 1 ? width : 0,
      stageHeight: pane.offsetHeight * scale,
      split,
    });
  };

  componentDidMount() {
    this.setState({ mac: /mac/i.test(navigator.platform) });
    this.onTheme();
    window.addEventListener('themechange', this.onTheme);
    this.fit();
    this.resizeObserver = new ResizeObserver(this.fit);
    if (this.rootRef.current) this.resizeObserver.observe(this.rootRef.current);
    if (this.welcome) window.addEventListener('resize', this.fit);
    const pane = this.paneRef.current;
    if (pane) {
      this.setState({
        cx: pane.clientWidth * 0.55,
        cy: pane.clientHeight * 0.5,
      });
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.startId = setTimeout(() => this.play(0, 0), this.welcome ? 600 : 2300);
  }

  componentWillUnmount() {
    this.clear();
    window.removeEventListener('themechange', this.onTheme);
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.fit);
  }

  clear() {
    clearTimeout(this.startId);
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  target(t: string) {
    const pane = this.paneRef.current;
    const el = pane?.querySelector(`[data-t="${t}"]`);
    if (!pane || !el) return null;
    const r = el.getBoundingClientRect();
    const pr = pane.getBoundingClientRect();
    const s = this.state.scale;
    const w = r.width / s;
    const h = r.height / s;
    const wide = w > 80;
    return {
      x: (r.left - pr.left) / s + (wide ? Math.min(w * 0.3, 140) : w / 2),
      y: (r.top - pr.top) / s + (wide ? Math.min(h * 0.5, 22) : h / 2),
    };
  }

  apply(patch: Patch) {
    const k = 1 / this.state.speed;
    if (patch.qType) {
      for (let i = 1; i <= QUOTE_TOTAL; i++) {
        this.later(i * 28 * k + Math.floor(i / 22) * 200 * k, () =>
          this.setState({ qChars: i }),
        );
      }
    }
    if (patch.profType) {
      for (let i = 1; i <= NEW_PROFILE.length; i++) {
        this.later(i * 70 * k, () => this.setState({ profLen: i }));
      }
    }
    const next: Partial<State> = {};
    Object.keys(patch).forEach((key) => {
      if (!PLAYBACK_KEYS.has(key))
        (next as Record<string, unknown>)[key] = patch[key];
    });
    if (patch.cur) {
      const pt = this.target(patch.cur);
      if (pt) {
        next.cx = pt.x;
        next.cy = pt.y;
      }
    }
    if (patch.click) {
      next.clicking = true;
      next.rx = this.state.cx;
      next.ry = this.state.cy;
      this.later(180, () => this.setState({ clicking: false }));
    }
    this.setState(next);
  }

  baseline(i: number): DemoState {
    const s: Record<string, unknown> = { ...this.init };
    this.scenes.slice(0, i).forEach((sc) =>
      sc.acts.forEach(([, p]) =>
        Object.keys(p).forEach((key) => {
          if (key !== 'cur' && key !== 'click') s[key] = p[key];
        }),
      ),
    );
    Object.assign(s, {
      popOpen: false,
      popHover: false,
      menuOpen: false,
      focus: null,
      profMenu: false,
      profCreating: false,
      profLen: 0,
    });
    if (this.scenes.slice(0, i).some((sc) => sc.acts.some(([, p]) => p.qType)))
      s.qChars = QUOTE_TOTAL;
    return s as DemoState;
  }

  play(i: number, from: number) {
    this.clear();
    const sc = this.scenes[i];
    const k = 1 / this.state.speed;
    const dur = sc.dur * k;
    this.scene = i;
    this.t0 = performance.now() - from;
    this.setState({
      scene: i,
      done: false,
      pct: from / dur,
      anim: false,
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        this.setState({ pct: 1, anim: true, remain: dur - from }),
      ),
    );
    sc.acts.forEach(([t, p]) => {
      const at = t * k;
      if (at >= from) this.later(at - from, () => this.apply(p));
    });
    this.later(dur - from, () => {
      if (i + 1 < this.scenes.length) this.play(i + 1, 0);
      else {
        this.setState({ done: true, pct: 1, anim: false });
        if (!this.welcome) this.later(2500, () => this.jump(0));
      }
    });
  }

  jump(i: number) {
    this.clear();
    this.setState(this.baseline(i), () => this.play(i, 0));
  }

  seek(i: number, frac: number) {
    this.clear();
    const sc = this.scenes[i];
    const k = 1 / this.state.speed;
    const from = sc.dur * k * frac;
    const s: Record<string, unknown> = { ...this.baseline(i) };
    const typed: Record<string, () => Partial<DemoState>> = {
      qType: () => ({ qChars: QUOTE_TOTAL }),
      profType: () => ({ profLen: NEW_PROFILE.length }),
    };
    let cur: string | null = null;
    sc.acts.forEach(([t, p]) => {
      if (t * k > from) return;
      Object.keys(p).forEach((key) => {
        if (key === 'cur') cur = p.cur ?? null;
        else if (typed[key]) Object.assign(s, typed[key]());
        else if (key !== 'click') s[key] = p[key];
      });
    });
    s.clicking = false;
    this.setState(s as Partial<State>, () => {
      requestAnimationFrame(() => {
        if (cur) {
          const pt = this.target(cur);
          if (pt) this.setState({ cx: pt.x, cy: pt.y });
        }
        this.play(i, from);
      });
    });
  }

  seekFromBar(i: number, ev: MouseEvent) {
    ev.stopPropagation();
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    this.seek(i, Math.max(0, Math.min(0.98, (ev.clientX - r.left) / r.width)));
  }

  codeLines(S: State): { lines: Line[]; quoteDone: Record<string, boolean> } {
    const lines: Line[] = [];
    const indent =
      'padding-left:14px;margin-left:3px;border-left:1px solid var(--border)';
    let left = S.qChars;
    const quoteDone: Record<string, boolean> = {};
    const typed: string[] = [];
    QUOTE_CSS.forEach((q) => {
      if (left <= 0) return;
      const n = Math.min(left, q.txt.length);
      left -= q.txt.length;
      typed.push(q.txt.slice(0, n));
      if (n === q.txt.length) quoteDone[q.k] = true;
    });

    const decls: Token[][] = [];
    if (S.h1Size !== 32) {
      decls.push([
        tk('font-size', 'prop'),
        tk(': ', 'pl'),
        tk(`${S.h1Size}px`, 'num'),
        tk(';', 'pl'),
      ]);
    }
    if (S.h1Color) {
      decls.push([
        tk('color', 'prop'),
        tk(': ', 'pl'),
        {
          text: '',
          style: `display:inline-block;width:10px;height:10px;margin-right:3px;vertical-align:-1px;border:1px solid var(--ink);background:${S.h1Color}`,
        },
        tk(S.h1Color, 'val'),
        tk(';', 'pl'),
      ]);
    }
    if (decls.length) {
      lines.push({
        style: '',
        toks: [tk('article h1 ', 'sel'), tk('{', 'br')],
      });
      decls.forEach((toks) => lines.push({ style: indent, toks }));
      lines.push({ style: '', toks: [tk('}', 'br')] });
    } else if (!typed.length && !S.lookDone) {
      lines.push({ style: '', toks: [tk('/* No styles yet */', 'com')] });
    }
    if (typed.length) {
      const caret = {
        text: '',
        style:
          'display:inline-block;width:1.5px;height:13px;vertical-align:-2px;margin-left:1px;background:var(--acc)',
      };
      lines.push({
        style: 'margin-top:10px',
        toks: [tk('blockquote ', 'sel'), tk('{', 'br')],
      });
      typed.forEach((t, i) => {
        const ci = t.indexOf(':');
        const toks =
          ci < 0
            ? [tk(t, 'prop')]
            : [tk(t.slice(0, ci), 'prop'), tk(t.slice(ci), 'pl')];
        if (i === typed.length - 1 && S.qChars < QUOTE_TOTAL) toks.push(caret);
        lines.push({ style: indent, toks });
      });
      lines.push({ style: '', toks: [tk('}', 'br')] });
    }
    return { lines, quoteDone };
  }

  lookLines(css: [string, [string, string][]][]): Line[] {
    const hex = (v: string): Token[] =>
      /^#[0-9a-f]{6}$/i.test(v)
        ? [
            {
              text: '',
              style: `display:inline-block;width:9px;height:9px;margin-right:4px;vertical-align:-1px;border:1px solid var(--strong);background:${v}`,
            },
            tk(v, 'val'),
          ]
        : v
            .split(' ')
            .map((w, i, a) =>
              /^#/.test(w)
                ? tk(w, 'val')
                : tk(
                    w + (i < a.length - 1 ? ' ' : ''),
                    /^\d/.test(w) ? 'num' : 'val',
                  ),
            );
    const lines: Line[] = [];
    css.forEach(([sel, props]) => {
      lines.push({ style: '', toks: [tk(`${sel} `, 'sel'), tk('{', 'br')] });
      props.forEach(([p, v]) =>
        lines.push({
          style: 'padding-left:14px',
          toks: [tk(p, 'prop'), tk(': ', 'pl'), ...hex(v), tk(';', 'pl')],
        }),
      );
      lines.push({ style: '', toks: [tk('}', 'br')] });
    });
    return lines;
  }

  renderLines(lines: Line[]) {
    return lines.map((ln, i) => (
      <div key={i} style={ln.style}>
        {ln.toks.map((t, j) => (
          <span key={j} style={t.style}>
            {t.text}
          </span>
        ))}
      </div>
    ));
  }

  /**
   * The state as the current profile shows it: Default keeps the hand-written
   * styles, and the new profile starts clean and gets the look.
   */
  profileView(state: State): State {
    return state.profile === 'Default'
      ? { ...state, lookDone: false, lookStep: 0 }
      : { ...state, h1Size: 32, h1Color: null, qChars: 0 };
  }

  /**
   * Fills in the shortcut wherever a step or caption mentions it.
   */
  keysText(text: string, mac: boolean) {
    return text.replace('{keys}', mac ? '⌥⇧M' : 'Alt+Shift+M');
  }

  render(_: Props, state: State) {
    const S = this.profileView(state);
    const read = S.read;
    const step = S.lookDone ? LOOK_STEPS : S.lookStep;
    const at = (n: number) => step >= n;
    const dk = S.dark;
    const look = LOOKS[dk ? 'dark' : 'light'];
    const np = look.colors;
    const ink = at(1) ? np.ink : 'var(--page-ink)';
    const muted = at(4) ? np.muted : 'var(--page-muted)';
    const serif =
      at(2) && look.serif
        ? "'Newsreader',Georgia,serif"
        : read
          ? "Georgia,'Times New Roman',serif"
          : "'Helvetica Neue',Arial,sans-serif";
    const mark = (k: string) =>
      S.inspecting && S.hover === k
        ? ';background-color:rgba(111,168,220,.66)' +
          (k === 'h1' ? ';box-shadow:0 10px 0 0 rgba(246,178,107,.5)' : '')
        : '';
    const tr = ';transition:outline-color .2s';

    const { lines: codeLines, quoteDone: qd } = this.codeLines(S);
    const hasSel = !!S.sel && !S.inspecting;
    const sizeSet = S.h1Size !== 32;
    const computedInk = at(1) ? np.head : dk ? '#dfe2e7' : '#22252b';

    const tab = (k: string) => {
      const on = S.tab === k;
      const first = k === 'basic';
      const inset = first ? 0 : 6;
      return (
        `padding:6px 6px 8px ${inset}px;font:${on ? 600 : 400} 14px/1.3 var(--ui);margin-bottom:-1px;transition:color .15s;` +
        `background:${on ? `linear-gradient(var(--acc),var(--acc)) no-repeat ${inset}px 100% / calc(100% - ${inset + 6}px) 2px` : 'none'};` +
        `color:${on ? 'var(--ink)' : 'var(--muted)'}`
      );
    };
    const field = (f: string) =>
      'width:104px;height:30px;flex:none;border-radius:8px;display:flex;align-items:center;overflow:hidden;background:var(--hover);transition:box-shadow .15s;' +
      (S.focus === f
        ? 'box-shadow:0 0 0 1px var(--acc),0 0 0 4px rgba(42,95,214,.15)'
        : 'box-shadow:none');
    const toggle = (on: boolean) => ({
      track: `width:36px;height:20px;border-radius:10px;flex:none;position:relative;transition:background .2s;background:${on ? 'var(--acc)' : 'var(--strong)'}`,
      knob: `position:absolute;top:2px;left:${on ? 18 : 2}px;width:16px;height:16px;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.15);transition:left .2s`,
    });
    const readTog = toggle(read);
    const grayTog = toggle(S.gray);
    const selected = !S.inspecting && !!S.sel;
    const selText = selected ? 'article h1' : 'Pick an element';

    const quote =
      'margin:4px 0 18px;transition:all .35s' +
      (qd.bg || at(5)
        ? `;background:${at(5) ? np.panel : 'var(--page-quote)'}`
        : '') +
      (qd.pad || at(5) ? ';padding:18px 20px' : '') +
      (qd.radius || at(5) ? ';border-radius:8px' : '') +
      (qd.border || at(5)
        ? `;border-left:3px solid ${at(5) ? np.acc : 'var(--page-kicker)'}`
        : '');
    const quoteFont = at(5)
      ? `font-family:${serif};font-size:18px;font-style:italic;`
      : `font-family:${qd.font ? "'Lora',Georgia,serif" : serif};font-size:${qd.size ? '20px' : '16px'};font-style:${qd.size ? 'italic' : 'normal'};`;

    const steps = this.scenes.map((sc, i) => {
      const doneStep = S.done || i < S.scene;
      const active = !S.done && i === S.scene;
      return {
        title: sc.title,
        body: this.keysText(sc.body, S.mac),
        mark: doneStep ? '✓' : String(i + 1),
        state: doneStep ? 'is-done' : active ? 'is-active' : '',
        titleStyle:
          `font:${active ? 600 : 500} 13.5px/1.35 var(--ui);padding-top:2px;color:` +
          (doneStep ? 'var(--muted)' : active ? 'var(--ink)' : 'var(--faint)'),
        barStyle:
          `height:2px;background:var(--acc);width:${doneStep ? 100 : active ? S.pct * 100 : 0}%;transition:` +
          (active && S.anim ? `width ${S.remain}ms linear` : 'none'),
      };
    });

    const stage = (
      <div
        ref={this.stageRef}
        class="demo-stage"
        style={
          (S.scale < 1 ? `height:${S.stageHeight}px;` : '') +
          (S.fitWidth ? `width:${S.fitWidth}px;align-self:center` : '')
        }
      >
        <div
          ref={this.paneRef}
          class="demo-pane"
          style={
            S.scale < 1
              ? `width:${S.paneWidth}px;transform:scale(${S.scale})`
              : ''
          }
        >
          <div class="demo-chrome">
            <div style="display:flex;gap:5px">
              <span class="demo-light" />
              <span class="demo-light" />
              <span class="demo-light" />
            </div>
            <div class="demo-url">harbourpost.example/travel/night-ferry</div>
            <div
              data-t="sbicon"
              style={
                'height:28px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;transition:width .3s,opacity .3s,background .15s;' +
                `width:${S.pinned ? 28 : 0}px;opacity:${S.pinned ? 1 : 0}` +
                (S.popOpen || S.editorOpen ? ';background:var(--strong)' : '')
              }
            >
              <SbIcon size={20} nudgeX={1} />
            </div>
            <div
              data-t="puzzle"
              class="demo-puzzle"
              style={S.menuOpen ? 'background:var(--strong)' : ''}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
              >
                <rect x="1" y="1" width="5" height="5" rx="1" />
                <rect x="8" y="1" width="5" height="5" rx="1" />
                <rect x="1" y="8" width="5" height="5" rx="1" />
                <rect x="8" y="8" width="5" height="5" rx="1" />
              </svg>
            </div>
            <span class="demo-avatar" />
          </div>

          <div
            class="demo-menu"
            style={
              S.menuOpen
                ? 'opacity:1;transform:scale(1)'
                : 'opacity:0;transform:scale(.96);pointer-events:none'
            }
          >
            <div class="demo-menu-head">
              <span>Extensions</span>
            </div>
            <div class="demo-menu-note">
              <strong>Full access</strong>
              <span>
                These extensions can see and change information on this site.
              </span>
            </div>
            {EXTENSIONS.map(([name, bg]) => {
              const sb = !bg;
              const on = sb && S.pinned;
              return (
                <div key={name} class="demo-menu-row">
                  {sb ? (
                    <SbIcon size={20} nudgeX={1} />
                  ) : (
                    <span class="demo-menu-icon" style={`background:${bg}`} />
                  )}
                  <span class="demo-menu-name">{name}</span>
                  <span
                    data-t={sb ? 'pin' : undefined}
                    class="demo-menu-pin"
                    style={`color:${on ? 'var(--acc)' : 'var(--muted)'}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill={on ? 'var(--acc)' : 'none'}
                      stroke="currentColor"
                      stroke-width="1.3"
                      stroke-linejoin="round"
                    >
                      <path d="M4.5 1.5h5l-.6 4 2.1 2.2H3l2.1-2.2z" />
                      <path d="M7 7.7v4.8" fill="none" stroke-linecap="round" />
                    </svg>
                  </span>
                </div>
              );
            })}
          </div>

          <div
            data-ed="1"
            class="demo-popup"
            style={
              S.popOpen
                ? 'opacity:1;transform:scale(1)'
                : 'opacity:0;transform:scale(.97);pointer-events:none'
            }
          >
            <div class="demo-pop-head">
              <span class="demo-pop-site">harbourpost.example</span>
              <span class="demo-pop-gear">
                <Gear />
              </span>
            </div>
            <div class="demo-pop-sep" />
            <div style="padding:8px 6px">
              <div class="demo-pop-row">
                <span style="flex:1;min-width:0">Readability</span>
                <span style="width:28px;height:16px;border-radius:8px;background:var(--strong);position:relative;flex:none">
                  <span style="position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:6px;background:#fff" />
                </span>
              </div>
            </div>
            <div class="demo-pop-sep" />
            <div style="display:flex;padding:10px 12px 12px">
              <span
                data-t="style-btn"
                class="demo-style-btn"
                style={`background:${S.popHover ? (S.clicking ? 'var(--track)' : 'var(--hover)') : 'var(--surface)'}`}
              >
                <span />
                <span style="text-align:center">Style this page</span>
                <span
                  class="demo-shortcut"
                  style={`opacity:${S.popHover ? 1 : 0}`}
                >
                  {S.mac ? '⌥⇧M' : 'Alt+Shift+M'}
                </span>
              </span>
            </div>
          </div>

          <div class="demo-page-row">
            <div
              class="demo-page"
              style={`background:${at(1) ? np.bg : 'var(--page-bg)'};filter:${S.gray ? 'grayscale(1)' : 'none'}`}
            >
              <div
                data-t="header"
                style={
                  'position:relative;z-index:2;display:flex;gap:16px;align-items:center;padding:14px 28px;font-size:15px;border-bottom:1px solid ' +
                  (at(2) ? np.line : 'var(--page-line)') +
                  ';background:' +
                  (at(2) ? np.panel : 'var(--page-bar)') +
                  `;color:${ink};font-family:${serif}` +
                  tr +
                  mark('header')
                }
              >
                <span style="font-weight:700;letter-spacing:-.01em;white-space:nowrap">
                  The Harbour Post
                </span>
                <span style="margin-left:auto;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px 16px;opacity:.75;white-space:nowrap">
                  <span>News</span>
                  <span>Travel</span>
                  <span>Sign in</span>
                </span>
                {S.inspecting && S.hover === 'header' && (
                  <PickCard selector="header.site-header" dark={dk} />
                )}
              </div>
              <div style="padding:26px 28px 36px">
                <div
                  style={`flex:1 1 260px;min-width:0;transition:max-width .3s;max-width:${read ? '32em' : '60em'}`}
                >
                  <div
                    style={
                      "margin:0 0 10px;font:700 11px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:" +
                      (at(3) ? np.acc : 'var(--page-kicker)') +
                      ';transition:color .5s'
                    }
                  >
                    Travel · Long read
                  </div>
                  <div style="position:relative">
                    <h2
                      data-t="h1"
                      style={
                        `margin:0 0 10px;font-family:${serif};font-weight:${at(3) ? 600 : 700};line-height:1.15;letter-spacing:${at(3) ? '-.02em' : '-.01em'};font-size:${S.h1Size}px;color:` +
                        (at(3)
                          ? np.head
                          : S.h1Color
                            ? dk
                              ? '#ef6b6b'
                              : S.h1Color
                            : ink) +
                        tr +
                        mark('h1')
                      }
                    >
                      The quiet return of the night ferry
                    </h2>
                    {S.inspecting && S.hover === 'h1' && (
                      <PickCard selector="h1.headline" dark={dk} />
                    )}
                  </div>
                  <div
                    style={`margin:0 0 16px;font:400 16px/1.5 ${serif};color:${muted};transition:color .5s`}
                  >
                    Three operators are betting that travelers will trade speed
                    for a cabin, a sea view and no airport.
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;margin:0 0 18px">
                    <span
                      style={
                        "width:26px;height:26px;border-radius:13px;flex:none;display:flex;align-items:center;justify-content:center;font:700 10px/1 'Helvetica Neue',Arial,sans-serif;color:#fff;background:" +
                        (at(3) ? np.avatar : '#3d5a80') +
                        ';transition:background .5s'
                      }
                    >
                      ML
                    </span>
                    <span style={`font:400 12.5px/1.4 ${serif};color:${muted}`}>
                      Marta Linde · Sep 24 · 6 min read
                    </span>
                  </div>
                  <p style={this.paragraph(read, serif, ink, tr)}>
                    Twenty years after the last overnight crossing was cut,
                    three operators are putting cabins back on the water. The
                    pitch is simple: board after dinner, sleep through the
                    crossing, and wake up in another country.
                  </p>
                  <div data-t="quote" style={quote}>
                    <div
                      style={
                        quoteFont +
                        `line-height:1.45;text-wrap:pretty;color:${ink};transition:all .35s`
                      }
                    >
                      “Nobody books this to save time. They book it to lose a
                      little.”
                    </div>
                    <div
                      style={`margin-top:8px;font:400 12.5px/1.3 ${serif};color:${muted}`}
                    >
                      — Ines Varga, route planner
                    </div>
                  </div>
                  <p style={this.paragraph(read, serif, ink, tr)}>
                    Bookings on the first reopened line sold out for the summer
                    within a week. Most passengers are under forty, and many
                    have never taken a sleeper of any kind. Operators say the
                    cabins fill first, then the reclining seats, then the deck.
                  </p>
                </div>
              </div>
            </div>

            <div
              data-ed="1"
              class="demo-editor-wrap"
              style={`width:${S.editorOpen ? 378 : 0}px`}
            >
              <div class="demo-editor">
                <div class="demo-side-bar">
                  <SbIcon size={16} />
                  <span class="demo-side-name">Stylebot</span>
                  <ChevronDown />
                  <span class="demo-side-icon" style="margin-left:auto">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M9.5 2.5 13.5 6.5 11 7.5 8.5 10 8 13 3 8 6 7.5 8.5 5z" />
                      <path d="M5.5 10.5 2.5 13.5" />
                    </svg>
                  </span>
                  <span class="demo-side-icon">
                    <Close size={12} />
                  </span>
                </div>
                <div class="demo-ed-body">
                  <div class="demo-ed-head">
                    <span class="demo-ed-site">harbourpost.example</span>
                    <span style="flex:none;font:400 13px/1 var(--ui);color:var(--faint)">
                      /
                    </span>
                    <span style="position:relative;display:flex">
                      <span
                        data-t="prof-btn"
                        class="demo-prof-btn"
                        style={S.profMenu ? 'background:var(--hover)' : ''}
                      >
                        {S.profile}
                        <span style="display:flex;color:var(--muted)">
                          <ChevronDown />
                        </span>
                      </span>
                      <div
                        class="demo-prof-menu"
                        style={
                          S.profMenu
                            ? 'opacity:1;transform:scale(1)'
                            : 'opacity:0;transform:scale(.97);pointer-events:none'
                        }
                      >
                        {S.profiles.map((name) => {
                          const on = name === S.profile;
                          return (
                            <div
                              key={name}
                              data-t={`prof-${name}`}
                              class="demo-prof-row"
                              style={
                                on
                                  ? 'font-weight:600;background:var(--hover)'
                                  : ''
                              }
                            >
                              <span
                                class="demo-prof-check"
                                style={`opacity:${on ? 1 : 0}`}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.6"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                >
                                  <path d="M2.5 6.2 5 8.6 9.5 3.5" />
                                </svg>
                              </span>
                              <span>{name}</span>
                            </div>
                          );
                        })}
                        <div class="demo-prof-sep" />
                        {S.profCreating ? (
                          <div class="demo-prof-input">
                            <span>{NEW_PROFILE.slice(0, S.profLen)}</span>
                            <span class="demo-caret" />
                          </div>
                        ) : (
                          <div
                            data-t="prof-create"
                            class="demo-prof-row"
                            style="padding-left:32px;color:var(--muted)"
                          >
                            Create profile
                          </div>
                        )}
                      </div>
                    </span>
                    <span class="demo-ed-more">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <circle cx="3.5" cy="8" r="1.3" />
                        <circle cx="8" cy="8" r="1.3" />
                        <circle cx="12.5" cy="8" r="1.3" />
                      </svg>
                    </span>
                  </div>

                  <div style="flex:none;display:flex;align-items:center;gap:8px;padding:4px 16px">
                    <span
                      data-t="picker"
                      class="demo-picker"
                      style={
                        S.inspecting
                          ? 'background:var(--acc);color:#fff'
                          : 'background:var(--hover);color:var(--ink)'
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
                        <path
                          d="M11 11l9.5 3.6-4.2 1.7-1.7 4.2z"
                          fill="currentColor"
                        />
                        <path d="M16.6 16.6l4.4 4.4" />
                      </svg>
                    </span>
                    <div class="demo-sel-field">
                      <span
                        style={
                          'flex:1;min-width:0;padding:0 12px;font:400 13px/1 var(--mono);overflow:hidden;white-space:nowrap;color:' +
                          (selected ? 'var(--ink)' : 'var(--faint)')
                        }
                      >
                        {selText}
                      </span>
                      {selected && (
                        <span class="demo-sel-icon">
                          <Close size={11} />
                        </span>
                      )}
                      <span class="demo-sel-icon">
                        <ChevronDown />
                      </span>
                    </div>
                  </div>

                  <div style="flex:none;display:flex;align-items:flex-end;gap:6px;padding:16px 16px 0;border-bottom:1px solid var(--border)">
                    <span data-t="tab-basic" style={tab('basic')}>
                      Basic
                    </span>
                    <span data-t="tab-code" style={tab('code')}>
                      Code
                    </span>
                    <span data-t="tab-presets" style={tab('presets')}>
                      Presets
                    </span>
                    <span data-t="tab-chat" style={tab('chat')}>
                      Chat
                    </span>
                  </div>

                  <div style="flex:1;min-height:0;overflow:hidden;background:var(--fill)">
                    {S.tab === 'basic' && (
                      <div style="padding:10px 6px 16px;display:flex;flex-direction:column;gap:8px">
                        <div style="display:flex;justify-content:flex-end;gap:6px">
                          <span
                            class="demo-small-btn"
                            style={`color:${hasSel ? 'var(--ink2)' : 'var(--faint)'}`}
                          >
                            <EyeOff size={12} />
                            Hide
                          </span>
                          <span
                            class="demo-small-btn"
                            style={`color:${hasSel ? 'var(--ink2)' : 'var(--faint)'}`}
                          >
                            Reset
                          </span>
                        </div>
                        <div class="demo-card" style="padding:0 14px 8px">
                          <div style="display:flex;align-items:center;height:42px;font:600 13.5px/1 var(--ui);color:var(--ink2)">
                            <span style="flex:1">Text</span>
                            <span style="color:var(--muted);display:flex;transform:rotate(180deg)">
                              <ChevronDown />
                            </span>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Font</span>
                            <div
                              data-t="font-field"
                              class="demo-field"
                              style="width:160px;gap:6px;padding:0 10px;color:var(--muted)"
                            >
                              <span class="demo-field-text">
                                {hasSel
                                  ? serif.split(',')[0].replace(/'/g, '')
                                  : 'Default'}
                              </span>
                              <ChevronDown />
                            </div>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Size</span>
                            <div data-t="size" style={field('size')}>
                              <span
                                style={`flex:1;padding:0 10px;font:400 12.5px/1 var(--ui);color:${sizeSet ? 'var(--ink)' : 'var(--faint)'}`}
                              >
                                {sizeSet || hasSel ? String(S.h1Size) : '—'}
                              </span>
                              <span class="demo-unit">px</span>
                            </div>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Line Height</span>
                            <div style={field('lh')}>
                              <span style="flex:1;padding:0 10px;font:400 12.5px/1 var(--ui);color:var(--faint)">
                                {hasSel
                                  ? String(Math.round(S.h1Size * 1.15))
                                  : '—'}
                              </span>
                              <span class="demo-unit">px</span>
                            </div>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Color</span>
                            <div data-t="color" style={field('color')}>
                              <span
                                class="demo-swatch"
                                style={`background:${S.h1Color || (hasSel ? computedInk : 'repeating-linear-gradient(135deg,transparent 0 3px,var(--strong) 3px 4px)')}`}
                              />
                              <span
                                style={`flex:1;padding:0 8px;font:400 12px/1 var(--mono);color:${S.h1Color ? 'var(--ink)' : 'var(--faint)'}`}
                              >
                                {S.h1Color || (hasSel ? computedInk : '—')}
                              </span>
                            </div>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Decoration</span>
                            <div
                              class="demo-seg"
                              style="font:400 12.5px/1 var(--ui)"
                            >
                              <span style="padding:6px 8px;text-decoration:underline">
                                U
                              </span>
                              <span style="padding:6px 8px;text-decoration:line-through">
                                S
                              </span>
                              <span style="padding:6px 8px;text-decoration:overline">
                                A
                              </span>
                              <span style="padding:6px 8px">None</span>
                            </div>
                          </div>
                          <div class="demo-row">
                            <span class="demo-label">Alignment</span>
                            <div class="demo-seg">
                              {[
                                'M1 1.5h11M1 5.5h7M1 9.5h9',
                                'M1 1.5h11M3 5.5h7M2 9.5h9',
                                'M1 1.5h11M5 5.5h7M3 9.5h9',
                              ].map((d) => (
                                <span
                                  key={d}
                                  style="padding:6px 9px;display:flex"
                                >
                                  <svg
                                    width="13"
                                    height="11"
                                    viewBox="0 0 13 11"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                    stroke-linecap="round"
                                  >
                                    <path d={d} />
                                  </svg>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {[
                          'Background',
                          'Box',
                          'Effects',
                          'More properties',
                        ].map((g) => (
                          <div key={g} class="demo-card demo-group">
                            <span style="flex:1">{g}</span>
                            <span style="color:var(--muted);display:flex">
                              <ChevronDown />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {S.tab === 'code' && (
                      <div
                        data-t="code"
                        style="height:100%;overflow:hidden;background:var(--surface);font:400 12px/1.75 var(--mono)"
                      >
                        <div style="padding:12px 14px 40px">
                          {this.renderLines(codeLines)}
                          {S.lookDone &&
                            this.renderLines(this.lookLines(look.css))}
                        </div>
                      </div>
                    )}

                    {S.tab === 'presets' && (
                      <div style="padding:12px;display:flex;flex-direction:column;gap:10px">
                        <div class="demo-card" style="padding:14px 16px">
                          <div style="display:flex;align-items:center;gap:12px">
                            <span style="font:600 14px/1.2 var(--ui);color:var(--ink)">
                              Readability
                            </span>
                            <span style={readTog.track}>
                              <span style={readTog.knob} />
                            </span>
                            <span style="margin-left:auto;font:400 12px/1 var(--ui);color:var(--muted)">
                              Articles only
                            </span>
                          </div>
                          <div class="demo-card-body">
                            Turn this site's articles into a clean,
                            distraction-free reading view, with your choice of
                            theme, font, and size.
                          </div>
                        </div>
                        <div class="demo-card" style="padding:14px 16px">
                          <div style="display:flex;align-items:center;gap:12px">
                            <span style="font:600 14px/1.2 var(--ui);color:var(--ink)">
                              Grayscale
                            </span>
                            <span style={grayTog.track}>
                              <span style={grayTog.knob} />
                            </span>
                          </div>
                          <div class="demo-card-body">
                            Apply grayscale to the page.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="demo-caption">
            <span class="demo-step-label">
              {S.scene + 1} / {this.scenes.length}
            </span>
            <span aria-live="polite" style="flex:1;min-width:0">
              {this.keysText(S.caption, S.mac)}
            </span>
          </div>

          <div
            class="demo-cursor"
            style={`left:${S.cx}px;top:${S.cy}px;transform:scale(${S.clicking ? 0.86 : 1})`}
          >
            <svg width="18" height="22" viewBox="0 0 18 22">
              <path
                d="M1 1 L1 17 L5.5 13 L8.5 20 L11.5 18.8 L8.6 12 L14.5 12 Z"
                fill="#191b1f"
                stroke="#fff"
                stroke-width="1.4"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div
            class="demo-ripple"
            style={
              `left:${S.rx}px;top:${S.ry}px;` +
              (S.clicking
                ? 'opacity:.6;transform:scale(.4);transition:none'
                : 'opacity:0;transform:scale(1.3);transition:opacity .45s,transform .45s')
            }
          />
        </div>
      </div>
    );

    const narrow = S.fitWidth && !S.split;
    const fitted = narrow ? `width:${S.fitWidth}px;align-self:center` : '';

    return (
      <div
        ref={this.rootRef}
        class={this.welcome ? 'demo demo-welcome' : 'demo'}
      >
        {this.props.intro && <div class="demo-intro">{this.props.intro}</div>}
        <div ref={this.mainRef} class="demo-main">
          {stage}
        </div>
        <div ref={this.stepsRef} class="demo-steps-wrap" style={fitted}>
          <div class="demo-steps-head">How it works</div>
          <ol
            class="demo-steps"
            style={
              narrow
                ? `grid-template-columns:repeat(${steps.length},minmax(0,1fr))`
                : ''
            }
          >
            {steps.map((s, i) => (
              <li
                key={s.title}
                class={`demo-step ${s.state}`}
                onClick={() => this.jump(i)}
              >
                <div
                  class="demo-step-bar"
                  title="Jump to this point"
                  onClick={(ev: MouseEvent) => this.seekFromBar(i, ev)}
                >
                  <div class="demo-step-track">
                    <div style={s.barStyle} />
                  </div>
                </div>
                <span class="demo-step-mark">{s.mark}</span>
                <button class="demo-step-title" style={s.titleStyle}>
                  {s.title}
                </button>
                <div class="demo-step-body">{s.body}</div>
              </li>
            ))}
          </ol>
        </div>
        {this.props.children && (
          <div ref={this.belowRef} class="demo-below" style={fitted}>
            {this.props.children}
          </div>
        )}
      </div>
    );
  }

  paragraph(read: boolean, serif: string, ink: string, tr: string) {
    return `margin:0 0 16px;font-size:${read ? 18 : 16}px;font-family:${serif};line-height:${read ? '1.75' : '1.55'};color:${ink}${tr}`;
  }
}
