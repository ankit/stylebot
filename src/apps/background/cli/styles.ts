import { getAll } from '../styles';
import { activeCss } from './profiles';
import { prepareCss, readStylesheet, saveCss } from './save-css';
import { appendRules, diffRules, editRule, grepRules } from './style-edit';
import { parseSavedCss } from './stylesheet';
import { requireNamed } from './targets';
import type { CliCommands } from './types';

/**
 * The stylesheet of the site or tab a command named, for commands that write
 * css: they never fall back to the active tab, which can change under a
 * command run in several steps.
 */
const readNamedStylesheet = (target: unknown, profile: unknown) => {
  requireNamed(target, 'site or tab');
  return readStylesheet(target, profile);
};

export const styleCommands: CliCommands = {
  async styles() {
    const styles = await getAll();

    return Object.entries(styles).map(([url, style]) => ({
      url,
      enabled: style.enabled,
      css: activeCss(style),
    }));
  },

  async getCss({ target, profile, grep }) {
    const { url, css } = await readStylesheet(target, profile);

    if (!grep) {
      return { url, css };
    }

    return { url, css: grepRules(css, String(grep)), grep: String(grep) };
  },

  async setCss({ target, css, profile, verbose }) {
    const sheet = await readNamedStylesheet(target, profile);
    return saveCss(sheet, String(css), { verbose: Boolean(verbose) });
  },

  async addCss({ target, css, profile, verbose }) {
    const sheet = await readNamedStylesheet(target, profile);
    const addition = String(css ?? '');

    if (!addition.trim()) {
      throw new Error('css add needs css to add');
    }

    const added = appendRules(sheet.css, addition);
    const saved = await saveCss(sheet, added.css, {
      verbose: Boolean(verbose),
    });

    return { ...saved, duplicates: added.duplicates };
  },

  async editRule({
    target,
    selector,
    media,
    set,
    unset,
    remove,
    profile,
    verbose,
  }) {
    const ruleSelector = String(selector ?? '');
    const query = media ? String(media) : undefined;

    if (!ruleSelector.trim()) {
      throw new Error('Name the selector of the rule to edit');
    }

    const sheet = await readNamedStylesheet(target, profile);
    const edited = editRule(sheet.css, {
      selector: ruleSelector,
      media: query,
      set: set as Array<{ property: string; value: string }> | undefined,
      unset: unset as Array<string> | undefined,
      delete: Boolean(remove),
    });
    const saved = await saveCss(sheet, edited.css, {
      verbose: Boolean(verbose),
    });
    const { created, deleted, notFound } = edited;

    return { ...saved, edit: { created, deleted, notFound } };
  },

  async diffCss({ target, css, profile }) {
    const sheet = await readStylesheet(target, profile);
    const given = await prepareCss(String(css));
    const diff = diffRules(parseSavedCss(sheet.css), given.root);

    return {
      url: sheet.url,
      ...diff,
      fonts: given.fonts,
      swappedSelectors: given.swappedSelectors,
    };
  },
};
