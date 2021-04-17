import * as postcss from 'postcss';

import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
} from '@stylebot/types';

import { State, CssSelectorMetadata } from './';

export default {
  setVisible(state: State, visible: boolean): void {
    state.visible = visible;
  },

  setOptions(state: State, options: StylebotOptions): void {
    state.options = options;
  },

  setUrl(state: State, url: string): void {
    state.url = url;
  },

  setEnabled(state: State, enabled: boolean): void {
    state.enabled = enabled;
  },

  setCss(state: State, css: string): void {
    state.css = css;
  },

  setActiveSelector(state: State, selector: string): void {
    state.activeSelector = selector;
  },

  setInspecting(state: State, inspecting: boolean): void {
    state.inspecting = inspecting;
  },

  setResize(state: State, resize: boolean): void {
    state.resize = resize;
  },

  setSelectors(state: State, root: postcss.Root): void {
    const selectors: Array<CssSelectorMetadata> = [];
    let index = 1;

    root.walkRules(rule => {
      try {
        selectors.push({
          id: index++,
          value: rule.selector,
          count: document.querySelectorAll(rule.selector).length,
        });
      } catch (e) {}
    });

    // sort in descending order of number of affected elements
    selectors.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      } else if (b.value > a.value) {
        return -1;
      } else {
        return 1;
      }
    });

    state.selectors = selectors;
  },

  setHelp(state: State, value: boolean): void {
    state.help = value;
  },

  setReadability(state: State, value: boolean): void {
    state.readability = value;
  },

  setReadabilitySettings(state: State, value: ReadabilitySettings): void {
    state.readabilitySettings = value;
  },

  setCommands(state: State, value: StylebotCommands): void {
    state.commands = value;
  },

  setContextMenuSelector(state: State, value: string): void {
    state.contextMenuSelector = value;
  },
};
