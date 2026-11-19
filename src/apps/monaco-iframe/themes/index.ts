import type { ThemeRegistration } from '@shikijs/primitive';
import type { StylebotCodeTheme } from '@stylebot/types';

export type CodeThemeVariants = {
  light: ThemeRegistration;
  dark: ThemeRegistration;
};

type ThemeModule = Promise<{ default: unknown }>;

const variants = async (
  light: ThemeModule,
  dark: ThemeModule
): Promise<CodeThemeVariants> => {
  const [lightModule, darkModule] = await Promise.all([light, dark]);

  return {
    light: lightModule.default as ThemeRegistration,
    dark: darkModule.default as ThemeRegistration,
  };
};

/**
 * VS Code theme files: Stylebot's own come with the highlighter, the rest
 * from Shiki's set, each its own chunk fetched the first time it's picked.
 */
const loaders: Record<StylebotCodeTheme, () => Promise<CodeThemeVariants>> = {
  stylebot: () =>
    variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/shiki" */ './stylebot-light.json'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/shiki" */ './stylebot-dark.json'
      )
    ),
  catppuccin: () =>
    variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/catppuccin" */ '@shikijs/themes/dist/catppuccin-latte.mjs'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/catppuccin" */ '@shikijs/themes/dist/catppuccin-mocha.mjs'
      )
    ),
  github: () =>
    variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/github" */ '@shikijs/themes/dist/github-light-default.mjs'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/github" */ '@shikijs/themes/dist/github-dark-default.mjs'
      )
    ),
  gruvbox: () =>
    variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/gruvbox" */ '@shikijs/themes/dist/gruvbox-light-medium.mjs'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/gruvbox" */ '@shikijs/themes/dist/gruvbox-dark-medium.mjs'
      )
    ),
  'rose-pine': () =>
    variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/rose-pine" */ '@shikijs/themes/dist/rose-pine-dawn.mjs'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/rose-pine" */ '@shikijs/themes/dist/rose-pine.mjs'
      )
    ),
  solarized: async () => {
    const { light, dark } = await variants(
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/solarized" */ '@shikijs/themes/dist/solarized-light.mjs'
      ),
      import(
        /* webpackChunkName: "monaco-editor/iframe/themes/solarized" */ '@shikijs/themes/dist/solarized-dark.mjs'
      )
    );

    // Solarized Light has no bracket colours, which leaves Monaco's gold.
    return {
      light: {
        ...light,
        colors: {
          ...light.colors,
          'editorBracketHighlight.foreground1': '#268bd2',
          'editorBracketHighlight.foreground2': '#b58900',
          'editorBracketHighlight.foreground3': '#d33682',
        },
      },
      dark,
    };
  },
};

/**
 * The code editor's themes, in the order they're offered, with their names.
 */
export const codeThemes: Array<{ value: StylebotCodeTheme; name: string }> = [
  { value: 'stylebot', name: 'Stylebot' },
  { value: 'catppuccin', name: 'Catppuccin' },
  { value: 'github', name: 'GitHub' },
  { value: 'gruvbox', name: 'Gruvbox' },
  { value: 'rose-pine', name: 'Rosé Pine' },
  { value: 'solarized', name: 'Solarized' },
];

export const isCodeTheme = (name: unknown): name is StylebotCodeTheme =>
  typeof name === 'string' && Object.hasOwn(loaders, name);

/**
 * Both variants of a code theme, renamed to the Monaco theme ids the editor
 * uses: `<code theme>-light` and `<code theme>-dark`.
 */
export const loadCodeTheme = async (
  name: StylebotCodeTheme
): Promise<CodeThemeVariants> => {
  const { light, dark } = await loaders[name]();

  return {
    light: { ...light, name: `${name}-light` },
    dark: { ...dark, name: `${name}-dark` },
  };
};
