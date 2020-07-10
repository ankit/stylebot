import * as postcss from 'postcss';

import { State, CssSelectorMetadata } from './';

import {
  StylebotPlacement,
  StylebotOptions,
  StylebotEditingMode,
} from '../../types';

export default {
  showStylebot(state: State) {
    state.visible = true;
  },

  hideStylebot(state: State) {
    state.visible = false;
  },

  setPosition(state: State, position: StylebotPlacement) {
    state.position = position;
  },

  setOptions(state: State, options: StylebotOptions) {
    state.options = options;
  },

  setUrl(state: State, url: string) {
    state.url = url;
  },

  setCss(state: State, css: string) {
    state.css = css;
  },

  setActiveSelector(state: State, selector: string) {
    state.activeSelector = selector;
  },

  setInspecting(state: State, inspecting: boolean) {
    state.inspecting = inspecting;
  },

  setSelectors(state: State, root: postcss.Root) {
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

    state.selectors = selectors;
  },
};
