import type { InspectorWindow, PageInspector } from '@stylebot/types';

let loading: Promise<PageInspector> | null = null;

/**
 * Loads the CLI's page inspector bundle on its first request. A failed load
 * is forgotten, so the next request tries again.
 */
export const loadInspector = (): Promise<PageInspector> => {
  if (!loading) {
    const url = chrome.runtime.getURL('cli-inspector/index.js');

    loading = import(/* webpackIgnore: true */ url).then(
      () => {
        const inspect = (window as InspectorWindow).stylebotInspectPage;

        if (!inspect) {
          throw new Error(
            'cli-inspector/index.js did not register the inspector'
          );
        }

        return inspect;
      },
      (e: unknown) => {
        loading = null;
        throw e;
      }
    );
  }

  return loading;
};
