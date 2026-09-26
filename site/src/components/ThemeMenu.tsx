import { useEffect, useState } from 'preact/hooks';
import { STORAGE_KEY, THEMES, THEME_KEYS, type ThemeKey } from '../lib/themes';
import { currentTheme } from '../lib/theme-state';

export default function ThemeMenu() {
  const [theme, setTheme] = useState<ThemeKey>('light');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (key: ThemeKey) => {
    document.documentElement.dataset.theme = key;
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: key }));
    setTheme(key);
    setOpen(false);
  };

  const title = `Theme: ${THEMES[theme].label}`;

  return (
    <div class="theme-menu">
      <button
        class={`icon-btn${open ? ' is-open' : ''}`}
        aria-label={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6.3"
            stroke="currentColor"
            stroke-width="1.4"
          />
          <path d="M8 1.7a6.3 6.3 0 0 1 0 12.6z" fill="currentColor" />
        </svg>
        <span class="tip">{title}</span>
      </button>
      {open && (
        <>
          <div class="theme-menu-scrim" onClick={() => setOpen(false)} />
          <div class="theme-menu-list" role="menu">
            {THEME_KEYS.map((key) => {
              const t = THEMES[key];
              const on = key === theme;
              return (
                <button
                  key={key}
                  role="menuitemradio"
                  aria-checked={on}
                  class={`theme-option${on ? ' is-on' : ''}`}
                  onClick={() => pick(key)}
                >
                  <span
                    class="theme-dot"
                    style={{
                      background: `linear-gradient(135deg,${t.surface} 0 50%,${t.acc} 50% 100%)`,
                      boxShadow: `inset 0 0 0 1px ${t.strong}`,
                    }}
                  />
                  <span class="theme-name" style={{ fontFamily: t.ui }}>
                    {t.label}
                  </span>
                  <span class="theme-check">✓</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
