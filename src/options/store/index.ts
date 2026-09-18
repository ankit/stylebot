import Vue from 'vue';
import Vuex from 'vuex';

import * as postcss from 'postcss';

import { defaultCommands } from '@stylebot/settings';
import {
  StyleMap,
  StylebotOptions,
  StylebotCommands,
  SyncState,
  SyncErrorKey,
} from '@stylebot/types';
import {
  getGoogleDriveSyncEnabled,
  getSyncState,
} from '@stylebot/sync';
import { getCurrentTimestamp } from '@stylebot/utils';
import { setGoogleDriveSyncEnabled, clearSyncState } from '@stylebot/sync';

import {
  getAllStyles,
  setAllStyles,
  setOption,
  getAllOptions,
  getCommands,
  setCommands,
  runGoogleDriveSync,
} from '../utils';

Vue.use(Vuex);

export type SyncStatus =
  | { type: 'success'; messageKey: 'sync_success' }
  | { type: 'error'; messageKey: SyncErrorKey; detail?: string }
  | null;

type State = {
  styles: StyleMap;

  options: StylebotOptions | null;
  commands: StylebotCommands;

  googleDriveSyncEnabled: boolean;
  googleDriveSyncState: SyncState | undefined;

  syncInProgress: boolean;
  syncStatus: SyncStatus;
};

export default new Vuex.Store<State>({
  state: {
    styles: {},
    options: null,
    commands: defaultCommands,
    googleDriveSyncEnabled: false,
    googleDriveSyncState: undefined,
    syncInProgress: false,
    syncStatus: null,
  },

  actions: {
    async getAllStyles({ state }) {
      state.styles = await getAllStyles();
    },

    async getAllOptions({ state }) {
      state.options = await getAllOptions();
    },

    async getCommands({ state }) {
      state.commands = await getCommands();
    },

    async getGoogleDriveSyncMetadata({ state }) {
      state.googleDriveSyncEnabled = await getGoogleDriveSyncEnabled();
      if (state.googleDriveSyncEnabled) {
        state.googleDriveSyncState = await getSyncState();
      }
    },

    setAllStyles({ state }, styles: StyleMap) {
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
          modifiedTime: getCurrentTimestamp(),
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

    async setGoogleDriveSyncEnabled({ state, dispatch }, enabled: boolean) {
      state.googleDriveSyncEnabled = enabled;
      setGoogleDriveSyncEnabled(enabled);

      if (enabled) {
        return dispatch('syncWithGoogleDrive');
      }

      state.googleDriveSyncState = undefined;
      state.syncStatus = null;

      // Leaving the stored state behind meant re-enabling picked up a stale
      // record of a sync that may no longer reflect either side. The Drive file
      // itself is the user's backup and is left alone.
      await clearSyncState();
    },

    async syncWithGoogleDrive({ state, dispatch }) {
      if (state.syncInProgress) {
        return;
      }

      state.syncInProgress = true;
      state.syncStatus = null;

      try {
        const response = await runGoogleDriveSync();

        if (response?.ok) {
          state.syncStatus = { type: 'success', messageKey: 'sync_success' };
        } else {
          state.syncStatus = {
            type: 'error',
            messageKey: response?.errorKey ?? 'sync_error_unknown',
            detail: response?.errorDetail,
          };
        }

        await dispatch('getGoogleDriveSyncMetadata');
        await dispatch('getAllStyles');
      } finally {
        state.syncInProgress = false;
      }
    },
  },
});
