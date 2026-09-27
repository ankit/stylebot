import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheWindowTabBar from './TheWindowTabBar.vue';
import { getPageBridge } from '@stylebot/page-bridge';
import { editorWindow, WINDOW_TAB } from '@stylebot/storybook/editor-story';
import { storeOf, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Window tab',
  tags: ['test'],
  component: TheWindowTabBar,
  parameters: { padded: false },
};

export default meta;

const strip = (root: HTMLElement) =>
  root.querySelector('.window-tab') as HTMLElement;

export const NamesTheTab: StoryObj = {
  ...editorWindow(),
  name: 'the strip shows the tab it edits and switches to it on click',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const focusPage = spyOn(getPageBridge(), 'focusPage');

    await expect(strip(canvasElement)).toHaveTextContent(WINDOW_TAB.title);
    await expect(
      strip(canvasElement).querySelector('img.window-tab-icon')
    ).toHaveAttribute('src', WINDOW_TAB.favIconUrl);

    await user.click(canvas.getByRole('button', { name: WINDOW_TAB.title }));
    await expect(focusPage).toHaveBeenCalledTimes(1);
  },
};

export const BackgroundSignal: StoryObj = {
  ...editorWindow(),
  name: 'the strip marks the tab as in the background while another is in front',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    await expect(strip(canvasElement)).not.toHaveTextContent('In background');

    store.commit('setTab', { ...WINDOW_TAB, active: false });
    await waitFor(() =>
      expect(strip(canvasElement)).toHaveTextContent('In background')
    );
    await expect(strip(canvasElement)).toHaveClass('background');

    store.commit('setTab', WINDOW_TAB);
    await waitFor(() =>
      expect(strip(canvasElement)).not.toHaveTextContent('In background')
    );
  },
};

export const FallsBackToHref: StoryObj = {
  ...editorWindow({ tab: null }),
  name: 'without tab details the strip falls back to the page url',
  play: async ({ canvasElement }) => {
    await expect(strip(canvasElement)).toHaveTextContent(
      'https://example.com/article'
    );
    await expect(
      strip(canvasElement).querySelector('.window-tab-icon-placeholder')
    ).toBeInTheDocument();
  },
};
