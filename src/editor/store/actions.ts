import * as postcss from 'postcss';
import type { Commit, Dispatch } from 'vuex';

import type { State } from './';
import type storeGetters from './getters';

type Getters = {
  [K in keyof typeof storeGetters]: ReturnType<(typeof storeGetters)[K]>;
};

import {
  addDeclaration,
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  getPrimaryFontFamily,
  getCssAfterApplyingFilterEffectToPage,
  removeEmptyRules,
  removeRule,
} from '@stylebot/css';

import { resolveGoogleFont } from '@stylebot/google-fonts';

import type {
  Style,
  StylebotEditingMode,
  FilterEffect,
  ReadabilitySettings,
  StylebotBasicModeSections,
  StylebotLayout,
  StylebotAppearance,
} from '@stylebot/types';

import {
  getAllOptions,
  setOption,
  setStyle,
  setReadability,
  enableStyle,
  getCommands,
  getReadabilitySettings,
  setReadabilitySettings,
  closeEditorWindow,
  openEditorWindow,
} from '../utils/chrome';

import type { RemotePageBridgeSyncedState } from '@stylebot/page-bridge';
import { getPageBridge } from '@stylebot/page-bridge';

import { PLACEHOLDER_PROPERTIES } from '../utils/computed-placeholder';
import { isForceImportant } from '@stylebot/styles';

import {
  emptyUndoStack,
  recordChange,
  undoChange,
  redoChange,
} from './undo-stack';

export type ApplyCssArgs = {
  css: string;
  // Groups rapid changes into one undo step: a drag or a burst of
  // keystrokes on one control, each from the same source.
  source?: string;
  // False for housekeeping (empty-rule shuffling, import cleanup) and for
  // undo/redo itself, which must not become steps of their own.
  record?: boolean;
};

const RECENT_FONTS_LIMIT = 10;

// Bumped per apply/preview so that, after its awaits, a call superseded by a
// newer one does nothing: the latest one owns the stylesheet.
let fontRequest = 0;
let previewRequest = 0;
let computedStylesRequest = 0;

export default {
  async initialize({ commit }: { commit: Commit }): Promise<void> {
    const [options, commands, readabilitySettings] = await Promise.all([
      getAllOptions(),
      getCommands(),
      getReadabilitySettings(),
    ]);

    commit('setOptions', options);
    commit('setCommands', commands);
    commit('setReadabilitySettings', readabilitySettings);
  },

  /**
   * Re-reads the page facts the store mirrors; a page that can't answer
   * (navigating away) keeps the last snapshot.
   */
  async refreshPage({ commit }: { commit: Commit }): Promise<void> {
    try {
      commit('setPage', await getPageBridge().getSnapshot());
    } catch {
      //
    }
  },

  initializeDefaultStyle(
    { dispatch }: { dispatch: Dispatch },
    defaultStyle: Style
  ): void {
    const { url, enabled, css, readability } = defaultStyle;
    const forceImportant = isForceImportant(defaultStyle);
    dispatch('syncFromPage', {
      url,
      enabled,
      css,
      readability,
      forceImportant,
    });
  },

  /**
   * Mirrors state the page owns — from its stored style, or, in the window
   * host, whatever the tab reports over the port.
   */
  syncFromPage(
    { commit }: { commit: Commit },
    state: Partial<RemotePageBridgeSyncedState>
  ): void {
    if (state.url !== undefined) {
      commit('setUrl', state.url);
    }
    if (state.enabled !== undefined) {
      commit('setEnabled', state.enabled);
    }
    if (state.readability !== undefined) {
      commit('setReadability', state.readability);
    }
    if (state.forceImportant !== undefined) {
      commit('setForceImportant', state.forceImportant);
    }
    if (state.css !== undefined) {
      commit('setCss', state.css);
      commit('setSelectors', postcss.parse(state.css));
    }
  },

  async openStylebot(
    {
      state,
      commit,
      dispatch,
      getters,
    }: {
      state: State;
      commit: Commit;
      dispatch: Dispatch;
      getters: Getters;
    },
    { inspect = false }: { inspect?: boolean } = {}
  ): Promise<void> {
    await dispatch('refreshPage');

    if (!state.enabled) {
      enableStyle(state.url);
    }

    commit('setVisible', true);

    // Show Magic instead of the useless Basic/Code panel, without
    // persisting over the user's actual mode preference elsewhere.
    if (getters.readabilityActive && state.options.mode !== 'magic') {
      commit('setOptions', { ...state.options, mode: 'magic' });
    }

    if (state.options.mode === 'basic' && inspect) {
      commit('setInspecting', true);
    }
  },

  closeStylebot({ state, commit }: { state: State; commit: Commit }): void {
    if (state.host === 'window') {
      closeEditorWindow(state.tabId ?? undefined);
      return;
    }

    commit('setVisible', false);
    commit('setUndoStack', emptyUndoStack());
  },

  escape({
    state,
    commit,
    dispatch,
  }: {
    state: State;
    commit: Commit;
    dispatch: Dispatch;
  }): void {
    if (state.help) {
      commit('setHelp', false);
      return;
    }

    // A separate window closes with Cmd/Ctrl+W like any other, so Escape only backs out.
    if (state.host === 'window') {
      if (state.inspecting) {
        commit('setInspecting', false);
      }
      return;
    }

    dispatch('closeStylebot');
  },

  setMode(
    { state, commit }: { state: State; commit: Commit },
    mode: StylebotEditingMode
  ): void {
    setOption('mode', mode);
    commit('setOptions', { ...state.options, mode });
  },

  setLayout(
    { state, commit }: { state: State; commit: Commit },
    layout: StylebotLayout
  ): void {
    setOption('layout', layout);
    commit('setOptions', { ...state.options, layout });
  },

  /**
   * Persists the dock choice and moves the editor to match: the page hands
   * off to a separate window, or a window hands back to the page.
   */
  setDockLocation(
    {
      state,
      commit,
      dispatch,
    }: { state: State; commit: Commit; dispatch: Dispatch },
    dockLocation: StylebotLayout['dockLocation']
  ): void {
    dispatch('setLayout', { ...state.options.layout, dockLocation });

    if (state.host === 'page' && dockLocation === 'window') {
      commit('setVisible', false);
      openEditorWindow();
    } else if (state.host === 'window' && dockLocation !== 'window') {
      getPageBridge().openInPage();
    }
  },

  setAppearance(
    { state, commit }: { state: State; commit: Commit },
    appearance: StylebotAppearance
  ): void {
    setOption('appearance', appearance);
    commit('setOptions', { ...state.options, appearance });
  },

  setBasicModeOpenedSections(
    { state, commit }: { state: State; commit: Commit },
    basicModeOpenedSections: StylebotBasicModeSections
  ): void {
    setOption('basicModeOpenedSections', basicModeOpenedSections);
    commit('setOptions', { ...state.options, basicModeOpenedSections });
  },

  setLastColorSet(
    { state, commit }: { state: State; commit: Commit },
    lastColorSet: string
  ): void {
    setOption('lastColorSet', lastColorSet);
    commit('setOptions', { ...state.options, lastColorSet });
  },

  setLastColorPickerTab(
    { state, commit }: { state: State; commit: Commit },
    lastColorPickerTab: string
  ): void {
    setOption('lastColorPickerTab', lastColorPickerTab);
    commit('setOptions', { ...state.options, lastColorPickerTab });
  },

  /**
   * Moves a font to the front of the recently used list, which the font
   * picker shows by default.
   */
  rememberFont(
    { state, commit }: { state: State; commit: Commit },
    font: string
  ): void {
    const fonts = [
      font,
      ...state.options.fonts.filter(item => item !== font),
    ].slice(0, RECENT_FONTS_LIMIT);

    setOption('fonts', fonts);
    commit('setOptions', { ...state.options, fonts });
  },

  applyCss(
    { commit, state }: { commit: Commit; state: State },
    { css, source = 'edit', record = true }: ApplyCssArgs
  ): void {
    // Saving empty css deletes the style, and holding none may just mean the
    // stored one never reached the editor rather than that there is none.
    if (!css && !state.css) {
      return;
    }

    try {
      const root = postcss.parse(css);

      getPageBridge().applyCss({
        url: state.url,
        css,
        enabled: state.enabled,
        forceImportant: state.forceImportant,
      });
      setStyle(
        state.url,
        removeEmptyRules(css),
        state.readability,
        state.forceImportant
      );

      if (record && css !== state.css) {
        commit(
          'setUndoStack',
          recordChange(state.undoStack, state.css, source)
        );
      }

      commit('setCss', css);
      commit('setSelectors', root);
    } catch {
      //
    }
  },

  /**
   * Switches whether the style has `!important` forced onto every
   * declaration or is applied exactly as written, and reapplies it.
   */
  setForceImportant(
    {
      state,
      commit,
      dispatch,
    }: {
      state: State;
      commit: Commit;
      dispatch: Dispatch;
    },
    value: boolean
  ): void {
    commit('setForceImportant', value);
    dispatch('applyCss', { css: state.css });
  },

  /**
   * Re-reads the computed styles the basic editor shows as placeholders;
   * a read overtaken by a newer one is dropped.
   */
  async refreshComputedStyles({
    commit,
    state,
  }: {
    commit: Commit;
    state: State;
  }): Promise<void> {
    const request = ++computedStylesRequest;
    let styles: Record<string, string> = {};

    if (state.activeSelector && state.pageConnected) {
      try {
        styles = await getPageBridge().getComputedStyles(
          state.activeSelector,
          PLACEHOLDER_PROPERTIES
        );
      } catch {
        //
      }
    }

    if (request === computedStylesRequest) {
      commit('setComputedStyles', styles);
    }
  },

  /**
   * Steps the css back to before the latest change, through the same path
   * an edit takes so the page and storage follow.
   */
  undo({
    state,
    commit,
    dispatch,
  }: {
    state: State;
    commit: Commit;
    dispatch: Dispatch;
  }): void {
    const move = undoChange(state.undoStack, state.css);

    if (!move) {
      return;
    }

    commit('setUndoStack', move.undoStack);
    dispatch('applyCss', { css: move.css, record: false });
  },

  redo({
    state,
    commit,
    dispatch,
  }: {
    state: State;
    commit: Commit;
    dispatch: Dispatch;
  }): void {
    const move = redoChange(state.undoStack, state.css);

    if (!move) {
      return;
    }

    commit('setUndoStack', move.undoStack);
    dispatch('applyCss', { css: move.css, record: false });
  },

  applyDeclaration(
    { state, dispatch }: { state: State; dispatch: Dispatch },
    { property, value }: { property: string; value: string }
  ): void {
    if (!state.activeSelector) {
      return;
    }

    const css = addDeclaration(
      property,
      value,
      state.activeSelector,
      state.css
    );

    dispatch('applyCss', {
      css,
      source: `declaration:${state.activeSelector}:${property}`,
    });
  },

  resetActiveRule({
    state,
    dispatch,
  }: {
    state: State;
    dispatch: Dispatch;
  }): void {
    if (!state.activeSelector) {
      return;
    }

    const css = removeRule(state.css, state.activeSelector);
    dispatch('applyCss', { css, source: 'reset' });
  },

  /**
   * Applies a font-family value, then imports its first family if Google
   * serves it. Only explicit picks are remembered as recents.
   */
  async applyFontFamily(
    { state, dispatch }: { state: State; dispatch: Dispatch },
    { value, remember = false }: { value: string; remember?: boolean }
  ): Promise<void> {
    const request = ++fontRequest;
    const family = getPrimaryFontFamily(value);

    dispatch('applyDeclaration', { property: 'font-family', value });

    if (family && remember) {
      dispatch('rememberFont', family);
    }

    const googleFont = family ? await resolveGoogleFont(family) : null;

    if (request !== fontRequest) {
      return;
    }

    // Read the css only now: other edits may have landed during the awaits.
    const withImport = googleFont
      ? addGoogleWebFontImport(googleFont, state.css)
      : state.css;
    const css = cleanGoogleWebFonts(withImport);

    // The import belongs to the font pick the user already made; undoing
    // that pick takes the import with it.
    if (css !== state.css) {
      dispatch('applyCss', { css, record: false });
    }

    getPageBridge().setPreviewCss(null);
  },

  /**
   * Shows a font-family value on the active selector without saving it, via
   * a separate stylesheet. An empty value removes the preview.
   */
  async previewFontFamily(
    { state }: { state: State },
    value: string
  ): Promise<void> {
    const request = ++previewRequest;

    if (!state.activeSelector) {
      return;
    }

    if (!value) {
      getPageBridge().setPreviewCss(null);
      return;
    }

    const family = getPrimaryFontFamily(value);
    let css = `${state.activeSelector} { font-family: ${value}; }`;

    const googleFont = family ? await resolveGoogleFont(family) : null;

    if (googleFont) {
      css = addGoogleWebFontImport(googleFont, css);
    }

    if (request !== previewRequest) {
      return;
    }

    // Typed text may not be valid CSS; then there's nothing to preview.
    try {
      postcss.parse(css);
    } catch {
      return;
    }

    getPageBridge().setPreviewCss({
      css,
      forceImportant: state.forceImportant,
    });
  },

  applyReadability(
    { state, commit }: { state: State; commit: Commit },
    value: boolean
  ): void {
    getPageBridge().applyReadability(value);
    setReadability(state.url, value);

    // Editing page CSS has no effect while readability is running — its DOM
    // is detached from the document, not just hidden. Switch the panel to
    // Magic locally without persisting over the user's global mode
    // preference (mirrors openStylebot's readabilityActive handling above).
    if (value && ['basic', 'code'].includes(state.options.mode)) {
      commit('setOptions', { ...state.options, mode: 'magic' });
    }

    commit('setReadability', value);
  },

  setReadabilitySettings(
    { commit }: { commit: Commit },
    value: ReadabilitySettings
  ): void {
    setReadabilitySettings(value);
    commit('setReadabilitySettings', value);
  },

  applyFilter(
    {
      state,
      commit,
      dispatch,
    }: {
      state: State;
      commit: Commit;
      dispatch: Dispatch;
    },
    {
      effectName,
      percent,
    }: {
      effectName: FilterEffect;
      percent: string;
    }
  ): void {
    // Filters attach to body's current children: read them now where the
    // page is at hand, else use the last snapshot and refresh for next time.
    const fresh = getPageBridge().getSnapshotSync?.();
    if (fresh) {
      commit('setPage', fresh);
    } else {
      dispatch('refreshPage');
    }

    dispatch('applyCss', {
      css: getCssAfterApplyingFilterEffectToPage(
        effectName,
        state.css,
        percent,
        (fresh ?? state.page).bodyChildSelectors
      ),
      source: `filter:${effectName}`,
    });
  },
};
