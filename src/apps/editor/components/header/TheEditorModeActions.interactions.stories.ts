import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheEditorModeActions from './TheEditorModeActions.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
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
  name: 'the tabs switch between Basic and Code',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(canvas.getByRole('tab', { name: 'Code' }));
    await expect(store.state.options.mode).toBe('code');
    await waitFor(() =>
      expect(canvasElement.querySelector('.code-editor-stub')).toBeVisible()
    );
    await expect(canvasElement.querySelector('.basic-editor')).toBeNull();

    await user.click(canvas.getByRole('tab', { name: 'Basic' }));
    await expect(store.state.options.mode).toBe('basic');
    await expect(
      canvasElement.querySelector('.basic-editor')
    ).toBeInTheDocument();
  },
};

export const ShortcutsSwitchMode: StoryObj = {
  ...editor(WITH_RULE),
  name: 'b and c switch modes; i inspects in both',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await pressKey('c');
    await expect(store.state.options.mode).toBe('code');

    await pressKey('i');
    await expect(store.state.inspecting).toBe(true);

    await pressKey('i');
    await expect(store.state.inspecting).toBe(false);

    await pressKey('b');
    await expect(store.state.options.mode).toBe('basic');
    await waitFor(() =>
      expect(canvasElement.querySelector('.basic-editor')).toBeInTheDocument()
    );
  },
};

export const ReadabilityDisablesTabs: StoryObj = {
  ...editor({ readability: true }),
  name: 'Basic and Code are disabled and the reader panel shows while readability is on',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    store.commit('setPage', { ...store.state.page, readerable: true });
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled()
    );
    await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();
    await expect(
      canvasElement.querySelector('.reader-panel')
    ).toBeInTheDocument();
    await expect(canvasElement.querySelector('.basic-editor')).toBeNull();
  },
};

export const ReadabilityTogglesReaderPanel: StoryObj = {
  ...editor(WITH_RULE),
  name: 'turning readability on swaps in the reader panel, and its switch turns it back off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    store.commit('setPage', { ...store.state.page, readerable: true });
    store.dispatch('applyReadability', true);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeDisabled()
    );
    await expect(canvas.getByRole('tab', { name: 'Code' })).toBeDisabled();
    await expect(store.state.options.mode).toBe('basic');

    await user.click(featureSwitch(canvas, 'Readability'));
    await expect(store.state.readability).toBe(false);
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: 'Basic' })).toBeEnabled()
    );
    await expect(
      canvasElement.querySelector('.basic-editor')
    ).toBeInTheDocument();
  },
};
