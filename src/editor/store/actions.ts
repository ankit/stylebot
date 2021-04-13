import * as postcss from 'postcss';
import { Commit, Dispatch, Store } from 'vuex';

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
    { state, commit }: { state: State; commit: Commit },
    { inspect = false, store }: { inspect: boolean; store: Store<State> }
  ): void {
    initEditor(store);

    if (!state.enabled) {
      enableStyle(state.url);
    }

    commit('setVisible', true);

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
    { state, commit }: { state: State; commit: Commit },
    value: boolean
  ): void {
    if (value) {
      applyReadability(true);
    } else {
      removeReadability();
    }

    commit('setReadability', value);
    setReadability(state.url, value);
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
