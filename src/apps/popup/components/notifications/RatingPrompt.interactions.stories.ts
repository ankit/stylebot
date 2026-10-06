import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, waitFor, within } from '@storybook/test';

import RatingPrompt from './RatingPrompt.vue';
import {
  popup,
  ratingEligible,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Popup/RatingPrompt',
  tags: ['test'],
  component: RatingPrompt,
  parameters: { padded: false },
};

export default meta;

const DAY = 24 * 60 * 60 * 1000;

export const ShownWhenEligible: StoryObj = {
  ...popup(ratingEligible()),
  name: 'asks for a rating after 3 saved styles and a week installed',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText('Having fun restyling the web?')
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Rate Stylebot' })
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Not now' })).toBeVisible();
  },
};

export const HiddenWhenTooNew: StoryObj = {
  ...popup(ratingEligible({ 'install-time': Date.now() - 2 * DAY })),
  name: 'does not ask within a week of installing',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('heading', { name: 'example.com' });
    await expect(
      canvas.queryByText('Having fun restyling the web?')
    ).toBeNull();
  },
};

export const HiddenWithFewStyles: StoryObj = {
  ...popup({
    ...ratingEligible(),
    styles: [style('example.com'), style('news.site')],
  }),
  name: 'does not ask with fewer than 3 saved styles',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('heading', { name: 'example.com' });
    await expect(
      canvas.queryByText('Having fun restyling the web?')
    ).toBeNull();
  },
};

export const HiddenOnceDismissed: StoryObj = {
  ...popup(ratingEligible({ 'notification~rating-prompt': true })),
  name: 'does not ask again once answered',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('heading', { name: 'example.com' });
    await expect(
      canvas.queryByText('Having fun restyling the web?')
    ).toBeNull();
  },
};

export const DismissHidesForGood: StoryObj = {
  ...popup(ratingEligible()),
  name: 'Not now hides the prompt and never shows it again',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const create = spyOn(chrome.tabs, 'create');

    await user.click(await canvas.findByRole('button', { name: 'Not now' }));

    await waitFor(() =>
      expect(canvas.queryByText('Having fun restyling the web?')).toBeNull()
    );
    await expect(create).not.toHaveBeenCalled();
    await expect(
      await chrome.storage.local.get('notification~rating-prompt')
    ).toEqual({ 'notification~rating-prompt': true });
  },
};

export const RateOpensStore: StoryObj = {
  ...popup(ratingEligible()),
  name: 'Rate Stylebot opens the store review page and stops asking',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const create = spyOn(chrome.tabs, 'create');
    spyOn(window, 'close').mockImplementation(() => undefined);

    await user.click(
      await canvas.findByRole('button', { name: 'Rate Stylebot' })
    );

    await expect(create).toHaveBeenCalledWith({
      url: 'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha/reviews',
    });
    await waitFor(async () =>
      expect(
        await chrome.storage.local.get('notification~rating-prompt')
      ).toEqual({ 'notification~rating-prompt': true })
    );
  },
};
