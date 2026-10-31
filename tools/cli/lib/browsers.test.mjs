const HOME = '/Users/ankit';
const SOCKETS = `${HOME}/.stylebot/browsers`;

const chrome = {
  name: 'Chrome',
  instance: 'k3f9',
  page: { title: 'Hacker News', url: 'https://news.ycombinator.com/' },
};
const edge = { name: 'Edge', instance: 'a1b2' };

/**
 * Loads browsers.mjs on a platform, with only the given folders and files,
 * and each socket's host answering with a browser or failing with a code.
 */
const load = ({
  platform = 'darwin',
  dirs = {},
  existing = [],
  hosts = {},
}) => {
  let browsers;

  jest.doMock('node:os', () => ({
    platform: () => platform,
    homedir: () => HOME,
    userInfo: () => ({ username: 'ankit' }),
  }));
  jest.doMock('node:fs', () => ({
    existsSync: file => existing.includes(file),
    readdirSync: dir => {
      if (!(dir in dirs)) {
        throw new Error(`ENOENT: ${dir}`);
      }

      return dirs[dir];
    },
    rmSync: jest.fn(),
  }));
  jest.doMock('./socket.mjs', () => ({
    sendToHost: async socket => {
      const host = hosts[socket];

      if (typeof host === 'string') {
        throw Object.assign(new Error(host), { code: host });
      }

      return { protocol: 1, version: '4.0.0', result: host };
    },
  }));

  jest.isolateModules(() => {
    browsers = require('./browsers.mjs');
  });

  return browsers;
};

afterEach(() => {
  jest.resetModules();
  delete process.env.STYLEBOT_SOCKET;
});

describe('findSockets', () => {
  it("finds each host's socket and the shared one", () => {
    const { findSockets } = load({
      dirs: { [SOCKETS]: ['12.sock', '34.sock', '.DS_Store'] },
      existing: [`${HOME}/.stylebot/cli.sock`],
    });

    expect(findSockets()).toEqual([
      `${SOCKETS}/12.sock`,
      `${SOCKETS}/34.sock`,
      `${HOME}/.stylebot/cli.sock`,
    ]);
  });

  it("finds the user's pipes on Windows", () => {
    const { findSockets } = load({
      platform: 'win32',
      dirs: {
        '\\\\.\\pipe\\': [
          'stylebot-browser-12-ankit',
          'stylebot-browser-34-someone',
          'stylebot-cli-ankit',
          'mojo.123',
        ],
      },
    });

    expect(findSockets()).toEqual([
      '\\\\.\\pipe\\stylebot-browser-12-ankit',
      '\\\\.\\pipe\\stylebot-cli-ankit',
    ]);
  });

  it('uses only the socket given', () => {
    process.env.STYLEBOT_SOCKET = `${HOME}/.stylebot/test.sock`;
    const { findSockets } = load({ dirs: { [SOCKETS]: ['12.sock'] } });

    expect(findSockets()).toEqual([`${HOME}/.stylebot/test.sock`]);
  });
});

describe('addBrowserKeys', () => {
  it('names a browser by its name, or with its instance when shared', () => {
    const { addBrowserKeys } = load({});
    const other = { name: 'Chrome', instance: 'zz99' };

    expect(addBrowserKeys([chrome, edge, other]).map(({ key }) => key)).toEqual(
      ['chrome-k3f9', 'edge', 'chrome-zz99']
    );
  });
});

describe('findBrowser', () => {
  it('finds a browser by its key or its full name, in any case', () => {
    const { findBrowser, addBrowserKeys } = load({});
    const browsers = addBrowserKeys([chrome, edge]);

    expect(findBrowser(browsers, 'Edge')?.name).toBe('Edge');
    expect(findBrowser(browsers, 'chrome-k3f9')?.name).toBe('Chrome');
    expect(findBrowser(browsers, 'brave')).toBeUndefined();
  });
});

describe('describeBrowsers', () => {
  it('lines up each key with its browser and page', () => {
    const { describeBrowsers, addBrowserKeys } = load({});

    expect(describeBrowsers(addBrowserKeys([chrome, edge]))).toEqual([
      '  chrome  Chrome, showing Hacker News (news.ycombinator.com)',
      '  edge    Edge',
    ]);
  });
});

describe('chooseSocket', () => {
  const hosts = {
    [`${SOCKETS}/12.sock`]: chrome,
    [`${SOCKETS}/34.sock`]: edge,
  };
  const dirs = { [SOCKETS]: ['12.sock', '34.sock'] };

  it('uses the only socket without asking which browser it is', async () => {
    const { chooseSocket } = load({
      dirs: { [SOCKETS]: ['12.sock'] },
      hosts: { [`${SOCKETS}/12.sock`]: 'ECONNREFUSED' },
    });

    expect(await chooseSocket()).toBe(`${SOCKETS}/12.sock`);
  });

  it('uses the browser named', async () => {
    const { chooseSocket, useBrowser } = load({ dirs, hosts });
    useBrowser('edge');

    expect(await chooseSocket()).toBe(`${SOCKETS}/34.sock`);
  });

  it('refuses a browser not running Stylebot, listing those that are', async () => {
    const { chooseSocket, useBrowser } = load({ dirs, hosts });
    useBrowser('brave');

    await expect(chooseSocket()).rejects.toThrow(
      `Stylebot isn't running in a browser named "brave". Name one with --browser:\n  chrome  Chrome, showing Hacker News (news.ycombinator.com)\n  edge    Edge`
    );
  });

  it('asks for the profile when several of one browser run Stylebot', async () => {
    const { chooseSocket, useBrowser } = load({
      dirs: { [SOCKETS]: ['12.sock', '34.sock'] },
      hosts: {
        [`${SOCKETS}/12.sock`]: chrome,
        [`${SOCKETS}/34.sock`]: { name: 'Chrome', instance: 'zz99' },
      },
    });
    useBrowser('chrome');

    await expect(chooseSocket()).rejects.toThrow(
      /^Stylebot is running in more than one Chrome. Name one with --browser:\n {2}chrome-k3f9/
    );
  });

  it('lists the browsers to name when not on a terminal', async () => {
    const { chooseSocket } = load({ dirs, hosts });

    await expect(chooseSocket()).rejects.toThrow(
      /^Stylebot is running in 2 browsers. Name the one to use with --browser:\n {2}chrome/
    );
  });

  it('skips a socket left by a host that crashed', async () => {
    const { chooseSocket } = load({
      dirs,
      hosts: { ...hosts, [`${SOCKETS}/34.sock`]: 'ECONNREFUSED' },
    });

    expect(await chooseSocket()).toBe(`${SOCKETS}/12.sock`);
  });

  it('says no host listens when none is left', async () => {
    const { chooseSocket } = load({ dirs: { [SOCKETS]: [] } });

    await expect(chooseSocket()).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
