import Vue from 'vue';
import Vuex from 'vuex';

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

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

Vue.use(Vuex);

export type CssSelectorMetadata = {
  id: number;
  value: string;
  count: number;
};

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
  resize: boolean;
  colorPickerVisible: boolean;

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
    resize: false,
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
