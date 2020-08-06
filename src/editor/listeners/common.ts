import { Store, Dispatch, Commit, GetterTree } from 'vuex';
import { State } from 'editor/store';
import { injectCSSIntoDocument } from '@stylebot/css';

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

export const enableStyle = (
  { state, commit }: { state: State; commit: Commit },
  css: string,
  url: string
): void => {
  injectCSSIntoDocument(css, url);

  if (url === state.url) {
    commit('setEnabled', true);
  }
};

export const disableStyle = (
  { state, commit }: { state: State; commit: Commit },
  url: string
): void => {
  injectCSSIntoDocument('', url);

  if (url === state.url) {
    commit('setEnabled', false);
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
