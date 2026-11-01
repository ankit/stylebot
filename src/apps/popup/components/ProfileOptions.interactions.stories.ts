import type { Meta, StoryObj } from '@storybook/vue';
import { expect, spyOn, within } from '@storybook/test';

import ProfileOptions from './ProfileOptions.vue';
import {
  optionsStyle,
  popup,
  profiledStyle,
  style,
} from '@stylebot/storybook/fixtures/popup';
import { user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Browser Action/Style Options',
  tags: ['test'],
  component: ProfileOptions,
  parameters: { padded: false },
};

export default meta;

const declared = (fallback = 'system') =>
  [
    '/**',
    ' * ==Stylebot==',
    ` * @option scheme select [system, light, dark] ${fallback}`,
    ' * ==/Stylebot==',
    ' */',
    ':root { color-scheme: light dark; }',
  ].join('\n');

const themed = { ...style('example.com'), css: declared() };

const twoProfiles = {
  ...profiledStyle('example.com'),
  profiles: {
    default: { name: '' },
    dark: { name: 'Late Edition', css: declared('dark') },
  },
  profileOptions: { dark: { scheme: 'light' } },
};

export const SwitchScheme: StoryObj = {
  ...popup({ styles: [themed], defaultStyle: themed }),
  name: "a style that declares a color scheme shows its switch, and picking one saves it for the style's profile",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const group = await canvas.findByRole('group', { name: 'Mode' });
    const segments = within(group);

    await expect(
      segments.getByRole('button', { name: 'System' })
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(segments.getByRole('button', { name: 'Dark' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetStyleOption',
        url: 'example.com',
        profileId: 'default',
        option: 'scheme',
        value: 'dark',
      })
    );
    await expect(
      segments.getByRole('button', { name: 'Dark' })
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const OffHidesSwitch: StoryObj = {
  ...popup({ styles: [themed], defaultStyle: themed }),
  name: 'turning the style off hides its color scheme switch, and turning it on shows it again',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('group', { name: 'Mode' });
    await user.click(canvas.getByRole('checkbox', { name: /^Style/ }));
    await expect(canvas.queryByRole('group', { name: 'Mode' })).toBeNull();

    await user.click(canvas.getByRole('checkbox', { name: /^Style/ }));
    await expect(
      await canvas.findByRole('group', { name: 'Mode' })
    ).toBeVisible();
  },
};

export const NoDeclaration: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
  }),
  name: 'a style without the declaration shows no color scheme switch',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText('example.com');
    await expect(canvas.queryByRole('button', { name: 'System' })).toBeNull();
  },
};

export const PerProfile: StoryObj = {
  ...popup({ styles: [twoProfiles], defaultStyle: twoProfiles }),
  name: 'the switch follows the active profile, showing its stored scheme',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('radio', { name: 'Default' });
    await expect(canvas.queryByRole('button', { name: 'System' })).toBeNull();

    await user.click(canvas.getByRole('radio', { name: 'Late Edition' }));

    const group = await canvas.findByRole('group', { name: 'Mode' });

    await expect(
      within(group).getByRole('button', { name: 'Light' })
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(canvas.getByRole('radio', { name: 'No style' }));
    await expect(canvas.queryByRole('group', { name: 'Mode' })).toBeNull();
  },
};

const optioned = optionsStyle('example.com');

export const PickSelect: StoryObj = {
  ...popup({ styles: [optioned], defaultStyle: optioned }),
  name: "a select shows the author's label and choices, and picking one saves it for the style's profile",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const group = await canvas.findByRole('group', { name: 'Accent' });

    await user.click(within(group).getByRole('button', { name: 'Mauve' }));
    await user.click(await canvas.findByRole('menuitem', { name: 'Blue' }));

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetStyleOption',
        url: 'example.com',
        profileId: 'default',
        option: 'accentColor',
        value: 'blue',
      })
    );
    await expect(
      within(group).getByRole('button', { name: 'Blue' })
    ).toBeVisible();
  },
};

export const ToggleCheckbox: StoryObj = {
  ...popup({ styles: [optioned], defaultStyle: optioned }),
  name: 'a checkbox shows as a switch under its label, and turning it on saves 1',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sendMessage = spyOn(chrome.runtime, 'sendMessage');
    const toggle = await canvas.findByRole('checkbox', {
      name: 'Rounded corners',
    });

    await expect(toggle).not.toBeChecked();
    await user.click(toggle);

    await expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SetStyleOption',
        option: 'rounded',
        value: '1',
      })
    );
    await expect(toggle).toBeChecked();
  },
};

export const OffHidesOptions: StoryObj = {
  ...popup({ styles: [optioned], defaultStyle: optioned }),
  name: 'turning the style off hides all of its options',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole('group', { name: 'Accent' });
    await user.click(canvas.getByRole('checkbox', { name: /^Style/ }));

    await expect(canvas.queryByRole('group', { name: 'Accent' })).toBeNull();
    await expect(
      canvas.queryByRole('checkbox', { name: 'Rounded corners' })
    ).toBeNull();
  },
};
