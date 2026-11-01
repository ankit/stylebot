let mockResponse;

jest.mock('./browsers.mjs', () => ({ chooseSocket: async () => '/host.sock' }));
jest.mock('./diagnose.mjs', () => ({ diagnoseConnection: () => '' }));
jest.mock('./install.mjs', () => ({ prepareHost: () => ({}) }));
jest.mock('./protocol.mjs', () => ({
  incompatibility: () => undefined,
  unsupportedFeature: (feature, version) =>
    `too old for ${feature} (${version})`,
}));
jest.mock('./socket.mjs', () => ({
  sendToHost: jest.fn(async () => mockResponse),
}));
jest.mock('./style.mjs', () => ({ isStyled: () => false, linkify: s => s }));

const { sendToHost } = require('./socket.mjs');
const { request } = require('./request.mjs');

let onExit;
const argv = process.argv;

beforeEach(() => {
  onExit = undefined;
  jest.spyOn(process, 'on').mockImplementation((name, listener) => {
    if (name === 'exit') {
      onExit = listener;
    }

    return process;
  });
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  process.argv = argv;
});

describe('request', () => {
  it('hands a streaming command its events', async () => {
    const onEvent = jest.fn();
    mockResponse = { result: 'done' };

    expect(await request('watch', { tab: 1 }, onEvent)).toBe('done');
    expect(sendToHost).toBeCalledWith(
      '/host.sock',
      'watch',
      { tab: 1 },
      0,
      onEvent
    );
  });

  it("prints a response's notice after the command's output", async () => {
    mockResponse = { result: [], notice: '2 unread notes' };
    await request('tabs');

    expect(console.log).not.toBeCalled();
    onExit(0);
    expect(console.log).toBeCalledWith('2 unread notes');
  });

  it('prints the notice to stderr with --json', async () => {
    process.argv = [...argv, '--json'];
    mockResponse = { result: [], notice: '2 unread notes' };
    await request('tabs');
    onExit(0);

    expect(console.error).toBeCalledWith('2 unread notes');
    expect(console.log).not.toBeCalled();
  });

  it("doesn't print the notice when the CLI fails afterwards", async () => {
    mockResponse = { result: [], notice: '2 unread notes' };
    await request('tabs');
    onExit(1);

    expect(console.log).not.toBeCalled();
  });

  it("doesn't print the notice of a command that failed", async () => {
    mockResponse = { error: 'No tab', notice: '2 unread notes' };

    await expect(request('tabs')).rejects.toThrow('No tab');
    expect(onExit).toBeUndefined();
  });

  it("asks to update a Stylebot that doesn't have the command", async () => {
    mockResponse = { error: 'Unknown command: watch', version: '4.1.0' };

    await expect(request('watch')).rejects.toThrow(
      'too old for this command (4.1.0)'
    );
  });

  it("passes on another command's unknown command error", async () => {
    mockResponse = { error: 'Unknown command: other' };

    await expect(request('watch')).rejects.toThrow('Unknown command: other');
  });

  it('prints nothing without a notice', async () => {
    mockResponse = { result: [] };
    await request('tabs');

    expect(onExit).toBeUndefined();
  });
});
