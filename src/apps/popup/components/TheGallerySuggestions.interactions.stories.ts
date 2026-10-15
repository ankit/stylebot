import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheGallerySuggestions from './TheGallerySuggestions.vue';
import {
  gallerySuggestions,
  popup,
  profiledStyle,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Gallery Suggestions',
  tags: ['test'],
  component: TheGallerySuggestions,
  parameters: { padded: false },
};

export default meta;

const withSuggestions = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: { suggestions: gallerySuggestions },
});

const previewPort = () => {
  const port = {
    postMessage: spyOn({ fn: () => undefined }, 'fn'),
    disconnect: () => undefined,
  };
  spyOn(chrome.tabs, 'connect').mockReturnValue(
    port as unknown as chrome.runtime.Port
  );

  return port.postMessage;
};

export const ListsSuggestions: StoryObj = {
  ...withSuggestions,
  name: "lists the site's popular Gallery styles with their author and installs",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Popular in Gallery');
    await expect(
      canvas.getByRole('button', { name: /Tokyo Night/ })
    ).toHaveTextContent('maya · 1.2K installs');
    await expect(
      canvas.getByRole('button', { name: /Paper/ })
    ).toHaveTextContent('1 install');
  },
};

export const PreviewsThenInstalls: StoryObj = {
  ...withSuggestions,
  name: 'a suggestion previews on the page, and Install adds it as a profile',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sent = previewPort();
    const install = spyOn(chrome.runtime, 'sendMessage');

    await step('preview', async () => {
      await user.click(
        await canvas.findByRole('button', { name: /Tokyo Night/ })
      );

      await canvas.findByText('Previewing on this page');
      await waitFor(() =>
        expect(sent).toHaveBeenCalledWith({
          preview: expect.objectContaining({ importUrls: [] }),
        })
      );
    });

    await step('install', async () => {
      await user.click(canvas.getByRole('button', { name: 'Install' }));

      await waitFor(() =>
        expect(install).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'InstallGalleryStyle',
            id: 'tokyo-night',
            url: 'example.com',
          })
        )
      );
      await waitFor(() =>
        expect(canvas.queryByText('Previewing on this page')).toBeNull()
      );
      await expect(sent).toHaveBeenLastCalledWith({ preview: null });
    });
  },
};

export const CancelEndsThePreview: StoryObj = {
  ...withSuggestions,
  name: 'Cancel puts the page back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sent = previewPort();

    await user.click(await canvas.findByRole('button', { name: /Paper/ }));
    await user.click(await canvas.findByRole('button', { name: 'Cancel' }));

    await expect(sent).toHaveBeenLastCalledWith({ preview: null });
    await expect(canvas.queryByText('Previewing on this page')).toBeNull();
  },
};

export const LeavesOutInstalledProfiles: StoryObj = {
  ...popup({
    styles: [profiledStyle('example.com')],
    defaultStyle: profiledStyle('example.com'),
    gallery: {
      suggestions: [
        { ...gallerySuggestions[0], name: 'Dark' },
        gallerySuggestions[1],
      ],
    },
  }),
  name: 'a suggestion named like one of the site’s profiles is left out',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('button', { name: /Paper/ });
    await expect(canvas.queryByRole('button', { name: /^Dark/ })).toBeNull();
  },
};
