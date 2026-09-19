import Vuex, { Store } from 'vuex';

import { defaultOptions, defaultCommands } from '@stylebot/settings';
import type {
  StyleMap,
  StylebotOptions,
  StylebotCommands,
  GoogleDriveSyncMetadata,
} from '@stylebot/types';

export type OptionsState = {
  styles: StyleMap;
  options: StylebotOptions | null;
  commands: StylebotCommands;
  googleDriveSyncEnabled: boolean;
  googleDriveSyncMetadata: GoogleDriveSyncMetadata | undefined;
};

export type OptionsStateOverrides = Partial<Omit<OptionsState, 'options'>> & {
  options?: Partial<StylebotOptions>;
};

const ACTIONS = [
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
  'setGoogleDriveSyncEnabled',
  'syncWithGoogleDrive',
];

/**
 * Options-page store seeded up front; every action is a no-op so App.vue's
 * created() fetches leave the seeded state untouched.
 */
export const createOptionsStore = (
  overrides: OptionsStateOverrides = {}
): Store<OptionsState> => {
  const actions: Record<string, () => void> = {};

  ACTIONS.forEach(name => {
    actions[name] = () => undefined;
  });

  return new Vuex.Store<OptionsState>({
    state: {
      styles: {},
      commands: defaultCommands,
      googleDriveSyncEnabled: false,
      googleDriveSyncMetadata: undefined,
      ...overrides,
      options: { ...defaultOptions, ...overrides.options },
    },
    actions,
  });
};
