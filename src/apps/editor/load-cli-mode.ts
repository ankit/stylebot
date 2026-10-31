import type { CliModeApp, CliModeAppWindow } from '@stylebot/types';

let loading: Promise<CliModeApp> | null = null;

/**
 * Whether the CLI mode terminal has been asked for yet.
 */
export const isCliModeLoading = (): boolean => loading !== null;

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
