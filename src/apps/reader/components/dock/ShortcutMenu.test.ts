import { mount } from '@vue/test-utils';

jest.mock('../../utils/get-commands');
jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  openShortcutsPage: jest.fn(),
}));

import { openShortcutsPage } from '@stylebot/utils';
import { getCommands } from '../../utils/get-commands';
import { shortcutStore } from './shortcut-store';
import ShortcutMenu from './ShortcutMenu.vue';

const commands = (readability: string) => ({
  readability,
  style: '',
  stylebot: '',
  grayscale: '',
});

describe('ShortcutMenu.vue', () => {
  const mountMenu = (initial: string, dismissible = false) => {
    shortcutStore.state.commands = commands(initial);
    shortcutStore.state.promptDismissed = false;
    return mount(ShortcutMenu, { propsData: { dismissible } });
  };

  beforeEach(() => {
    (getCommands as jest.Mock).mockResolvedValue(commands(''));
    (openShortcutsPage as jest.Mock).mockClear();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(() => Promise.resolve({})),
          set: jest.fn(),
        },
      },
    } as unknown as typeof chrome;
  });

  it('invites setting a shortcut when there is none', () => {
    const wrapper = mountMenu('');

    expect(wrapper.text()).toContain('set_shortcut');
    expect(wrapper.find('.chip').exists()).toBe(false);
  });

  it('shows the current shortcut with a way to change it', () => {
    const wrapper = mountMenu('alt+shift+r');

    expect(wrapper.text()).toContain('modify_shortcut');
    expect(wrapper.find('.chip').exists()).toBe(true);
  });

  it('opens the browser’s shortcuts page and answers the invite', async () => {
    const wrapper = mountMenu('', true);

    await wrapper.find('.change-btn').trigger('click');

    expect(openShortcutsPage).toHaveBeenCalled();
    expect(shortcutStore.state.promptDismissed).toBe(true);
  });

  it('lets the invite be dismissed without going there', async () => {
    const wrapper = mountMenu('', true);

    await wrapper.find('.dismiss').trigger('click');

    expect(openShortcutsPage).not.toHaveBeenCalled();
    expect(shortcutStore.state.promptDismissed).toBe(true);
  });
});
