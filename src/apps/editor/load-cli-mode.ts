import type {
  CliModeAction,
  CliModeApp,
  CliModeAppWindow,
} from '@stylebot/types';

let loading: Promise<CliModeApp> | null = null;

/**
 * Whether an action needs the CLI mode terminal: one that shows it, or any
 * once it's loaded. Screenshots ask every page where the terminal is, and
 * most never loaded it.
 */
export const needsCliMode = ({ kind }: CliModeAction): boolean =>
  kind === 'on' || kind === 'invite' || loading !== null;

/**
 * Loads the CLI mode terminal's bundle on its first request. A failed load is
 * forgotten, so the next request tries again.
 */
export const loadCliMode = (): Promise<CliModeApp> => {
  if (!loading) {
    const url = chrome.runtime.getURL('cli-mode/index.js');

    loading = import(/* webpackIgnore: true */ url).then(
      () => {
        const app = (window as CliModeAppWindow).stylebotCliMode;

        if (!app) {
          throw new Error('cli-mode/index.js did not register CLI mode');
        }

        return app;
      },
      (e: unknown) => {
        loading = null;
        throw e;
      }
    );
  }

  return loading;
};
