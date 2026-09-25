import type * as postcss from 'postcss';

import type {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
} from '@stylebot/types';

import { walkUnnestedRules } from '@stylebot/css';
import type { State, CssSelectorMetadata, EditorTab } from './';
import type { PageSnapshot } from '@stylebot/page-bridge';

export default {
  setVisible(state: State, visible: boolean): void {
    state.visible = visible;
  },

  setPage(state: State, page: PageSnapshot): void {
    state.page = page;
  },

  setPageConnected(state: State, value: boolean): void {
    state.pageConnected = value;
  },

  setWindowConnected(state: State, value: boolean): void {
    state.windowConnected = value;
  },

  setTabId(state: State, tabId: number | null): void {
    state.tabId = tabId;
  },

  setTab(state: State, tab: EditorTab | null): void {
    state.tab = tab;
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

  setComputedStyles(state: State, styles: Record<string, string>): void {
    state.computedStyles = styles;
  },

  setInspecting(state: State, inspecting: boolean): void {
    state.inspecting = inspecting;
  },

  setResizing(state: State, resizing: boolean): void {
    state.resizing = resizing;
  },

  setColorPickerVisible(state: State, colorPickerVisible: boolean): void {
    state.colorPickerVisible = colorPickerVisible;
  },

  setSelectors(state: State, root: postcss.Root): void {
    const selectors: Array<CssSelectorMetadata> = [];
    let index = 1;

    walkUnnestedRules(root, rule => {
      try {
        let styleCount = 0;
        rule.walkDecls(() => {
          styleCount++;
        });

        selectors.push({
          id: index++,
          value: rule.selector,
          styleCount,
        });
      } catch {
        // querySelectorAll throws on selectors it can't parse; skip those rules.
      }
    });

    // sort in descending order of number of declared styles
    selectors.sort((a, b) => {
      if (b.styleCount !== a.styleCount) {
        return b.styleCount - a.styleCount;
      } else if (b.value > a.value) {
        return -1;
      }
      return 1;
    });

    state.selectors = selectors;
  },

  setHelp(state: State, value: boolean): void {
    state.help = value;
  },

  setReadability(state: State, value: boolean): void {
    state.readability = value;
  },

  setForceImportant(state: State, value: boolean): void {
    state.forceImportant = value;
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
