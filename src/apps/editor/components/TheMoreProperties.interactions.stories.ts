import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheMoreProperties from './TheMoreProperties.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import {
  declaration,
  propertyCard,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/More properties',
  tags: ['test'],
  component: TheMoreProperties,
  parameters: { padded: false },
};

export default meta;

// The rule's own rows, as "property value"; the page's rows are left out.
const rows = (card: HTMLElement) =>
  Array.from(
    card.querySelectorAll('.more-property-row:not(.page)'),
    row =>
      `${row.querySelector('.more-property-key')?.textContent?.trim()} ${
        row.querySelector<HTMLInputElement>('.more-property-value')?.value
      }`
  );

export const ListsUnknownDeclarations: StoryObj = {
  ...editor(WITH_RULE),
  name: 'lists the declarations no other panel edits',
  play: async ({ canvasElement }) => {
    const card = propertyCard(within(canvasElement), 'More properties');

    // Only what no other panel edits shows up here.
    await expect(rows(card)).toEqual(['letter-spacing 1px']);
  },
};

export const EditInPlace: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a value edits in place and Escape reverts it',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    const card = within(propertyCard(within(canvasElement), 'More properties'));
    const value = card.getByLabelText('letter-spacing') as HTMLInputElement;

    await user.clear(value);
    await user.type(value, '2px{Enter}');
    await expect(declaration(store, 'h1', 'letter-spacing')).toBe('2px');

    await user.clear(value);
    await user.type(value, '9px{Escape}');
    await expect(value).toHaveValue('2px');
    await expect(declaration(store, 'h1', 'letter-spacing')).toBe('2px');
  },
};

export const AddProperty: StoryObj = {
  ...editor(WITH_RULE),
  name: 'Enter adds a typed property and Escape abandons one',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const card = within(propertyCard(canvas, 'More properties'));

    await user.click(card.getByRole('button', { name: /Add property/ }));
    await user.type(card.getByPlaceholderText('Property'), 'cursor');
    await user.type(card.getByPlaceholderText('Value'), 'pointer{Enter}');

    await expect(declaration(store, 'h1', 'cursor')).toBe('pointer');
    await waitFor(() =>
      expect(rows(propertyCard(canvas, 'More properties'))).toContain(
        'cursor pointer'
      )
    );

    // Escape abandons a half-typed property.
    await user.click(card.getByRole('button', { name: /Add property/ }));
    await user.type(
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
  ...editor(WITH_RULE),
  name: 'removing a property keeps the rest of the rule',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const card = within(propertyCard(canvas, 'More properties'));

    await user.click(card.getByRole('button', { name: 'Remove' }));

    await expect(declaration(store, 'h1', 'letter-spacing')).toBeUndefined();
    await waitFor(() =>
      expect(rows(propertyCard(canvas, 'More properties'))).toEqual([])
    );
    // The rule itself survives.
    await expect(declaration(store, 'h1', 'color')).toBe('#2a5fd6');
  },
};

const PAGE_DECLARATIONS = [
  'cursor',
  'vertical-align',
  'white-space',
  'word-break',
  'text-indent',
  'text-shadow',
  'outline-style',
].map(property => ({ property, value: 'initial-page-value' }));

export const PageRows: StoryObj = {
  ...editor(WITH_RULE),
  name: "the page's own values show dimmed and typing one adds it to the rule",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const pageRows = () =>
      Array.from(
        propertyCard(canvas, 'More properties').querySelectorAll<HTMLElement>(
          '.more-property-row.page'
        )
      );

    await step('six page rows show until Show all', async () => {
      store.commit('setPageDeclarations', [
        { property: 'color', value: 'red' },
        ...PAGE_DECLARATIONS,
      ]);

      // Color has its own control, so only the others are listed.
      await waitFor(() => expect(pageRows()).toHaveLength(6));
      await user.click(canvas.getByRole('button', { name: 'Show all' }));
      await waitFor(() => expect(pageRows()).toHaveLength(7));
    });

    await step('typing into a page row writes it; Escape reverts', async () => {
      const cursor = canvas.getByLabelText('cursor') as HTMLInputElement;
      await expect(cursor).toHaveAttribute('placeholder', 'initial-page-value');

      await user.type(cursor, 'zoom-in{Escape}');
      await expect(cursor).toHaveValue('');
      await expect(declaration(store, 'h1', 'cursor')).toBeUndefined();

      await user.type(cursor, 'pointer{Enter}');
      await expect(declaration(store, 'h1', 'cursor')).toBe('pointer');
    });
  },
};

export const TruncatedRowTooltip: StoryObj = {
  ...editor(WITH_RULE),
  name: 'a row whose name is cut off shows the whole declaration on hover',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const long = '-webkit-tap-highlight-color-and-then-some-more';

    store.commit('setPageDeclarations', [
      { property: long, value: 'transparent' },
    ]);
    const anchor = await waitFor(() => {
      const key = within(propertyCard(canvas, 'More properties')).getByText(
        long
      );
      return key.closest('.s-tooltip') as HTMLElement;
    });

    await user.hover(anchor);
    await expect(await canvas.findByRole('tooltip')).toHaveTextContent(
      `${long}: transparent`
    );

    // A row that fits shows none.
    await user.unhover(anchor);
    await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull());
    await user.hover(
      canvas
        .getByLabelText('letter-spacing')
        .closest('.s-tooltip') as HTMLElement
    );
    await new Promise(resolve => setTimeout(resolve, 700));
    await expect(canvas.queryByRole('tooltip')).toBeNull();
  },
};
