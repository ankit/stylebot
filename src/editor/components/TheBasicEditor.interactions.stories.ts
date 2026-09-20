import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheBasicEditor from './TheBasicEditor.vue';
import {
  editor,
  PANEL_STATE_PAGE,
  RULE_CSS,
} from '@stylebot/storybook/editor-story';
import {
  cardCollapse,
  declaration,
  pressKey,
  propertyCard,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Interactions/Basic panels',
  component: TheBasicEditor,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

/* Picks a page element the way the inspector does: hover, then Enter.
   Clicking would be swallowed by the highlighter (see the Inspector
   stories). */
const pick = async (element: HTMLElement) => {
  await userEvent.hover(element);
  await pressKey('Enter');
};

export const HideButton = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const hide = canvas.getByRole('button', { name: 'Hide' });

    await userEvent.click(hide);
    await expect(declaration(store, 'h1', 'display')).toBe('none');
    await waitFor(() => expect(hide).toHaveClass('active'));

    await pressKey('h');
    await expect(declaration(store, 'h1', 'display')).toBeUndefined();
    await waitFor(() => expect(hide).not.toHaveClass('active'));
  },
});

export const ResetButton = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const reset = canvas.getByRole('button', { name: 'Reset' });

    await expect(reset).toBeEnabled();
    await userEvent.click(reset);

    await expect(store.getters.activeRule).toBeNull();
    await expect(store.state.css).not.toMatch(/h1\s*\{/);
    // The other rule is untouched.
    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '1.6'
    );
    await waitFor(() => expect(reset).toBeDisabled());
  },
});

export const ResetDisabledWithoutRule = editor(
  { activeSelector: 'h1' },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(
        canvas.getByRole('button', { name: 'Reset' })
      ).toBeDisabled();
    },
  }
);

export const PanelsAutoExpandPerElement = editor(
  { css: 'h1 { margin: 10px; }', inspecting: true },
  {
    page: PANEL_STATE_PAGE,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);

      // The heading has a Box declaration, so Box opens and Text stays shut.
      await pick(canvas.getByRole('heading', { level: 1 }));
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Box')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Text')).toHaveClass('collapsed');

      // The quote has nothing styled: Text opens as the default, Box shuts.
      await pressKey('i');
      await pick(canvas.getByText('Pick an element to start.'));
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Box')).toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed');
    },
  }
);

export const ManualOpenPersistsAcrossPicks = editor(
  { inspecting: true },
  {
    page: PANEL_STATE_PAGE,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const store = storeOf(canvasElement);
      const heading = canvas.getByRole('heading', { level: 1 });
      const quote = canvas.getByText('Pick an element to start.');
      const boxHeader = () =>
        propertyCard(canvas, 'Box').querySelector(
          '.property-card-header'
        ) as HTMLElement;

      await pick(heading);
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Box')).toHaveClass('collapsed');

      // Opening Box by hand is remembered as a preference…
      await userEvent.click(boxHeader());
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Box')).not.toHaveClass('collapsed')
      );
      await expect(store.state.options.basicModeOpenedSections.layout).toBe(
        true
      );

      // …so it stays open for the next element too.
      await pressKey('i');
      await pick(quote);
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Box')).not.toHaveClass('collapsed');

      // Closing it by hand forgets the preference again.
      await userEvent.click(boxHeader());
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Box')).toHaveClass('collapsed')
      );
      await expect(store.state.options.basicModeOpenedSections.layout).toBe(
        false
      );

      await pressKey('i');
      await pick(heading);
      await pressKey('i');
      await pick(quote);
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Box')).toHaveClass('collapsed');
    },
  }
);

export const CollapseAll = editor(withRule, {
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

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
    await expect(
      Object.values(store.state.options.basicModeOpenedSections)
    ).not.toContain(true);
  },
});
