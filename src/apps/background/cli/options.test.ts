const dedent = require('dedent');

import type { StyleMap } from '@stylebot/types';

import { applyStylesToAllTabs, getAll, setStyleOption } from '../styles';
import { optionCommands } from './options';

jest.mock('../styles', () => ({
  getAll: jest.fn(),
  setStyleOption: jest.fn(),
  applyStylesToAllTabs: jest.fn(),
}));

const declared = dedent`
  /**
   * ==Stylebot==
   * @option scheme select [system, light, dark] system
   * ==/Stylebot==
   */
  a { color: light-dark(black, white); }
`;

const styles: StyleMap = {
  'example.com': {
    css: declared,
    enabled: true,
    readability: false,
    modifiedTime: '',
    activeProfile: 'default',
    profiles: {
      default: { name: '' },
      plain: { name: 'Plain', css: 'a { color: red; }' },
    },
    profileOptions: { default: { scheme: 'dark' } },
  },
};

describe('optionCommands', () => {
  beforeEach(() => {
    jest.mocked(getAll).mockResolvedValue(styles);
    jest.mocked(setStyleOption).mockClear();
    jest.mocked(applyStylesToAllTabs).mockClear();
  });

  it("lists the profile in use's options with their values", async () => {
    expect(await optionCommands.options({ target: 'example.com' })).toEqual({
      url: 'example.com',
      profileId: 'default',
      options: [
        {
          name: 'scheme',
          values: ['system', 'light', 'dark'],
          default: 'system',
          value: 'dark',
        },
      ],
    });
  });

  it('lists nothing for a profile that declares no options', async () => {
    const result = await optionCommands.options({
      target: 'example.com',
      profile: 'Plain',
    });

    expect(result).toMatchObject({ profileId: 'plain', options: [] });
  });

  it('sets a value and applies it to open tabs', async () => {
    await optionCommands.setOption({
      target: 'example.com',
      option: 'scheme',
      value: 'light',
    });

    expect(setStyleOption).toHaveBeenCalledWith(
      'example.com',
      'default',
      'scheme',
      'light'
    );
    expect(applyStylesToAllTabs).toHaveBeenCalled();
  });

  it('refuses a value the option does not take', async () => {
    await expect(
      optionCommands.setOption({
        target: 'example.com',
        option: 'scheme',
        value: 'sepia',
      })
    ).rejects.toThrow('scheme takes one of system, light, dark, not sepia');
    expect(setStyleOption).not.toHaveBeenCalled();
  });

  it("refuses an option the profile doesn't declare", async () => {
    await expect(
      optionCommands.setOption({
        target: 'example.com',
        profile: 'Plain',
        option: 'scheme',
        value: 'dark',
      })
    ).rejects.toThrow("The profile doesn't declare a scheme option");
  });

  it('needs the site named', async () => {
    await expect(
      optionCommands.setOption({ option: 'scheme', value: 'dark' })
    ).rejects.toThrow('Name the site or tab');
  });
});
