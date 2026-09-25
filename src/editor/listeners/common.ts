import type { Store, Dispatch, Commit } from 'vuex';
import type { State } from 'editor/store';
import { injectCSSIntoDocument } from '@stylebot/css';
import type { Style } from '@stylebot/types';

import {
  enableStyle as sendEnableStyleMessage,
  disableStyle as sendDisableStyleMessage,
  openEditorWindow,
  toggleEditorWindow,
} from '../utils/chrome';
import { initEditor } from '../utils/init-editor';

/**
 * Whether opening the editor for this page means its separate window: the
 * user chose that dock, or a window is already attached to this tab.
 */
export const usesEditorWindow = (state: State): boolean =>
  state.windowConnected || state.options.layout.dockLocation === 'window';

export const toggleStylebot = (store: Store<State>, inspect = true): void => {
  if (usesEditorWindow(store.state)) {
    toggleEditorWindow();
    return;
  }

  if (store.state.visible) {
    store.dispatch('closeStylebot');
  } else {
    initEditor(store);
    store.dispatch('openStylebot', { inspect });
  }
};

export const openStylebot = (store: Store<State>, inspect = true): void => {
  if (usesEditorWindow(store.state)) {
    openEditorWindow();
    return;
  }

  if (!store.state.visible) {
    initEditor(store);
    store.dispatch('openStylebot', { inspect });
  }
};

export const toggleReadability = ({
  state,
  dispatch,
}: {
  state: State;
  dispatch: Dispatch;
}): void => {
  if (state.readability) {
    dispatch('applyReadability', false);
  } else {
    dispatch('applyReadability', true);
  }
};

export const sendToggleStyleMessage = ({ state }: { state: State }): void => {
  if (state.enabled) {
    sendDisableStyleMessage(state.url);
  } else {
    sendEnableStyleMessage(state.url);
  }
};

export const toggleGrayscale = ({
  getters,
  dispatch,
}: {
  getters: { grayscale: number };
  dispatch: Dispatch;
}): void => {
  let percent = '0';
  if (!getters.grayscale) {
    percent = '100';
  }

  dispatch('applyFilter', {
    effectName: 'grayscale',
    percent,
  });
};

/**
 * Applies a fresh set of styles pushed by the background page. If the style
 * the editor is showing is no longer among them (removed on another device
 * and pulled by sync), its CSS is cleared from the page and the editor, or
 * the next keystroke would save the stale copy back.
 */
export const applyStyles = (
  { state, dispatch }: { state: State; dispatch: Dispatch },
  defaultStyle: Style | undefined,
  styles: Array<Style>
): void => {
  styles.forEach(style => {
    if (style.enabled) {
      injectCSSIntoDocument(style.css, style.url, {
        forceImportant: style.forceImportant !== false,
      });
    } else {
      injectCSSIntoDocument('', style.url);
    }
  });

  const currentStyleRemoved =
    state.css !== '' && !styles.some(style => style.url === state.url);

  if (currentStyleRemoved) {
    injectCSSIntoDocument('', state.url);
  }

  if (defaultStyle) {
    if (defaultStyle.readability) {
      dispatch('applyReadability', true);
    } else {
      dispatch('applyReadability', false);
    }

    dispatch('initializeDefaultStyle', defaultStyle);
  } else if (currentStyleRemoved) {
    if (state.readability) {
      dispatch('applyReadability', false);
    }

    dispatch('initializeDefaultStyle', {
      url: state.url,
      css: '',
      enabled: true,
      readability: false,
      modifiedTime: '',
    });
  }
};

export const updateSelectorWithContextMenuSelector = ({
  state,
  commit,
}: {
  state: State;
  commit: Commit;
}): void => {
  commit('setActiveSelector', state.contextMenuSelector);
};
