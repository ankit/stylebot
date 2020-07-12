import * as postcss from 'postcss';
import { Commit, Dispatch } from 'vuex';

import CssUtils from '../../css/CssUtils';

import {
  getAllOptions,
  getMergedCssAndUrlForPage,
  setOption,
  setStyle,
} from '../utils/chrome';

import { getCss as getDarkModeCss } from '../../css/DarkMode';

import { State } from './';
import { StylebotEditingMode } from '../../types';

export default {
  async initialize({
    commit,
    dispatch,
  }: {
    commit: Commit;
    dispatch: Dispatch;
  }): Promise<void> {
    const options = await getAllOptions();
    const { url, css } = await getMergedCssAndUrlForPage(false);

    if (url) {
      commit('setUrl', url);
    }

    if (css) {
      dispatch('applyCss', { css, shouldSave: false });
    }

    commit('setOptions', options);
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
    { css, shouldSave = true }: { css: string; shouldSave: boolean }
  ): void {
    try {
      const root = postcss.parse(css);
      CssUtils.injectRootIntoDocument(root);

      commit('setCss', css);
      commit('setSelectors', root);

      if (shouldSave) {
        setStyle(state.url, css);
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

  applyDarkMode({ dispatch }: { dispatch: Dispatch }): void {
    CssUtils.removeCSSFromDocument();
    dispatch('applyCss', { css: getDarkModeCss() });
  },
};
