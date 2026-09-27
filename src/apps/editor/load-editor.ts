import type { StylebotCommandName, TabMessage } from '@stylebot/types';

/**
 * What the editor bundle hands the page's listener script once its store is
 * ready: a handler for each event the listener script receives.
 */
export type EditorApp = {
  handleMessage: (
    message: TabMessage,
    sendResponse: (response: boolean) => void
  ) => boolean;
  handleCommand: (name: StylebotCommandName) => void;
  handleContextMenu: (target: EventTarget | null) => void;
  handleEditorWindowPort: (port: chrome.runtime.Port) => void;
};

// The editor bundle sets stylebotEditorApp once it has run.
export type EditorAppWindow = Window & {
  stylebotEditorApp?: Promise<EditorApp>;
};

let loading: Promise<EditorApp> | null = null;

/**
 * Whether the editor has been asked for yet, so later events go to it too.
 */
export const isEditorLoading = (): boolean => loading !== null;

/**
 * Loads the editor bundle, resolving once its store is ready. A failed load
 * is forgotten, so the next event tries again.
 */
export const loadEditor = (): Promise<EditorApp> => {
  if (!loading) {
    const url = chrome.runtime.getURL('editor/app.js');

    loading = import(/* webpackIgnore: true */ url).then(
      () => {
        const app = (window as EditorAppWindow).stylebotEditorApp;

        if (!app) {
          throw new Error('editor/app.js did not register the editor');
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
