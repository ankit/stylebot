const { CLI_PROTOCOL } = require('../../../src/apps/background/cli/protocol');

jest.mock('./package.mjs', () => ({ CLI_VERSION: '0.2.0', LIB_DIR: '/lib' }));

const { PROTOCOL, cliStamp, incompatibility } = require('./protocol.mjs');

describe('the protocol', () => {
  it("matches the extension's", () => {
    expect(PROTOCOL).toBe(CLI_PROTOCOL);
  });

  it('stamps requests with the protocol and the CLI version', () => {
    expect(cliStamp()).toEqual({ protocol: PROTOCOL, version: '0.2.0' });
  });
});

describe('incompatibility', () => {
  it('accepts an extension in the same protocol', () => {
    expect(
      incompatibility({ protocol: PROTOCOL, version: '4.0.0', result: [] })
    ).toBeUndefined();
  });

  it('asks to update Stylebot when the extension is behind', () => {
    expect(incompatibility({ protocol: PROTOCOL - 1, version: '4.0.0' })).toBe(
      "Your browser's Stylebot (4.0.0) is too old for this CLI (0.2.0). Update Stylebot in your browser."
    );
  });

  it('asks to update Stylebot when the extension sends no protocol', () => {
    expect(incompatibility({ id: 1, result: [] })).toBe(
      "Your browser's Stylebot is too old for this CLI (0.2.0). Update Stylebot in your browser."
    );
  });

  it('asks to update the CLI when the extension is ahead', () => {
    expect(incompatibility({ protocol: PROTOCOL + 1, version: '4.2.0' })).toBe(
      "This CLI (0.2.0) is too old for your browser's Stylebot (4.2.0). Update it: npm update -g @stylebot/cli"
    );
  });
});
