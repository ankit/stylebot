import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheGallerySuggestions from './TheGallerySuggestions.vue';
import {
  gallerySuggestions,
  popup,
  profiledStyle,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { focusViaTab, user } from '@stylebot/storybook/story-helpers';

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

const pickButton = async (
  canvas: ReturnType<typeof within>,
  name: string
): Promise<HTMLElement> =>
  (await suggestion(canvas, name)).querySelector('.pick') as HTMLElement;

const preview = async (canvas: ReturnType<typeof within>, name: string) =>
  user.click(await pickButton(canvas, name));

export const ListsSuggestions: StoryObj = {
  ...withSuggestions,
  name: "lists the site's popular Gallery styles with their installs, and their author and exact installs in a tooltip",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Gallery');
    const row = await suggestion(canvas, 'Tokyo Night');
    await expect(row).toHaveTextContent(/Tokyo Night\s*1\.2K/);
    await expect(row).not.toHaveTextContent('maya');

    focusViaTab(row, '.pick');
    await expect(await canvas.findByRole('tooltip')).toHaveTextContent(
      'by maya · 1,240 installs'
    );
  },
};

export const PreviewsThenInstalls: StoryObj = {
  ...withSuggestions,
  name: 'clicking a suggestion previews it on the tab, keeping its row with Install, which adds it as a profile',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await step('preview', async () => {
      await preview(canvas, 'Tokyo Night');

      await expect(await pickButton(canvas, 'Tokyo Night')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(
        (await suggestion(canvas, 'Tokyo Night')).querySelector('.installs')
      ).toBeNull();
      await expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PreviewGalleryStyle',
          id: 1,
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
        expect(canvas.queryByRole('button', { name: 'Install' })).toBeNull()
      );
    });
  },
};

export const StopEndsThePreview: StoryObj = {
  ...withSuggestions,
  name: 'Stop preview on the previewing row ends the preview',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await preview(canvas, 'Paper');
    await user.click(
      await canvas.findByRole('button', { name: 'Stop preview' })
    );

    await expect(sent).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'EndGalleryPreview' })
    );
    await expect(await pickButton(canvas, 'Paper')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
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

    await waitFor(async () =>
      expect(await pickButton(canvas, 'Paper')).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
    await expect(canvas.getByRole('button', { name: 'Install' })).toBeVisible();
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
  name: 'a suggestion nobody has installed yet shows just its name',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await suggestion(canvas, 'Tokyo Night');

    await expect(row.textContent?.trim()).toBe('Tokyo Night');
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
      'https://gallery.stylebot.dev/site/example.com'
    );
    await expect(link).toHaveAttribute('target', '_blank');
  },
};
