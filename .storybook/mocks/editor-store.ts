import Vuex, { ActionTree, Commit, Store } from 'vuex';
import * as postcss from 'postcss';

import { addDeclaration } from '@stylebot/css';
import type { StylebotOptions } from '@stylebot/types';

import mockState from '../../src/editor/store/__mocks__/state';
import getters from '../../src/editor/store/getters';
import mutations from '../../src/editor/store/mutations';
import type { State } from '../../src/editor/store';

export type EditorStateOverrides = Partial<Omit<State, 'options'>> & {
  options?: Partial<StylebotOptions>;
};

const noop = () => undefined;

const NOOP_ACTIONS = [
  'initialize',
  'initializeDefaultStyle',
  'openStylebot',
  'closeStylebot',
  'escape',
  'resetActiveRule',
  'applyFontFamily',
  'previewFontFamily',
  'applyReadability',
  'setReadabilitySettings',
  'applyFilter',
];

const setOptionAction =
  (key: keyof StylebotOptions) =>
  ({ state, commit }: { state: State; commit: Commit }, value: unknown) => {
    commit('setOptions', { ...state.options, [key]: value });
  };

/**
 * A real Vuex store with the editor's getters and mutations but no
 * extension side effects, so composites render from seeded CSS and
 * stay interactive in the Storybook canvas.
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

  const actions: ActionTree<State, State> = {
    setMode: setOptionAction('mode'),
    setLayout: setOptionAction('layout'),
    setAppearance: setOptionAction('appearance'),
    setBasicModeOpenedSections: setOptionAction('basicModeOpenedSections'),
    setLastColorSet: setOptionAction('lastColorSet'),
    setLastColorPickerTab: setOptionAction('lastColorPickerTab'),

    rememberFont(
      { state, commit }: { state: State; commit: Commit },
      font: string
    ) {
      commit('setOptions', {
        ...state.options,
        fonts: [font, ...state.options.fonts.filter(item => item !== font)],
      });
    },

    applyCss({ commit }, { css }: { css: string }) {
      commit('setCss', css);
      commit('setSelectors', postcss.parse(css));
    },

    applyDeclaration(
      { state, dispatch },
      { property, value }: { property: string; value: string }
    ) {
      if (state.activeSelector) {
        dispatch('applyCss', {
          css: addDeclaration(property, value, state.activeSelector, state.css),
        });
      }
    },
  };

  NOOP_ACTIONS.forEach(name => {
    actions[name] = noop;
  });

  const store = new Vuex.Store<State>({ state, getters, mutations, actions });

  if (state.css) {
    store.commit('setSelectors', postcss.parse(state.css));
  }

  return store;
};
