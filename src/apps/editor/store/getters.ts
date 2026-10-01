import type * as postcss from 'postcss';

import type { State } from './';
import type { CssDeclaration } from '@stylebot/types';
import type { RoleColorGroups } from '@stylebot/css';
import {
  getRule,
  getRuleForSelector,
  withOwnDeclarationsOnly,
  getDeclarationValue,
  toHexColors,
  mergeShorthands,
  getFilterEffectValueForPage,
  getAlreadyUsedColors,
} from '@stylebot/css';

// A rule for every element can't be judged by the one that was picked.
const PAGE_WIDE_SELECTOR = /^\s*(\*|html|body|:root)\s*$/i;

export type OtherSelectorValue = { selector: string; value: string };

export default {
  /**
   * Falls back to a grouped rule the selector belongs to, so Basic mode
   * shows its declarations before any edit splits it into its own rule.
   * Carries only the rule's own declarations, so the property controls
   * don't read values from rules nested inside it. While picking, it's the
   * previewed element's rule, so the panel shows what a pick would.
   */
  activeRule: (
    state: State,
    getters: { inspectedSelector: string }
  ): postcss.Rule | null => {
    const selector = getters.inspectedSelector;

    if (!selector) {
      return null;
    }

    const rule =
      getRule(state.css, selector) ?? getRuleForSelector(state.css, selector);

    return rule ? withOwnDeclarationsOnly(rule) : null;
  },

  /**
   * Each property the inspected element takes from another of the user's
   * selectors, with that selector and its value, merged per selector so four
   * corner radii read as border-radius. The two getters below split it.
   */
  otherSelectorValues: (
    state: State,
    getters: { inspectedSelector: string }
  ): Record<string, OtherSelectorValue> => {
    const { inspectedSelector } = getters;
    const winners: Record<string, OtherSelectorValue> = {};

    if (PAGE_WIDE_SELECTOR.test(inspectedSelector)) {
      return winners;
    }

    const bySelector = new Map<string, Array<CssDeclaration>>();

    state.appliedDeclarations
      .filter(({ selector }) => selector !== inspectedSelector)
      .forEach(({ selector, property, value }) => {
        bySelector.set(selector, [
          ...(bySelector.get(selector) ?? []),
          { property, value },
        ]);
      });

    for (const [selector, declarations] of bySelector) {
      for (const { property, value } of mergeShorthands(declarations)) {
        winners[property] ??= { selector, value: toHexColors(value) };
      }
    }

    return winners;
  },

  /**
   * The user's other selectors that set a property on the inspected element
   * which the active rule leaves unset, keyed by property.
   */
  setByOtherSelector: (
    state: State,
    getters: {
      activeRule: postcss.Rule | null;
      otherSelectorValues: Record<string, OtherSelectorValue>;
    }
  ): Record<string, OtherSelectorValue> =>
    Object.fromEntries(
      Object.entries(getters.otherSelectorValues).filter(
        ([property]) => !getDeclarationValue(getters.activeRule, property)
      )
    ),

  /**
   * The user's other selectors that win a property on the element even
   * though the active rule sets it too, so edits here won't show.
   */
  overriddenByOtherSelector: (
    state: State,
    getters: {
      activeRule: postcss.Rule | null;
      otherSelectorValues: Record<string, OtherSelectorValue>;
    }
  ): Record<string, OtherSelectorValue> =>
    Object.fromEntries(
      Object.entries(getters.otherSelectorValues).filter(
        ([property]) => !!getDeclarationValue(getters.activeRule, property)
      )
    ),

  /**
   * The selector the panel reads the page for: the element under the
   * inspector while picking, otherwise the active selector.
   */
  inspectedSelector: (state: State): string =>
    (state.inspecting && state.previewSelector) || state.activeSelector,

  alreadyUsedColors: (state: State): RoleColorGroups =>
    getAlreadyUsedColors(state.css),

  canUndo: (state: State): boolean => state.undoStack.past.length > 0,

  canRedo: (state: State): boolean => state.undoStack.future.length > 0,

  grayscale: (state: State): number => {
    return getFilterEffectValueForPage(
      'grayscale',
      state.css,
      state.page.bodyChildSelectors
    );
  },

  // state.readability alone can be true domain-wide while this page
  // doesn't actually qualify (e.g. a wiki's main page).
  readabilityActive: (state: State): boolean => {
    return state.readability && state.page.readerable;
  },
};
