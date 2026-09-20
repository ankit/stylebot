import Vuex, { ActionTree, Commit, Dispatch, Store } from 'vuex';
import * as postcss from 'postcss';

import {
  addDeclaration,
  getCssAfterApplyingFilterEffectToPage,
  getPrimaryFontFamily,
  removeRule,
} from '@stylebot/css';
import type { FilterEffect, StylebotOptions } from '@stylebot/types';

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
  'previewFontFamily',
  'setReadabilitySettings',
];

const setOptionAction =
  (key: keyof StylebotOptions) =>
  ({ state, commit }: { state: State; commit: Commit }, value: unknown) => {
    commit('setOptions', { ...state.options, [key]: value });
  };

type Context = { state: State; commit: Commit; dispatch: Dispatch };

/**
 * A real Vuex store with the editor's getters and mutations but no
 * extension side effects, so composites render from seeded CSS and
 * stay interactive in the Storybook canvas. Actions that only touch
 * state are mirrored here; the ones that reach into the page or the
 * background are no-ops.
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

    closeStylebot({ commit }: Context) {
      commit('setVisible', false);
    },

    escape({ state, commit, dispatch }: Context) {
      if (state.help) {
        commit('setHelp', false);
        return;
      }

      dispatch('closeStylebot');
    },

    resetActiveRule({ state, dispatch }: Context) {
      if (state.activeSelector) {
        dispatch('applyCss', {
          css: removeRule(state.css, state.activeSelector),
        });
      }
    },

    applyFontFamily(
      { dispatch }: Context,
      { value, remember = false }: { value: string; remember?: boolean }
    ) {
      dispatch('applyDeclaration', { property: 'font-family', value });

      const family = getPrimaryFontFamily(value);
      if (family && remember) {
        dispatch('rememberFont', family);
      }
    },

    applyReadability({ state, commit }: Context, value: boolean) {
      if (value && ['basic', 'code'].includes(state.options.mode)) {
        commit('setOptions', { ...state.options, mode: 'magic' });
      }

      commit('setReadability', value);
    },

    applyFilter(
      { state, dispatch }: Context,
      { effectName, percent }: { effectName: FilterEffect; percent: string }
    ) {
      dispatch('applyCss', {
        css: getCssAfterApplyingFilterEffectToPage(
          effectName,
          state.css,
          percent
        ),
      });
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
