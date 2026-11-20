import type { Meta, StoryObj } from '@storybook/vue';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import TheBasicEditor from './TheBasicEditor.vue';
import {
  editor,
  PANEL_STATE_PAGE,
  WITH_RULE,
} from '@stylebot/storybook/fixtures/editor';
import {
  cardCollapse,
  cardHeader,
  collapseAllCards,
  declaration,
  hoverPage,
  numberInput,
  pageStyle,
  pick,
  pressKey,
  propertyControl,
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

export const SectionsStayAsLeft: StoryObj = {
  ...editor(
    { css: 'div.sb-page h1 { margin: 10px; }', inspecting: true },
    { page: PANEL_STATE_PAGE }
  ),
  name: 'the common sections start open, the rest collapsed, and each stays as the user leaves it across picks',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const heading = canvas.getByRole('heading', { level: 1 });
    const quote = canvas.getByText('Pick an element to start.');

    await step(
      'Text, Colors and Layout start open, the rest collapsed',
      async () => {
        await pick(heading);
        await waitFor(() =>
          expect(cardCollapse(canvas, 'Layout')).not.toHaveClass('collapsed')
        );

        for (const label of ['Text', 'Colors']) {
          await expect(cardCollapse(canvas, label)).not.toHaveClass(
            'collapsed'
          );
        }

        for (const label of ['Border', 'Effects', 'More properties']) {
          await expect(cardCollapse(canvas, label)).toHaveClass('collapsed');
        }
      }
    );

    await step('collapsing Layout is remembered', async () => {
      await user.click(cardHeader(canvas, 'Layout'));
      await waitFor(() =>
        expect(cardCollapse(canvas, 'Layout')).toHaveClass('collapsed')
      );
      await expect(store.state.options.basicModeCollapsedSections.layout).toBe(
        true
      );
    });

    await step('so it stays collapsed for the next element', async () => {
      await pressKey('i');
      await pick(quote);
      await pressKey('i');
      await pick(heading);
      await expect(cardCollapse(canvas, 'Layout')).toHaveClass('collapsed');
      await expect(cardCollapse(canvas, 'Text')).not.toHaveClass('collapsed');
    });
  },
};

export const CollapseAll: StoryObj = {
  ...editor(WITH_RULE),
  name: 'every section can be collapsed and each is remembered as collapsed',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await collapseAllCards(canvasElement);
    await expect(
      Object.values(store.state.options.basicModeCollapsedSections).filter(
        Boolean
      )
    ).toHaveLength(6);
  },
};

export const OtherSelectorSource: StoryObj = {
  ...editor({
    css: 'h1 { color: #2a5fd6; }',
    activeSelector: 'h1',
  }),
  name: 'a value another selector sets shows its source beside the label, and clicking it switches to that selector',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    store.commit('setAppliedDeclarations', [
      {
        selector: 'body',
        property: 'font-family',
        value: 'Georgia',
        everywhere: true,
      },
    ]);

    const source = await canvas.findByRole('button', {
      name: 'Styled by body',
    });
    await expect(source.closest('.property-row-heading')).toHaveTextContent(
      'Font'
    );

    await user.click(source);
    await expect(store.state.activeSelector).toBe('body');
  },
};

export const OverriddenBySelector: StoryObj = {
  ...editor({
    css: 'h1 { color: #2a5fd6; font-family: Georgia; }',
    activeSelector: 'h1',
  }),
  name: 'a value another selector overrides shows a warning with the winning selector',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    store.commit('setAppliedDeclarations', [
      {
        selector: 'body',
        property: 'font-family',
        value: 'Arial',
        everywhere: true,
      },
    ]);

    const warning = await canvas.findByRole('button', {
      name: 'Overridden by body',
    });
    await expect(warning.closest('.property-row-heading')).toHaveTextContent(
      'Font'
    );
    await expect(warning.querySelector('svg')).not.toBeNull();
  },
};

export const OverriddenOnThisElement: StoryObj = {
  ...editor({
    css: 'h1 { color: #2a5fd6; } .title { color: #d62a2a; }',
    activeSelector: 'h1',
  }),
  name: 'a value another selector overrides on only some of the elements says it is overridden on this element',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    store.commit('setAppliedDeclarations', [
      {
        selector: '.title',
        property: 'color',
        value: '#d62a2a',
        everywhere: false,
      },
    ]);

    await expect(
      await canvas.findByRole('button', {
        name: 'Overridden by .title on this element',
      })
    ).toBeVisible();
  },
};

export const HoverPreviewClearsOnLeave: StoryObj = {
  ...editor({ inspecting: true }, { page: PANEL_STATE_PAGE }),
  name: "the hovered element's values clear once the pointer leaves the page",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole('heading', { level: 1 });
    const size = numberInput(propertyControl(canvas, 'Size'));
    const sizeShown = () => size.getAttribute('placeholder');
    const blank = sizeShown();

    await step('hovering an element previews its values', async () => {
      await hoverPage(heading);
      await waitFor(() => expect(sizeShown()).not.toBe(blank));
    });

    await step('moving into the panel clears them', async () => {
      await user.hover(size);
      await waitFor(() => expect(sizeShown()).toBe(blank));
    });

    await step('hovering the page again brings them back', async () => {
      await hoverPage(heading);
      await waitFor(() => expect(sizeShown()).not.toBe(blank));
    });

    await step('leaving the window clears them', async () => {
      await fireEvent.pointerOut(heading, { relatedTarget: null });
      await waitFor(() => expect(sizeShown()).toBe(blank));
    });
  },
};
