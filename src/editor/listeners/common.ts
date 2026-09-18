import { Store, Dispatch, Commit, GetterTree } from 'vuex';
import { State } from 'editor/store';
import {
  injectCSSIntoDocument,
  appendImportantToDeclarations,
} from '@stylebot/css';
import { Style } from '@stylebot/types';
import { applyReadability, removeReadability } from '@stylebot/readability';

import {
  enableStyle as sendEnableStyleMessage,
  disableStyle as sendDisableStyleMessage,
} from '../utils/chrome';

export const toggleStylebot = (store: Store<State>, inspect = true): void => {
  if (store.state.visible) {
    store.dispatch('closeStylebot');
  } else {
    store.dispatch('openStylebot', { store, inspect });
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
  getters: GetterTree<State, State>;
  dispatch: Dispatch;
}): void => {
  let percent = 0;
  if (!getters.grayscale) {
    percent = 100;
  }

  dispatch('applyFilter', {
    effectName: 'grayscale',
    percent,
  });
};

// Applies a readability change that originated elsewhere (the options page,
// the reader's own dock, an SPA navigation). Unlike the applyReadability
// action it never persists: the value already came from storage, and writing
// it back would re-create an entry the user just deleted.
export const syncReadabilityState = (
  { commit }: { commit: Commit },
  value: boolean
): void => {
  commit('setReadability', value);

  if (value) {
    applyReadability();
  } else {
    removeReadability();
  }
};

export const applyStyles = (
  {
    state,
    commit,
    dispatch,
  }: { state: State; commit: Commit; dispatch: Dispatch },
  defaultStyle: Style | undefined,
  styles: Style[]
): void => {
  styles.forEach(style => {
    if (style.enabled) {
      injectCSSIntoDocument(
        appendImportantToDeclarations(style.css),
        style.url
      );
    } else {
      injectCSSIntoDocument('', style.url);
    }
  });

  // Read from defaultStyle rather than guarded by it: when the last matching
  // style is deleted it becomes undefined, and the reader still has to come
  // down. Only on an actual change — removeReadability() bumps the generation
  // counter, so running it on every broadcast would cancel a reader mount
  // racing with an unrelated style edit.
  const readability = Boolean(defaultStyle?.readability);

  if (readability !== state.readability) {
    syncReadabilityState({ commit }, readability);
  }

  if (defaultStyle) {
    dispatch('initializeDefaultStyle', defaultStyle);
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
