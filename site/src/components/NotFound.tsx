import { useEffect, useState } from 'preact/hooks';

type Key = 'h1' | 'p' | 'a';
type Font = 'serif' | 'sans' | 'mono';
type ElementStyle = { font: Font; color: string | null; size: number };
type Styles = Record<Key, ElementStyle>;

const DEFAULTS: Styles = {
  h1: { font: 'serif', color: null, size: 32 },
  p: { font: 'serif', color: null, size: 16 },
  a: { font: 'serif', color: null, size: 16 },
};

const FONTS: Record<Font, string> = {
  serif: "'Times New Roman',Times,serif",
  sans: 'var(--ui)',
  mono: 'var(--mono)',
};

const FONT_OPTIONS: [Font, string][] = [
  ['serif', 'Serif'],
  ['sans', 'Sans'],
  ['mono', 'Mono'],
];

const COLORS = [null, '#191b1f', '#e5487f', '#2a5fd6', '#1f8a4c'];

const EASE = ';transition:all .35s cubic-bezier(.3,.7,.2,1)';

/**
 * A 404 page styled like a bare server error, next to a small Stylebot panel
 * that lets the visitor pick an element and restyle it, or make it nice.
 */
export default function NotFound() {
  const [styles, setStyles] = useState<Styles>(DEFAULTS);
  const [sel, setSel] = useState<Key | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [hover, setHover] = useState<Key | null>(null);
  const [nice, setNice] = useState(false);
  const [path, setPath] = useState('/this-page-does-not-exist');

  useEffect(() => {
    if (location.pathname !== '/404' && location.pathname !== '/404.html') {
      setPath(location.pathname);
    }
  }, []);

  const patch = (change: Partial<ElementStyle>) => {
    if (!sel) return;
    setNice(false);
    setStyles((s) => ({ ...s, [sel]: { ...s[sel], ...change } }));
  };

  const reset = () => {
    setNice(false);
    setStyles(DEFAULTS);
    setSel(null);
    setInspecting(false);
    setHover(null);
  };

  const touched = nice || JSON.stringify(styles) !== JSON.stringify(DEFAULTS);
  const hint = nice
    ? 'Much better. The page still doesn’t exist, but at least it looks good now.'
    : touched
      ? 'Keep going, or let Stylebot finish the job.'
      : 'Turn on the picker, click something, and restyle it. Or just make it nice.';

  const mark = (k: Key) =>
    sel === k
      ? ';outline:2px solid #2a5fd6;outline-offset:4px'
      : inspecting && hover === k
        ? ';outline:1.5px dashed #2a5fd6;outline-offset:4px;background-color:rgba(42,95,214,.07)'
        : '';
  const cursor = inspecting ? ';cursor:crosshair' : '';
  const color = (k: Key, fallback: string) => styles[k].color || fallback;

  const base: Record<Key, string> = {
    h1: nice
      ? 'margin:0 0 14px;font:800 clamp(56px,8vw,88px)/.95 var(--display);letter-spacing:-.05em;color:var(--ink)'
      : `margin:0 0 16px;font-family:${FONTS[styles.h1.font]};font-weight:700;font-size:${styles.h1.size}px;line-height:1.15;color:${color('h1', '#000')}`,
    p: nice
      ? 'margin:0 0 26px;font:400 18px/1.55 var(--ui);color:var(--muted);max-width:34ch'
      : `margin:0 0 16px;font-family:${FONTS[styles.p.font]};font-size:${styles.p.size}px;line-height:1.3;color:${color('p', '#000')}`,
    a: nice
      ? 'display:inline-flex;align-items:center;padding:12px 18px;border-radius:9px;background:var(--ink);color:var(--surface);font:600 14px/1 var(--ui);text-decoration:none'
      : `font-family:${FONTS[styles.a.font]};font-size:${styles.a.size}px;color:${color('a', '#0000ee')};text-decoration:underline`,
  };

  const bind = (k: Key) => ({
    style: base[k] + EASE + mark(k) + cursor,
    onMouseEnter: () => inspecting && setHover(k),
    onMouseLeave: () => setHover(null),
    onClick: (e: MouseEvent) => {
      if (!inspecting) return;
      e.preventDefault();
      setSel(k);
      setInspecting(false);
      setHover(null);
    },
  });

  const current = sel ? styles[sel] : null;
  const disabled = sel ? '' : ';opacity:.45;pointer-events:none';
  const chip = (on: boolean) =>
    "padding:6px 9px;border-radius:7px;cursor:pointer;font:500 12px/1 'Public Sans',system-ui;" +
    (on
      ? 'border:1px solid #2a5fd6;background:#f3f6fd;color:#2a5fd6'
      : 'border:1px solid #d9dce2;background:#fff;color:#3f4550') +
    disabled;
  const swatch = (c: string | null, on: boolean) =>
    `width:22px;height:22px;border-radius:6px;cursor:pointer;padding:0;border:1px solid ${c || '#d9dce2'};background:${c || 'repeating-linear-gradient(135deg,#fff 0 4px,#e4e6ea 4px 5px)'}` +
    (on ? ';box-shadow:0 0 0 2px #fff,0 0 0 3.5px #2a5fd6' : '') +
    disabled;
  const selText = inspecting
    ? hover || 'Click an element'
    : sel || 'Pick an element';

  return (
    <div class="nf">
      <div class="nf-intro">
        <div class="nf-code">Error 404</div>
        <h1>This page doesn't exist, and it looks terrible.</h1>
        <p aria-live="polite">{hint}</p>
      </div>
      <div class="nf-body">
        <div class="nf-window">
          <div class="nf-chrome">
            <span class="nf-lights">
              <span />
              <span />
              <span />
            </span>
            <span class="nf-url">stylebot.dev{path}</span>
          </div>
          <div
            class="nf-page"
            style={`background:${nice ? 'var(--sunken)' : '#fff'}${EASE}`}
          >
            <div
              style={
                (nice
                  ? 'margin:auto;padding:48px 32px;text-align:left;max-width:560px;width:100%'
                  : 'padding:8px 10px;width:100%') + EASE
              }
            >
              <h1 {...bind('h1')}>404 Not Found</h1>
              <p {...bind('p')}>
                The requested URL was not found on this server.
              </p>
              <a href="/" {...bind('a')}>
                Go to the homepage
              </a>
              {!nice && (
                <>
                  <hr class="nf-hr" />
                  <address class="nf-addr">
                    Apache/2.4.1 Server at stylebot.dev Port 443
                  </address>
                </>
              )}
            </div>
          </div>
        </div>

        <div class="nf-panel">
          <div class="nf-panel-head">stylebot.dev</div>
          <div class="nf-panel-pick">
            <button
              class={`nf-picker${inspecting ? ' is-on' : ''}`}
              title="Pick an element"
              aria-pressed={inspecting}
              onClick={() => {
                setInspecting(!inspecting);
                setHover(null);
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
              >
                <path d="M7 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5V7" />
                <path d="M9 9l7.5 2.6-3.2 1.2-1.2 3.2z" fill="currentColor" />
              </svg>
            </button>
            <div
              class="nf-selector"
              style={`color:${sel || hover ? '#191b1f' : '#8b919c'}`}
            >
              {selText}
            </div>
          </div>
          <div class="nf-controls">
            <div class="nf-row">
              <span>Font</span>
              <div>
                {FONT_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    style={chip(current?.font === value)}
                    onClick={() => patch({ font: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div class="nf-row">
              <span>Color</span>
              <div>
                {COLORS.map((c) => (
                  <button
                    key={c ?? 'none'}
                    aria-label={c ?? 'Default color'}
                    style={swatch(c, !!current && current.color === c)}
                    onClick={() => patch({ color: c })}
                  />
                ))}
              </div>
            </div>
            <div class="nf-row">
              <span>Size</span>
              <div>
                <button
                  class="nf-step"
                  aria-label="Smaller"
                  onClick={() =>
                    current && patch({ size: Math.max(10, current.size - 4) })
                  }
                >
                  −
                </button>
                <span class="nf-size">
                  {current ? `${current.size}px` : '—'}
                </span>
                <button
                  class="nf-step"
                  aria-label="Larger"
                  onClick={() =>
                    current && patch({ size: Math.min(96, current.size + 4) })
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div class="nf-actions">
            <button
              class="nf-nice"
              onClick={() => {
                setNice(true);
                setSel(null);
                setInspecting(false);
                setHover(null);
              }}
            >
              ✨ Just make it nice
            </button>
            <button class="nf-reset" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
