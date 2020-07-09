import Vue from 'vue';
import Vuex from 'vuex';
import * as postcss from 'postcss';

import CssUtils from '../../css/CssUtils';
import { getCss as getDarkModeCss } from '../../css/DarkMode';

import { setStyle, setOption } from '../utils/chrome';

import {
  StylebotOptions,
  StylebotPlacement,
  StylebotEditingMode,
} from '../../types';

Vue.use(Vuex);

type CssSelectorMetadata = {
  value: string;
  count: number;
};

type State = {
  url: string;
  css: string;

  activeRule: postcss.Rule | null;
  activeSelector: string;
  selectors: Array<CssSelectorMetadata>;

  visible: boolean;
  options: StylebotOptions;
  position: StylebotPlacement;
  inspecting: boolean;
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
    inspecting: false,
  },

  mutations: {
    setVisible(state, visible) {
      state.visible = visible;
    },

    setPosition(state, position) {
      state.position = position;
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

    setInspecting(state, inspecting) {
      state.inspecting = inspecting;
    },
  },

  actions: {
    showStylebot({ commit }) {
      commit('setVisible', true);
    },

    hideStylebot({ commit }) {
      commit('setVisible', false);
    },

    setMode({ commit }, mode: StylebotEditingMode) {
      commit('setMode', mode);
      setOption('mode', mode);
    },

    setSelectors({ commit }, root: postcss.Root) {
      const selectors: Array<CssSelectorMetadata> = [];

      root.walkRules(rule => {
        try {
          selectors.push({
            value: rule.selector,
            count: document.querySelectorAll(rule.selector).length,
          });
        } catch (e) {}
      });

      // sort in descending order of number of affected elements
      selectors.sort((a, b) => b.count - a.count);

      commit('setSelectors', selectors);
    },

    setActiveSelector({ commit, state }, selector: string) {
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

    applyCss(
      { commit, state },
      { css, shouldSave = true }: { css: string; shouldSave: boolean }
    ) {
      try {
        const root = postcss.parse(css);

        this.dispatch('setSelectors', root);
        CssUtils.injectRootIntoDocument(root);

        commit('setCss', css);

        if (shouldSave) {
          setStyle(state.url, css);
        }
      } catch (e) {
        //
      }
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

      this.dispatch('applyCss', { css: root.toString() });
    },

    applyDarkMode() {
      CssUtils.removeCSSFromDocument();
      this.dispatch('applyCss', { css: getDarkModeCss() });
    },
  },
});
