import { useEffect, useState } from 'preact/hooks';

type Props = {
  size?: number;
  animate?: boolean;
  bare?: boolean;
  once?: boolean;
  cycle?: number;
  nudge?: number;
};

const BARS: [number, number, string][] = [
  [12, 44, '#ec4d86'],
  [28, 30, '#1c9fc4'],
  [44, 36, '#e0a218'],
];

const BARE_OPACITY = [1, 0.7, 0.45];

const ease = (k: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);

/**
 * The Stylebot icon: three lines of CSS and a text cursor. When animated, the
 * lines draw in and the cursor slides to the end of the last one and blinks.
 * `once` plays it a single time; `bare` renders it in the current color.
 */
export default function SbIcon({
  size = 24,
  animate = false,
  bare = false,
  once = false,
  cycle = 1.8,
  nudge,
}: Props) {
  const [t, setT] = useState<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setT(null);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (!(once && elapsed > 1.6)) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, once]);

  const live = t !== null;
  const tt = live ? (once ? t : t % cycle) : 9;
  const caretK = live ? ease((tt - 0.28) / 0.36) : 1;
  const blink =
    live && tt > 0.7 && tt < 1.6 ? (Math.floor(tt * 4) % 2 ? 0.15 : 1) : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{
        display: 'block',
        flex: 'none',
        overflow: 'visible',
        transform: nudge ? `translateY(${nudge}px)` : undefined,
      }}
      aria-hidden="true"
    >
      {BARS.map(([y, w, color], i) => {
        const k = live ? ease((tt - i * 0.14) / 0.36) : 1;
        return (
          <rect
            key={i}
            x={6}
            y={y}
            width={Math.max(0.01, w * k)}
            height={10}
            rx={5}
            fill={bare ? 'currentColor' : color}
            opacity={bare ? BARE_OPACITY[i] : live && k < 0.02 ? 0 : 1}
          />
        );
      })}
      <rect
        x={6 + 36 * caretK + 5}
        y={41}
        width={4.5}
        height={16}
        rx={2}
        fill={bare ? 'currentColor' : '#2563eb'}
        opacity={blink}
      />
    </svg>
  );
}
