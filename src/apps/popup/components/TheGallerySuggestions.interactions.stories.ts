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

/**
 * The suggestion row for a gallery style, found by its name.
 */
const suggestion = async (
  canvas: ReturnType<typeof within>,
  name: string
): Promise<HTMLElement> =>
  (await canvas.findByText(name)).closest('.suggestion') as HTMLElement;

const preview = async (canvas: ReturnType<typeof within>, name: string) =>
  user.click(await suggestion(canvas, name));

export const ListsSuggestions: StoryObj = {
  ...withSuggestions,
  name: "lists the site's popular Gallery styles with their author and installs",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Popular in Gallery');
    await expect(await suggestion(canvas, 'Tokyo Night')).toHaveTextContent(
      /maya\s*1\.2K/
    );
    await expect(canvas.getByTitle('1,240 installs')).toBeVisible();
    await expect(canvas.getByTitle('1 install')).toHaveTextContent('1');
  },
};

export const PreviewsThenInstalls: StoryObj = {
  ...withSuggestions,
  name: 'clicking a suggestion previews it on the tab, and Install adds it as a profile',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await step('preview', async () => {
      await preview(canvas, 'Tokyo Night');

      await canvas.findByText('Preview · not installed');
      await expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PreviewGalleryStyle',
          id: 'tokyo-night',
        })
      );
    });

    await step('install', async () => {
      await user.click(canvas.getByRole('button', { name: 'Install' }));

      await waitFor(() =>
        expect(sent).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'InstallGalleryPreview' })
        )
      );
      await waitFor(() =>
        expect(canvas.queryByText('Preview · not installed')).toBeNull()
      );
    });
  },
};

export const CancelEndsThePreview: StoryObj = {
  ...withSuggestions,
  name: 'Cancel ends the preview',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await preview(canvas, 'Paper');
    await user.click(await canvas.findByRole('button', { name: 'Cancel' }));

    await expect(sent).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'EndGalleryPreview' })
    );
    await expect(canvas.queryByText('Preview · not installed')).toBeNull();
  },
};

export const ShowsTheTabsPreview: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: {
      suggestions: gallerySuggestions,
      previewing: gallerySuggestions[1],
    },
  }),
  name: 'reopened while the tab previews a style, it shows that preview',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Preview · not installed');
    await expect(
      canvas.getByText('Paper').closest('.preview-card')
    ).not.toBeNull();
  },
};

export const ShowsAnonymousAuthors: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: {
      suggestions: [
        {
          ...gallerySuggestions[0],
          author: { ...gallerySuggestions[0].author, name: null },
        },
      ],
    },
  }),
  name: 'a suggestion whose author has no alias says anonymous',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await suggestion(canvas, 'Tokyo Night')).toHaveTextContent(
      'anonymous'
    );
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

    await suggestion(canvas, 'Paper');
    await expect(
      canvas.queryByText('Dark', { selector: '.suggestion *' })
    ).toBeNull();
  },
};

export const LeavesOutNoInstalls: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: {
      suggestions: [{ ...gallerySuggestions[0], installs: 0 }],
    },
  }),
  name: 'a suggestion nobody has installed yet shows just its author',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await suggestion(canvas, 'Tokyo Night');

    await expect(row).toHaveTextContent('maya');
    await expect(row.querySelector('.installs')).toBeNull();
  },
};

export const BrowsesAll: StoryObj = {
  ...withSuggestions,
  name: "Browse all opens the site's styles in the Gallery",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', { name: 'Browse all' });

    await expect(link).toHaveAttribute(
      'href',
      'https://gallery.stylebot.dev/s/example.com'
    );
    await expect(link).toHaveAttribute('target', '_blank');
  },
};
