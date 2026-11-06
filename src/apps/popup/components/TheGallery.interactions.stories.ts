import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import TheGallery from './TheGallery.vue';
import {
  gallerySuggestions,
  popup,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { focusViaTab, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Gallery',
  tags: ['test'],
  component: TheGallery,
  parameters: { padded: false },
};

export default meta;

const withSuggestions = popup({
  gallery: { suggestions: gallerySuggestions },
});

const onAStyledSite = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  gallery: { suggestions: gallerySuggestions },
});

const manyStyles = [
  ...gallerySuggestions,
  { ...gallerySuggestions[0], id: 3, name: 'Solarized' },
  { ...gallerySuggestions[0], id: 4, name: 'Mono' },
];

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

const browse = async (canvas: ReturnType<typeof within>) =>
  user.click(await canvas.findByRole('button', { name: /Styles in Gallery/ }));

export const ListsSuggestions: StoryObj = {
  ...withSuggestions,
  name: "lists the site's popular Gallery styles with their installs, and their author and exact installs in a tooltip",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Styles in Gallery');
    const row = await suggestion(canvas, 'Tokyo Night');
    await expect(row).toHaveTextContent(/Tokyo Night\s*1\.2K/);
    await expect(row).not.toHaveTextContent('maya');

    focusViaTab(row, '.pick');
    await expect(await canvas.findByRole('tooltip')).toHaveTextContent(
      'by maya · 1,240 installs'
    );
  },
};

export const Previews: StoryObj = {
  ...withSuggestions,
  name: 'clicking a suggestion previews it on the tab, hiding the footer',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await step('preview', async () => {
      await preview(canvas, 'Tokyo Night');

      await expect(await pickButton(canvas, 'Tokyo Night')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      const pick = await pickButton(canvas, 'Tokyo Night');

      await user.unhover(pick);
      pick.blur();
      await expect(await canvas.findByText('Stop')).toBeVisible();
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
  },
};

export const StopEndsThePreview: StoryObj = {
  ...withSuggestions,
  name: 'the previewing style always shows Stop, and clicking it ends the preview and brings the footer back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await preview(canvas, 'Paper');
    await waitFor(() =>
      expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PreviewGalleryStyle' })
      )
    );

    const pick = await pickButton(canvas, 'Paper');

    await user.hover(pick);
    await expect(await canvas.findByText('Stop')).toBeVisible();

    await user.click(pick);
    await waitFor(() =>
      expect(sent).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'EndGalleryPreview' })
      )
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
    await expect(
      canvas.queryByRole('button', { name: /Style this page/ })
    ).toBeNull();
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

export const BrowsesOnAStyledSite: StoryObj = {
  ...onAStyledSite,
  name: 'a styled site shows one row with how many styles there are to try, which lists them in place of the popup',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await canvas.findByRole('button', {
      name: /Styles in Gallery/,
    });

    await expect(row).toHaveTextContent(/Styles in Gallery\s*2/);
    await expect(canvas.queryByText('Tokyo Night')).toBeNull();

    await user.click(row);

    await expect(await canvas.findByText('Tokyo Night')).toBeVisible();
    await expect(canvas.getByText('Paper')).toBeVisible();
    await expect(canvas.queryByText('Create profile')).not.toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open Gallery' })
    ).toHaveAttribute('href', 'https://gallery.stylebot.dev/site/example.com');
  },
};

export const HidesWithNothingToTry: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: { suggestions: [] },
  }),
  name: 'a styled site with no style left to try shows no Gallery row',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('Create profile');
    await expect(canvas.queryByText('Styles in Gallery')).toBeNull();
  },
};

export const BackStopsThePreview: StoryObj = {
  ...onAStyledSite,
  name: 'Back ends a preview, and returns to the popup',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sent = spyOn(chrome.runtime, 'sendMessage');

    await browse(canvas);
    await preview(canvas, 'Paper');

    const back = canvas.getByRole('button', { name: 'Back' });

    await waitFor(() => expect(back).toBeEnabled());
    await user.click(back);

    await waitFor(() =>
      expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'EndGalleryPreview' })
      )
    );
    await expect(await canvas.findByText('Create profile')).toBeVisible();
  },
};

export const ReopensOnThePreview: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
    gallery: {
      suggestions: gallerySuggestions,
      previewing: gallerySuggestions[1],
    },
  }),
  name: 'reopened during a preview on a styled site, it opens on the list with that style picked',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('button', { name: 'Back' })
    ).toBeVisible();
    await waitFor(async () =>
      expect(await pickButton(canvas, 'Paper')).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
  },
};

export const ShowsAtMostThree: StoryObj = {
  ...popup({
    gallery: {
      suggestions: manyStyles,
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
  ...popup({ gallery: { suggestions: manyStyles } }),
  name: 'Browse all shows how many styles there are to try, and lists them all',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await canvas.findByRole('button', { name: /Browse all/ });

    await expect(row).toHaveTextContent(/Browse all\s*4/);

    await user.click(row);

    await expect(await canvas.findByText('Mono')).toBeVisible();
    await expect(canvasElement.querySelectorAll('.suggestion')).toHaveLength(4);

    await user.click(canvas.getByRole('button', { name: 'Back' }));

    await expect(await canvas.findByText(/Browse all/)).toBeVisible();
    await expect(canvas.queryByText('Mono')).toBeNull();
  },
};
