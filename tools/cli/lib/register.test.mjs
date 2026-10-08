const NODE = process.execPath;

/**
 * Loads register.mjs as it runs on a platform, with a home folder in which
 * only the given paths exist, and returns it with the mocks it wrote through.
 */
const load = async (
  platform,
  { home, cwd, existing = [], dirs = [], contents = {} }
) => {
  const fs = {
    existsSync: jest.fn(file => existing.includes(file) || file in contents),
    readFileSync: jest.fn(file => contents[file]),
    readdirSync: jest.fn(dir => {
      if (Array.isArray(dirs)) {
        return dirs;
      }

      if (!(dir in dirs)) {
        throw new Error(`ENOENT: ${dir}`);
      }

      return dirs[dir];
    }),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
  const childProcess = { execFileSync: jest.fn() };
  let register;

  jest.spyOn(process, 'cwd').mockReturnValue(cwd);
  jest.doMock('node:fs', () => fs);
  jest.doMock('node:child_process', () => childProcess);
  jest.doMock('node:os', () => ({
    platform: () => platform,
    homedir: () => home,
    userInfo: () => ({ username: 'ankit' }),
  }));

  jest.isolateModules(() => {
    register = require('./register.mjs');
  });

  /**
   * What was written to a file, by path.
   */
  const written = file =>
    fs.writeFileSync.mock.calls.find(([path]) => path === file)?.[1];

  return { ...register, fs, childProcess, written };
};

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.LOCALAPPDATA;
});

describe('registerHost on macOS', () => {
  const home = '/Users/ankit';
  const support = `${home}/Library/Application Support`;

  it('registers with the dev profiles and each installed browser', async () => {
    const { registerHost, written } = await load('darwin', {
      home,
      cwd: '/code/stylebot/tools',
      existing: [
        '/code/stylebot/src/assets/manifest/manifest-dev.json',
        `${support}/Google/Chrome/Local State`,
        `${support}/BraveSoftware/Brave-Browser/Local State`,
        `${support}/Arc/User Data/Local State`,
      ],
      dirs: ['.edge-dev-profile', 'src', '.chrome-dev-profile-test'],
    });

    expect(registerHost()).toEqual([
      {
        browser: 'Dev profile',
        location: '/code/stylebot/.edge-dev-profile/NativeMessagingHosts',
      },
      {
        browser: 'Dev profile',
        location:
          '/code/stylebot/.chrome-dev-profile-test/NativeMessagingHosts',
      },
      {
        browser: 'Dev profile',
        location: '/code/stylebot/.chrome-dev-profile/NativeMessagingHosts',
      },
      {
        browser: 'Chrome',
        location: `${support}/Google/Chrome/NativeMessagingHosts`,
      },
      {
        browser: 'Brave',
        location: `${support}/Google/Chrome/NativeMessagingHosts`,
      },
      {
        browser: 'Arc',
        location: `${support}/Arc/User Data/NativeMessagingHosts`,
      },
    ]);

    expect(written(`${home}/.stylebot/native-host`)).toBe(
      `#!/bin/sh\nexec "${NODE}" "${home}/.stylebot/host/host.mjs"\n`
    );
    expect(
      JSON.parse(
        written(
          `${support}/Google/Chrome/NativeMessagingHosts/dev.stylebot.cli.json`
        )
      )
    ).toEqual({
      name: 'dev.stylebot.cli',
      description: 'Stylebot CLI',
      path: `${home}/.stylebot/native-host`,
      type: 'stdio',
      allowed_origins: [
        'chrome-extension://oiaejidbmkiecgbjeifoejpgmdaleoha/',
        'chrome-extension://mjolbpfednnbebfapicajpifliopnnai/',
      ],
    });
  });

  it('registers with no dev profiles outside a checkout', async () => {
    const { registerHost, fs } = await load('darwin', {
      home,
      cwd: '/tmp',
      existing: [`${support}/Microsoft Edge/Local State`],
    });

    expect(registerHost()).toEqual([
      {
        browser: 'Edge',
        location: `${support}/Microsoft Edge/NativeMessagingHosts`,
      },
    ]);
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  it('skips a browser that has never run, whose folder holds only our manifest', async () => {
    const { registerHost } = await load('darwin', {
      home,
      cwd: '/tmp',
      existing: [
        `${support}/Microsoft Edge/Local State`,
        `${support}/Vivaldi`,
        `${support}/Vivaldi/NativeMessagingHosts`,
      ],
    });

    expect(registerHost().map(({ browser }) => browser)).toEqual(['Edge']);
  });
});

describe('registerHost on Linux', () => {
  it("registers in each installed browser's config folder", async () => {
    const home = '/home/ankit';
    const { registerHost, written } = await load('linux', {
      home,
      cwd: '/tmp',
      existing: [
        `${home}/.config/google-chrome/Local State`,
        `${home}/.config/microsoft-edge/Local State`,
        `${home}/.config/BraveSoftware/Brave-Browser/Local State`,
        `${home}/.config/chromium/Local State`,
        `${home}/.config/vivaldi/Local State`,
        `${home}/Library/Application Support/Arc/User Data/Local State`,
      ],
    });

    expect(registerHost()).toEqual(
      [
        ['Chrome', 'google-chrome'],
        ['Edge', 'microsoft-edge'],
        ['Brave', 'BraveSoftware/Brave-Browser'],
        ['Chromium', 'chromium'],
        ['Vivaldi', 'vivaldi'],
      ].map(([browser, dir]) => ({
        browser,
        location: `${home}/.config/${dir}/NativeMessagingHosts`,
      }))
    );
    expect(written(`${home}/.stylebot/native-host`)).toContain('#!/bin/sh');
  });
});

describe('registerHost on Windows', () => {
  const home = 'C:\\Users\\ankit';
  const local = `${home}\\AppData\\Local`;
  const manifest = `${home}\\.stylebot\\dev.stylebot.cli.json`;

  it('writes one manifest and the registry keys the installed browsers read', async () => {
    process.env.LOCALAPPDATA = local;

    const { registerHost, written, childProcess, fs } = await load('win32', {
      home,
      cwd: 'C:\\code\\stylebot',
      existing: [
        'C:\\code\\stylebot\\src\\assets\\manifest\\manifest-dev.json',
        `${local}\\Google\\Chrome\\User Data\\Local State`,
        `${local}\\Microsoft\\Edge\\User Data\\Local State`,
        `${local}\\BraveSoftware\\Brave-Browser\\User Data\\Local State`,
      ],
    });
    const key = browser =>
      `HKCU\\Software\\${browser}\\NativeMessagingHosts\\dev.stylebot.cli`;

    expect(registerHost()).toEqual([
      { browser: 'Chrome', location: key('Google\\Chrome') },
      { browser: 'Edge', location: key('Microsoft\\Edge') },
      { browser: 'Brave', location: key('Google\\Chrome') },
    ]);

    expect(
      childProcess.execFileSync.mock.calls.map(([, args]) => args)
    ).toEqual(
      ['Google\\Chrome', 'Microsoft\\Edge'].map(browser => [
        'add',
        key(browser),
        '/ve',
        '/d',
        manifest,
        '/f',
      ])
    );
    expect(written(`${home}\\.stylebot\\native-host.cmd`)).toBe(
      `@echo off\r\n"${NODE}" "${home}\\.stylebot\\host\\host.mjs"\r\n`
    );
    expect(JSON.parse(written(manifest)).path).toBe(
      `${home}\\.stylebot\\native-host.cmd`
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  it('finds browsers under AppData without LOCALAPPDATA', async () => {
    const { registerHost } = await load('win32', {
      home,
      cwd: home,
      existing: [`${local}\\Vivaldi\\User Data\\Local State`],
    });

    expect(registerHost()).toEqual([
      {
        browser: 'Vivaldi',
        location:
          'HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\dev.stylebot.cli',
      },
    ]);
  });
});

describe('isHostRegistered', () => {
  const home = '/Users/ankit';
  const launcher = `${home}/.stylebot/native-host`;
  const chrome = `${home}/Library/Application Support/Google/Chrome`;
  const manifest = `${chrome}/NativeMessagingHosts/dev.stylebot.cli.json`;

  it('is true with the launcher and a browser manifest', async () => {
    const { isHostRegistered } = await load('darwin', {
      home,
      cwd: '/tmp',
      existing: [launcher, `${chrome}/Local State`, manifest],
    });

    expect(isHostRegistered()).toBe(true);
  });

  it('is false without a manifest where install writes one', async () => {
    const { isHostRegistered } = await load('darwin', {
      home,
      cwd: '/tmp',
      existing: [launcher, `${chrome}/Local State`],
    });

    expect(isHostRegistered()).toBe(false);
  });

  it('is false without the launcher', async () => {
    const { isHostRegistered } = await load('darwin', {
      home,
      cwd: '/tmp',
      existing: [`${chrome}/Local State`, manifest],
    });

    expect(isHostRegistered()).toBe(false);
  });

  it("reads Windows' manifest from ~/.stylebot", async () => {
    const userProfile = 'C:\\Users\\ankit';
    const { isHostRegistered } = await load('win32', {
      home: userProfile,
      cwd: 'C:\\',
      existing: [
        `${userProfile}\\.stylebot\\native-host.cmd`,
        `${userProfile}\\.stylebot\\dev.stylebot.cli.json`,
      ],
    });

    expect(isHostRegistered()).toBe(true);
  });
});

describe('launcherNode', () => {
  it('reads the node the launcher is pinned to', async () => {
    const home = '/Users/ankit';
    const { launcherNode } = await load('darwin', {
      home,
      cwd: '/tmp',
      contents: {
        [`${home}/.stylebot/native-host`]: `#!/bin/sh\nexec "/nvm/node" "${home}/.stylebot/host/host.mjs"\n`,
      },
    });

    expect(launcherNode()).toBe('/nvm/node');
  });

  it('is undefined without a launcher', async () => {
    const { launcherNode } = await load('darwin', {
      home: '/Users/ankit',
      cwd: '/tmp',
    });

    expect(launcherNode()).toBeUndefined();
  });
});

describe('supportedBrowsers', () => {
  it('names the browsers supported on the platform', async () => {
    const { supportedBrowsers } = await load('win32', {
      home: 'C:\\Users\\ankit',
      cwd: 'C:\\',
    });

    expect(supportedBrowsers()).toEqual([
      'Chrome',
      'Edge',
      'Brave',
      'Chromium',
      'Vivaldi',
    ]);
  });
});

describe('findStylebot', () => {
  const home = '/Users/ankit';
  const support = `${home}/Library/Application Support`;
  const chrome = `${support}/Google/Chrome`;
  const edge = `${support}/Microsoft Edge`;
  const checkout = '/code/stylebot';
  const dev = `${checkout}/.chrome-dev-profile`;
  const settings = id =>
    JSON.stringify({ extensions: { settings: { [id]: {} } } });

  /**
   * Loads register.mjs with Chrome and Edge installed, each with the given
   * profile folders and files.
   */
  const find = async ({ dirs, existing = [], contents = {}, cwd = '/tmp' }) => {
    const { findStylebot } = await load('darwin', {
      home,
      cwd,
      existing: [
        `${chrome}/Local State`,
        `${edge}/Local State`,
        `${checkout}/src/assets/manifest/manifest-dev.json`,
        ...existing,
      ],
      dirs: { [checkout]: [], ...dirs },
      contents,
    });

    return findStylebot();
  };

  it('finds a store install in a profile', async () => {
    expect(
      await find({
        dirs: { [chrome]: ['Profile 3', 'Local State'], [edge]: ['Default'] },
        existing: [
          `${chrome}/Profile 3/Preferences`,
          `${chrome}/Profile 3/Extensions/oiaejidbmkiecgbjeifoejpgmdaleoha`,
          `${edge}/Default/Preferences`,
        ],
      })
    ).toEqual(['Chrome']);
  });

  it("finds an unpacked install in a dev profile's preferences", async () => {
    expect(
      await find({
        cwd: checkout,
        dirs: { [chrome]: [], [edge]: [], [dev]: ['Default'] },
        contents: {
          [`${dev}/Default/Preferences`]: '{}',
          [`${dev}/Default/Secure Preferences`]: settings(
            'oiaejidbmkiecgbjeifoejpgmdaleoha'
          ),
        },
      })
    ).toEqual(['Dev profile']);
  });

  it("finds Edge's store install in its preferences", async () => {
    expect(
      await find({
        dirs: { [chrome]: [], [edge]: ['Default'] },
        contents: {
          [`${edge}/Default/Preferences`]: settings(
            'mjolbpfednnbebfapicajpifliopnnai'
          ),
        },
      })
    ).toEqual(['Edge']);
  });

  it('finds none when profiles lack it', async () => {
    expect(
      await find({
        dirs: { [chrome]: ['Default'], [edge]: [] },
        contents: { [`${chrome}/Default/Preferences`]: 'not json' },
      })
    ).toEqual([]);
  });

  it('is undefined with no profile to look in', async () => {
    expect(await find({ dirs: { [chrome]: ['Crashpad'] } })).toBeUndefined();
  });
});

describe('SOCKET_PATH', () => {
  afterEach(() => delete process.env.STYLEBOT_SOCKET);

  /**
   * The socket path paths.mjs settles on for a platform.
   */
  const socketPath = async (platform, home = 'C:\\Users\\ankit') => {
    let paths;

    await load(platform, { home, cwd: '/' });
    jest.isolateModules(() => {
      paths = require('./paths.mjs');
    });

    return paths.SOCKET_PATH;
  };

  it('is a named pipe for the user on Windows', async () => {
    expect(await socketPath('win32')).toBe('\\\\.\\pipe\\stylebot-cli-ankit');
  });

  it('is a socket in ~/.stylebot elsewhere', async () => {
    expect(await socketPath('linux', '/home/ankit')).toBe(
      '/home/ankit/.stylebot/cli.sock'
    );
  });

  it('names a pipe after a socket path given on Windows', async () => {
    process.env.STYLEBOT_SOCKET = 'C:\\Users\\ankit\\.stylebot\\test.sock';
    expect(await socketPath('win32')).toBe('\\\\.\\pipe\\stylebot-test.sock');
  });

  it('keeps a pipe given on Windows', async () => {
    process.env.STYLEBOT_SOCKET = '\\\\.\\pipe\\mine';
    expect(await socketPath('win32')).toBe('\\\\.\\pipe\\mine');
  });
});
