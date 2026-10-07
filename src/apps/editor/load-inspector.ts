import type { inspectPage } from './inspect-page';

export type InspectPage = typeof inspectPage;

// The inspector bundle sets stylebotInspectPage once it has run.
export type InspectorWindow = Window & {
  stylebotInspectPage?: InspectPage;
};

let loading: Promise<InspectPage> | null = null;

/**
 * Loads the CLI's page inspector bundle on its first request. A failed load
 * is forgotten, so the next request tries again.
 */
export const loadInspector = (): Promise<InspectPage> => {
  if (!loading) {
    const url = chrome.runtime.getURL('editor/inspector.js');

    loading = import(/* webpackIgnore: true */ url).then(
      () => {
        const inspect = (window as InspectorWindow).stylebotInspectPage;

        if (!inspect) {
          throw new Error('editor/inspector.js did not register the inspector');
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
