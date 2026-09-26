import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import SbIcon from './SbIcon';

type Splat = {
  id: number;
  x: number;
  y: number;
  size: number;
  rot: number;
  color: string;
  delay: number;
  drops: [number, number, number][];
};

const SPLAT_COLORS = ['#4d80f0', '#f07c2a', '#e0457b', '#2fae68'];
const SPLAT_PATH =
  'M30 5 C35 4 37 9 41 10 C45 11 47 5 51 7 C54.5 9 51 14 53 17 C56 21 62.5 19.5 61.5 25 C60.5 29.5 55 28 55 32.5 C55 37.5 60.5 40 57.5 45.5 C54.5 50.5 48.5 46.5 45.5 50.5 C42.5 54.5 46 60.5 39.5 60.5 C34 60.5 35 54 30 54 C25 54 23.5 59.5 18 57.5 C13.5 55.5 17.5 50.5 13 47.5 C9 44.5 2.5 46.5 2.5 41 C2.5 36 9 36.5 9 31 C9 26 3.5 23 6.5 18 C9.5 13.5 15 17 18 14 C21 11 23.5 6 30 5 Z';

function PaintSplat({ x, y, size, rot, color, delay, drops }: Splat) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStage(1));
    const fade = setTimeout(() => setStage(2), 2600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fade);
    };
  }, []);

  return (
    <svg
      viewBox="-8 -8 80 80"
      width={size}
      height={size}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        transform: `rotate(${rot}deg) scale(${stage === 0 ? 0.05 : 1})`,
        opacity: stage === 2 ? 0 : 0.92,
        transition:
          stage === 2
            ? 'opacity .6s ease'
            : `transform .38s cubic-bezier(.2,1.6,.4,1) ${delay}s`,
        mixBlendMode: 'multiply',
        overflow: 'visible',
      }}
    >
      <path d={SPLAT_PATH} fill={color} />
      {drops.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </svg>
  );
}

/**
 * The header logo. The icon draws itself on hover; on the home page, clicking
 * it splatters paint across the page instead of reloading. The paint is drawn
 * into a layer on <body> so it scrolls with the page while it fades.
 */
export default function Logo() {
  const [hover, setHover] = useState(false);
  const [splats, setSplats] = useState<Splat[]>([]);
  const nextId = useRef(0);
  const layer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!layer.current) {
      if (!splats.length) return;
      layer.current = document.createElement('div');
      layer.current.className = 'paint-layer';
      layer.current.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer.current);
    }
    render(
      <>
        {splats.map((s) => (
          <PaintSplat key={s.id} {...s} />
        ))}
      </>,
      layer.current,
    );
  }, [splats]);

  const splash = (ev: MouseEvent) => {
    if (location.pathname !== '/') return;
    ev.preventDefault();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const born: Splat[] = Array.from({ length: 5 }, (_, i) => ({
      id: nextId.current++,
      x: w * (0.08 + Math.random() * 0.84),
      y: window.scrollY + h * (0.14 + Math.random() * 0.78),
      size: 70 + Math.random() * 120,
      rot: Math.random() * 360,
      color: SPLAT_COLORS[Math.floor(Math.random() * SPLAT_COLORS.length)],
      delay: i * 0.07,
      drops: Array.from({ length: 4 }, () => {
        const a = Math.random() * Math.PI * 2;
        const d = 36 + Math.random() * 12;
        return [
          32 + Math.cos(a) * d,
          32 + Math.sin(a) * d,
          1.2 + Math.random() * 2.6,
        ] as [number, number, number];
      }),
    }));
    const ids = new Set(born.map((s) => s.id));
    setSplats((current) => [...current, ...born]);
    setTimeout(
      () => setSplats((current) => current.filter((s) => !ids.has(s.id))),
      3400,
    );
  };

  return (
    <>
      <a
        href="/"
        class="logo"
        aria-label="Stylebot home"
        onClick={splash}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span class="logo-mark">
          <SbIcon size={26} nudge={1} once animate={hover} />
        </span>
        <span class="logo-name">stylebot</span>
      </a>
    </>
  );
}
