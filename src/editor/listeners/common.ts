import { Store, Dispatch, Commit, GetterTree } from 'vuex';
import { State } from 'editor/store';
import {
  injectCSSIntoDocument,
  appendImportantToDeclarations,
} from '@stylebot/css';
import { Style } from '@stylebot/types';

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

export const applyStyles = (
  { dispatch }: { dispatch: Dispatch },
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

  if (defaultStyle) {
    if (defaultStyle.readability) {
      dispatch('applyReadability', true);
    } else {
      dispatch('applyReadability', false);
    }

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
