const HOME = '/Users/ankit';

/**
 * Loads diagnose.mjs with the host registered or not, and only the given
 * files existing.
 */
const load = ({ registered = true, existing = [] } = {}) => {
  let diagnose;

  jest.doMock('node:os', () => ({
    platform: () => 'darwin',
    homedir: () => HOME,
    userInfo: () => ({ username: 'ankit' }),
  }));
  jest.doMock('node:fs', () => ({
    existsSync: file => existing.includes(file),
  }));
  jest.doMock('./register.mjs', () => ({
    isHostRegistered: () => registered,
  }));

  jest.isolateModules(() => {
    diagnose = require('./diagnose.mjs');
  });

  return diagnose.diagnoseConnection;
};

afterEach(() => {
  jest.resetModules();
  delete process.env.STYLEBOT_SOCKET;
});

describe('diagnoseConnection', () => {
  it('asks to install when no browser has the host registered', () => {
    expect(load({ registered: false })({ code: 'ENOENT' })).toBe(
      'Stylebot is not set up for this computer. Run `stylebot install`.'
    );
  });

  it('asks to restart the browser after repinning the launcher', () => {
    expect(load()({ code: 'ENOENT', repinned: true })).toMatch(
      /Restart the browser/
    );
  });

  it('asks to turn on the setting when the host has never started', () => {
    expect(load()({ code: 'ENOENT' })).toBe(
      'Stylebot is not connected. Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings — stylebot.dev/cli'
    );
  });

  it('asks to open the browser when the host has started before', () => {
    const diagnose = load({ existing: [`${HOME}/.stylebot/cli.sock.started`] });

    expect(diagnose({ code: 'ENOENT' })).toBe(
      'Stylebot is not running. Open Chrome (or Edge) with Stylebot.'
    );
  });

  it('asks to open the browser when a host left its socket behind', () => {
    expect(load()({ code: 'ECONNREFUSED' })).toMatch(/Open Chrome/);
  });

  it("reads the marker of the socket's own host", () => {
    process.env.STYLEBOT_SOCKET = `${HOME}/.stylebot/test.sock`;
    const diagnose = load({ existing: [`${HOME}/.stylebot/cli.sock.started`] });

    expect(diagnose({ code: 'ENOENT' })).toMatch(/Turn on/);
  });
});
