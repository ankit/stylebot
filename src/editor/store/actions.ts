import * as postcss from 'postcss';
import { Commit, Dispatch } from 'vuex';

import CssUtils from '../../css/CssUtils';

import {
  getAllOptions,
  setOption,
  setStyle,
  getStylesForPage,
  enableStyle,
  setDarkMode,
  setReadability,
} from '../utils/chrome';

import {
  apply as applyDarkMode,
  remove as removeDarkMode,
} from '../../dark-mode/index';

import {
  apply as applyReadability,
  remove as removeReadability,
} from '../../readability/index';

import {
  EffectName,
  getCssAfterApplyingFilterEffectToPage,
} from '../../css/Filters';

import { State } from './';
import { StylebotEditingMode } from '../../types';

export default {
  async initialize({ commit }: { commit: Commit }): Promise<void> {
    const options = await getAllOptions();
    const { defaultStyle } = await getStylesForPage(false);

    if (defaultStyle) {
      const { url, enabled, css, readability, darkMode } = defaultStyle;

      commit('setUrl', url);
      commit('setCss', css);
      commit('setEnabled', enabled);
      commit('setReadability', readability);
      commit('setDarkMode', darkMode);

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
      CssUtils.injectRootIntoDocument(root, state.url);

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

    const css = CssUtils.addDeclaration(
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
      css = await CssUtils.addGoogleWebFont(value, css);
    }

    if (css !== state.css) {
      dispatch('applyCss', { css });
    }

    dispatch('applyDeclaration', { property: 'font-family', value });

    css = CssUtils.cleanGoogleWebFonts(state.css);
    if (css !== state.css) {
      dispatch('applyCss', { css });
    }
  },

  applyDarkMode(
    { state, commit }: { state: State; commit: Commit },
    value: boolean
  ): void {
    if (value) {
      applyDarkMode();
    } else {
      removeDarkMode();
    }

    commit('setDarkMode', value);
    setDarkMode(state.url, value);
  },

  applyReadability(
    { state, commit }: { state: State; commit: Commit },
    value: boolean
  ): void {
    if (value) {
      applyReadability();
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
      effectName: EffectName;
      percent: number;
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
