const HOME = '/Users/ankit';

/**
 * Loads diagnose.mjs with the host registered or not, and only the given
 * files existing.
 */
const load = ({
  registered = true,
  existing = [],
  stylebot = ['Chrome'],
} = {}) => {
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
    findStylebot: () => stylebot,
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
  it('asks to install a browser when none has the host registered', () => {
    expect(load({ registered: false })({ code: 'ENOENT' })).toBe(
      'No supported browser found. Install Chrome or Edge, then try again.'
    );
  });

  it('asks to restart the browser after repinning the launcher', () => {
    expect(load()({ code: 'ENOENT', repinned: true })).toMatch(
      /Restart the browser/
    );
  });

  it('asks to turn on the setting when the host has never started', () => {
    expect(load()({ code: 'ENOENT' })).toBe(
      'Not connected yet. Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings — stylebot.dev/cli'
    );
  });

  it('asks to add Stylebot when no browser profile has it', () => {
    expect(load({ stylebot: [] })({ code: 'ENOENT' })).toMatch(
      /^No browser has Stylebot yet. Add it from stylebot.dev/
    );
  });

  it('asks to turn on the setting when there was no profile to look in', () => {
    expect(load({ stylebot: undefined })({ code: 'ENOENT' })).toMatch(
      /Turn on/
    );
  });

  it('asks to open the browser when the host has started before', () => {
    const diagnose = load({ existing: [`${HOME}/.stylebot/cli.sock.started`] });

    expect(diagnose({ code: 'ENOENT' })).toBe(
      'No browser is running Stylebot. Open Chrome (or Edge) with Stylebot.'
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
