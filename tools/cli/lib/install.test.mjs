const HOME = '/Users/ankit';
const HOST_DIR = `${HOME}/.stylebot/host`;
const LAUNCHER = `${HOME}/.stylebot/native-host`;
const OLD_NODE = '/nvm/v20.1.0/bin/node';

/**
 * Loads install.mjs with these files in place, by path, and returns
 * refreshHost with the mocks it wrote through.
 */
const load = files => {
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

  return { refreshHost: install.refreshHost, fs, register };
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
