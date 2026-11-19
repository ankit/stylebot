import type { Meta, StoryObj } from '@storybook/vue';

import TheStylebotApp from './TheStylebotApp.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import { collapseAllCards, storeOf } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Panel',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

export const BasicEmpty = editor();

export const BasicWithRule = editor(WITH_RULE);

/* Sections remember being collapsed, so it happens through the headers,
   as a user would. */
export const BasicSectionsCollapsed: StoryObj = {
  ...editor(WITH_RULE),
  play: ({ canvasElement }) => collapseAllCards(canvasElement),
};

/* The stand-in page isn't an article, so it's marked readerable here. */
export const Readability: StoryObj = {
  ...editor({ readability: true }),
  play: ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    store.commit('setPage', { ...store.state.page, readerable: true });
  },
};

export const Code = editor({ ...WITH_RULE, options: { mode: 'code' } });
