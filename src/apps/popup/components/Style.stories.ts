import type { Meta } from '@storybook/vue';

import Style from './Style.vue';
import {
  popup,
  syncSucceeds,
  profiledStyle,
  style,
} from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Styles',
  component: Style,
  parameters: { padded: false },
};

export default meta;

export const NoStyle = popup();

export const WithStyle = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
});

export const MultipleStyles = popup({
  styles: [
    style('example.com'),
    style('example.com/article', false),
    style('*.example.com'),
  ],
  defaultStyle: style('example.com'),
});

export const StyleDisabled = popup({
  styles: [style('example.com', false)],
  defaultStyle: style('example.com', false),
});

export const WithProfiles = popup({
  styles: [profiledStyle('example.com/article'), profiledStyle('example.com')],
  defaultStyle: profiledStyle('example.com/article'),
});

export const WithProfilesAndSync = popup({
  styles: [profiledStyle('example.com')],
  defaultStyle: profiledStyle('example.com'),
  pageReaderable: false,
  storage: {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': {
      lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  },
  googleDriveSync: syncSucceeds,
});

export const WithStyleAndSync = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  pageReaderable: false,
  commands: { style: 'alt+shift+s' },
  storage: {
    'google-drive-sync-enabled': true,
    'google-drive-sync-state': {
      lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  },
  googleDriveSync: syncSucceeds,
});
