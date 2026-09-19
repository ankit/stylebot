import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor } from '@storybook/test';

import TheStylebotApp from './TheStylebotApp.vue';
import {
  getCssAfterApplyingFilterEffectToPage,
  getBodyChildSelectors,
} from '@stylebot/css';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import { collapseAllCards, storeOf } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Panel',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

export const BasicEmpty = editor();

export const BasicWithRule = editor(WITH_RULE);

/* Picking an element auto-opens the sections it has declarations in, so
   collapsing has to happen through the headers, as a user would. */
export const BasicSectionsCollapsed: StoryObj = {
  ...editor(WITH_RULE),
  play: ({ canvasElement }) => collapseAllCards(canvasElement),
};

export const Magic = editor({ options: { mode: 'magic' } });

/* The grayscale preset targets the page's top-level elements by generated
   selector, so it's applied once the DOM has settled — as the toggle would. */
export const MagicGrayscaleApplied: StoryObj = {
  ...editor({ options: { mode: 'magic' } }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const bodyChildSelectors = getBodyChildSelectors();

    store.commit('setPage', { ...store.state.page, bodyChildSelectors });
    store.dispatch('applyCss', {
      css: getCssAfterApplyingFilterEffectToPage(
        'grayscale',
        '',
        '100',
        bodyChildSelectors
      ),
    });
    await waitFor(() => expect(store.getters.grayscale).toBe(100));
  },
};

export const Readability = editor({
  readability: true,
  options: { mode: 'magic' },
});

export const Code = editor({ ...WITH_RULE, options: { mode: 'code' } });
