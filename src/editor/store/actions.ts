import * as postcss from 'postcss';
import { Commit, Dispatch } from 'vuex';

import {
  addDeclaration,
  addGoogleWebFont,
  cleanGoogleWebFonts,
  injectRootIntoDocument,
  getCssAfterApplyingFilterEffectToPage,
} from '@stylebot/css';

import {
  apply as applyReadability,
  remove as removeReadability,
} from '@stylebot/readability';

import { StylebotEditingMode, FilterEffect } from '@stylebot/types';

import {
  getAllOptions,
  setOption,
  setStyle,
  getStylesForPage,
  enableStyle,
  setReadability,
} from '../utils/chrome';

import { State } from './';

export default {
  async initialize({ commit }: { commit: Commit }): Promise<void> {
    const options = await getAllOptions();
    const { defaultStyle } = await getStylesForPage(false);

    if (defaultStyle) {
      const { url, enabled, css, readability } = defaultStyle;

      commit('setUrl', url);
      commit('setCss', css);
      commit('setEnabled', enabled);
      commit('setReadability', readability);

      const root = postcss.parse(defaultStyle.css);
      commit('setSelectors', root);
    }

    commit('setOptions', options);
  },

  openStylebot({ state, commit }: { state: State; commit: Commit }): void {
    commit('setVisible', true);

    if (!state.enabled) {
      enableStyle(state.url);
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

  applyCss(
    { commit, state }: { commit: Commit; state: State },
    { css }: { css: string }
  ): void {
    try {
      const root = postcss.parse(css);
      injectRootIntoDocument(root, state.url);

      commit('setCss', css);
      commit('setSelectors', root);

      setStyle(state.url, css);
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
