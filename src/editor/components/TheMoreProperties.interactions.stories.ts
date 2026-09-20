import type { Meta, StoryObj } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheMoreProperties from './TheMoreProperties.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  declaration,
  propertyCard,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/More properties',
  tags: ['test'],
  component: TheMoreProperties,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

const rows = (card: HTMLElement) =>
  Array.from(card.querySelectorAll('.more-property-row')).map(row =>
    row.textContent?.replace(/\s+/g, ' ').trim()
  );

export const ListsUnknownDeclarations: StoryObj = {
  ...editor(withRule),
  name: 'lists the declarations no other panel edits',
  play: async ({ canvasElement }) => {
    const card = propertyCard(within(canvasElement), 'More Properties');

    // Only what no other panel edits shows up here.
    await expect(rows(card)).toEqual(['letter-spacing 1px']);
  },
};

export const AddProperty: StoryObj = {
  ...editor(withRule),
  name: 'Enter adds a typed property and Escape abandons one',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const card = within(propertyCard(canvas, 'More Properties'));

    await userEvent.click(card.getByRole('button', { name: /Add property/ }));
    await userEvent.type(card.getByPlaceholderText('Property'), 'cursor');
    await userEvent.type(card.getByPlaceholderText('Value'), 'pointer{Enter}');

    await expect(declaration(store, 'h1', 'cursor')).toBe('pointer');
    await waitFor(() =>
      expect(rows(propertyCard(canvas, 'More Properties'))).toContain(
        'cursor pointer'
      )
    );

    // Escape abandons a half-typed property.
    await userEvent.click(card.getByRole('button', { name: /Add property/ }));
    await userEvent.type(
      card.getByPlaceholderText('Property'),
      'text-transform{Escape}'
    );
    await waitFor(() =>
      expect(card.queryByPlaceholderText('Property')).toBeNull()
    );
    await expect(declaration(store, 'h1', 'text-transform')).toBeUndefined();
  },
};

export const RemoveProperty: StoryObj = {
  ...editor(withRule),
  name: 'removing a property keeps the rest of the rule',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const card = within(propertyCard(canvas, 'More Properties'));

    await userEvent.click(card.getByRole('button', { name: 'Remove' }));

    await expect(declaration(store, 'h1', 'letter-spacing')).toBeUndefined();
    await waitFor(() =>
      expect(rows(propertyCard(canvas, 'More Properties'))).toEqual([])
    );
    // The rule itself survives.
    await expect(declaration(store, 'h1', 'color')).toBe('#2a5fd6');
  },
};
