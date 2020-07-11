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

    const root = postcss.parse(state.css);
    const matchingRules: Array<postcss.Rule> = [];

    root.walkRules(state.activeSelector, rule => matchingRules.push(rule));
    const activeRule = matchingRules.length > 0 ? matchingRules[0] : null;

    if (!activeRule) {
      if (value) {
        const ruleCss = `${state.activeSelector} {\n  ${property}: ${value};\n}`;

        if (root.some(rule => !!rule)) {
          root.append(`\n\n${ruleCss}`);
        } else {
          root.append(ruleCss);
        }

        dispatch('applyCss', { css: root.toString() });
      }

      return;
    }

    const declarationExists = activeRule.some(
      decl => decl.type === 'decl' && decl.prop === property
    );

    if (declarationExists) {
      activeRule.walkDecls(property, (decl: postcss.Declaration) => {
        if (value) {
          decl.value = value;
        } else {
          decl.remove();
        }
      });

      if (!activeRule.some(decl => !!decl)) {
        activeRule.remove();
      }

      dispatch('applyCss', { css: root.toString() });
      return;
    }

    if (value) {
      activeRule.append(`\n  ${property}: ${value};`);
      dispatch('applyCss', { css: root.toString() });
    }
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
