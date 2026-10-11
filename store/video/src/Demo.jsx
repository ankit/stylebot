import { loadFont } from '@remotion/google-fonts/Geist';
import { loadFont as loadNewsreader } from '@remotion/google-fonts/Newsreader';
import {
  AbsoluteFill,
  Audio,
  Img,
  getStaticFiles,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  CHROME_H,
  CROSSFADE,
  END,
  FPS,
  HOOK,
  TABS_H,
  TOOLBAR_H,
  WIN,
  cameraAt,
  cutFrames,
  editedSeconds,
  heldTime,
  toCapture,
  cursorAt,
  ease,
  latest,
  layout,
  marks,
  terminalShowing,
  timeline,
  toCanvas,
  toggleAt,
  totalSeconds,
  windowAt,
} from './timeline';

export { FPS };
export const totalFrames = Math.ceil(totalSeconds * FPS);

const UI_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
const { fontFamily: SERIF } = loadNewsreader('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});
const { fontFamily: GEIST } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const MONO = '"SF Mono", Menlo, monospace';

const DARK = layout.theme === 'dark';
// Chrome's frame, light or dark, and the side panel header to match Stylebot.
const CHROME = DARK
  ? {
      tabs: '#1f2023',
      tab: '#35363a',
      toolbar: '#35363a',
      omnibox: '#202124',
      text: '#e8eaed',
      icon: '#9aa0a6',
      line: '#2b2c30',
      panel: '#1d1e22',
      panelLine: '#2c2d32',
    }
  : {
      tabs: '#dfe3e8',
      tab: '#fff',
      toolbar: '#fff',
      omnibox: '#f1f3f4',
      text: '#202124',
      icon: '#5f6368',
      line: '#e3e3e3',
      panel: '#fff',
      panelLine: '#dadce0',
    };

const frameAt = (surface, t) =>
  latest(timeline.frames[surface], surface === 'site' ? heldTime(t) : t);

const Shot = ({ frame, style }) =>
  frame ? (
    <Img
      src={staticFile(`capture/${frame.f}`)}
      style={{
        position: 'absolute',
        width: frame.w,
        height: frame.h,
        ...style,
      }}
    />
  ) : null;

/**
 * The site's favicon: a letter on a tile, which is all a 16px icon needs.
 */
const Favicon = () => (
  <div
    style={{
      width: 16,
      height: 16,
      background: '#fff',
      color: '#111',
      font: '600 13px/16px Georgia, serif',
      textAlign: 'center',
      border: '1px solid #d0d0d0',
      borderRadius: 3,
      boxSizing: 'border-box',
    }}
  >
    {layout.site.favicon}
  </div>
);

const Icon = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={CHROME.icon}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/**
 * Chrome's side panel header: the extension's icon and name, pin and close.
 */
const SidePanelHeader = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      height: layout.panelHeader,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 10px 0 14px',
      background: CHROME.panel,
      borderBottom: `1px solid ${CHROME.panelLine}`,
      fontFamily: UI_FONT,
      fontSize: 13,
      fontWeight: 500,
      color: CHROME.text,
    }}
  >
    <Img src={staticFile('icon.png')} style={{ width: 16, height: 16 }} />
    <span>Stylebot</span>
    <span style={{ flex: 1 }} />
    <Icon size={16} d="M12 17v5M9 3h6l-1 7 4 4H6l4-4z" />
    <Icon size={16} d="M18 6L6 18M6 6l12 12" />
  </div>
);

const ChromeFrame = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: WIN.w,
      height: CHROME_H,
      fontFamily: UI_FONT,
    }}
  >
    <div
      style={{ height: TABS_H, background: CHROME.tabs, position: 'relative' }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
        <div
          key={c}
          style={{
            position: 'absolute',
            left: 16 + i * 20,
            top: 14,
            width: 12,
            height: 12,
            borderRadius: 6,
            background: c,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 84,
          top: 7,
          width: 240,
          height: TABS_H - 7,
          background: CHROME.tab,
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 12px',
          boxSizing: 'border-box',
          fontSize: 12.5,
          color: CHROME.text,
        }}
      >
        <Favicon />
        <span style={{ flex: 1 }}>{layout.site.title}</span>
        <span style={{ color: CHROME.icon, fontSize: 14 }}>×</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 336,
          top: 11,
          fontSize: 18,
          color: CHROME.icon,
        }}
      >
        +
      </div>
    </div>
    <div
      style={{
        height: TOOLBAR_H,
        background: CHROME.toolbar,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 14px',
        borderBottom: `1px solid ${CHROME.line}`,
        boxSizing: 'border-box',
      }}
    >
      <Icon d="M19 12H5M12 19l-7-7 7-7" />
      <Icon d="M5 12h14M12 5l7 7-7 7" />
      <Icon d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
      <div
        style={{
          flex: 1,
          height: 30,
          borderRadius: 15,
          background: CHROME.omnibox,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          fontSize: 13.5,
          color: CHROME.text,
        }}
      >
        <Icon size={14} d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
        {layout.site.url}
      </div>
      <Img
        src={staticFile('icon.png')}
        style={{ width: 20, height: 20, marginLeft: 6 }}
      />
      <Icon d="M20 7h-3V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3H8a1 1 0 0 0-1 1v3H4a2 2 0 0 0 0 4h3v4a1 1 0 0 0 1 1h4v-3a2 2 0 0 1 4 0v3h4a1 1 0 0 0 1-1z" />
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          background: '#c7d7f4',
          color: '#3a5a9c',
          font: `600 12px/24px ${UI_FONT}`,
          textAlign: 'center',
        }}
      >
        A
      </div>
    </div>
  </div>
);

/**
 * The browser window: Chrome's frame, the page, and the side panel and popup
 * when they're open, at capture time t.
 */
const Browser = ({ t, siteFrame }) => {
  const w = windowAt(t);
  const panel = toggleAt(timeline.panel, t);
  const popup = toggleAt(timeline.popup, t);
  const site = siteFrame ?? frameAt('site', t);
  const panelFrame = frameAt('panel', t);
  const popupFrame = frameAt('popup', t);
  const popupIn = popup.show
    ? ease(popup.since / 160)
    : 1 - ease(popup.since / 120);
  const pw = layout.width - layout.panelWidth;
  const panelIn = panel.show
    ? ease(panel.since / 320)
    : 1 - ease(panel.since / 220);
  return (
    <div
      style={{
        position: 'absolute',
        left: w.left,
        top: w.top,
        width: WIN.w,
        height: WIN.h,
        transform: `scale(${w.s})`,
        transformOrigin: '0 0',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: DARK
          ? '0 40px 90px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08)'
          : '0 40px 90px rgba(40,30,10,.28), 0 0 0 1px rgba(0,0,0,.08)',
      }}
    >
      <ChromeFrame />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CHROME_H,
          width: layout.width,
          height: layout.height,
          overflow: 'hidden',
          background: layout.site.background,
        }}
      >
        <Shot frame={site} style={{ left: 0, top: 0 }} />
        {panelIn > 0 && !siteFrame && (
          <div
            style={{
              position: 'absolute',
              left: pw + (1 - panelIn) * layout.panelWidth,
              top: 0,
              width: layout.panelWidth,
              height: layout.height,
              background: CHROME.panel,
              borderLeft: `1px solid ${CHROME.panelLine}`,
              boxShadow: panelIn < 1 ? '-8px 0 24px rgba(0,0,0,.08)' : 'none',
            }}
          >
            <SidePanelHeader />
            <Shot
              frame={panelFrame}
              style={{ left: 0, top: layout.panelHeader }}
            />
          </div>
        )}
      </div>
      {popupIn > 0 && popupFrame && !siteFrame && (
        <div
          style={{
            position: 'absolute',
            left: layout.popup.x,
            top: CHROME_H + layout.popup.y,
            width: layout.popupWidth,
            height: popupFrame.h,
            borderRadius: 10,
            overflow: 'hidden',
            background: CHROME.panel,
            boxShadow: DARK
              ? '0 14px 36px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.1)'
              : '0 12px 32px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.08)',
            opacity: popupIn,
            transform: `translateY(${(1 - popupIn) * -6}px) scale(${
              0.98 + 0.02 * popupIn
            })`,
            transformOrigin: 'top right',
          }}
        >
          <Shot frame={popupFrame} style={{ left: 0, top: 0 }} />
        </div>
      )}
    </div>
  );
};

const SPINNER = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];

/**
 * Claude Code in a terminal window, replaying the run's transcript.
 */
const Terminal = ({ t }) => {
  const { show, since } = terminalShowing(t);
  const k = show ? ease(since / 450) : 1 - ease(since / 350);
  if (k <= 0) return null;
  const events = timeline.terminal.filter(e => e.t <= t);
  const lastShow = [...events].reverse().find(e => e.kind === 'show');
  const shown = events.filter(e => !lastShow || e.t >= lastShow.t);
  const submitted = shown.find(e => e.kind === 'submit');
  const input = submitted
    ? ''
    : [...shown].reverse().find(e => e.kind === 'input')?.text ?? '';
  const spinner = [...shown].reverse().find(e => e.kind === 'spinner');
  const items = shown.filter(e => e.kind === 'tool' || e.kind === 'say');
  const caret = Math.floor(t / 530) % 2 === 0;
  const spin = SPINNER[Math.floor(t / 110) % SPINNER.length];

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        top: 150,
        width: 720,
        height: 700,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1c1c1e',
        boxShadow:
          '0 40px 90px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.06)',
        opacity: k,
        transform: `translateY(${(1 - k) * 18}px)`,
        fontFamily: MONO,
        color: '#e5e5e5',
        fontSize: 15,
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          height: 34,
          background: '#2a2a2c',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 8,
          fontFamily: UI_FONT,
          fontSize: 12.5,
          color: '#9a9a9e',
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map(c => (
          <div
            key={c}
            style={{ width: 12, height: 12, borderRadius: 6, background: c }}
          />
        ))}
        <div style={{ flex: 1, textAlign: 'center', marginRight: 52 }}>
          claude — ~/projects
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            border: '1px solid #d97757',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 18,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ color: '#d97757' }}>✻</span> Welcome to{' '}
          <b>Claude Code</b>
        </div>
        {submitted && (
          <div style={{ color: '#9a9a9e', marginBottom: 12 }}>
            &gt; {submitted.text}
          </div>
        )}
        {items.map((e, i) => {
          const age = t - e.t;
          const o = ease(age / 180);
          if (e.kind === 'say') {
            return (
              <div
                key={i}
                style={{ display: 'flex', gap: 10, marginTop: 12, opacity: o }}
              >
                <span>⏺</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{e.text}</span>
              </div>
            );
          }
          const { name, args, out } = JSON.parse(e.text);
          return (
            <div key={i} style={{ marginTop: 12, opacity: o }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: '#4eba65' }}>⏺</span>
                <span>
                  <b style={{ color: '#fff' }}>{name}</b>({args})
                </span>
              </div>
              {out.split('\n').map((line, j) => (
                <div
                  key={j}
                  style={{
                    color: '#8e8e93',
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {j ? '     ' : '  ⎿  '}
                  {line}
                </div>
              ))}
            </div>
          );
        })}
        {spinner?.text && (
          <div style={{ marginTop: 14, color: '#d97757' }}>
            {spin} {spinner.text}{' '}
            <span style={{ color: '#8e8e93' }}>(esc to interrupt)</span>
          </div>
        )}
        <div
          style={{
            border: '1px solid #4a4a4e',
            borderRadius: 6,
            padding: '9px 12px',
            marginTop: 16,
          }}
        >
          <span style={{ color: '#8e8e93' }}>&gt; </span>
          {input}
          <span
            style={{
              background: caret ? '#e5e5e5' : 'transparent',
              marginLeft: 1,
            }}
          >
            &nbsp;
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * The macOS arrow, pressed briefly on each click, with a soft ring.
 */
const Cursor = ({ t }) => {
  const p = toCanvas(cursorAt(t), t);
  const s = windowAt(t).s;
  const click = [...timeline.clicks]
    .reverse()
    .find(c => c.t <= t && t - c.t < 520);
  const age = click ? t - click.t : Infinity;
  const press = age < 160 ? 0.82 + 0.18 * (age / 160) : 1;
  const ring = click ? toCanvas(click, click.t) : null;
  return (
    <>
      {ring && (
        <div
          style={{
            position: 'absolute',
            left: ring.x - 22,
            top: ring.y - 22,
            width: 44,
            height: 44,
            borderRadius: 22,
            border: '2.5px solid rgba(255,255,255,.95)',
            background: 'rgba(30,30,30,.12)',
            boxShadow: '0 0 0 1px rgba(0,0,0,.15)',
            transform: `scale(${0.4 + (age / 520) * 0.9})`,
            opacity: 1 - age / 520,
          }}
        />
      )}
      <svg
        width={26 * s}
        height={26 * s}
        viewBox="0 0 26 26"
        style={{
          position: 'absolute',
          left: p.x - 5 * s,
          top: p.y - 3 * s,
          transform: `scale(${press})`,
          transformOrigin: '5px 3px',
          filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,.35))',
        }}
      >
        <path
          d="M5 3 L5 21 L9.6 16.8 L12.8 23.6 L15.6 22.4 L12.5 15.8 L18.6 15.8 Z"
          fill="#000"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

/**
 * The caption: a dark card whose words rise in one after another. The opening
 * line is set larger, in a serif; a caption being replaced fades up and out.
 */
const Caption = ({ text, since, hero = false, leaving = false }) => {
  if (!text) {
    return null;
  }
  const k = leaving ? 1 - ease(since / 240) : ease(since / 420);
  const words = text.split(' ');
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: hero ? 84 : 60,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          // The serif's descenders leave room below, so the hero line gets more
          // padding above to centre its capitals and baseline in the card.
          padding: hero ? '30px 40px 14px' : '14px 26px',
          borderRadius: hero ? 24 : 16,
          background: 'rgba(20, 19, 18, 0.84)',
          backdropFilter: 'blur(12px)',
          boxShadow:
            '0 14px 40px rgba(30, 20, 5, 0.22), inset 0 0 0 1px rgba(255,255,255,.06)',
          opacity: k,
          transform: leaving
            ? `translateY(${(1 - k) * -8}px)`
            : `translateY(${(1 - k) * 12}px)`,
          fontFamily: hero ? SERIF : GEIST,
          fontWeight: hero ? 500 : 400,
          fontSize: hero ? 64 : 32,
          lineHeight: 1.1,
          letterSpacing: hero ? '-0.02em' : '-0.015em',
          color: '#f7f3ec',
          whiteSpace: 'nowrap',
        }}
      >
        {words.map((w, i) => {
          const wk = leaving ? 1 : ease((since - 100 - i * 50) / 340);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: wk,
                transform: `translateY(${(1 - wk) * 0.3}em)`,
              }}
            >
              {w}
              {i < words.length - 1 ? '\u00a0' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// The track isn't committed, so the video renders silent without it.
const HAS_MUSIC = getStaticFiles().some(f => f.name === 'music.mp3');

/**
 * The music bed: fades in under the hook and out under the end card.
 */
const Soundtrack = () => (
  <Audio
    src={staticFile('music.mp3')}
    volume={f =>
      interpolate(
        f,
        [0, 20, totalFrames - 75, totalFrames - 1],
        [0, 0.55, 0.55, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      )
    }
  />
);

const Wallpaper = () => (
  <AbsoluteFill
    style={{
      background: DARK
        ? 'radial-gradient(120% 90% at 25% 15%, #3b3630 0%, #2a2622 55%, #1e1b18 100%)'
        : 'radial-gradient(120% 90% at 25% 15%, #f7f2e8 0%, #ece4d4 55%, #e2d8c4 100%)',
    }}
  />
);

const EndCard = ({ k }) => (
  <AbsoluteFill
    style={{
      background: DARK
        ? 'radial-gradient(120% 90% at 50% 40%, #2c2824 0%, #1e1b18 100%)'
        : '#f7f2e8',
      opacity: k,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 22,
      fontFamily: UI_FONT,
    }}
  >
    <Img
      src={staticFile('icon.png')}
      style={{
        width: 120,
        height: 120,
        transform: `translateY(${(1 - k) * 12}px)`,
      }}
    />
    <div
      style={{
        fontFamily: GEIST,
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1,
        letterSpacing: '-0.045em',
        color: DARK ? '#f5f1ea' : '#141414',
      }}
    >
      Stylebot
    </div>
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 400,
        fontSize: 40,
        color: DARK ? '#c9c0b3' : '#3c3c3c',
        letterSpacing: '-0.015em',
      }}
    >
      Restyle any website.
    </div>
    <div
      style={{
        marginTop: 26,
        padding: '12px 28px',
        borderRadius: 999,
        background: DARK ? '#2a2723' : '#fffdf8',
        boxShadow: DARK
          ? '0 6px 20px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
          : '0 6px 20px rgba(60, 45, 20, 0.08), inset 0 0 0 1px #e6dece',
        fontFamily: GEIST,
        fontWeight: 500,
        fontSize: 26,
        letterSpacing: '-0.01em',
        color: DARK ? '#f5f1ea' : '#1c1b19',
        opacity: ease(k * 1.4 - 0.4),
      }}
    >
      stylebot.dev
    </div>
    <div
      style={{
        fontFamily: GEIST,
        fontWeight: 400,
        fontSize: 20,
        letterSpacing: '0.01em',
        color: DARK ? '#8c8478' : '#958c7e',
        opacity: ease(k * 1.6 - 0.6),
      }}
    >
      Free and open source since 2011
    </div>
  </AbsoluteFill>
);

const CUT_FADE = 16;
const HOOK_LINE = 'Restyle any website.';

/**
 * Everything the camera sees at one video frame.
 */
const Stage = ({ frame }) => {
  const sec = frame / FPS;
  const t = toCapture(Math.max(0, (sec - HOOK) * 1000));
  const cam = cameraAt(frame);

  // The hook opens on the finished look, taken from late in the capture.
  const hookFrame = latest(timeline.frames.site, marks.profiles - 400);
  const hookK =
    sec < HOOK - CROSSFADE
      ? 1
      : 1 - ease((sec - (HOOK - CROSSFADE)) / CROSSFADE);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(960px, 540px) scale(${
          cam.z
        }) translate(${-cam.x}px, ${-cam.y}px)`,
        transformOrigin: '0 0',
      }}
    >
      <Wallpaper />
      <Browser t={t} />
      {hookK > 0 && (
        <div style={{ opacity: hookK }}>
          <Browser t={0} siteFrame={hookFrame} />
        </div>
      )}
      <Terminal t={t} />
      {sec >= HOOK - CROSSFADE && <Cursor t={t} />}
    </AbsoluteFill>
  );
};

export const Demo = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const t = toCapture(Math.max(0, (sec - HOOK) * 1000));
  const endK = ease((sec - HOOK - editedSeconds) / 0.6);
  // The latest cut this frame is just past, if any, for its crossfade.
  const cutFrame = cutFrames.filter(c => c >= 0 && c <= frame).pop() ?? -1;
  const sinceCut = frame - cutFrame;

  const cap = latest(timeline.captions, t);
  let caption = cap ? { text: cap.text, since: t - cap.t } : null;
  // The caption before, while it fades out under the new one.
  let leaving = null;
  if (cap) {
    const before = timeline.captions[timeline.captions.indexOf(cap) - 1];
    leaving = before ? { text: before.text, since: t - cap.t } : null;
  }
  if (sec < HOOK) {
    caption = { text: HOOK_LINE, since: sec * 1000 };
    leaving = null;
  } else if (sec - HOOK < 0.25 && !cap) {
    leaving = { text: HOOK_LINE, since: (sec - HOOK) * 1000, hero: true };
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Stage frame={frame} />
      {cutFrame >= 0 && sinceCut >= 0 && sinceCut < CUT_FADE && (
        <AbsoluteFill style={{ opacity: 1 - ease(sinceCut / CUT_FADE) }}>
          <Stage frame={cutFrame - 1} />
        </AbsoluteFill>
      )}
      {leaving && leaving.since < 240 && endK < 1 && (
        <Caption
          text={leaving.text}
          since={leaving.since}
          hero={leaving.hero}
          leaving
        />
      )}
      {caption && endK < 1 && (
        <Caption text={caption.text} since={caption.since} hero={sec < HOOK} />
      )}
      {endK > 0 && <EndCard k={endK} />}
      {HAS_MUSIC && <Soundtrack />}
    </AbsoluteFill>
  );
};
