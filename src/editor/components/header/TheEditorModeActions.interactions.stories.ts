import type { Meta } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import TheEditorModeActions from './TheEditorModeActions.vue';
import { editor, RULE_CSS } from '@stylebot/storybook/editor-story';
import {
  featureSwitch,
  pressKey,
  storeOf,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Modes',
  tags: ['test'],
  component: TheEditorModeActions,
  parameters: { padded: false },
};

export default meta;

const withRule = { css: RULE_CSS, activeSelector: 'h1' };

export const TabsSwitchMode = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await userEvent.click(canvas.getByRole('tab', { name: 'Code' }));
    await expect(store.state.options.mode).toBe('code');
    await waitFor(() =>
      expect(canvasElement.querySelector('.code-editor-stub')).toBeVisible()
    );
    await expect(canvasElement.querySelector('.basic-editor')).toBeNull();

    await userEvent.click(canvas.getByRole('tab', { name: 'Presets' }));
    await expect(store.state.options.mode).toBe('magic');
    await expect(
      canvasElement.querySelector('.presets-editor')
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: 'Basic' }));
    await expect(store.state.options.mode).toBe('basic');
    await expect(
      canvasElement.querySelector('.basic-editor')
    ).toBeInTheDocument();
  },
});

export const ShortcutsSwitchMode = editor(withRule, {
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('c');
    await expect(store.state.options.mode).toBe('code');

    // Inspecting is a basic-mode affair, so its shortcut is inert here.
    await pressKey('i');
    await expect(store.state.inspecting).toBe(false);

    await pressKey('m');
    await expect(store.state.options.mode).toBe('magic');

    await pressKey('b');
    await expect(store.state.options.mode).toBe('basic');
    await waitFor(() =>
      expect(canvasElement.querySelector('.basic-editor')).toBeInTheDocument()
    );
  },
});

export const ReadabilityDisablesTabs = editor(
  { readability: true, options: { mode: 'magic' } },
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);

      await expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled();
      await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();

      const presets = canvas.getByRole('tab', { name: 'Presets' });
      await expect(presets).toBeEnabled();
      await expect(presets).toHaveAttribute('aria-selected', 'true');
    },
  }
);

export const ReadabilityToggleForcesPresets = editor(withRule, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await userEvent.click(canvas.getByRole('tab', { name: 'Presets' }));
    const readability = featureSwitch(canvas, 'Readability');

    await userEvent.click(readability);
    await expect(store.state.readability).toBe(true);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled()
    );
    await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();

    await userEvent.click(readability);
    await expect(store.state.readability).toBe(false);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeEnabled()
    );
  },
});
