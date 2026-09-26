import { Component, createRef, type JSX } from 'preact';
import SbIcon from '../SbIcon';
import './demo.css';
import { isDarkTheme } from '../../lib/themes';
import { currentTheme } from '../../lib/theme-state';
import {
  AGENT_CSS,
  CHAT_MSG,
  INIT,
  KEY_LEN,
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
  scale: number;
  stageHeight: number;
};

type Token = { text: string; style: string };
type Step = {
  title: string;
  body: string;
  active: boolean;
  mark: string;
  dotClass: string;
  titleStyle: string;
  barStyle: string;
};
type Line = { style: string; toks: Token[] };

const PANE_WIDTH = { landing: 980, welcome: 620 };
const PLAYBACK_KEYS = new Set(['cur', 'click', 'chatType', 'keyType', 'qType']);

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

const ToolbarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 64 64"
    style="display:block;flex:none;transform:translateX(1px)"
    aria-hidden="true"
  >
    <rect x="6" y="12" width="44" height="10" rx="5" fill="#ec4d86" />
    <rect x="6" y="28" width="30" height="10" rx="5" fill="#1c9fc4" />
    <rect x="6" y="44" width="36" height="10" rx="5" fill="#e0a218" />
    <rect x="47" y="41" width="4.5" height="16" rx="2" fill="#2563eb" />
  </svg>
);

/**
 * The inspector tooltip shown under a hovered element: its selector, and the
 * parent that the up-arrow key would select instead.
 */
function PickCard({ selector, parent }: { selector: string; parent: string }) {
  return (
    <div class="demo-pick-card">
      <span class="demo-pick-arrow" />
      <span class="demo-pick-chip">{selector}</span>
      <span class="demo-pick-rule" />
      <div class="demo-pick-parent">
        <kbd>↑</kbd>
        <span class="demo-pick-chip is-muted">{parent}</span>
      </div>
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

const ChevronDown = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M2 3.5 5 6.5 8 3.5" />
  </svg>
);

const SmallChevron = () => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  >
    <path d="M2 3.5 5 6.5 8 3.5" />
  </svg>
);

type Props = {
  variant?: 'landing' | 'welcome';
  heading?: string;
  lede?: string;
};

/**
 * The hero walkthrough: a scripted browser window that plays through opening
 * the editor, picking an element, editing it, writing CSS, and asking the
 * agent. The welcome variant starts by pinning Stylebot, shows the steps in a
 * sidebar and stops at the end instead of looping.
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

  get paneWidth() {
    return PANE_WIDTH[this.welcome ? 'welcome' : 'landing'];
  }

  paneRef = createRef<HTMLDivElement>();
  artRef = createRef<HTMLDivElement>();
  stageRef = createRef<HTMLDivElement>();
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
    scale: 1,
    stageHeight: 0,
  };

  onTheme = () => this.setState({ dark: isDarkTheme(currentTheme()) });

  /**
   * Below the pane's natural width, the demo is laid out at a fixed width and
   * scaled down as a whole, so the page and editor keep their proportions.
   */
  fit = () => {
    const stage = this.stageRef.current;
    const pane = this.paneRef.current;
    if (!stage || !pane) return;
    const scale = Math.min(1, stage.clientWidth / this.paneWidth);
    this.setState({ scale, stageHeight: pane.offsetHeight * scale });
  };

  componentDidMount() {
    this.onTheme();
    window.addEventListener('themechange', this.onTheme);
    this.fit();
    this.resizeObserver = new ResizeObserver(this.fit);
    if (this.stageRef.current)
      this.resizeObserver.observe(this.stageRef.current);
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
    this.startId = setTimeout(() => this.play(0, 0), 600);
  }

  componentWillUnmount() {
    this.clear();
    clearTimeout(this.startId);
    window.removeEventListener('themechange', this.onTheme);
    this.resizeObserver?.disconnect();
  }

  clear() {
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
        this.later(i * 34 * k + Math.floor(i / 22) * 260 * k, () =>
          this.setState({ qChars: i }),
        );
      }
    }
    if (patch.keyType) {
      for (let i = 1; i <= KEY_LEN; i++) {
        this.later(i * 38 * k, () => this.setState({ keyLen: i }));
      }
    }
    if (patch.chatType) {
      for (let i = 1; i <= CHAT_MSG.length; i++) {
        this.later(i * 26 * k, () => this.setState({ chatDraft: i }));
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
      keys: false,
      keyDown: false,
      popOpen: false,
      menuOpen: false,
      focus: null,
      codeScroll: false,
    });
    if (this.scenes.slice(0, i).some((sc) => sc.acts.some(([, p]) => p.qType)))
      s.qChars = QUOTE_TOTAL;
    if (
      this.scenes.slice(0, i).some((sc) => sc.acts.some(([, p]) => p.keyType))
    )
      s.keyLen = KEY_LEN;
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
      chatType: () => ({ chatDraft: CHAT_MSG.length }),
      keyType: () => ({ keyLen: KEY_LEN }),
      qType: () => ({ qChars: QUOTE_TOTAL }),
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

  codeLines(): { lines: Line[]; quoteDone: Record<string, boolean> } {
    const S = this.state;
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
    } else if (!typed.length) {
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

  agentLines(): Line[] {
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
    AGENT_CSS.forEach(([sel, props]) => {
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

  render(_: Props, S: State) {
    const read = S.read;
    const ag = S.agentTheme;
    const dk = S.dark;
    const ink = ag ? '#d3c6aa' : dk ? '#dfe2e7' : '#22252b';
    const muted = ag ? '#859289' : dk ? '#8f96a3' : '#6b7280';
    const serif = ag
      ? "'Lora',Georgia,serif"
      : read
        ? "Georgia,'Times New Roman',serif"
        : "'Helvetica Neue',Arial,sans-serif";
    const headF = ag ? "'Newsreader',Georgia,serif" : serif;
    const mark = (k: string) =>
      S.inspecting && S.hover === k
        ? ';background-color:rgba(111,168,220,.66)' +
          (k === 'h1' ? ';box-shadow:0 10px 0 0 rgba(246,178,107,.5)' : '')
        : '';
    const tr =
      ';transition:font-size .25s,color .25s,background .3s,outline-color .2s';

    const { lines: codeLines, quoteDone: qd } = this.codeLines();
    const agentLines = this.agentLines();
    const hasSel = !!S.sel;
    const sizeSet = S.h1Size !== 32;

    const tab = (k: string) =>
      'padding:0 0 10px;font:400 14px/1 var(--ui);margin-bottom:-1px;border-bottom:2px solid ' +
      (S.tab === k
        ? 'var(--acc);color:var(--ink)'
        : 'transparent;color:var(--muted)');
    const field = (f: string, w: number) =>
      `width:${w}px;height:28px;flex:none;border-radius:8px;display:flex;align-items:center;overflow:hidden;background:var(--surface);transition:border-color .15s,box-shadow .15s;` +
      (S.focus === f
        ? 'border:1px solid var(--acc);box-shadow:0 0 0 3px rgba(42,95,214,.15)'
        : 'border:1px solid var(--strong)');
    const toggle = (on: boolean) => ({
      track: `width:36px;height:20px;border-radius:10px;flex:none;position:relative;transition:background .2s;background:${on ? 'var(--acc)' : 'var(--strong)'}`,
      knob: `position:absolute;top:2px;left:${on ? 18 : 2}px;width:16px;height:16px;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.15);transition:left .2s`,
    });
    const readTog = toggle(read);
    const grayTog = toggle(S.gray);
    const keyCap =
      'padding:5px 10px;border-radius:6px;font:500 13px/1.3 var(--mono);transition:all .12s;' +
      (S.keyDown
        ? 'background:var(--acctint);border:1px solid var(--acc);border-bottom-width:1px;color:var(--acc);transform:translateY(1px)'
        : 'background:var(--fill);border:1px solid var(--strong);border-bottom-width:2px;color:var(--ink2)');
    const selected = !S.inspecting && !!S.sel;
    const selText = selected ? 'article h1' : 'Pick an element';
    const isChat = S.tab === 'chat' && S.keyOk;
    const needsKey = S.tab === 'chat' && !S.keyOk;
    const loadText = ['Reading the page…', 'Picking colours…', 'Writing CSS…'][
      Math.min(2, Math.floor(S.thinkT / 400))
    ];
    const provOn =
      'flex:1;text-align:center;padding:7px 0;border-radius:7px;font:600 12.5px/1 var(--ui);background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)';
    const provOff =
      'flex:1;text-align:center;padding:7px 0;border-radius:7px;font:400 12.5px/1 var(--ui);color:var(--muted)';

    const quote =
      'margin:4px 0 18px;transition:all .35s' +
      (qd.bg
        ? `;background:${ag ? '#343f44' : dk ? '#23262c' : '#faf4ee'}`
        : '') +
      (qd.pad ? ';padding:18px 20px' : '') +
      (qd.radius ? ';border-radius:8px' : '') +
      (qd.border
        ? `;border-left:3px solid ${ag ? '#e69875' : dk ? '#e2795f' : '#c2410c'}`
        : '');

    const steps = this.scenes.map((sc, i) => {
      const doneStep = S.done || i < S.scene;
      const active = !S.done && i === S.scene;
      return {
        title: sc.title,
        body: sc.body,
        active,
        mark: doneStep ? '✓' : String(i + 1),
        dotClass: doneStep ? 'is-done' : active ? 'is-active' : '',
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
        style={S.scale < 1 ? `height:${S.stageHeight}px` : ''}
      >
        <div
          ref={this.paneRef}
          class="demo-pane"
          style={
            S.scale < 1
              ? `width:${this.paneWidth}px;transform:scale(${S.scale})`
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
              <ToolbarIcon />
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
                    <ToolbarIcon />
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
            <div style="padding:14px 16px 12px;border-bottom:1px solid var(--border)">
              <div style="font:600 14.5px/1.2 var(--ui);color:var(--ink)">
                harbourpost.example
              </div>
              <div style="margin-top:5px;font:400 12.5px/1.3 var(--ui);color:var(--muted)">
                No style saved for this site
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
              <span style="width:28px;height:16px;border-radius:8px;background:var(--strong);position:relative;flex:none">
                <span style="position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:6px;background:#fff" />
              </span>
              <span style="flex:1;font:400 13.5px/1.2 var(--ui);color:var(--ink)">
                Readability
              </span>
              <span style="font:500 11.5px/1 var(--mono);color:var(--muted)">
                ⌥R
              </span>
            </div>
            <div style="display:flex;gap:8px;padding:10px 12px 12px">
              <span
                data-t="style-btn"
                style={
                  'flex:1;height:38px;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:8px;border:1px solid var(--strong);font:600 13px/1 var(--ui);color:var(--ink);transition:background .1s;background:' +
                  (S.clicking && S.popOpen ? 'var(--track)' : 'var(--surface)')
                }
              >
                <span style="flex:1;text-align:center">Style this page</span>
                <span style="font:500 11.5px/1 var(--mono);color:var(--muted)">
                  ⌥⇧M
                </span>
              </span>
              <span style="width:40px;height:38px;border-radius:8px;border:1px solid var(--strong);display:flex;align-items:center;justify-content:center;color:var(--muted)">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                >
                  <path d="M2 5h12M2 11h12" />
                  <circle cx="10" cy="5" r="1.8" fill="var(--surface)" />
                  <circle cx="6" cy="11" r="1.8" fill="var(--surface)" />
                </svg>
              </span>
            </div>
          </div>

          <div class="demo-page-row">
            <div
              class="demo-page"
              style={`background:${ag ? '#2d353b' : dk ? '#17191d' : '#fff'};filter:${S.gray ? 'grayscale(1)' : 'none'}`}
            >
              <div
                data-t="header"
                style={
                  'position:relative;z-index:2;display:flex;gap:16px;align-items:center;padding:14px 28px;font-size:15px;border-bottom:1px solid ' +
                  (ag ? '#859289' : dk ? '#2a2d33' : '#e5e5e5') +
                  ';background:' +
                  (ag ? '#343f44' : dk ? '#1e2126' : '#fafafa') +
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
                  <PickCard selector="header.site-header" parent="div.page" />
                )}
              </div>
              <div
                ref={this.artRef}
                style={`padding:26px 28px 36px;transition:transform .7s cubic-bezier(.4,0,.2,1);transform:translateY(-${this.artShift()}px)`}
              >
                <div
                  style={`flex:1 1 260px;min-width:0;transition:max-width .3s;max-width:${read ? '32em' : '60em'}`}
                >
                  <div
                    style={
                      "margin:0 0 10px;font:700 11px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:" +
                      (ag ? '#a7c080' : dk ? '#e2795f' : '#c2410c') +
                      ';transition:color .5s'
                    }
                  >
                    Travel · Long read
                  </div>
                  <div style="position:relative">
                    <h2
                      data-t="h1"
                      style={
                        `margin:0 0 10px;font-family:${headF};font-weight:${ag ? 600 : 700};line-height:1.15;letter-spacing:${ag ? '-.02em' : '-.01em'};font-size:${S.h1Size}px;color:` +
                        (ag
                          ? '#e69875'
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
                      <PickCard selector="h1.headline" parent="article.story" />
                    )}
                  </div>
                  <div
                    style={`margin:0 0 16px;font:400 16px/1.5 ${serif};color:${muted};transition:color .5s`}
                  >
                    Three operators are betting that travellers will trade speed
                    for a cabin, a sea view and no airport.
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;margin:0 0 18px">
                    <span
                      style={
                        "width:26px;height:26px;border-radius:13px;flex:none;display:flex;align-items:center;justify-content:center;font:700 10px/1 'Helvetica Neue',Arial,sans-serif;color:#fff;background:" +
                        (ag ? '#83c092' : '#3d5a80') +
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
                        `font-family:${qd.font ? "'Lora',Georgia,serif" : serif};font-size:${qd.size ? '20px' : '16px'};font-style:${qd.size ? 'italic' : 'normal'};` +
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
              style={`--mono:'Fira Code',ui-monospace,monospace;width:${S.editorOpen ? 362 : 0}px`}
            >
              <div class="demo-editor">
                <div style="flex:none;height:46px;display:flex;align-items:center;gap:4px;padding:0 8px 0 16px;border-bottom:1px solid var(--border)">
                  <span style="flex:1;min-width:0;font:400 13.5px/1 var(--ui);color:var(--ink2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">
                    harbourpost.example
                  </span>
                  <span class="demo-ed-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.3"
                      stroke-linecap="round"
                    >
                      <circle cx="8" cy="8" r="2.8" />
                      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
                    </svg>
                  </span>
                  <span class="demo-ed-icon">
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
                  <span class="demo-ed-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                    >
                      <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
                    </svg>
                  </span>
                </div>

                <div style="flex:none;padding:12px 14px 0;display:flex;gap:8px;align-items:center">
                  <span
                    data-t="picker"
                    style={
                      'width:40px;height:40px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:all .15s;' +
                      (S.inspecting
                        ? 'background:#2f62de;color:#fff'
                        : 'background:#e9ebef;color:#191b1f')
                    }
                  >
                    <svg
                      width="19"
                      height="19"
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
                  <div style="flex:1;min-width:0;height:38px;border-radius:9px;border:1px solid var(--strong);display:flex;align-items:center;overflow:hidden">
                    <span
                      style={
                        'flex:1;min-width:0;padding:0 12px;font:400 12.5px/1 var(--mono);overflow:hidden;white-space:nowrap;color:' +
                        (selected ? 'var(--ink)' : 'var(--faint)')
                      }
                    >
                      {selText}
                    </span>
                    <span style="width:32px;height:100%;flex:none;border-left:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--faint)">
                      <ChevronDown />
                    </span>
                  </div>
                </div>

                <div style="flex:none;display:flex;gap:20px;padding:14px 16px 0;border-bottom:1px solid var(--border)">
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
                    <div style="padding:12px 12px 16px;display:flex;flex-direction:column;gap:8px">
                      <div style="display:flex;justify-content:flex-end;gap:6px">
                        <span
                          class="demo-small-btn"
                          style={`color:${hasSel ? 'var(--ink2)' : 'var(--faint)'}`}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.3"
                            stroke-linecap="round"
                          >
                            <path d="M1.5 7s2-3.8 5.5-3.8S12.5 7 12.5 7s-2 3.8-5.5 3.8S1.5 7 1.5 7z" />
                            <path d="M2.5 11.5l9-9" />
                          </svg>
                          Hide
                        </span>
                        <span
                          class="demo-small-btn"
                          style={`color:${hasSel ? 'var(--ink2)' : 'var(--faint)'}`}
                        >
                          Reset
                        </span>
                      </div>
                      <div class="demo-card" style="padding:0 14px">
                        <div style="display:flex;align-items:center;height:42px;font:600 13.5px/1 var(--ui);color:var(--ink2)">
                          <span style="flex:1">Text</span>
                          <span style="color:var(--muted);display:flex;transform:rotate(180deg)">
                            <ChevronDown />
                          </span>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;padding:0 0 9px;border-bottom:1px solid var(--border)">
                          <span class="demo-label" style="width:52px;flex:none">
                            Font
                          </span>
                          <div style="flex:1;height:32px;border:1px solid var(--strong);border-radius:9px;display:flex;align-items:center;overflow:hidden">
                            <span style="flex:1;padding:0 10px;font:400 12.5px/1 var(--ui);color:var(--faint)">
                              Default
                            </span>
                            <span style="width:30px;height:100%;border-left:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--faint)">
                              <ChevronDown />
                            </span>
                          </div>
                        </div>
                        <div class="demo-row">
                          <span class="demo-label">Size</span>
                          <div data-t="size" style={field('size', 116)}>
                            <span
                              style={`flex:1;padding:0 9px;font:400 12.5px/1 var(--ui);color:${sizeSet ? 'var(--ink)' : 'var(--faint)'}`}
                            >
                              {sizeSet ? String(S.h1Size) : '—'}
                            </span>
                            <span class="demo-unit">px</span>
                            <span class="demo-stepper">
                              <SmallChevron />
                            </span>
                          </div>
                        </div>
                        <div class="demo-row">
                          <span class="demo-label">Line Height</span>
                          <div style={field('lh', 116)}>
                            <span style="flex:1;padding:0 9px;font:400 12.5px/1 var(--ui);color:var(--faint)">
                              —
                            </span>
                            <span class="demo-unit">px</span>
                            <span class="demo-stepper">
                              <SmallChevron />
                            </span>
                          </div>
                        </div>
                        <div class="demo-row">
                          <span class="demo-label">Color</span>
                          <div data-t="color" style={field('color', 116)}>
                            <span
                              style={
                                'width:30px;height:100%;flex:none;border-right:1px solid var(--border);background:' +
                                (S.h1Color ||
                                  'repeating-linear-gradient(135deg,var(--surface) 0 4px,var(--border) 4px 5px)')
                              }
                            />
                            <span
                              style={`flex:1;padding:0 9px;font:400 12px/1 var(--mono);color:${S.h1Color ? 'var(--ink)' : 'var(--faint)'}`}
                            >
                              {S.h1Color || '—'}
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
                        <div class="demo-row" style="border-bottom:none">
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
                      {['Background', 'Box', 'Effects', 'More Properties'].map(
                        (g) => (
                          <div key={g} class="demo-card demo-group">
                            <span style="flex:1">{g}</span>
                            <span style="color:var(--muted);display:flex">
                              <ChevronDown />
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {S.tab === 'code' && (
                    <div
                      data-t="code"
                      style="height:100%;overflow:hidden;background:var(--surface);font:400 12px/1.75 var(--mono)"
                    >
                      <div
                        style={
                          'padding:12px 14px 40px;transition:transform 1.6s cubic-bezier(.4,0,.2,1);transform:translateY(' +
                          (S.codeScroll
                            ? -Math.max(0, codeLines.length * 21 - 8)
                            : 0) +
                          'px)'
                        }
                      >
                        {this.renderLines(codeLines)}
                        {ag && (
                          <div style="margin:12px -14px 0;padding:6px 14px 8px 12px;border-left:2px solid #1f8a4c;background:rgba(31,138,76,.07)">
                            <div style="font:400 12px/1.75 var(--mono);color:var(--ccom)">
                              /* Everforest · added by Stylebot agent */
                            </div>
                            {this.renderLines(agentLines)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {needsKey && (
                    <div style="height:100%;background:var(--surface);padding:18px 16px;display:flex;flex-direction:column;gap:14px">
                      <div>
                        <div style="font:600 14px/1.3 var(--ui);color:var(--ink)">
                          Set up the Stylebot agent
                        </div>
                        <div style="margin-top:5px;font:400 12.5px/1.5 var(--ui);color:var(--muted);text-wrap:pretty">
                          Bring your own key. It stays in this browser and is
                          only sent to the provider you pick.
                        </div>
                      </div>
                      <div style="display:flex;padding:3px;gap:2px;border-radius:9px;background:var(--track)">
                        <span
                          data-t="prov-claude"
                          style={S.prov === 'claude' ? provOn : provOff}
                        >
                          Claude
                        </span>
                        <span style={provOff}>OpenAI</span>
                      </div>
                      <div style="display:flex;flex-direction:column;gap:6px">
                        <span style="font:500 12px/1 var(--ui);color:var(--ink2)">
                          API key
                        </span>
                        <div
                          data-t="key-input"
                          style={
                            'height:36px;display:flex;align-items:center;padding:0 12px;border-radius:9px;overflow:hidden;background:var(--surface);transition:border-color .15s,box-shadow .15s;' +
                            (S.keyFocus
                              ? 'border:1px solid var(--acc);box-shadow:0 0 0 3px rgba(42,95,214,.15)'
                              : 'border:1px solid var(--strong)')
                          }
                        >
                          <span
                            style={`font:400 12.5px/1 var(--mono);overflow:hidden;white-space:nowrap;color:${S.keyLen ? 'var(--ink)' : 'var(--faint)'}`}
                          >
                            {S.keyLen
                              ? `sk-ant-${'•'.repeat(S.keyLen)}`
                              : 'Paste your key'}
                          </span>
                        </div>
                      </div>
                      <span
                        data-t="key-save"
                        style={
                          'align-self:flex-start;padding:10px 16px;border-radius:9px;font:600 13px/1 var(--ui);background:var(--ink);color:var(--surface);transition:opacity .15s;opacity:' +
                          (S.keyLen ? 1 : 0.45)
                        }
                      >
                        {S.keySaving ? 'Checking…' : 'Connect'}
                      </span>
                    </div>
                  )}

                  {isChat && (
                    <div style="height:100%;display:flex;flex-direction:column;background:var(--surface)">
                      <div style="flex:1;min-height:0;padding:14px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px">
                        {S.chatSent && (
                          <div class="demo-bubble">{CHAT_MSG}</div>
                        )}
                        {S.chatThinking && (
                          <div style="display:flex;align-items:center;gap:10px;font:400 12.5px/1.4 var(--ui);color:var(--muted)">
                            <SbIcon size={18} bare animate cycle={1.8} />
                            <span>{loadText}</span>
                          </div>
                        )}
                        {S.chatReplied && (
                          <>
                            <div style="font:400 13px/1.5 var(--ui);color:var(--ink2);text-wrap:pretty">
                              Done. I switched the page to Everforest colours
                              with Lora and Newsreader, and added the CSS to
                              your style.
                            </div>
                            <div style="display:flex;align-items:center;gap:10px">
                              <span style="font:500 11.5px/1 var(--mono);color:#1f8a4c">
                                +{agentLines.length + 1} lines
                              </span>
                              <span
                                data-t="view-code"
                                style={
                                  'font:600 12.5px/1 var(--ui);color:var(--acc);transition:opacity .1s;opacity:' +
                                  (S.clicking && S.tab === 'chat' ? 0.6 : 1)
                                }
                              >
                                View in Code
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div style="flex:none;padding:10px 12px 12px;border-top:1px solid var(--border)">
                        <div
                          data-t="chat-input"
                          style={
                            'display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:12px;background:var(--surface);min-height:44px;transition:border-color .15s,box-shadow .15s;' +
                            (S.chatDraft
                              ? 'border:1px solid var(--acc);box-shadow:0 0 0 3px rgba(42,95,214,.15)'
                              : 'border:1px solid var(--strong)')
                          }
                        >
                          <span
                            style={`flex:1;min-width:0;font:400 13px/1.4 var(--ui);color:${S.chatDraft ? 'var(--ink)' : 'var(--faint)'}`}
                          >
                            {S.chatDraft
                              ? CHAT_MSG.slice(0, S.chatDraft)
                              : 'Describe a change…'}
                          </span>
                          <span class="demo-send">
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
                              <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />
                            </svg>
                          </span>
                        </div>
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

          <div class="demo-caption">
            <span class="demo-step-label">
              {S.scene + 1} / {this.scenes.length}
            </span>
            <span aria-live="polite" style="flex:1;min-width:0">
              {S.caption}
            </span>
          </div>

          <div
            class="demo-keys"
            style={
              S.keys
                ? 'opacity:1;transform:translate(-50%,0)'
                : 'opacity:0;transform:translate(-50%,8px);pointer-events:none'
            }
          >
            <span style={keyCap}>alt</span>
            <span class="demo-plus">+</span>
            <span style={keyCap}>shift</span>
            <span class="demo-plus">+</span>
            <span style={keyCap}>M</span>
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

    if (this.welcome) return this.renderSplit(stage, steps);

    return (
      <>
        {stage}
        <ol class="demo-steps">
          {steps.map((s, i) => (
            <li key={s.title} class="demo-step" onClick={() => this.jump(i)}>
              <div
                class="demo-step-bar"
                title="Jump to this point"
                onClick={(ev: MouseEvent) => this.seekFromBar(i, ev)}
              >
                <div class="demo-step-track">
                  <div style={s.barStyle} />
                </div>
              </div>
              <button class="demo-step-title" style={s.titleStyle}>
                {s.title}
              </button>
              <div class="demo-step-body">{s.body}</div>
            </li>
          ))}
        </ol>
      </>
    );
  }

  /**
   * In the narrower welcome layout, how far to scroll the article up so the
   * quote stays in view once the Write CSS scene starts restyling it.
   */
  artShift() {
    const art = this.artRef.current;
    const box = art?.parentElement;
    const quote = art?.querySelector('[data-t="quote"]');
    if (!this.welcome || this.state.scene < 4 || !art || !box || !quote)
      return 0;
    const current = new DOMMatrix(getComputedStyle(art).transform).m42;
    const s = this.state.scale;
    const quoteBottom =
      (quote.getBoundingClientRect().bottom - current * s) / s;
    const boxBottom = box.getBoundingClientRect().bottom / s;
    return Math.max(0, Math.round(quoteBottom + 24 - boxBottom));
  }

  renderSplit(stage: JSX.Element, steps: Step[]) {
    return (
      <div class="demo-split">
        <aside class="demo-side">
          {this.props.heading && (
            <h1 class="demo-side-title">{this.props.heading}</h1>
          )}
          {this.props.lede && <p class="demo-side-lede">{this.props.lede}</p>}
          <div class="demo-side-card">
            <div class="demo-side-head">How it works</div>
            <ol class="demo-side-steps">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  class={`demo-side-step${s.active ? ' is-active' : ''}`}
                  onClick={() => this.jump(i)}
                >
                  <span class={`demo-side-dot ${s.dotClass}`}>{s.mark}</span>
                  <div style="flex:1;min-width:0">
                    <button class="demo-step-title" style={s.titleStyle}>
                      {s.title}
                    </button>
                    {s.active && <div class="demo-side-body">{s.body}</div>}
                    {s.active && (
                      <div
                        class="demo-side-bar"
                        title="Jump to this point"
                        onClick={(ev: MouseEvent) => this.seekFromBar(i, ev)}
                      >
                        <div class="demo-side-track">
                          <div style={s.barStyle} />
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {this.state.done && (
            <div class="demo-side-card demo-your-turn">
              <div class="demo-your-turn-title">Your turn.</div>
              <p>
                Open any site and press the shortcut. Nothing changes until you
                do.
              </p>
              <div class="demo-your-turn-keys">
                <kbd>alt</kbd>
                <kbd>shift</kbd>
                <kbd>M</kbd>
              </div>
              <nav>
                <a href="/manual">
                  Manual<span>›</span>
                </a>
              </nav>
            </div>
          )}
        </aside>
        {stage}
      </div>
    );
  }

  paragraph(read: boolean, serif: string, ink: string, tr: string) {
    return `margin:0 0 16px;font-size:${read ? 18 : 16}px;font-family:${serif};line-height:${read ? '1.75' : '1.55'};color:${ink}${tr}`;
  }
}
