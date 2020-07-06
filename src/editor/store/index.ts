import Vue from 'vue';
import Vuex from 'vuex';
import * as postcss from 'postcss';

import CssUtils from '../../css/CssUtils';
import { getCss as getDarkModeCss } from '../../css/DarkMode';

import { saveCss, saveOption } from '../utils/chrome';

import { StylebotOptions, StylebotPlacement } from '../../types';

Vue.use(Vuex);

type State = {
  url: string;
  css: string;

  activeRule: postcss.Rule | null;
  activeSelector: string;
  selectors: Array<string>;

  visible: boolean;
  options: StylebotOptions;
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
      mode: 'basic',
      useShortcutKey: true,
      shortcutKey: 77,
      shortcutMetaKey: 'alt',
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

    setMode(state, mode) {
      state.options.mode = mode;
    },
  },

  actions: {
    setCss({ commit }, css) {
      const root = postcss.parse(css);
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

    setMode({ commit }, mode) {
      commit('setMode', mode);
      saveOption('mode', mode);
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
      const root = postcss.parse(state.css);

      if (!activeRule) {
        const rule = postcss.rule({ selector: state.activeSelector });
        rule.append(postcss.decl({ prop: property, value }));
        root.append(rule);

        commit('setActiveRule', rule);
      } else if (activeRule) {
        if (
          activeRule.some(
            decl => decl.type === 'decl' && decl.prop === property
          )
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

        root.walkRules(activeRule.selector, rule => {
          rule.replaceWith(activeRule);
        });

        commit('setActiveRule', activeRule);
      }

      const css = root.toString();

      commit('setCss', css);
      saveCss(state.url, css);

      const selectors: Array<string> = [];
      root.walkRules(rule => {
        selectors.push(rule.selector);
      });
      commit('setSelectors', selectors);

      const rootWithImportant = root.clone();
      rootWithImportant.walkDecls(decl => (decl.important = true));
      const cssWithImportant = rootWithImportant.toString();

      CssUtils.injectCSSIntoDocument(cssWithImportant);
    },

    applyDarkMode({ commit, state }) {
      CssUtils.removeCSSFromDocument();
      const css = getDarkModeCss();
      const root = postcss.parse(css);

      commit('setCss', css);
      saveCss(state.url, css);

      const rootWithImportant = root.clone();
      rootWithImportant.walkDecls(decl => (decl.important = true));
      const cssWithImportant = rootWithImportant.toString();
      CssUtils.injectCSSIntoDocument(cssWithImportant);
    },
  },
});
