import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import {
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

import { PageSnapshot, emptyPageSnapshot } from '@stylebot/page-bridge';

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

Vue.use(Vuex);

/**
 * Where the editor UI lives: injected into the styled page itself, or in a
 * separate extension window driving that page over a tab port.
 */
export type EditorHost = 'page' | 'window';

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

  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;

  activeSelector: string;
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

      css: '',
      enabled: true,
      readability: false,
      url: '',

      selectors: [],
      activeSelector: '',
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
