import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheGallerySuggestions from './TheGallerySuggestions.vue';
import {
  gallerySuggestions,
  popup,
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
  gallery: { suggestions: gallerySuggestions, total: 14 },
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
  name: 'clicking a suggestion previews it on the tab, swapping the footer for Stop preview and Install, which adds it as a profile',
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
      ).toHaveTextContent('1.2K');
      await expect(
        canvas.getByRole('button', { name: 'Stop preview' })
      ).toBeVisible();
      await expect(
        canvas.queryByRole('button', { name: /Style this page/ })
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
  name: 'Stop preview in the footer ends the preview and brings the footer back',
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
    await expect(
      await canvas.findByRole('button', { name: /Style this page/ })
    ).toBeVisible();
  },
};

export const ShowsTheTabsPreview: StoryObj = {
  ...popup({
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

export const OpensTheGallery: StoryObj = {
  ...popup({ gallery: { suggestions: gallerySuggestions } }),
  name: 'with every style of the site listed, the link just opens the Gallery',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', { name: 'Open Gallery' });

    await expect(link).toHaveAttribute(
      'href',
      'https://gallery.stylebot.dev/site/example.com'
    );
    await expect(canvas.queryByText(/Browse all/)).toBeNull();
  },
};

export const LinksOnAStyledSite: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: { suggestions: gallerySuggestions, total: 14 },
  }),
  name: "a styled site shows just a link to the site's Gallery styles, with how many there are, in its own section",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', {
      name: /Styles in Gallery/,
    });

    await expect(link).toHaveTextContent(/Styles in Gallery\s*14/);
    await expect(link).toHaveAttribute(
      'href',
      'https://gallery.stylebot.dev/site/example.com'
    );
    await expect(canvas.queryByText('Tokyo Night')).toBeNull();
  },
};

export const ShowsAtMostThree: StoryObj = {
  ...popup({
    gallery: {
      suggestions: [
        ...gallerySuggestions,
        { ...gallerySuggestions[0], id: 3, name: 'Solarized' },
        { ...gallerySuggestions[0], id: 4, name: 'Mono' },
      ],
    },
  }),
  name: "lists at most three of the site's Gallery styles",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await suggestion(canvas, 'Solarized');
    await expect(canvasElement.querySelectorAll('.suggestion')).toHaveLength(3);
    await expect(canvas.queryByText('Mono')).toBeNull();
  },
};

export const LeavesOutNoInstalls: StoryObj = {
  ...popup({
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
  name: 'Browse all shows how many styles the site has, and opens them in the Gallery',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', { name: /Browse all/ });

    await expect(link).toHaveTextContent(/Browse all\s*14/);

    await expect(link).toHaveAttribute(
      'href',
      'https://gallery.stylebot.dev/site/example.com'
    );
    await expect(link).toHaveAttribute('target', '_blank');
  },
};
