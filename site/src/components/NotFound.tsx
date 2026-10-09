import { useEffect, useState } from 'preact/hooks';

const FADE_MS = 180;

/**
 * A 404 page styled like a bare server error, with a button that makes it nice.
 */
export default function NotFound() {
  const [nice, setNice] = useState(false);
  const [fading, setFading] = useState(false);
  const [path, setPath] = useState('/this-page-does-not-exist');

  useEffect(() => {
    if (location.pathname !== '/404' && location.pathname !== '/404.html') {
      setPath(location.pathname);
    }
  }, []);

  const makeNice = () => {
    setFading(true);
    setTimeout(() => {
      setNice(true);
      setFading(false);
    }, FADE_MS);
  };

  const style = {
    h1: nice
      ? 'margin:0 0 14px;font:800 clamp(56px,8vw,88px)/.95 var(--display);letter-spacing:-.05em;color:var(--ink)'
      : "margin:0 0 16px;font:700 32px/1.15 'Times New Roman',Times,serif;color:#000",
    p: nice
      ? 'margin:0 0 26px;font:400 18px/1.55 var(--ui);color:var(--muted);max-width:34ch'
      : "margin:0 0 16px;font:400 16px/1.3 'Times New Roman',Times,serif;color:#000",
    a: nice
      ? 'display:inline-flex;align-items:center;padding:12px 18px;border-radius:9px;background:var(--ink);color:var(--surface);font:600 14px/1 var(--ui);text-decoration:none'
      : "font:400 16px 'Times New Roman',Times,serif;color:#0000ee;text-decoration:underline",
  };

  return (
    <div class="nf">
      <div class="nf-intro">
        <h1>This page doesn't exist, and it looks terrible.</h1>
        {nice ? (
          <p class="nf-done" role="status">
            Much better. The page still doesn’t exist, but at least it looks
            good now.
          </p>
        ) : (
          <button class="nf-nice" disabled={fading} onClick={makeNice}>
            ✨ Just make it nice
          </button>
        )}
      </div>
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
          style={`background:${nice ? 'var(--sunken)' : '#fff'};transition:background ${FADE_MS}ms`}
        >
          <div
            style={
              (nice
                ? 'margin:auto;padding:48px 32px;text-align:left;max-width:560px;width:100%'
                : 'padding:8px 10px;width:100%') +
              `;transition:opacity ${FADE_MS}ms;opacity:${fading ? 0 : 1}`
            }
          >
            <h1 style={style.h1}>404 Not Found</h1>
            <p style={style.p}>
              The requested URL was not found on this server.
            </p>
            <a href="/" style={style.a}>
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
    </div>
  );
}
