import { useEffect, useRef, useState } from 'preact/hooks';
import './cli-demo.css';

const SITE = 'harbourpost.example';
const TAB = '54432929';
const PROMPT = `make ${SITE} easier to read at night`;
const STEP_MS = 800;
const STEPS = 17;
const LAST = STEPS - 1;

const COMMANDS = [
  [`stylebot open ${SITE}`, `Opened tab ${TAB}`],
  [`stylebot outline ${TAB}`, 'article › h1, p.dek, p ×12, aside.ad'],
  [`stylebot css set ${SITE} < night.css`, 'Saved · applied to 1 tab'],
  [`stylebot screenshot ${TAB} -o check.png`, 'Saved check.png'],
];

/**
 * A coding agent restyling a page through the CLI: a terminal running the
 * commands beside the page they change. It loops while it's on screen.
 */
export default function CliDemo() {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(LAST - 1);
      return;
    }

    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry.isIntersecting) {
          timer = setInterval(() => setStep((s) => (s + 1) % STEPS), STEP_MS);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root.current!);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);

  const at = (n: number) => step >= n && step < LAST;
  const after = at(7);

  return (
    <div ref={root} class="cli-demo" aria-hidden="true">
      <div class="cli-term">
        <div class="cli-term-title">Terminal · coding agent</div>
        <div class="cli-term-body">
          <div class="cli-term-ask">
            <span class="cli-term-caret">&gt;</span>
            <Typer text={PROMPT} on={at(1)} />
          </div>
          {COMMANDS.map(([command, output], i) => {
            const start = 2 + i * 2;
            return (
              <div class={`cli-term-row${at(start) ? ' is-on' : ''}`}>
                <div class="cli-term-cmd">
                  <span
                    class={`cli-term-dot${step === start ? ' is-running' : ''}`}
                  />
                  {command}
                </div>
                <div class={`cli-term-out${at(start + 1) ? ' is-on' : ''}`}>
                  {output}
                </div>
              </div>
            );
          })}
          <div class={`cli-term-row cli-term-done${at(10) ? ' is-on' : ''}`}>
            Dark background, warmer text, larger serif body. Ad removed.
          </div>
        </div>
      </div>

      <div class={`cli-page${after ? ' is-after' : ''}`}>
        <div class="cli-page-bar">
          <div class="cli-page-url">{SITE}/travel/night-ferry</div>
          <span class="cli-page-badge">{after ? 'After' : 'Before'}</span>
        </div>
        <div class="cli-page-body">
          <div class="cli-page-col">
            <div class="cli-page-kicker">Travel</div>
            <div class="cli-page-h1">The quiet return of the night ferry</div>
            <div class="cli-page-dek">
              Three operators are betting that travelers will trade speed for a
              cabin, a sea view and no airport.
            </div>
            <div class="cli-page-text">
              The 22:40 from Rostock leaves without fanfare. By the time the
              port lights fall behind, most passengers have found their cabins
              and the bar has settled into a low murmur.
            </div>
          </div>
          <div class="cli-page-ad">Ad</div>
        </div>
        <div class={`cli-page-flash${step === 9 ? ' is-on' : ''}`} />
      </div>
    </div>
  );
}

/**
 * Types `text` out a character at a time while `on`, with a block cursor
 * that hides once it's done.
 */
function Typer({ text, on }: { text: string; on: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!on) {
      setCount(0);
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) clearInterval(timer);
    }, 14);
    return () => clearInterval(timer);
  }, [on]);

  const typing = on && count < text.length;
  return (
    <span>
      {text.slice(0, count)}
      <span class={`cli-term-cursor${on && !typing ? ' is-hidden' : ''}`} />
    </span>
  );
}
