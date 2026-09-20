import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheEditorModeActions from './TheEditorModeActions.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/editor-story';
import {
  featureSwitch,
  pressKey,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Modes',
  tags: ['test'],
  component: TheEditorModeActions,
  parameters: { padded: false },
};

export default meta;

export const TabsSwitchMode: StoryObj = {
  ...editor(WITH_RULE),
  name: 'the tabs switch between Basic, Code and Presets',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(canvas.getByRole('tab', { name: 'Code' }));
    await expect(store.state.options.mode).toBe('code');
    await waitFor(() =>
      expect(canvasElement.querySelector('.code-editor-stub')).toBeVisible()
    );
    await expect(canvasElement.querySelector('.basic-editor')).toBeNull();

    await user.click(canvas.getByRole('tab', { name: 'Presets' }));
    await expect(store.state.options.mode).toBe('magic');
    await expect(
      canvasElement.querySelector('.presets-editor')
    ).toBeInTheDocument();

    await user.click(canvas.getByRole('tab', { name: 'Basic' }));
    await expect(store.state.options.mode).toBe('basic');
    await expect(
      canvasElement.querySelector('.basic-editor')
    ).toBeInTheDocument();
  },
};

export const ShortcutsSwitchMode: StoryObj = {
  ...editor(WITH_RULE),
  name: 'b, c and p switch modes; i only inspects in Basic',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('c');
    await expect(store.state.options.mode).toBe('code');

    // Inspecting is a basic-mode affair, so its shortcut is inert here.
    await pressKey('i');
    await expect(store.state.inspecting).toBe(false);

    await pressKey('p');
    await expect(store.state.options.mode).toBe('magic');

    await pressKey('b');
    await expect(store.state.options.mode).toBe('basic');
    await waitFor(() =>
      expect(canvasElement.querySelector('.basic-editor')).toBeInTheDocument()
    );
  },
};

export const ReadabilityDisablesTabs: StoryObj = {
  ...editor({ readability: true, options: { mode: 'magic' } }),
  name: 'Basic and Code are disabled while readability is on',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled();
    await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();

    const presets = canvas.getByRole('tab', { name: 'Presets' });
    await expect(presets).toBeEnabled();
    await expect(presets).toHaveAttribute('aria-selected', 'true');
  },
};

export const ReadabilityToggleForcesPresets: StoryObj = {
  ...editor(WITH_RULE),
  name: 'turning readability on forces Presets mode and disables the other tabs',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(canvas.getByRole('tab', { name: 'Presets' }));
    const readability = featureSwitch(canvas, 'Readability');

    await user.click(readability);
    await expect(store.state.readability).toBe(true);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled()
    );
    await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();

    await user.click(readability);
    await expect(store.state.readability).toBe(false);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeEnabled()
    );
  },
};
