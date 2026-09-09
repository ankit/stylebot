import { mount } from '@vue/test-utils';

jest.mock('../../../utils/get-commands');
jest.mock('../../../utils/set-commands');

import { getCommands } from '../../../utils/get-commands';
import { setCommands } from '../../../utils/set-commands';
import { shortcutStore } from '../shortcut-store';
import ShortcutMenu from '../ShortcutMenu.vue';

const commands = (readability: string) => ({
  readability,
  style: '',
  stylebot: '',
  grayscale: '',
});

describe('ShortcutMenu.vue', () => {
  const mountMenu = (initial: string) => {
    shortcutStore.state.commands = commands(initial);
    return mount(ShortcutMenu);
  };

  beforeEach(() => {
    shortcutStore.state.recording = false;
    (getCommands as jest.Mock).mockResolvedValue(commands(''));
    (setCommands as jest.Mock).mockClear();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((_key, callback) => callback({})),
          set: jest.fn(),
        },
      },
    } as unknown as typeof chrome;
  });

  it('shows the invite to record a shortcut when unset', () => {
    const wrapper = mountMenu('');

    expect(wrapper.text()).toContain('record_shortcut');
    expect(wrapper.text()).not.toContain('change_shortcut');
  });

  it('shows the current shortcut with Change/Remove when set', () => {
    const wrapper = mountMenu('alt+shift+r');

    expect(wrapper.text()).toContain('change_shortcut');
    expect(wrapper.text()).toContain('remove');
  });

  it('clicking "Record a shortcut" starts recording', async () => {
    const wrapper = mountMenu('');

    await wrapper.find('.record-btn').trigger('click');

    expect(shortcutStore.state.recording).toBe(true);
    expect(wrapper.text()).toContain('press_key_to_finish');
  });

  it('capturing a key combo persists it and stops recording', async () => {
    const wrapper = mountMenu('alt+shift+r');

    await wrapper.findAll('.row').at(0).trigger('click'); // "change_shortcut"
    expect(shortcutStore.state.recording).toBe(true);

    wrapper.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 't', code: 'KeyT', ctrlKey: true, shiftKey: true })
    );
    await wrapper.vm.$nextTick();

    expect(setCommands).toHaveBeenCalledWith(
      expect.objectContaining({ readability: 'ctrl+shift+t' })
    );
    expect(shortcutStore.state.recording).toBe(false);
  });

  it('Escape cancels recording without persisting', async () => {
    const wrapper = mountMenu('');

    await wrapper.find('.record-btn').trigger('click');
    wrapper.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(shortcutStore.state.recording).toBe(false);
    expect(setCommands).not.toHaveBeenCalled();
  });

  it('clicking Remove clears the shortcut', async () => {
    const wrapper = mountMenu('alt+shift+r');

    await wrapper.find('.row.danger').trigger('click');

    expect(setCommands).toHaveBeenCalledWith(expect.objectContaining({ readability: '' }));
  });
});
