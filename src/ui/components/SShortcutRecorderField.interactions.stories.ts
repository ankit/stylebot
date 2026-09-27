import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import SShortcutRecorderField from './SShortcutRecorderField.vue';
import { fromTemplate, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/ShortcutRecorderField',
  tags: ['test'],
  component: SShortcutRecorderField,
};

export default meta;

const components = { SShortcutRecorderField };

const field = (value: string): StoryObj =>
  fromTemplate(
    components,
    `
    <div style="width: 260px">
      <s-shortcut-recorder-field :value="value" @update="value = $event" />
      <output data-testid="value">{{ value }}</output>
    </div>
  `,
    { data: () => ({ value }) }
  );

const syncedField = (value: string): StoryObj =>
  fromTemplate(
    components,
    `
    <div style="width: 260px">
      <s-shortcut-recorder-field
        :value="value"
        :recording.sync="recording"
        @update="value = $event"
      >
        <template #idle="{ start }">
          <button type="button" @click="start">Start</button>
        </template>
        <template #helper>
          <p>Custom helper</p>
        </template>
      </s-shortcut-recorder-field>
      <output data-testid="value">{{ value }}</output>
      <output data-testid="recording">{{ recording }}</output>
    </div>
  `,
    { data: () => ({ value, recording: false }) }
  );

export const RecordsAShortcut: StoryObj = {
  ...field(''),
  name: 'recording a key combo saves it and leaves recording',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('start recording', async () => {
      await user.click(
        canvas.getByRole('button', { name: 'Record a shortcut' })
      );
      await expect(
        canvas.getByText('Press a key to finish · Esc cancels')
      ).toBeVisible();
    });

    await step('held modifiers show live', async () => {
      await user.keyboard('{Control>}{Shift>}');
      await waitFor(() =>
        expect(
          canvasElement.querySelector('.field.recording kbd')
        ).not.toBeNull()
      );
    });

    await step('a non-modifier key finishes the shortcut', async () => {
      await user.keyboard('y{/Shift}{/Control}');
      await expect(canvas.getByTestId('value')).toHaveTextContent(
        'ctrl+shift+y'
      );
      await expect(
        canvasElement.querySelector('.field.has-value')
      ).toBeVisible();
      await expect(
        canvas.queryByText('Press a key to finish · Esc cancels')
      ).toBeNull();
    });
  },
};

export const EscapeCancels: StoryObj = {
  ...field('alt+shift+t'),
  name: 'Escape stops recording and keeps the existing shortcut',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(canvasElement.querySelector('.field.has-value')!);
    await expect(canvasElement.querySelector('.field.recording')).toBeVisible();

    await user.keyboard('{Escape}');

    await expect(canvasElement.querySelector('.field.recording')).toBeNull();
    await expect(canvasElement.querySelector('.field.has-value')).toBeVisible();
    await expect(canvas.getByTestId('value')).toHaveTextContent('alt+shift+t');
  },
};

export const CancelButtonCancels: StoryObj = {
  ...field(''),
  name: 'the Cancel button stops recording without saving',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(canvas.getByRole('button', { name: 'Record a shortcut' }));
    await user.click(canvas.getByRole('button', { name: 'Cancel' }));

    await expect(
      canvas.getByRole('button', { name: 'Record a shortcut' })
    ).toBeVisible();
    await expect(canvas.getByTestId('value').textContent).toBe('');
  },
};

export const ClearRemovesTheShortcut: StoryObj = {
  ...field('alt+shift+t'),
  name: 'clearing removes the shortcut without starting to record',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(canvas.getByRole('button', { name: 'Clear shortcut' }));

    await expect(canvas.getByTestId('value').textContent).toBe('');
    await expect(
      canvas.getByRole('button', { name: 'Record a shortcut' })
    ).toBeVisible();
    await expect(canvasElement.querySelector('.field.recording')).toBeNull();
  },
};

export const SlotsAndSyncedRecording: StoryObj = {
  ...syncedField('alt+shift+t'),
  name: 'custom idle and helper slots drive recording through .sync',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(canvas.getByRole('button', { name: 'Start' }));
    await expect(canvas.getByTestId('recording')).toHaveTextContent('true');
    await expect(canvas.getByText('Custom helper')).toBeVisible();

    await user.keyboard('{Alt>}k{/Alt}');

    await expect(canvas.getByTestId('value')).toHaveTextContent('alt+k');
    await expect(canvas.getByTestId('recording')).toHaveTextContent('false');
    await expect(canvas.getByRole('button', { name: 'Start' })).toBeVisible();
  },
};
