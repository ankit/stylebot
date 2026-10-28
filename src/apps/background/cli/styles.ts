import { addGoogleFontImports } from '@stylebot/google-fonts';
import { expandProfiles } from '@stylebot/saved-styles';
import type { CssEdit, StyleCheckReport } from '@stylebot/types';

import { applyStylesToAllTabs, getAll, set } from '../styles';
import { describeStyleCheck } from './style-report';
import { EMPTY_STYLE, activeCss, resolveProfileId } from './profiles';
import {
  type RuleChanges,
  allDeclarations,
  changedDeclarations,
  compareRules,
  googleFontImports,
  parseCss,
  parseSavedCss,
  ruleSelectors,
  useStableSelectors,
} from './style-check';
import {
  findTabShowing,
  inspectTab,
  requireNamed,
  resolveStyleUrl,
} from './targets';
import type { CliCommands } from './types';

/**
 * The css with Google Fonts imports added for the families it names, and
 * the families it newly imports.
 */
const addFontImports = async (
  css: string
): Promise<{ css: string; fonts: Array<string> }> => {
  const given = parseCss(css);
  const imported = new Set(googleFontImports(given));
  const withImports = await addGoogleFontImports(css, allDeclarations(given));

  return {
    css: withImports,
    fonts: googleFontImports(parseCss(withImports)).filter(
      family => !imported.has(family)
    ),
  };
};

/**
 * Notes the page before the edits apply, on a tab showing a page the style
 * applies to, and resolves to that tab's id and the other tabs showing one;
 * a null id when no tab shows one or its page can't be asked.
 */
const startCheck = async (
  url: string,
  target: unknown,
  edits: Array<CssEdit>
): Promise<{ tabId: number | null; others: Array<number> }> => {
  const { tab, others } = await findTabShowing(url, target);

  if (tab?.id === undefined) {
    return { tabId: null, others };
  }

  const tabId = await inspectTab(tab.id, { kind: 'startCheck', edits }).then(
    () => tab.id as number,
    () => null
  );

  return { tabId, others };
};

/**
 * What the check started on a tab found once the style has applied, with
 * its wording for the terminal; null when no check started or the page
 * can't say.
 */
const finishCheck = async (
  tabId: number | null,
  selectors: Array<string>,
  changes: RuleChanges | null
): Promise<(StyleCheckReport & { check: string }) | null> => {
  if (tabId === null) {
    return null;
  }

  const report = await inspectTab<StyleCheckReport>(tabId, {
    kind: 'finishCheck',
    selectors,
  }).catch(() => null);

  if (!report) {
    return null;
  }

  return {
    ...report,
    // Selectors on one line, as a terminal prints them.
    check: describeStyleCheck(
      selectors.map(selector => selector.replace(/\s*\n\s*/g, ' ')),
      report.matchCounts,
      report.styleProblems,
      changes
    ),
  };
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

  async getCss({ target, profile }) {
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];

    if (!profile) {
      return { url, css: style ? activeCss(style) : '' };
    }

    const id = resolveProfileId(style, profile);
    return { url, css: expandProfiles(style ?? EMPTY_STYLE).sheets[id].css };
  },

  async setCss({ target, css, profile, verbose }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const style = (await getAll())[url];
    const profileId = profile ? resolveProfileId(style, profile) : undefined;
    const { active, sheets } = expandProfiles(style ?? EMPTY_STYLE);
    const id = profileId ?? active;

    const save = async (next: string) => {
      await set(url, next, style?.readability ?? false, undefined, profileId);
      await applyStylesToAllTabs();
    };

    // Blank css, such as a lone newline from a pipe, deletes the style.
    if (!String(css).trim()) {
      await save('');
      return { url, deleted: true };
    }

    const withFonts = await addFontImports(String(css));
    const after = parseCss(withFonts.css);
    const swappedSelectors = useStableSelectors(after);
    const { fonts } = withFonts;
    const next = swappedSelectors.length ? after.toString() : withFonts.css;
    const selectors = ruleSelectors(after);
    const before = parseSavedCss(sheets[id]?.css ?? '');
    const edits = changedDeclarations(before, after);
    const changes = verbose ? null : compareRules(before, after);

    // Only the profile in use shows on the page, so only it can be checked.
    const { tabId, others } =
      id === active && selectors.length
        ? await startCheck(url, target, edits)
        : { tabId: null, others: [] };

    await save(next);

    const report = await finishCheck(tabId, selectors, changes);

    return {
      url,
      deleted: false,
      notInUse: id === active ? null : String(profile),
      fonts,
      swappedSelectors,
      checkedTab: report ? tabId : null,
      otherTabs: report ? others : [],
      selectors,
      matchCounts: report?.matchCounts ?? null,
      styleProblems: report?.styleProblems ?? null,
      fragileSelectors: report?.fragileSelectors ?? null,
      check: report?.check ?? null,
    };
  },
};
