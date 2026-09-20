import Vuex, { Dispatch, Store } from 'vuex';
import * as postcss from 'postcss';

import { getPrimaryFontFamily, injectRootIntoDocument } from '@stylebot/css';
import type { StylebotOptions } from '@stylebot/types';

import mockState from '../../src/editor/store/__mocks__/state';
import actions from '../../src/editor/store/actions';
import getters from '../../src/editor/store/getters';
import mutations from '../../src/editor/store/mutations';
import type { State } from '../../src/editor/store';

export type EditorStateOverrides = Partial<Omit<State, 'options'>> & {
  options?: Partial<StylebotOptions>;
};

const noop = () => undefined;

/**
 * A real Vuex store with the editor's own getters, mutations and actions,
 * so composites render from seeded CSS and stay interactive in the
 * Storybook canvas. The background calls the actions make land in the
 * chrome shim; only the actions that mount the editor or fetch from
 * Google Fonts are replaced.
 */
export const createEditorStore = (
  overrides: EditorStateOverrides = {}
): Store<State> => {
  const state: State = {
    ...mockState,
    url: 'example.com',
    visible: true,
    ...overrides,
    options: { ...mockState.options, ...overrides.options },
  };

  const store = new Vuex.Store<State>({
    state,
    getters,
    mutations,
    actions: {
      ...actions,
      initialize: noop,
      initializeDefaultStyle: noop,
      openStylebot: noop,
      previewFontFamily: noop,

      // The real one checks unknown families against fonts.googleapis.com;
      // stories stay offline and just apply what was picked.
      applyFontFamily(
        { dispatch }: { dispatch: Dispatch },
        { value, remember = false }: { value: string; remember?: boolean }
      ) {
        dispatch('applyDeclaration', { property: 'font-family', value });

        const family = getPrimaryFontFamily(value);
        if (family && remember) {
          dispatch('rememberFont', family);
        }
      },
    },
  });

  if (state.css) {
    const root = postcss.parse(state.css);
    store.commit('setSelectors', root);
    injectRootIntoDocument(root, state.url);
  }

  return store;
};
