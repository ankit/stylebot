import * as postcss from 'postcss';
import { Commit, Dispatch, GetterTree, Store } from 'vuex';

import { State } from './';

import {
  addDeclaration,
  addGoogleWebFont,
  cleanGoogleWebFonts,
  injectRootIntoDocument,
  getCssAfterApplyingFilterEffectToPage,
  removeEmptyRules,
} from '@stylebot/css';

import {
  apply as applyReadability,
  remove as removeReadability,
} from '@stylebot/readability';

import {
  Style,
  StylebotEditingMode,
  FilterEffect,
  ReadabilitySettings,
  StylebotBasicModeSections,
  StylebotLayout,
  StylebotColorPalette,
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
    if (!options.colorPalette) {
      options.colorPalette = defaultOptions.colorPalette;
    }
    if (!options.fonts) {
      options.fonts = defaultOptions.fonts;
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
    }: { state: State; commit: Commit; getters: GetterTree<State, State> },
    { inspect = false, store }: { inspect: boolean; store: Store<State> }
  ): void {
    initEditor(store);

    if (!state.enabled) {
      enableStyle(state.url);
    }

    commit('setVisible', true);

    // Editing page CSS has no effect while readability is running — show
    // the Magic panel instead, without persisting over the user's actual
    // mode preference for when they open Stylebot elsewhere.
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

  setColorPalette(
    { state, commit }: { state: State; commit: Commit },
    colorPalette: StylebotColorPalette
  ): void {
    setOption('colorPalette', colorPalette);
    commit('setOptions', { ...state.options, colorPalette });
  },

  setBasicModeSections(
    { state, commit }: { state: State; commit: Commit },
    basicModeSections: StylebotBasicModeSections
  ): void {
    setOption('basicModeSections', basicModeSections);
    commit('setOptions', { ...state.options, basicModeSections });
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

  async applyFontFamily(
    { state, dispatch }: { state: State; dispatch: Dispatch },
    value: string
  ): Promise<void> {
    let css = state.css;

    if (value) {
      css = await addGoogleWebFont(value, css);
    }

    if (css !== state.css) {
      dispatch('applyCss', { css });
    }

    dispatch('applyDeclaration', { property: 'font-family', value });

    css = cleanGoogleWebFonts(state.css);
    if (css !== state.css) {
      dispatch('applyCss', { css });
    }
  },

  applyReadability(
    {
      state,
      commit,
      dispatch,
    }: { state: State; commit: Commit; dispatch: Dispatch },
    value: boolean
  ): void {
    if (value) {
      applyReadability(true);
    } else {
      removeReadability();
    }

    // Editing page CSS has no effect while readability is running — its DOM
    // is detached from the document, not just hidden.
    if (value && ['basic', 'code'].includes(state.options.mode)) {
      dispatch('setMode', 'magic');
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
