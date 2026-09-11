import Vue from 'vue';
import Vuex from 'vuex';

import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StylebotEditorCommands,
  ClaudeConversationTurn,
} from '@stylebot/types';

import {
  defaultOptions,
  defaultEditorCommands,
  defaultReadabilitySettings,
} from '@stylebot/settings';

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

Vue.use(Vuex);

export type CssSelectorMetadata = {
  id: number;
  value: string;
  count: number;
};

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; status: 'success'; message: string; css: string }
  | { role: 'assistant'; status: 'error'; error: string };

export type State = {
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

  aiGenerating: boolean;
  chatMessages: Array<ChatMessage>;
  apiHistory: Array<ClaudeConversationTurn>;
  lastSentDom: string | null;
  chatSelectedElement: string | null;
  sessionCost: number;

  options: StylebotOptions;
  commands: StylebotCommands | null;
  editorCommands: StylebotEditorCommands;
  readabilitySettings: ReadabilitySettings;
};

export default new Vuex.Store<State>({
  state: {
    css: '',
    enabled: true,
    readability: false,
    url: document.domain,

    selectors: [],
    activeSelector: '',
    contextMenuSelector: '',

    help: false,
    visible: false,
    inspecting: false,
    resizing: false,
    colorPickerVisible: false,

    aiGenerating: false,
    chatMessages: [],
    apiHistory: [],
    lastSentDom: null,
    chatSelectedElement: null,
    sessionCost: 0,

    commands: null,
    options: defaultOptions,
    editorCommands: defaultEditorCommands,
    readabilitySettings: defaultReadabilitySettings,
  },

  getters,
  actions,
  mutations,
});
