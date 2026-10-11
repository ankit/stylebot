import { loadFont } from '@remotion/google-fonts/Geist';
import { loadFont as loadNewsreader } from '@remotion/google-fonts/Newsreader';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { latest, marks, timeline } from './timeline';

const { fontFamily: SERIF } = loadNewsreader('normal', {
  weights: ['500'],
  subsets: ['latin'],
});
const { fontFamily: GEIST } = loadFont('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
});

// The page before anything changes, and with Claude's look applied.
const before = timeline.frames.site[0];
const after = latest(timeline.frames.site, marks.profiles - 400);

const CARD = { left: 590, top: 92, width: 640, height: 536 };
// How much of the page shows in the card, and from where.
const PAGE = { scale: 0.82, x: -170, y: -46 };
// The split runs from this x at the top to this x at the bottom.
const SPLIT = { top: 0.62, bottom: 0.38 };

const Page = ({ frame, clip }) => (
  <Img
    src={staticFile(`capture/${frame.f}`)}
    style={{
      position: 'absolute',
      left: PAGE.x,
      top: PAGE.y,
      width: frame.w * PAGE.scale,
      height: frame.h * PAGE.scale,
      clipPath: clip,
    }}
  />
);

/**
 * The YouTube thumbnail: the tagline beside Wikipedia's Ikigai article, split
 * between how it looks and how Stylebot restyled it.
 */
export const Thumbnail = () => {
  const w = CARD.width - PAGE.x;
  const h = CARD.height - PAGE.y;
  const topX = CARD.width * SPLIT.top - PAGE.x;
  const bottomX = CARD.width * SPLIT.bottom - PAGE.x;
  // clip-path points are in the image's own box, which starts at PAGE.x, PAGE.y.
  const toPage = x => `${x.toFixed(1)}px`;
  const left = `polygon(0 0, ${toPage(topX)} 0, ${toPage(bottomX)} ${toPage(
    h
  )}, 0 ${toPage(h)})`;
  const right = `polygon(${toPage(topX)} 0, ${toPage(w + 400)} 0, ${toPage(
    w + 400
  )} ${toPage(h)}, ${toPage(bottomX)} ${toPage(h)})`;

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(120% 100% at 20% 20%, #3b3630 0%, #2a2622 55%, #1c1a17 100%)',
        fontFamily: GEIST,
      }}
    >
      <div style={{ position: 'absolute', left: 72, top: 150, width: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Img src={staticFile('icon.png')} style={{ width: 56, height: 56 }} />
          <div
            style={{
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: '-0.04em',
              color: '#f5f1ea',
            }}
          >
            Stylebot
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
            color: '#f7f3ec',
          }}
        >
          Restyle any website.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          ...CARD,
          borderRadius: 18,
          overflow: 'hidden',
          background: '#fff',
          boxShadow:
            '0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.1)',
          transform: 'rotate(-2deg)',
        }}
      >
        <Page frame={before} clip={left} />
        <Page frame={after} clip={right} />
        <svg
          width={CARD.width}
          height={CARD.height}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <line
            x1={CARD.width * SPLIT.top}
            y1={0}
            x2={CARD.width * SPLIT.bottom}
            y2={CARD.height}
            stroke="#f7f3ec"
            strokeWidth="5"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
