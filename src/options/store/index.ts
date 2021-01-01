import Vue from 'vue';
import Vuex from 'vuex';

import * as postcss from 'postcss';

import { defaultCommands } from '@stylebot/settings';
import {
  StylebotOptions,
  StylebotCommands,
  GoogleDriveSyncMetadata,
} from '@stylebot/types';

import {
  getAllStyles,
  setAllStyles,
  setOption,
  getAllOptions,
  getCommands,
  setCommands,
} from '../utils';

Vue.use(Vuex);

type State = {
  styles: {
    [url: string]: {
      css: string;
      enabled: boolean;
      readability: boolean;
    };
  };

  options: StylebotOptions | null;
  commands: StylebotCommands;

  googleDriveSyncEnabled: boolean;
  googleDriveSyncMetadata: GoogleDriveSyncMetadata | null;
};

export default new Vuex.Store<State>({
  state: {
    styles: {},
    options: null,
    commands: defaultCommands,
    googleDriveSyncEnabled: false,
    googleDriveSyncMetadata: null,
  },

  actions: {
    async getAllStyles({ state }) {
      const styles = await getAllStyles();
      state.styles = styles;
    },

    async getAllOptions({ state }) {
      const options = await getAllOptions();
      state.options = options;
    },

    async getCommands({ state }) {
      const commands = await getCommands();
      state.commands = commands;
    },

    setAllStyles(
      { state },
      styles: {
        [url: string]: {
          css: string;
          enabled: boolean;
          readability: boolean;
        };
      }
    ) {
      state.styles = styles;
      setAllStyles(styles);
    },

    saveStyle(
      { state },
      {
        initialUrl,
        url,
        css,
      }: { initialUrl?: string; url: string; css: string }
    ) {
      try {
        // validate by parsing
        postcss.parse(css);
        const styles = { ...state.styles };

        styles[url] = {
          css,
          readability: styles[url] ? styles[url].readability : false,
          enabled: styles[url] ? styles[url].enabled : true,
        };

        if (initialUrl && initialUrl !== url) {
          delete styles[initialUrl];
        }

        setAllStyles(styles);
        state.styles = styles;
      } catch (e) {
        // todo
      }
    },

    deleteStyle({ state }, url: string) {
      const styles = { ...state.styles };

      delete styles[url];
      setAllStyles(styles);

      state.styles = styles;
    },

    deleteAllStyles({ state }) {
      state.styles = {};
      setAllStyles(state.styles);
    },

    enableStyle({ state }, url: string) {
      if (state.styles[url]) {
        state.styles[url].enabled = true;
      }

      setAllStyles(state.styles);
    },

    disableStyle({ state }, url: string) {
      if (state.styles[url]) {
        state.styles[url].enabled = false;
      }

      setAllStyles(state.styles);
    },

    enableAllStyles({ state }) {
      for (const url in state.styles) {
        state.styles[url].enabled = true;
      }

      setAllStyles(state.styles);
    },

    disableAllStyles({ state }) {
      for (const url in state.styles) {
        state.styles[url].enabled = false;
      }
      setAllStyles(state.styles);
    },

    setOption(
      { state },
      {
        name,
        value,
      }: {
        name: keyof StylebotOptions;
        value: StylebotOptions[keyof StylebotOptions];
      }
    ) {
      /* @ts-ignore */
      state.options[name] = value;
      setOption(name, value);
    },

    setCommands({ state }, commands: StylebotCommands) {
      state.commands = commands;
      setCommands(commands);
    },

    setGoogleDriveSyncEnabled({ state }, enabled: boolean) {
      state.googleDriveSyncEnabled = enabled;
    },
  },
});
