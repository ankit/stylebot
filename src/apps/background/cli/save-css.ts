import { addGoogleFontImports } from '@stylebot/google-fonts';
import { expandProfiles } from '@stylebot/saved-styles';
import type {
  CssEdit,
  StyleCheckReport,
  StyleWithoutUrl,
} from '@stylebot/types';

import { applyStylesToAllTabs, getAll, set } from '../styles';
import { EMPTY_STYLE, resolveProfileId } from './profiles';
import {
  type RuleChanges,
  allDeclarations,
  changedDeclarations,
  compareRules,
  googleFontImports,
  ruleSelectors,
  useStableSelectors,
} from './style-check';
import { describeStyleCheck } from './style-report';
import { collapseWhitespace, parseCss, parseSavedCss } from './stylesheet';
import { findTabShowing, inspectTab, resolveStyleUrl } from './targets';

/**
 * One profile's stylesheet, as a command named it.
 */
type ProfileStylesheet = {
  // The tab or site the command named, which picks the tab to check.
  target: unknown;
  url: string;
  style: StyleWithoutUrl | undefined;
  // Set when the command named a profile rather than leaving it to the one
  // in use.
  profileId?: string;
  profileName?: string;
  isInUse: boolean;
  css: string;
};

/**
 * The stylesheet of the profile named, or else the one in use, of the style
 * a tab or site has.
 */
export const readStylesheet = async (
  target: unknown,
  profile: unknown
): Promise<ProfileStylesheet> => {
  const url = await resolveStyleUrl(target);
  const style = (await getAll())[url];
  const { active, sheets } = expandProfiles(style ?? EMPTY_STYLE);
  const profileId = profile ? resolveProfileId(style, profile) : undefined;
  const sheet = sheets[profileId ?? active];

  return {
    target,
    url,
    style,
    profileId,
    profileName: profileId ? sheet?.name : undefined,
    isInUse: !profileId || profileId === active,
    css: sheet?.css ?? '',
  };
};

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
  const fonts = googleFontImports(parseCss(withImports)).filter(
    family => !imported.has(family)
  );

  return { css: withImports, fonts };
};

/**
 * The css as it would be saved: with Google Fonts imports for the families
 * it names and stable selectors for partly hashed classes.
 */
export const prepareCss = async (css: string) => {
  const { css: withImports, fonts } = await addFontImports(css);
  const root = parseCss(withImports);
  const swappedSelectors = useStableSelectors(root);

  return {
    css: swappedSelectors.length ? root.toString() : withImports,
    root,
    fonts,
    swappedSelectors,
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

const NOT_CHECKED = {
  checkedTab: null,
  otherTabs: [],
  matchCounts: null,
  styleProblems: null,
  fragileSelectors: null,
  check: null,
};

/**
 * What a save reports about the check started on a tab, once the style has
 * applied: the tab, the other tabs showing the style, what the page found
 * and its wording for the terminal. Nulls when no check started or the page
 * can't say.
 */
const finishCheck = async (
  tabId: number | null,
  others: Array<number>,
  selectors: Array<string>,
  changes: RuleChanges | null
) => {
  if (tabId === null) {
    return NOT_CHECKED;
  }

  const report = await inspectTab<StyleCheckReport>(tabId, {
    kind: 'finishCheck',
    selectors,
  }).catch(() => null);

  if (!report) {
    return NOT_CHECKED;
  }

  const { matchCounts, styleProblems, fragileSelectors } = report;
  const check = describeStyleCheck(
    selectors.map(collapseWhitespace),
    matchCounts,
    styleProblems,
    changes
  );

  return {
    checkedTab: tabId,
    otherTabs: others,
    matchCounts,
    styleProblems,
    fragileSelectors,
    check,
  };
};

/**
 * Saves css as a profile's stylesheet and applies it to open tabs. Blank css,
 * such as a lone newline from a pipe, deletes the style.
 */
const writeStylesheet = async (
  sheet: ProfileStylesheet,
  css: string
): Promise<void> => {
  const readability = sheet.style?.readability ?? false;

  await set(sheet.url, css, readability, undefined, sheet.profileId);
  await applyStylesToAllTabs();
};

/**
 * Saves css as a profile's stylesheet, applies it, and checks the page on a
 * tab showing it: what every command that writes css does and reports.
 */
export const saveCss = async (
  sheet: ProfileStylesheet,
  css: string,
  { verbose = false }: { verbose?: boolean } = {}
) => {
  const { url, target, isInUse } = sheet;

  if (!css.trim()) {
    await writeStylesheet(sheet, '');
    return { url, deleted: true };
  }

  const prepared = await prepareCss(css);
  const selectors = ruleSelectors(prepared.root);
  const before = parseSavedCss(sheet.css);
  const edits = changedDeclarations(before, prepared.root);
  const changes = verbose ? null : compareRules(before, prepared.root);

  // Only the profile in use shows on the page, so only it can be checked.
  const canCheck = isInUse && selectors.length > 0;
  const { tabId, others } = canCheck
    ? await startCheck(url, target, edits)
    : { tabId: null, others: [] };

  await writeStylesheet(sheet, prepared.css);

  const check = await finishCheck(tabId, others, selectors, changes);

  const notInUse = isInUse ? null : sheet.profileName ?? null;
  const { fonts, swappedSelectors } = prepared;

  return {
    url,
    deleted: false,
    notInUse,
    fonts,
    swappedSelectors,
    selectors,
    ...check,
  };
};
