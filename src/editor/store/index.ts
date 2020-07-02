import Vue from 'vue';
import Vuex from 'vuex';
import * as postcss from 'postcss';

import CssUtils from '../../css/CssUtils';
import { saveCss } from '../utils/chrome';

import { StylebotOptions, StylebotPlacement } from '../../types';

Vue.use(Vuex);

type State = {
  url: string;
  css: string;
  activeRule: postcss.Rule | null;
  activeSelector: string;
  selectors: Array<string>;

  visible: boolean;
  options?: StylebotOptions;
  position: StylebotPlacement;
};

export default new Vuex.Store<State>({
  state: {
    url: document.domain,
    css: '',
    activeRule: null,
    activeSelector: '',
    selectors: [],

    options: {
      useShortcutKey: true,
      shortcutKey: 77,
      shortcutMetaKey: 'alt',
      mode: 'Basic',
      contextMenu: true,
    },

    visible: false,
    position: 'right',
  },

  mutations: {
    toggleStylebot(state) {
      state.visible = !state.visible;
    },

    togglePlacement(state) {
      if (state.position === 'left') {
        state.position = 'right';
      } else {
        state.position = 'left';
      }
    },

    hideStylebot(state) {
      state.visible = false;
    },

    setOptions(state, options) {
      state.options = options;
    },

    setUrl(state, url) {
      state.url = url;
    },

    setCss(state, css) {
      state.css = css;
    },

    setSelectors(state, selectors) {
      state.selectors = selectors;
    },

    setActiveSelector(state, selector) {
      state.activeSelector = selector;
    },

    setActiveRule(state, rule) {
      state.activeRule = rule;
    },
  },

  actions: {
    setComputedCss({ commit }, computedCss) {
      const root = postcss.parse(computedCss);
      const selectors: Array<string> = [];

      root.walkDecls(decl => {
        decl.important = false;
      });

      root.walkRules(rule => {
        selectors.push(rule.selector);
      });

      commit('setCss', root.toString());
      commit('setSelectors', selectors);
    },

    setActiveSelector({ commit, state }, selector) {
      const root = postcss.parse(state.css);
      const matchingRules: Array<postcss.Rule> = [];

      root.walkRules(selector, rule => {
        matchingRules.push(rule);
      });

      commit(
        'setActiveRule',
        matchingRules.length > 0 ? matchingRules[0] : null
      );

      commit('setActiveSelector', selector);
    },

    applyDeclaration({ commit, state }, { property, value }) {
      const { activeRule } = state;
      if (!activeRule) {
        return;
      }

      if (
        activeRule.some(decl => decl.type === 'decl' && decl.prop === property)
      ) {
        activeRule.walkDecls(property, decl => {
          if (value) {
            decl.value = value;
          } else {
            decl.remove();
          }
        });
      } else if (value) {
        const decl = postcss.decl({ prop: property, value });
        activeRule.append(decl);
      }

      const root = postcss.parse(state.css);
      root.walkRules(activeRule.selector, rule => {
        rule.replaceWith(activeRule);
      });

      const css = root.toString();
      commit('setActiveRule', activeRule);
      commit('setCss', css);

      saveCss(state.url, css);

      const rootWithImportant = root.clone();
      rootWithImportant.walkDecls(decl => (decl.important = true));
      const cssWithImportant = rootWithImportant.toString();

      CssUtils.injectCSSIntoDocument(cssWithImportant);
    },
  },
});
