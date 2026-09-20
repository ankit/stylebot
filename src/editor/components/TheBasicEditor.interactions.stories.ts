import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheBasicEditor from './TheBasicEditor.vue';
import {
  editor,
  PANEL_STATE_PAGE,
  WITH_RULE,
} from '@stylebot/storybook/editor-story';
import {
  cardCollapse,
  cardHeader,
  collapseAllCards,
  declaration,
  pageStyle,
  pick,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Basic panels',
  tags: ['test'],
  component: TheBasicEditor,
  parameters: { padded: false },
};

export default meta;

export const HideButton: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Hide and h toggle display: none on the picked element',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const hide = canvas.getByRole('button', { name: 'Hide' });

    await user.click(hide);
    await expect(declaration(store, 'h1', 'display')).toBe('none');
    await expect(pageStyle(canvasElement, 'h1', 'display')).toBe('none');
    await waitFor(() => expect(hide).toHaveClass('active'));

    await pressKey('h');
    await expect(declaration(store, 'h1', 'display')).toBeUndefined();
    await expect(pageStyle(canvasElement, 'h1', 'display')).toBe('block');
    await waitFor(() => expect(hide).not.toHaveClass('active'));
  },
};

export const ResetButton: StoryObj = {
  ...editor(WITH_RULE),
  name: "Reset removes the picked element's rule and leaves the others alone",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const reset = canvas.getByRole('button', { name: 'Reset' });

    await expect(reset).toBeEnabled();
    await user.click(reset);

    await expect(store.getters.activeRule).toBeNull();
    await expect(store.state.css).not.toMatch(/h1\s*\{/);
    await expect(pageStyle(canvasElement, 'h1', 'color')).not.toBe(
      'rgb(42, 95, 214)'
    );
    // The other rule is untouched.
    await expect(declaration(store, '.article-body', 'line-height')).toBe(
      '1.6'
    );
    await waitFor(() => expect(reset).toBeDisabled());
  },
};

export const ResetDisabledWithoutRule: StoryObj = {
  ...editor({ activeSelector: 'h1' }),
  name: 'Reset is disabled when the picked element has no rule',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Reset' })).toBeDisabled();
  },
};

export const PanelsAutoExpandPerElement: StoryObj = {
  ...editor(
    { css: 'h1 { margin: 10px; }', inspecting: true },
    { page: PANEL_STATE_PAGE }
  ),
  name: 'panels with declarations auto-expand and collapse per element',
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
};

export const ManualOpenPersistsAcrossPicks: StoryObj = {
  ...editor({ inspecting: true }, { page: PANEL_STATE_PAGE }),
  name: 'a manually opened panel stays open across element picks until closed by hand',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const heading = canvas.getByRole('heading', { level: 1 });
    const quote = canvas.getByText('Pick an element to start.');
    const boxHeader = () => cardHeader(canvas, 'Box');

    await step('an unstyled element opens only Text', async () => {
      await pick(heading);
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Box')).toHaveClass('collapsed');
    });

    await step('opening Box by hand is remembered', async () => {
      await user.click(boxHeader());
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Box')).not.toHaveClass('collapsed')
      );
      await expect(store.state.options.basicModeOpenedSections.layout).toBe(
        true
      );
    });

    await step('so it stays open for the next element', async () => {
      await pressKey('i');
      await pick(quote);
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed')
      );
      await expect(cardCollapse(canvas, 'Box')).not.toHaveClass('collapsed');
    });

    await step('closing it by hand forgets the preference', async () => {
      await user.click(boxHeader());
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
    });
  },
};

export const CollapseAll: StoryObj = {
  ...editor(WITH_RULE),
  name: 'every panel can be collapsed and none stays remembered as open',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await collapseAllCards(canvasElement);
    await expect(
      Object.values(store.state.options.basicModeOpenedSections)
    ).not.toContain(true);
  },
};
