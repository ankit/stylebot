import * as postcss from 'postcss';
import { Commit, Dispatch } from 'vuex';

import { State } from './';
import storeGetters from './getters';

type Getters = {
  [K in keyof typeof storeGetters]: ReturnType<(typeof storeGetters)[K]>;
};

import {
  addDeclaration,
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  getPrimaryFontFamily,
  googleWebFontExists,
  getCssAfterApplyingFilterEffectToPage,
  removeEmptyRules,
  removeRule,
} from '@stylebot/css';

import { loadGoogleFonts } from '@stylebot/google-fonts';

import {
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

import {
  getPageBridge,
  RemotePageBridgeSyncedState,
} from '@stylebot/page-bridge';

const RECENT_FONTS_LIMIT = 10;
const isBundledGoogleFont = async (family: string): Promise<boolean> =>
  (await loadGoogleFonts()).some(font => font.family === family);

// Bumped per apply/preview so that, after its awaits, a call superseded by a
// newer one does nothing: the latest one owns the stylesheet.
let fontRequest = 0;
let previewRequest = 0;

export default {
  async initialize({ commit }: { commit: Commit }): Promise<void> {
    const options = await getAllOptions();
    commit('setOptions', options);

    const commands = await getCommands();
    commit('setCommands', commands);

    const readabilitySettings = await getReadabilitySettings();
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
    dispatch('syncFromPage', { url, enabled, css, readability });
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
    { css }: { css: string }
  ): void {
    try {
      const root = postcss.parse(css);

      getPageBridge().applyCss({
        url: state.url,
        css,
        enabled: state.enabled,
      });
      setStyle(state.url, removeEmptyRules(css), state.readability);

      commit('setCss', css);
      commit('setSelectors', root);
    } catch {
      //
    }
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

    dispatch('applyCss', { css });
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
    dispatch('applyCss', { css });
  },

  /**
   * Applies a font-family value right away, then adds the Google Fonts import
   * for its first family: synchronously when the family is in the bundled
   * list, otherwise once the existence check comes back. Only explicit picks
   * are remembered as recents, not text applied by leaving the field.
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

    const shouldImport =
      !!family &&
      ((await isBundledGoogleFont(family)) ||
        (await googleWebFontExists(family)));

    if (request !== fontRequest) {
      return;
    }

    // Read the css only now: other edits may have landed during the awaits.
    const withImport = shouldImport
      ? addGoogleWebFontImport(family, state.css)
      : state.css;
    const css = cleanGoogleWebFonts(withImport);

    if (css !== state.css) {
      dispatch('applyCss', { css });
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

    if (family && (await isBundledGoogleFont(family))) {
      css = addGoogleWebFontImport(family, css);
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

    getPageBridge().setPreviewCss(css);
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
    });
  },
};
