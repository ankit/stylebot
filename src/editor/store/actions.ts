import * as postcss from 'postcss';
import { Commit, Dispatch, Store } from 'vuex';

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
  injectRootIntoDocument,
  removeCSSFromDocument,
  getCssAfterApplyingFilterEffectToPage,
  removeEmptyRules,
  removeRule,
} from '@stylebot/css';

import { loadGoogleFonts } from '@stylebot/google-fonts';

import { applyReadability, removeReadability } from '@stylebot/readability';

import {
  Style,
  StylebotEditingMode,
  FilterEffect,
  ReadabilitySettings,
  StylebotBasicModeSections,
  StylebotLayout,
  StylebotAppearance,
} from '@stylebot/types';

import { defaultOptions } from '@stylebot/settings';

import {
  getAllOptions,
  setOption,
  setStyle,
  getStylesForPage,
  enableStyle,
  setReadability,
  getCommands,
  getReadabilitySettings,
  setReadabilitySettings,
} from '../utils/chrome';

import { initListeners } from '../listeners';
import { initEditor } from '../utils/init-editor';
import { readCache, writeCache } from '../../inject-css/cache';

const RECENT_FONTS_LIMIT = 10;
const FONT_PREVIEW_ID = 'font-preview';

const isBundledGoogleFont = async (family: string): Promise<boolean> =>
  (await loadGoogleFonts()).some(font => font.family === family);

// Bumped per apply/preview so that, after its awaits, a call superseded by a
// newer one does nothing: the latest one owns the stylesheet.
let fontRequest = 0;
let previewRequest = 0;

export default {
  async initialize(
    { commit, dispatch }: { commit: Commit; dispatch: Dispatch },
    store: Store<State>
  ): Promise<void> {
    const { defaultStyle } = await getStylesForPage(false);
    if (defaultStyle) {
      dispatch('initializeDefaultStyle', defaultStyle);
    }

    const options = await getAllOptions();
    if (!options.basicModeSections) {
      options.basicModeSections = defaultOptions.basicModeSections;
    }
    if (!options.layout) {
      options.layout = defaultOptions.layout;
    }
    if (!options.fonts) {
      options.fonts = defaultOptions.fonts;
    }
    if (!options.lastColorSet) {
      options.lastColorSet = defaultOptions.lastColorSet;
    }
    if (!options.lastColorPickerTab) {
      options.lastColorPickerTab = defaultOptions.lastColorPickerTab;
    }

    commit('setOptions', options);

    const commands = await getCommands();
    commit('setCommands', commands);

    const readabilitySettings = await getReadabilitySettings();
    commit('setReadabilitySettings', readabilitySettings);

    initListeners(store);
  },

  initializeDefaultStyle(
    { commit }: { commit: Commit },
    defaultStyle: Style
  ): void {
    const { url, enabled, css, readability } = defaultStyle;

    commit('setUrl', url);
    commit('setCss', css);
    commit('setEnabled', enabled);
    commit('setReadability', readability);

    const root = postcss.parse(defaultStyle.css);
    commit('setSelectors', root);
  },

  openStylebot(
    {
      state,
      commit,
      getters,
    }: { state: State; commit: Commit; getters: Getters },
    { inspect = false, store }: { inspect: boolean; store: Store<State> }
  ): void {
    initEditor(store);

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

  closeStylebot({ commit }: { commit: Commit }): void {
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

  setAppearance(
    { state, commit }: { state: State; commit: Commit },
    appearance: StylebotAppearance
  ): void {
    setOption('appearance', appearance);
    commit('setOptions', { ...state.options, appearance });
  },

  setBasicModeSections(
    { state, commit }: { state: State; commit: Commit },
    basicModeSections: StylebotBasicModeSections
  ): void {
    setOption('basicModeSections', basicModeSections);
    commit('setOptions', { ...state.options, basicModeSections });
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
      injectRootIntoDocument(root, state.url);

      commit('setCss', css);
      commit('setSelectors', root);

      // when saving, cleanup any empty rules
      const cleanCss = removeEmptyRules(css);
      setStyle(state.url, cleanCss, state.readability);

      // Keep the localStorage cache (read synchronously on the next page
      // load, before chrome.storage.local resolves) in sync with edits, so
      // reloading right after a change doesn't flash the pre-edit CSS.
      const cached = readCache();
      if (cached) {
        const entry = { url: state.url, css: cleanCss, enabled: state.enabled };
        const exists = cached.styles.some(style => style.url === state.url);

        writeCache({
          ...cached,
          styles: exists
            ? cached.styles.map(style =>
                style.url === state.url ? entry : style
              )
            : [...cached.styles, entry],
        });
      }
    } catch (e) {
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

    removeCSSFromDocument(FONT_PREVIEW_ID);
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
      removeCSSFromDocument(FONT_PREVIEW_ID);
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
      injectRootIntoDocument(postcss.parse(css), FONT_PREVIEW_ID);
    } catch {
      return;
    }
  },

  applyReadability(
    { state, commit }: { state: State; commit: Commit },
    value: boolean
  ): void {
    if (value) {
      applyReadability(true);
    } else {
      removeReadability();
    }

    // Editing page CSS has no effect while readability is running — its DOM
    // is detached from the document, not just hidden. Switch the panel to
    // Magic locally without persisting over the user's global mode
    // preference (mirrors openStylebot's readabilityActive handling above).
    if (value && ['basic', 'code'].includes(state.options.mode)) {
      commit('setOptions', { ...state.options, mode: 'magic' });
    }

    commit('setReadability', value);
    setReadability(state.url, value);

    // Keep the localStorage cache in sync so a refresh right after
    // toggling doesn't apply the stale readability state.
    const cached = readCache();
    if (cached) {
      writeCache({ ...cached, readability: value });
    }
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
      dispatch,
    }: {
      state: State;
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
    dispatch('applyCss', {
      css: getCssAfterApplyingFilterEffectToPage(
        effectName,
        state.css,
        percent
      ),
    });
  },
};
