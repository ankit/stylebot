import Vue from 'vue';
import Vuex from 'vuex';

import * as postcss from 'postcss';

import { defaultCommands } from '@stylebot/settings';
import type {
  StyleMap,
  StylebotOptions,
  StylebotCommands,
  SyncState,
  SyncErrorKey,
} from '@stylebot/types';
import {
  getGoogleDriveSyncEnabled,
  getSyncState,
  getSyncNeedsAuth,
  setGoogleDriveSyncEnabled,
  clearSyncState,
  dismissSyncConflict,
} from '@stylebot/sync';
import { getCurrentTimestamp } from '@stylebot/utils';

import {
  getAllStyles,
  setAllStyles,
  setOption,
  getAllOptions,
  getCommands,
  setCommands,
  runGoogleDriveSync,
  scanVersionHistory,
  restoreVersion,
} from '../utils';
import { isForceImportant } from '@stylebot/styles';

Vue.use(Vuex);

// Only failures get a banner; success shows in the card's synced pill.
export type SyncStatus = {
  type: 'error';
  messageKey: SyncErrorKey;
  detail?: string;
} | null;

type State = {
  styles: StyleMap;

  options: StylebotOptions | null;
  commands: StylebotCommands;

  googleDriveSyncEnabled: boolean;
  googleDriveSyncState: SyncState | undefined;
  googleDriveSyncNeedsAuth: boolean;

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
    googleDriveSyncNeedsAuth: false,
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
        state.googleDriveSyncNeedsAuth = await getSyncNeedsAuth();
      }
    },

    scanVersionHistory(_context, limit?: number) {
      return scanVersionHistory(limit);
    },

    /**
     * The background page owns the write, so the restore rides the same chain
     * as any other edit — which is what records it in the history too, making
     * the restore itself something that can be put back.
     */
    async restoreVersion(
      { dispatch },
      { versionId, urls }: { versionId: string; urls?: Array<string> }
    ) {
      const ok = await restoreVersion(versionId, urls);
      await dispatch('getAllStyles');
      return ok;
    },

    async dismissSyncConflict({ state }, url: string) {
      await dismissSyncConflict(url);
      state.googleDriveSyncState = await getSyncState();
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
          ...(!isForceImportant(styles[url]) ? { forceImportant: false } : {}),
        };

        if (initialUrl && initialUrl !== url) {
          delete styles[initialUrl];
        }

        setAllStyles(styles);
        state.styles = styles;
      } catch {
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
      // @ts-expect-error TS cannot correlate the key/value union members of StylebotOptions.
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
      state.googleDriveSyncNeedsAuth = false;
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

        // A run that was in flight when the user disconnected reports
        // not-enabled; there is no card left to show that on.
        if (!response?.ok && state.googleDriveSyncEnabled) {
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
