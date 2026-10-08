const HOME = '/Users/ankit';
const HOST_DIR = `${HOME}/.stylebot/host`;
const LAUNCHER = `${HOME}/.stylebot/native-host`;
const OLD_NODE = '/nvm/v20.1.0/bin/node';

/**
 * Loads install.mjs with these files in place, by path, and returns
 * it with the mocks it wrote through.
 */
const load = (files, registrations = []) => {
  const fs = {
    existsSync: jest.fn(file => file in files),
    readFileSync: jest.fn(file => files[file]),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
  const register = {
    launcherNode: jest.fn(
      () => files[LAUNCHER]?.match(/"([^"]+)"/)?.[1] ?? undefined
    ),
    writeLauncher: jest.fn(),
    isHostRegistered: jest.fn(() => LAUNCHER in files),
    registerHost: jest.fn(() => registrations),
  };
  let install;

  jest.doMock('node:fs', () => fs);
  jest.doMock('node:os', () => ({
    platform: () => 'darwin',
    homedir: () => HOME,
  }));
  jest.doMock('./package.mjs', () => ({
    CLI_VERSION: '0.2.0',
    LIB_DIR: '/cli',
  }));
  jest.doMock('./register.mjs', () => register);

  jest.isolateModules(() => {
    install = require('./install.mjs');
  });

  return { ...install, fs, register };
};

const launcher = node => `#!/bin/sh\nexec "${node}" "${HOST_DIR}/host.mjs"\n`;

afterEach(() => jest.resetModules());

describe('refreshHost', () => {
  it('leaves a host this version installed alone', () => {
    const { refreshHost, fs, register } = load({
      [LAUNCHER]: launcher(OLD_NODE),
      [OLD_NODE]: '',
      [`${HOST_DIR}/version`]: '0.2.0\n',
    });

    expect(refreshHost()).toEqual({ repinned: false });
    expect(fs.copyFileSync).not.toBeCalled();
    expect(register.writeLauncher).not.toBeCalled();
  });

  it('copies the host again after the CLI updates', () => {
    const { refreshHost, fs } = load({
      [LAUNCHER]: launcher(OLD_NODE),
      [OLD_NODE]: '',
      [`${HOST_DIR}/version`]: '0.1.0\n',
    });

    expect(refreshHost()).toEqual({ repinned: false });
    expect(fs.copyFileSync).toBeCalledWith(
      '/cli/host.mjs',
      `${HOST_DIR}/host.mjs`
    );
    expect(fs.copyFileSync).toBeCalledWith(
      '/cli/paths.mjs',
      `${HOST_DIR}/paths.mjs`
    );
    expect(fs.writeFileSync).toBeCalledWith(`${HOST_DIR}/version`, '0.2.0\n');
  });

  it('copies a host installed before versions were recorded', () => {
    const { refreshHost, fs } = load({
      [LAUNCHER]: launcher(OLD_NODE),
      [OLD_NODE]: '',
    });

    refreshHost();

    expect(fs.copyFileSync).toBeCalledTimes(2);
  });

  it('repins the launcher when its node is gone', () => {
    const { refreshHost, fs, register } = load({
      [LAUNCHER]: launcher(OLD_NODE),
      [`${HOST_DIR}/version`]: '0.2.0\n',
    });

    expect(refreshHost()).toEqual({ repinned: true });
    expect(register.writeLauncher).toBeCalled();
    expect(fs.copyFileSync).not.toBeCalled();
  });

  it("doesn't install a host that was never installed", () => {
    const { refreshHost, fs, register } = load({});

    expect(refreshHost()).toEqual({ repinned: false });
    expect(fs.copyFileSync).not.toBeCalled();
    expect(fs.writeFileSync).not.toBeCalled();
    expect(register.writeLauncher).not.toBeCalled();
  });
});

describe('prepareHost', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('sets the host up on first use, saying for which browsers', () => {
    const { prepareHost, fs, register } = load({}, [
      { browser: 'Chrome', location: '/a' },
      { browser: 'Brave', location: '/a' },
      { browser: 'Dev profile', location: '/b' },
    ]);

    expect(prepareHost()).toEqual({ repinned: false });
    expect(fs.copyFileSync).toBeCalledTimes(2);
    expect(register.registerHost).toBeCalled();
    expect(console.error).toBeCalledWith(
      'stylebot: Set up for Chrome, Brave and your dev profiles.'
    );
  });

  it('stays quiet when there was no browser to set up', () => {
    const { prepareHost, register } = load({});

    prepareHost();

    expect(register.registerHost).toBeCalled();
    expect(console.error).not.toBeCalled();
  });

  it('only refreshes a host already set up', () => {
    const { prepareHost, register } = load({
      [LAUNCHER]: launcher(OLD_NODE),
      [OLD_NODE]: '',
      [`${HOST_DIR}/version`]: '0.2.0\n',
    });

    expect(prepareHost()).toEqual({ repinned: false });
    expect(register.registerHost).not.toBeCalled();
    expect(console.error).not.toBeCalled();
  });
});

describe('checklist', () => {
  const checklist = steps => load({}).checklist(steps);

  it('is all done once connected', () => {
    expect(
      checklist({
        browsers: ['Dev profile', 'Chrome', 'Brave', 'Dev profile'],
        stylebot: ['Chrome'],
        connected: true,
      })
    ).toEqual([
      { done: true, text: 'Set up the stylebot command' },
      { done: true, text: 'Found Chrome, Brave and your dev profiles' },
      { done: true, text: 'Stylebot is in Chrome' },
      { done: true, text: 'Connected to Stylebot' },
    ]);
  });

  it('asks to add Stylebot when no profile has it', () => {
    const steps = checklist({
      browsers: ['Edge'],
      stylebot: [],
      connected: false,
    });

    expect(steps.map(step => [step.done, step.text])).toEqual([
      [true, 'Set up the stylebot command'],
      [true, 'Found Edge'],
      [false, 'Add Stylebot to your browser'],
      [
        false,
        'Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings',
      ],
    ]);
  });

  it("skips the Stylebot step when there's no profile to look in", () => {
    expect(
      checklist({ browsers: ['Chrome'], stylebot: undefined, connected: false })
        .map(step => step.text)
        .some(text => /Stylebot is in|Add Stylebot/.test(text))
    ).toBe(false);
  });

  it('stops at installing a browser when none was found', () => {
    expect(checklist({ browsers: [], connected: false })).toEqual([
      { done: true, text: 'Set up the stylebot command' },
      {
        done: false,
        text: 'Install Chrome or Edge, then run `stylebot install` again',
      },
    ]);
  });
});
