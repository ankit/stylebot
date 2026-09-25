import Vue from 'vue';
import type { Store } from 'vuex';
import Vuex from 'vuex';

import type {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StylebotEditorCommands,
} from '@stylebot/types';

import {
  defaultOptions,
  defaultEditorCommands,
  defaultReadabilitySettings,
} from '@stylebot/settings';

import type { PageSnapshot } from '@stylebot/page-bridge';
import { emptyPageSnapshot } from '@stylebot/page-bridge';

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

Vue.use(Vuex);

/**
 * Where the editor UI lives: injected into the styled page itself, or in a
 * separate extension window driving that page over a tab port.
 */
export type EditorHost = 'page' | 'window';

/**
 * What the browser knows about the styled tab, for the window host to show
 * which tab it belongs to.
 */
export type EditorTab = {
  title: string;
  favIconUrl: string;
  // Whether it is the selected tab of its window right now.
  active: boolean;
};

export type CssSelectorMetadata = {
  id: number;
  value: string;
  styleCount: number;
};

export type State = {
  host: EditorHost;
  page: PageSnapshot;
  // Whether the page can be reached: always in the page host; in the window
  // host, whether the port to the tab is up.
  pageConnected: boolean;
  // Whether a separate editor window is attached to this page; page host only.
  windowConnected: boolean;
  // Window host: the tab this window edits.
  tabId: number | null;
  tab: EditorTab | null;

  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  forceImportant: boolean;

  activeSelector: string;
  // Computed values on the active selector's first match, for placeholders.
  computedStyles: Record<string, string>;
  contextMenuSelector: string;
  selectors: Array<CssSelectorMetadata>;

  help: boolean;
  visible: boolean;
  inspecting: boolean;
  resizing: boolean;
  colorPickerVisible: boolean;

  options: StylebotOptions;
  commands: StylebotCommands | null;
  editorCommands: StylebotEditorCommands;
  readabilitySettings: ReadabilitySettings;
};

export const createStore = (host: EditorHost): Store<State> =>
  new Vuex.Store<State>({
    state: {
      host,
      page: emptyPageSnapshot(),
      pageConnected: host === 'page',
      windowConnected: false,
      tabId: null,
      tab: null,

      css: '',
      enabled: true,
      readability: false,
      forceImportant: true,
      url: '',

      selectors: [],
      activeSelector: '',
      computedStyles: {},
      contextMenuSelector: '',

      help: false,
      visible: false,
      inspecting: false,
      resizing: false,
      colorPickerVisible: false,

      commands: null,
      options: defaultOptions,
      editorCommands: defaultEditorCommands,
      readabilitySettings: defaultReadabilitySettings,
    },

    getters,
    actions,
    mutations,
  });
