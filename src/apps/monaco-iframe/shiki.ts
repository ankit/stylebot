/* eslint-disable @typescript-eslint/no-explicit-any */
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import { shikiToMonaco } from '@shikijs/monaco';
import {
  createShikiPrimitive,
  type LanguageRegistration,
  type ThemeRegistration,
} from '@shikijs/primitive';

const FONT_STYLES = [
  '',
  'italic',
  'bold',
  'underline',
  'italic bold',
  'italic underline',
  'bold underline',
  'italic bold underline',
];

/**
 * Adds a rule for every colour and font style pair the theme uses, under
 * scopes no token has. shikiToMonaco maps a token back to a scope by its
 * final colour and style, so a theme that sets them in separate rules (Rosé
 * Pine's italic comments) would otherwise lose that token's colour.
 */
const withEveryColourStyle = (theme: ThemeRegistration): ThemeRegistration => {
  const rules = theme.tokenColors ?? theme.settings ?? [];
  const colours = new Set(
    rules
      .map(rule => rule.settings?.foreground?.toLowerCase())
      .filter((colour): colour is string => Boolean(colour))
  );
  const pairs = [...colours].flatMap(colour =>
    FONT_STYLES.map(fontStyle => ({
      scope: `stylebot.${colour.slice(1)}.${fontStyle.replace(/ /g, '-')}`,
      settings: { foreground: colour, fontStyle },
    }))
  );

  return { ...theme, tokenColors: [...rules, ...pairs], settings: undefined };
};

export type CssHighlighting = {
  addThemes: (themes: Array<ThemeRegistration>) => void;
};

/**
 * Colours Monaco's CSS with VS Code's grammar and themes, leaving Monaco's
 * CSS language service alone. Must run before a CSS model exists, and every
 * theme has to be added here before Monaco can switch to it.
 */
export const highlightCss = (
  monaco: any,
  css: Array<LanguageRegistration>,
  themes: Array<ThemeRegistration>
): CssHighlighting => {
  const highlighter = createShikiPrimitive({
    langs: css,
    themes: themes.map(withEveryColourStyle),
    engine: createJavaScriptRegexEngine(),
  });
  const { setTheme, create } = monaco.editor;
  let activeTheme: string | undefined;

  const register = () => {
    // shikiToMonaco wraps both and only knows the themes loaded when it runs,
    // so it runs again for each new theme, over the unwrapped originals.
    monaco.editor.setTheme = setTheme;
    monaco.editor.create = create;
    // Its types expect a highlighter with bundled languages and themes.
    shikiToMonaco(highlighter as any, monaco);

    const setShikiTheme = monaco.editor.setTheme;

    monaco.editor.setTheme = (name: string) => {
      activeTheme = name;
      setShikiTheme(name);
    };

    if (activeTheme) {
      monaco.editor.setTheme(activeTheme);
    }
  };

  register();

  return {
    addThemes: (newThemes: Array<ThemeRegistration>) => {
      highlighter.loadThemeSync(...newThemes.map(withEveryColourStyle));
      register();
    },
  };
};
