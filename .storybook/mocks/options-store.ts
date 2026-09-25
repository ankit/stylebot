import type { ActionTree, Store } from 'vuex';
import Vuex from 'vuex';

import { defaultOptions, defaultCommands } from '@stylebot/settings';
import type {
  StyleMap,
  StylebotOptions,
  StylebotCommands,
  SyncState,
} from '@stylebot/types';
import type { SyncStatus } from '@/options/store';
import {
  runGoogleDriveSync,
  scanVersionHistory,
  restoreVersion,
} from '@/options/utils';

export type OptionsState = {
  styles: StyleMap;
  options: StylebotOptions | null;
  commands: StylebotCommands;
  googleDriveSyncEnabled: boolean;
  googleDriveSyncState: SyncState | undefined;
  googleDriveSyncNeedsAuth: boolean;
  syncInProgress: boolean;
  syncStatus: SyncStatus;
};

export type OptionsStateOverrides = Partial<Omit<OptionsState, 'options'>> & {
  options?: Partial<StylebotOptions>;
};

const NOOP_ACTIONS = [
  'getAllStyles',
  'getAllOptions',
  'getCommands',
  'getGoogleDriveSyncMetadata',
  'setAllStyles',
  'saveStyle',
  'deleteStyle',
  'deleteAllStyles',
  'enableStyle',
  'disableStyle',
  'enableAllStyles',
  'disableAllStyles',
  'setOption',
  'setCommands',
];

const noop = () => undefined;

const actions: ActionTree<OptionsState, OptionsState> = {
  ...Object.fromEntries(NOOP_ACTIONS.map(name => [name, noop])),

  setGoogleDriveSyncEnabled({ state, dispatch }, enabled: boolean) {
    state.googleDriveSyncEnabled = enabled;

    if (enabled) {
      return dispatch('syncWithGoogleDrive');
    }

    state.googleDriveSyncState = undefined;
    state.googleDriveSyncNeedsAuth = false;
    state.syncStatus = null;
  },

  dismissSyncConflict({ state }, url: string) {
    if (!state.googleDriveSyncState?.conflicts) {
      return;
    }

    state.googleDriveSyncState = {
      ...state.googleDriveSyncState,
      conflicts: state.googleDriveSyncState.conflicts.filter(
        conflict => conflict.url !== url
      ),
    };
  },

  scanVersionHistory(_context, limit?: number) {
    return scanVersionHistory(limit);
  },

  restoreVersion(
    _context,
    { versionId, urls }: { versionId: string; urls?: Array<string> }
  ) {
    return restoreVersion(versionId, urls);
  },

  async syncWithGoogleDrive({ state }) {
    if (state.syncInProgress) {
      return;
    }

    state.syncInProgress = true;
    state.syncStatus = null;

    try {
      const response = await runGoogleDriveSync();

      if (response.ok) {
        state.googleDriveSyncState = {
          remoteRevision: response.metadata.modifiedTime,
          localRevision: response.metadata.modifiedTime,
          lastSyncedAt: new Date().toISOString(),
          metadata: response.metadata,
          conflicts: state.googleDriveSyncState?.conflicts,
          account: state.googleDriveSyncState?.account,
        };
        state.googleDriveSyncNeedsAuth = false;
      } else {
        state.syncStatus = {
          type: 'error',
          messageKey: response.errorKey,
          detail: response.errorDetail,
        };
      }
    } finally {
      state.syncInProgress = false;
    }
  },
};

/**
 * Options-page store seeded up front; the fetch actions App.vue's created()
 * calls are no-ops so the seeded state survives mount, but the sync actions
 * a story clicks through run for real against the chrome shim, so a sync
 * driven from a story behaves like it does in production.
 */
export const createOptionsStore = (
  overrides: OptionsStateOverrides = {}
): Store<OptionsState> =>
  new Vuex.Store<OptionsState>({
    state: {
      styles: {},
      commands: defaultCommands,
      googleDriveSyncEnabled: false,
      googleDriveSyncState: undefined,
      googleDriveSyncNeedsAuth: false,
      syncInProgress: false,
      syncStatus: null,
      ...overrides,
      options: { ...defaultOptions, ...overrides.options },
    },
    actions,
  });
