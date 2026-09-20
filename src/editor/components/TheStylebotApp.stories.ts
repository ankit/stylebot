import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor } from '@storybook/test';

import TheStylebotApp from './TheStylebotApp.vue';
import { getCssAfterApplyingFilterEffectToPage } from '@stylebot/css';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import { storeOf } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Panel',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

export const BasicEmpty = editor();

export const BasicWithRule = editor({
  css: RULE_CSS,
  activeSelector: 'h1',
});

/* Picking an element auto-opens the sections it has declarations in, so
   collapsing has to happen through the headers, as a user would. */
export const BasicSectionsCollapsed = editor(
  { css: RULE_CSS, activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      for (const card of canvasElement.querySelectorAll('.property-card')) {
        if (!card.querySelector('.property-card-collapse.collapsed')) {
          await userEvent.click(
            card.querySelector('.property-card-header') as HTMLElement
          );
        }
      }

      await waitFor(() =>
        expect(
          canvasElement.querySelectorAll(
            '.property-card-collapse:not(.collapsed)'
          )
        ).toHaveLength(0)
      );
    },
  }
);

export const Magic = editor({ options: { mode: 'magic' } });

/* The grayscale preset targets the page's top-level elements by generated
   selector, so it's applied once the DOM has settled — as the toggle would. */
export const MagicGrayscaleApplied = editor(
  { options: { mode: 'magic' } },
  {
    play: async ({ canvasElement }) => {
      const store = storeOf(canvasElement);
      store.dispatch('applyCss', {
        css: getCssAfterApplyingFilterEffectToPage('grayscale', '', '100'),
      });
      await waitFor(() => expect(store.getters.grayscale).toBe(100));
    },
  }
);

export const Readability = editor({
  readability: true,
  options: { mode: 'magic' },
});

export const Code = editor({
  css: RULE_CSS,
  activeSelector: 'h1',
  options: { mode: 'code' },
});
